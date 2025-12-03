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

    let prompt = `
      Design a 16:9 rectangular Soviet-style wall carpet (rug) texture.
      
      COLOR PALETTE RESTRICTION (STRICT):
      - Primary Colors: Deep Black (#000000), Brand Blue (#3253EE), Acid Lime Green (#CCFF00), Pure White (#FFFFFF).
      - Do NOT use red, brown, or beige.
      
      STRUCTURE & STYLE:
      - Border: ${settings.borderThickness} decorative border.
      - Geometry Style: ${settings.geometry}.
      - Center: ${settings.symmetry === 'Kaleidoscope' ? 'Perfectly radial kaleidoscopic medallion' : settings.symmetry} arrangement.
      
      ${themePromptBlock}
      
      TEXTURE & VIBE:
      - Appearance: ${wearTerm}.
      - Detail Level: ${complexityTerm}.
      - Material: Realistic wool thread texture, visible weaving grid.
      - Aesthetic: Cyber-Soviet, Retro-Futurist, Brutalist.
    `;

    if (base64Layout) {
      prompt += `
      CRITICAL INPUT IMAGE INSTRUCTION (HIGHEST PRIORITY):
      - The attached input image contains the COMPANY LOGO layout (white shapes on black).
      - You MUST reproduce these logo shapes EXACTLY as they appear in the input image.
      - The logo is the MOST IMPORTANT element.
      - Weave the logo in Brand Blue (#3253EE) or Lime (#CCFF00).
      `;
    }
    
    prompt += `\nEnsure the image is a flat, top-down view of the pattern. High resolution, sharp focus.`;

    // 3. Send to our Backend Proxy
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        base64Layout
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server Error: ${response.status}`);
    }

    const data = await response.json();
    return data.imageUrl;

  } catch (error) {
    console.error("Carpet generation failed:", error);
    throw error;
  }
};