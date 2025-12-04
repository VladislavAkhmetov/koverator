import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Поддержка нескольких API ключей с ротацией
const getApiKey = () => {
  // Вариант 1: Один ключ через запятую (GOOGLE_API_KEY=key1,key2,key3)
  const multiKey = process.env.GOOGLE_API_KEY;
  if (multiKey) {
    if (multiKey.includes(',')) {
      const keys = multiKey
        .split(',')
        .map(k => k.trim())
        .filter(k => k && k.length > 0);
      
      if (keys.length > 0) {
        console.log(`Found ${keys.length} keys in GOOGLE_API_KEY (comma-separated)`);
        const selectedKey = keys[Math.floor(Math.random() * keys.length)];
        console.log(`Selected key ${keys.indexOf(selectedKey) + 1} of ${keys.length}`);
        return selectedKey;
      }
    } else {
      console.log('Using single GOOGLE_API_KEY');
      return multiKey.trim();
    }
  }
  
  // Вариант 2: Несколько переменных (GOOGLE_API_KEY_1, GOOGLE_API_KEY_2, etc.)
  const keys = [];
  let i = 1;
  while (process.env[`GOOGLE_API_KEY_${i}`]) {
    const key = process.env[`GOOGLE_API_KEY_${i}`].trim();
    if (key && key.length > 0) {
      keys.push(key);
    }
    i++;
  }
  
  if (keys.length > 0) {
    console.log(`Found ${keys.length} keys (GOOGLE_API_KEY_1, GOOGLE_API_KEY_2, etc.)`);
    const selectedKey = keys[Math.floor(Math.random() * keys.length)];
    console.log(`Selected key ${keys.indexOf(selectedKey) + 1} of ${keys.length}`);
    return selectedKey;
  }
  
  return null;
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, base64Layout } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const apiKey = getApiKey();

    if (!apiKey || apiKey.length < 20) {
      console.error('Invalid API key detected');
      return res.status(500).json({ 
        error: 'Invalid API key configuration. Check GOOGLE_API_KEY in environment variables.' 
      });
    }
    
    console.log(`Using API key (length: ${apiKey.length}, starts with: ${apiKey.substring(0, 10)}...)`);
    console.log('Initializing Gemini API...');
    
    let genAI;
    try {
      genAI = new GoogleGenerativeAI(apiKey);
    } catch (error) {
      console.error('Failed to initialize GoogleGenerativeAI:', error);
      return res.status(500).json({ 
        error: 'Failed to initialize API client. Check API key format.' 
      });
    }
    
    // Используем только самую быструю модель
    const modelName = 'gemini-2.0-flash-exp';
    console.log(`Using model: ${modelName}`);
    
    const model = genAI.getGenerativeModel({ model: modelName });

    const parts = [{ text: prompt }];
    
    // Оптимизация: если base64Layout слишком большой, пропускаем его для скорости
    if (base64Layout && base64Layout.length < 500000) { // Только если меньше ~500KB
      console.log('Adding image input...');
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: base64Layout
        }
      });
    } else if (base64Layout) {
      console.log('Skipping large image input for speed optimization');
    }

    console.log('Generating content...');
    
    // Таймаут: 50 секунд (для Render/Fly.io обычно лимит 60 секунд)
    const generateWithTimeout = async () => {
      const config = {
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: 'image/png',
          temperature: 0.7,
          maxOutputTokens: 8192,
        }
      };
      
      return Promise.race([
        model.generateContent(config),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 50 seconds')), 50000)
        )
      ]);
    };
    
    let result;
    try {
      result = await generateWithTimeout();
    } catch (error) {
      console.error('Generation timeout or error:', error.message);
      return res.status(504).json({ 
        error: 'Генерация заняла слишком много времени. Попробуйте позже.',
        details: error.message
      });
    }
    
    console.log('Content generated, processing response...');
    const response = await result.response;
    
    // Extract image from response
    let base64Data = "";
    const responseParts = response.candidates?.[0]?.content?.parts || [];
    console.log(`Response parts count: ${responseParts.length}`);
    
    for (const part of responseParts) {
      if (part.inlineData && part.inlineData.data) {
        base64Data = part.inlineData.data;
        console.log(`Image data extracted, length: ${base64Data.length}`);
        break;
      }
    }

    if (!base64Data) {
      console.error('No image data in response');
      return res.status(500).json({ 
        error: 'No image data received from Gemini. Model may not support image generation.',
      });
    }

    return res.json({ imageUrl: `data:image/png;base64,${base64Data}` });

  } catch (error) {
    console.error("API Error:", error);
    console.error("Error stack:", error.stack);
    
    let errorMessage = error.message || 'Internal Server Error';
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('401') || error.message?.includes('403')) {
      errorMessage = 'Invalid API key. Check GOOGLE_API_KEY in environment variables.';
    } else if (error.message?.includes('429') || error.message?.includes('quota')) {
      errorMessage = 'API quota exceeded. Try using multiple API keys (GOOGLE_API_KEY_1, GOOGLE_API_KEY_2, etc.)';
    }
    
    return res.status(500).json({ 
      error: errorMessage,
      details: error.toString(),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

