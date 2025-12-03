import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface PatternSelectorProps {
  selected: string;
  onSelect: (val: string) => void;
  options: Option[];
  label: string;
}

export const PatternSelector: React.FC<PatternSelectorProps> = ({ selected, onSelect, options, label }) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <span className="text-xs uppercase tracking-widest text-soviet-blue font-bold font-mono">{label}</span>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`
              px-1 py-3 text-[10px] sm:text-xs font-mono uppercase border transition-all duration-200
              ${selected === opt.value 
                ? 'bg-soviet-blue text-white border-soviet-lime shadow-[0_0_10px_rgba(50,83,238,0.5)]' 
                : 'bg-soviet-dark text-gray-500 border-soviet-gray hover:border-soviet-blue hover:text-white'}
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};