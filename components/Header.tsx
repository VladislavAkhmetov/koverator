import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-soviet-black/90 backdrop-blur border-b border-soviet-gray flex items-center justify-between px-6 z-40">
      <div className="flex items-center gap-4">
         {/* Brand Logo Icon */}
         <div className="h-8 flex items-center justify-center">
            <svg width="48" height="27" viewBox="0 0 382 216" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
                <path d="M287.476 0L190.949 65.9574L94.4357 0H0.0124578V58.5994H57.5725L129.631 107.838L57.8214 156.912H0V215.511H94.6721L190.937 149.73L287.202 215.511H381.874V156.912H324.052L252.243 107.838L324.301 58.5994H381.861V0H287.451H287.476Z" fill="#3253EE"/>
            </svg>
         </div>
         <div className="flex flex-col leading-none">
            <h1 className="text-2xl text-white font-display uppercase tracking-widest">
                КОВЕРАТОР
            </h1>
            <span className="text-soviet-lime font-mono text-[10px] tracking-[0.2em] -mt-1">ЦЕХ Влабс_2.0</span>
         </div>
      </div>
      <div className="hidden md:flex gap-6 text-xs font-mono text-gray-400">
        <span>СТАТУС: <span className="text-soviet-lime">АКТИВЕН</span></span>
        <span>ПАЛИТРА: <span className="text-soviet-blue">#3253EE</span></span>
        <span>РЕЖИМ: <span className="text-white">УЛЬТРА</span></span>
      </div>
    </header>
  );
};