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
      if (multiKey && multiKey.includes(',')) {
        const keys = multiKey.split(',').map(k => k.trim()).filter(k => k);
        if (keys.length > 0) {
          // Ротация: выбираем случайный ключ
          return keys[Math.floor(Math.random() * keys.length)];
        }
      }
      
      // Вариант 2: Несколько переменных (GOOGLE_API_KEY_1, GOOGLE_API_KEY_2, etc.)
      const keys = [];
      let i = 1;
      while (process.env[`GOOGLE_API_KEY_${i}`]) {
        keys.push(process.env[`GOOGLE_API_KEY_${i}`]);
        i++;
      }
      
      if (keys.length > 0) {
        // Ротация: выбираем случайный ключ
        return keys[Math.floor(Math.random() * keys.length)];
      }
      
      // Вариант 3: Один ключ (GOOGLE_API_KEY)
      if (multiKey) {
        return multiKey;
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

    console.log(`Using API key (length: ${apiKey.length}, starts with: ${apiKey.substring(0, 10)}...)`);
    console.log('Initializing Gemini API...');
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Используем стабильную модель для генерации изображений
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
    });

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
    const result = await model.generateContent({
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: 'image/png',
      }
    });

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
      console.error('No image data in response. Response structure:', JSON.stringify(response, null, 2));
      return new Response(JSON.stringify({ 
        error: 'No image data received from Gemini',
        debug: 'Response structure logged to server console'
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