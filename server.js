import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Replicate from "replicate";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Раздача статических файлов из dist (для фронтенда)
app.use(express.static(join(__dirname, 'dist')));

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
    // ВАЖНО: Проверь, поддерживает ли модель генерацию изображений
    // Если не работает, попробуй 'gemini-1.5-flash' или другую модель
    const modelName = 'gemini-2.0-flash-exp';
    console.log(`Using model: ${modelName}`);
    
    let model;
    try {
      model = genAI.getGenerativeModel({ model: modelName });
      console.log('Model initialized successfully');
    } catch (error) {
      console.error('Failed to initialize model:', error);
      return res.status(500).json({ 
        error: 'Failed to initialize Gemini model',
        details: error.message
      });
    }

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
    const startTime = Date.now();
    
    // Таймаут: 55 секунд (Render Free Tier лимит 60 секунд, оставляем запас)
    // ВАЖНО: Gemini API не поддерживает responseMimeType: 'image/png'
    // Используем стандартный запрос и парсим ответ
    const generateWithTimeout = async () => {
      const config = {
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        }
      };
      
      return Promise.race([
        model.generateContent(config),
        new Promise((_, reject) => 
          setTimeout(() => {
            const elapsed = Date.now() - startTime;
            reject(new Error(`Request timeout after ${Math.round(elapsed/1000)} seconds`));
          }, 55000)
        )
      ]);
    };
    
    let result;
    try {
      result = await generateWithTimeout();
      const elapsed = Date.now() - startTime;
      console.log(`Generation completed in ${Math.round(elapsed/1000)} seconds`);
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`Generation failed after ${Math.round(elapsed/1000)} seconds:`, error.message);
      console.error('Error details:', error);
      return res.status(504).json({ 
        error: 'Генерация заняла слишком много времени. Попробуйте позже.',
        details: error.message,
        elapsed: Math.round(elapsed/1000)
      });
    }
    
    console.log('Content generated, processing response...');
    const response = await result.response;
    
    // Extract image from response
    let base64Data = "";
    const responseParts = response.candidates?.[0]?.content?.parts || [];
    console.log(`Response parts count: ${responseParts.length}`);
    console.log('Response structure:', JSON.stringify(responseParts.map(p => ({
      hasText: !!p.text,
      hasInlineData: !!p.inlineData,
      textPreview: p.text?.substring(0, 100)
    })), null, 2));
    
    for (const part of responseParts) {
      // Проверяем inlineData (изображение)
      if (part.inlineData && part.inlineData.data) {
        base64Data = part.inlineData.data;
        console.log(`Image data extracted, length: ${base64Data.length}`);
        break;
      }
      // Если есть текст, логируем его
      if (part.text) {
        console.log(`Text response (first 200 chars): ${part.text.substring(0, 200)}`);
      }
    }

    if (!base64Data) {
      console.log('Gemini не вернул изображение, пробуем через Replicate (Stable Diffusion)...');
      
      // Используем Replicate для генерации изображения
      const replicateToken = process.env.REPLICATE_API_TOKEN;
      if (!replicateToken) {
        console.error('REPLICATE_API_TOKEN not set, falling back to error');
        return res.status(500).json({ 
          error: 'Gemini API не поддерживает генерацию изображений. Добавь REPLICATE_API_TOKEN для использования Stable Diffusion.',
          details: 'Для генерации изображений нужен Replicate API. Получи токен на replicate.com',
        });
      }
      
      try {
        const replicate = new Replicate({ token: replicateToken });
        console.log('Generating image via Replicate Stable Diffusion...');
        
        // Используем промпт из Gemini или оригинальный
        const imagePrompt = prompt.trim();
        
        const output = await replicate.run(
          "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
          {
            input: {
              prompt: imagePrompt,
              aspect_ratio: "16:9",
              output_format: "png",
            }
          }
        );
        
        if (output && output[0]) {
          // Replicate возвращает URL изображения
          const imageUrl = output[0];
          console.log('Image generated via Replicate:', imageUrl);
          return res.json({ imageUrl });
        } else {
          throw new Error('Replicate returned no image');
        }
      } catch (replicateError) {
        console.error('Replicate error:', replicateError);
        return res.status(500).json({ 
          error: 'Ошибка генерации изображения через Replicate',
          details: replicateError.message,
        });
      }
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

// Fallback для SPA роутинга - все остальные запросы на index.html
app.get('*', (req, res) => {
  // Пропускаем API запросы
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  // Отдаем index.html для всех остальных запросов (SPA роутинг)
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Frontend available at http://localhost:${PORT}`);
});

