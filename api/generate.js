import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  runtime: 'nodejs', // Use Node.js runtime for full API support
};

export default async function handler(request) {
  // Handle CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const body = await request.json();
    const { prompt, base64Layout } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Поддержка нескольких API ключей с ротацией
    const getApiKey = () => {
      // Вариант 1: Один ключ через запятую (GOOGLE_API_KEY=key1,key2,key3)
      const multiKey = process.env.GOOGLE_API_KEY;
      if (multiKey) {
        // Проверяем, есть ли запятая (несколько ключей)
        if (multiKey.includes(',')) {
          const keys = multiKey
            .split(',')
            .map(k => k.trim())
            .filter(k => k && k.length > 0); // Убираем пустые строки
          
          if (keys.length > 0) {
            console.log(`Found ${keys.length} keys in GOOGLE_API_KEY (comma-separated)`);
            // Ротация: выбираем случайный ключ
            const selectedKey = keys[Math.floor(Math.random() * keys.length)];
            console.log(`Selected key ${keys.indexOf(selectedKey) + 1} of ${keys.length}`);
            return selectedKey;
          }
        } else {
          // Один ключ без запятых
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
        // Ротация: выбираем случайный ключ
        const selectedKey = keys[Math.floor(Math.random() * keys.length)];
        console.log(`Selected key ${keys.indexOf(selectedKey) + 1} of ${keys.length}`);
        return selectedKey;
      }
      
      return null;
    };

    const apiKey = getApiKey();

    if (!apiKey) {
      console.error('No GOOGLE_API_KEY found. Use GOOGLE_API_KEY, GOOGLE_API_KEY_1/GOOGLE_API_KEY_2, or comma-separated keys');
      return new Response(JSON.stringify({ error: 'Server configuration error: GOOGLE_API_KEY is missing' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (!apiKey || apiKey.length < 20) {
      console.error('Invalid API key detected (too short or empty)');
      return new Response(JSON.stringify({ 
        error: 'Invalid API key configuration. Check GOOGLE_API_KEY in Vercel settings.' 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    console.log(`Using API key (length: ${apiKey.length}, starts with: ${apiKey.substring(0, 10)}...)`);
    console.log('Initializing Gemini API...');
    
    let genAI;
    try {
      genAI = new GoogleGenerativeAI(apiKey);
    } catch (error) {
      console.error('Failed to initialize GoogleGenerativeAI:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to initialize API client. Check API key format.' 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Используем модель, которая поддерживает генерацию изображений
    // Попробуем разные варианты моделей
    let model;
    let base64Data = "";
    
    // Список моделей для попытки (в порядке приоритета)
    const modelsToTry = [
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ];
    
    let lastError = null;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying model: ${modelName}`);
        model = genAI.getGenerativeModel({ model: modelName });

        const parts = [{ text: prompt }];
        
        if (base64Layout) {
          console.log('Adding image input...');
          parts.push({
            inlineData: {
              mimeType: 'image/png',
              data: base64Layout
            }
          });
        }

        console.log('Generating content...');
        
        // Добавляем таймаут для запроса (максимум 8 секунд для Free Tier)
        const generateWithTimeout = async () => {
          const config = {
            contents: [{ parts }],
          };
          
          // Пробуем с responseMimeType только для моделей, которые поддерживают
          if (modelName.includes('2.0') || modelName.includes('flash-exp')) {
            config.generationConfig = {
              responseMimeType: 'image/png',
            };
          }
          
          return Promise.race([
            model.generateContent(config),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout after 8 seconds (Vercel Free Tier limit)')), 8000)
            )
          ]);
        };
        
        const result = await generateWithTimeout();
        console.log('Content generated, processing response...');
        const response = await result.response;
        
        // Extract image from response
        const responseParts = response.candidates?.[0]?.content?.parts || [];
        console.log(`Response parts count: ${responseParts.length}`);
        
        for (const part of responseParts) {
          if (part.inlineData && part.inlineData.data) {
            base64Data = part.inlineData.data;
            console.log(`Image data extracted, length: ${base64Data.length}`);
            break;
          }
        }
        
        if (base64Data) {
          break; // Успешно получили изображение
        }
      } catch (error) {
        console.error(`Error with model ${modelName}:`, error.message);
        lastError = error;
        // Пробуем следующую модель
        continue;
      }
    }

    if (!base64Data) {
      console.error('No image data in response after trying all models. Last error:', lastError?.message);
      return new Response(JSON.stringify({ 
        error: 'Failed to generate image. Models may not support image generation or API key is invalid.',
        details: lastError?.message || 'Unknown error'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(JSON.stringify({ imageUrl: `data:image/png;base64,${base64Data}` }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      },
    });

  } catch (error) {
    console.error("API Error:", error);
    console.error("Error stack:", error.stack);
    
    // Проверяем специфичные ошибки API ключа
    let errorMessage = error.message || 'Internal Server Error';
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('401') || error.message?.includes('403')) {
      errorMessage = 'Invalid API key. Check GOOGLE_API_KEY in Vercel settings.';
    } else if (error.message?.includes('429') || error.message?.includes('quota')) {
      errorMessage = 'API quota exceeded. Try using multiple API keys (GOOGLE_API_KEY_1, GOOGLE_API_KEY_2, etc.)';
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error.toString(),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}