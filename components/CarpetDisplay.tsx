import React, { useRef, useEffect } from 'react';
import { GeneratorState } from '../types';

interface CarpetDisplayProps {
  image: string | null;
  state: GeneratorState;
  errorMessage?: string | null;
}

export const CarpetDisplay: React.FC<CarpetDisplayProps> = ({ image, state, errorMessage }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Download handler
  const handleDownload = () => {
    if (image) {
      const link = document.createElement('a');
      link.href = image;
      link.download = `koverator-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex-1 h-full relative bg-gray-900 overflow-hidden flex flex-col items-center justify-center p-8 lg:p-12">
      
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10" 
           style={{ 
               backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
               backgroundSize: '40px 40px' 
           }}>
      </div>

      {/* Main Frame */}
      <div className="relative w-full max-w-5xl aspect-video bg-black border-4 border-soviet-dark shadow-2xl group">
        
        {/* Corner Decors */}
        <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-soviet-blue z-20"></div>
        <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-soviet-blue z-20"></div>
        <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-soviet-blue z-20"></div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-soviet-blue z-20"></div>

        {/* Content */}
        <div className="w-full h-full relative overflow-hidden bg-[#111] flex items-center justify-center">
            
            {state === GeneratorState.IDLE && (
                <div className="text-center">
                    <p className="font-mono text-soviet-lime animate-pulse mb-2">СИСТЕМА ГОТОВА_</p>
                    <p className="font-mono text-xs text-gray-500 max-w-xs mx-auto">Настройте параметры слева и нажмите ГЕНЕРИРОВАТЬ.</p>
                </div>
            )}

            {state === GeneratorState.GENERATING && (
                 <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-soviet-lime border-t-transparent rounded-full animate-spin"></div>
                    <div className="font-mono text-xs text-soviet-lime uppercase text-center">
                        ТКЁМ КОВЕР... <br/>
                        ПРИМЕНЯЕМ ЭСТЕТИКУ...
                    </div>
                 </div>
            )}

            {state === GeneratorState.COMPLETE && image && (
                <img 
                    src={image} 
                    alt="Generated Carpet" 
                    className="w-full h-full object-cover shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]"
                />
            )}
            
            {state === GeneratorState.ERROR && (
                <div className="flex flex-col items-center max-w-md px-4">
                    <div className="text-red-500 font-mono text-sm border border-red-900 p-4 bg-red-900/20 text-center mb-2">
                        ОШИБКА: СБОЙ СИСТЕМЫ
                    </div>
                    {errorMessage && (
                        <div className="text-[10px] text-gray-500 font-mono text-center break-words w-full bg-black/50 p-2 border border-gray-800">
                            {errorMessage}
                        </div>
                    )}
                </div>
            )}
            
            {/* Texture Overlay (Vignette + Noise) */}
            <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30 bg-noise"></div>
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]"></div>

        </div>
        
        {/* Action Bar */}
        {state === GeneratorState.COMPLETE && (
            <div className="absolute bottom-4 right-4 flex gap-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={handleDownload}
                    className="bg-soviet-blue hover:bg-blue-600 text-white font-mono text-xs px-4 py-2 border border-blue-400 shadow-lg uppercase"
                >
                    СКАЧАТЬ .PNG
                </button>
            </div>
        )}
      </div>
    </div>
  );
};