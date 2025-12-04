import { CarpetSettings } from "../types";
import { generateLogoLayout } from "./logoDrawer";

// Mappings to translate abstract themes into concrete visual instructions
const THEME_MAPPINGS: Record<string, string> = {
  'Новый Год': 'Snowflakes, pine needle textures (rendered in Lime/Black), festive geometric ornaments, star bursts, clock faces at 12',
  'День Победы': 'Geometric star patterns, fireworks motifs, solemn and grand composition, ribbon stripes',
  'Хэллоуин': 'Spooky stylized skulls or pumpkin shapes adapted to carpet geometry, spiderweb-like lace patterns, high contrast Lime/Black',
  'Рождество': 'Angelic or star motifs, pine cones, winter patterns, candle shapes',
  'День Космонавтики': 'Rockets, planets, stars, orbits, retro-futurist space imagery, Sputnik satellites',
  'Масленица': 'Sun symbols, radial circle patterns, folk solar motifs, pancake-like disks',
  'Зимняя Стужа': 'Dominant White and Blue thread usage, crystalline ice geometric structures, snowflake tessellations, sharp jagged edges',
  'Весеннее Цветение': 'Explosion of Lime Green floral patterns, budding shoots, swirling organic lines, nature awakening',
  'Летнее Солнце': 'Radiant radial sun patterns, high contrast Lime/White brightness, energetic rays, wheat textures',
  'Осенний Листопад': 'Falling leaf stylized patterns, wind-swept geometry, usage of dithering to simulate decay',
  'Розы': 'Geometric rose patterns, thorny vines, floral borders',
  'Виноград': 'Bunches of grapes, vine leaves, spiral tendrils',
  'Клубника': 'Strawberry shapes, dotted berry textures, small leafy patterns',
  'Пшеница': 'Wheat stalks, grain textures, harvest motifs',
  'Папоротник': 'Fern leaves, fractal plant geometry, forest floor vibes',
  'Береза': 'Birch tree bark textures, small leaves, vertical stripe patterns',
  'Шишки': 'Pine cones, geometric scales, forest seed shapes'
};

const PROCESS_SYMBOL = (tag: string): string => {
  if (tag.includes('❤️')) return "Heart shapes, love motifs, stylized cardiac geometry";
  if (tag.includes('💀')) return "Skull motifs, memento mori styling, bone-like borders";
  if (tag.includes('🕊️')) return "Doves, bird silhouettes, peace symbols, wing patterns";
  if (tag.includes('🪙')) return "Coins, circular currency patterns, wealth symbols";
  if (tag.includes('💾')) return "Floppy disks, digital data artifacts, square tech patterns, qr-code like textures";
  if (tag.includes('✨')) return "Sparkles, stars, glinting geometry, magical dust noise";
  if (tag.includes('⚔️')) return "Crossed swords, heraldic weaponry, shield shapes";
  if (tag.includes('🦌')) return "Deer silhouettes, antlers, forest fauna, pixelated animals";
  return tag; 
};

