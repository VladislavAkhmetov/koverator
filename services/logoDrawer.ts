import { CarpetSettings } from "../types";

// Full logo path
const PATH_FULL = "M78.2188 157.365H251.446V0H329.665V215.523H372.664V274.123H294.544L294.47 215.523H0V0H78.2188V157.365ZM801.293 0L897.807 65.957L994.333 0H1068.72V58.5996H1031.16L959.101 107.837L1030.91 156.911H1068.73V215.511H994.06L897.794 149.73L801.529 215.511H726.857V156.911H764.679L836.488 107.837L764.43 58.5996H726.87V0H801.293ZM683.748 58.5996H466.291V89.6064H667.706V125.892H466.291V156.899H683.748V215.498H388.084V0H683.748V58.5996Z";
const FULL_WIDTH = 1069;
const FULL_HEIGHT = 275;

// Short logo path
const PATH_SHORT = "M287.476 0L190.949 65.9574L94.4357 0H0.0124578V58.5994H57.5725L129.631 107.838L57.8214 156.912H0V215.511H94.6721L190.937 149.73L287.202 215.511H381.874V156.912H324.052L252.243 107.838L324.301 58.5994H381.861V0H287.451H287.476Z";
const SHORT_WIDTH = 382;
const SHORT_HEIGHT = 216;

/**
 * Generates a base64 image string of a layout guide for Gemini
 */
export const generateLogoLayout = async (mode: CarpetSettings['brandingMode']): Promise<string | null> => {
  if (mode === 'none') return null;

  const width = 1024;
  const height = 576; // 16:9 aspect
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background - Dark to represent the wool base
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);
  
  // Draw logic
  ctx.fillStyle = '#FFFFFF'; // White allows Gemini to see it clearly as a pattern source
  
  const drawPath = (pathStr: string, x: number, y: number, scale: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const p = new Path2D(pathStr);
    ctx.fill(p);
    ctx.restore();
  };

  if (mode === 'center') {
    // Draw Full Logo centered
    const scale = (width * 0.7) / FULL_WIDTH;
    const w = FULL_WIDTH * scale;
    const h = FULL_HEIGHT * scale;
    drawPath(PATH_FULL, (width - w) / 2, (height - h) / 2, scale);
  } 
  else if (mode === 'corners') {
    // Draw Short Logo in 4 corners
    const scale = 0.4;
    const margin = 40;
    const w = SHORT_WIDTH * scale;
    const h = SHORT_HEIGHT * scale;

    drawPath(PATH_SHORT, margin, margin, scale); // TL
    drawPath(PATH_SHORT, width - w - margin, margin, scale); // TR
    drawPath(PATH_SHORT, margin, height - h - margin, scale); // BL
    drawPath(PATH_SHORT, width - w - margin, height - h - margin, scale); // BR
    
    // Add a center geometric hint
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(width/2, height/2, 100, 0, Math.PI*2);
    ctx.stroke();
  }
  else if (mode === 'pattern') {
    // Tiled pattern of short logo
    const scale = 0.25;
    const w = SHORT_WIDTH * scale;
    const h = SHORT_HEIGHT * scale;
    const gapX = w * 1.5;
    const gapY = h * 1.5;
    
    // Rotate context slightly for diamond pattern? No, straight grid for carpet foundation is safer
    for (let y = -h; y < height + h; y += gapY) {
      for (let x = -w; x < width + w; x += gapX) {
        // Offset every other row
        const offsetX = (Math.floor(y / gapY) % 2 === 0) ? 0 : gapX / 2;
        drawPath(PATH_SHORT, x + offsetX, y, scale);
      }
    }
  }

  return canvas.toDataURL('image/png').split(',')[1];
};