export const generateCarpet = async (settings: CarpetSettings): Promise<string> => {
  try {
    const complexityTerm = settings.complexity > 7 ? "hyper-detailed, intricate fractal patterns" : settings.complexity < 4 ? "bold, blocky, minimalist geometric" : "standard detailed weaving";
    const wearTerm = settings.wearAndTear > 7 ? "vintage, slightly moth-eaten, faded fabric texture, visible wool knots" : "brand new, pristine condition, high synthetic gloss";
    
    // 1. Generate Layout locally
    const base64Layout = await generateLogoLayout(settings.brandingMode);

    // 2. Prepare Prompt
    const visualInstructions: string[] = [];
    settings.elements.forEach(el => {
      if (THEME_MAPPINGS[el]) {
        visualInstructions.push(`THEME [${el}]: ${THEME_MAPPINGS[el]}`);
      } else {
        visualInstructions.push(`ELEMENT: ${PROCESS_SYMBOL(el)}`);
      }
    });

    const themePromptBlock = visualInstructions.length > 0 
      ? `THEMATIC VISUALS (MANDATORY):\n- You MUST incorporate the following motifs into the carpet pattern:\n${visualInstructions.map(i => `  * ${i}`).join('\n')}`
      : '- Standard geometric filler patterns.';

    // Оптимизированный промпт (короче для скорости)
    let prompt = `16:9 Soviet-style carpet. Colors: Black (#000000), Blue (#3253EE), Lime (#CCFF00), White (#FFFFFF). No red/brown/beige. Border: ${settings.borderThickness}. Style: ${settings.geometry}. Symmetry: ${settings.symmetry === 'Kaleidoscope' ? 'radial kaleidoscope' : settings.symmetry}. ${themePromptBlock.replace(/\n/g, ' ')} Texture: ${wearTerm}. Detail: ${complexityTerm}. Wool thread texture, weaving grid. Cyber-Soviet, Retro-Futurist, Brutalist aesthetic.`;

    if (base64Layout) {
      prompt += ` CRITICAL: Attached image contains COMPANY LOGO (white on black). Reproduce logo EXACTLY. Use Blue (#3253EE) or Lime (#CCFF00).`;
    }
    
    prompt += ` Flat top-down view. High resolution, sharp focus.`;

    // 3. Send to our Backend Proxy with timeout (9 секунд для Free Tier)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000); // 9 секунд (чуть меньше чем 10 на сервере)
    
    let response;
    try {
      response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          base64Layout
        }),
        signal: controller.signal
      });
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Timeout: Генерация заняла слишком много времени (лимит Vercel Free Tier: 10 секунд). Попробуйте позже или используйте Pro план.');
      }
      throw error;
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `Server Error: ${response.status}`;
      
      // Специальная обработка для таймаутов
      if (response.status === 504 || response.status === 408) {
        errorMessage = 'Timeout: Генерация заняла слишком много времени (лимит Vercel Free Tier: 10 секунд). Попробуйте позже или используйте Pro план.';
      } else {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Если ответ не JSON, читаем как текст (но ограничиваем длину)
          try {
            const textError = await response.text();
            // Если это HTML страница с ошибкой, показываем понятное сообщение
            if (textError.includes('<html') || textError.includes('<!DOCTYPE')) {
              if (response.status === 504) {
                errorMessage = 'Timeout: Генерация заняла слишком много времени (лимит Vercel Free Tier: 10 секунд).';
              } else {
                errorMessage = `Server Error ${response.status}: Не удалось получить ответ от сервера.`;
              }
            } else {
              errorMessage = textError.substring(0, 200) || errorMessage;
            }
          } catch (textError) {
            errorMessage = `Server Error ${response.status}: Не удалось прочитать ответ.`;
          }
        }
      }
      throw new Error(errorMessage);
    }

    let data;
    try {
      const responseText = await response.text();
      data = JSON.parse(responseText);
    } catch (e) {
      // Если не JSON, пытаемся понять что это
      let errorMsg = 'Invalid JSON response from server';
      try {
        const textResponse = await response.text();
        if (textResponse.includes('timeout') || textResponse.includes('Timeout')) {
          errorMsg = 'Timeout: Генерация заняла слишком много времени (лимит Vercel Free Tier: 10 секунд).';
        } else if (textResponse.includes('<html') || textResponse.includes('<!DOCTYPE')) {
          errorMsg = 'Server returned HTML instead of JSON. Possible timeout or server error.';
        } else {
          errorMsg = `Invalid JSON response: ${textResponse.substring(0, 100)}`;
        }
      } catch (textError) {
        errorMsg = 'Failed to parse server response';
      }
      throw new Error(errorMsg);
    }
    
    if (!data.imageUrl) {
      throw new Error('No imageUrl in response');
    }
    
    return data.imageUrl;

  } catch (error) {
    console.error("Carpet generation failed:", error);
    throw error;
  }
};