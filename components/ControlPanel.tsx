import React from 'react';
import { CarpetSettings } from '../types';
import { Knob } from './Knob';
import { PatternSelector } from './PatternSelector';

interface ControlPanelProps {
  settings: CarpetSettings;
  setSettings: React.Dispatch<React.SetStateAction<CarpetSettings>>;
  onGenerate: () => void;
  isGenerating: boolean;
}

const ELEMENT_GROUPS = [
  {
    title: "Праздники",
    items: ['Новый Год', 'День Победы', 'Хэллоуин', 'Рождество', 'День Космонавтики', 'Масленица']
  },
  {
    title: "Сезоны",
    items: ['Зимняя Стужа', 'Весеннее Цветение', 'Летнее Солнце', 'Осенний Листопад']
  },
  {
    title: "Флора",
    items: ['Розы', 'Виноград', 'Клубника', 'Пшеница', 'Папоротник', 'Береза', 'Шишки']
  },
  {
    title: "Символы",
    items: ['Сердца ❤️', 'Черепа 💀', 'Мир 🕊️', 'Монеты 🪙', 'Чипы 💾', 'Звезды ✨', 'Мечи ⚔️', 'Олени 🦌']
  }
];

export const ControlPanel: React.FC<ControlPanelProps> = ({ settings, setSettings, onGenerate, isGenerating }) => {
  
  const updateSetting = <K extends keyof CarpetSettings>(key: K, value: CarpetSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleElement = (el: string) => {
    const current = settings.elements;
    if (current.includes(el)) {
        updateSetting('elements', current.filter(e => e !== el));
    } else {
        updateSetting('elements', [...current, el]);
    }
  };

  return (
    <div className="w-full lg:w-80 flex-shrink-0 bg-soviet-dark/80 backdrop-blur-md border-r border-soviet-gray p-6 flex flex-col gap-8 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-soviet-gray scrollbar-track-transparent">
      
      <div className="border-b border-soviet-gray pb-4">
        <h2 className="text-xl text-soviet-lime font-display tracking-wider">КОНТРОЛЬ</h2>
        <p className="text-xs text-gray-500 font-mono mt-1">ЦЕХ ВЛАБС V.2.2.0 [RU]</p>
      </div>

      {/* Knobs Section */}
      <div className="flex justify-between px-2">
        <Knob 
            label="СЛОЖНОСТЬ" 
            value={settings.complexity} 
            min={1} 
            max={10} 
            onChange={(v) => updateSetting('complexity', v)} 
        />
        <Knob 
            label="ИЗНОС" 
            value={settings.wearAndTear} 
            min={1} 
            max={10} 
            onChange={(v) => updateSetting('wearAndTear', v)} 
        />
      </div>

      {/* Branding Section */}
      <div className="p-3 border border-soviet-blue/30 bg-soviet-blue/5 rounded">
        <PatternSelector 
            label="БРЕНДИНГ"
            selected={settings.brandingMode}
            onSelect={(v) => updateSetting('brandingMode', v as any)}
            options={[
                { value: 'none', label: 'НЕТ' },
                { value: 'center', label: 'ЦЕНТР' },
                { value: 'pattern', label: 'ПАТТЕРН' },
                { value: 'corners', label: 'УГЛЫ' }
            ]}
        />
      </div>

      {/* Selectors */}
      <PatternSelector 
        label="ГЕОМЕТРИЯ"
        selected={settings.geometry}
        onSelect={(v) => updateSetting('geometry', v)}
        options={[
            { value: 'Floral', label: 'ЦВЕТОЧНЫЙ' },
            { value: 'Abstract', label: 'АБСТРАКЦИЯ' },
            { value: 'Pixelated', label: 'ПИКСЕЛЬ' },
            { value: 'Fractal', label: 'ФРАКТАЛ' }
        ]}
      />

      <PatternSelector 
        label="СИММЕТРИЯ"
        selected={settings.symmetry}
        onSelect={(v) => updateSetting('symmetry', v)}
        options={[
            { value: 'Bilateral', label: 'ЗЕРКАЛЬНАЯ' },
            { value: 'Kaleidoscope', label: 'КАЛЕЙДОСКОП' },
            { value: 'Radial', label: 'РАДИАЛЬНАЯ' },
            { value: 'Chaos', label: 'ХАОС' }
        ]}
      />

      <PatternSelector 
        label="РАМКА"
        selected={settings.borderThickness}
        onSelect={(v) => updateSetting('borderThickness', v)}
        options={[
            { value: 'Thin', label: 'ТОНКАЯ' },
            { value: 'Thick', label: 'ТОЛСТАЯ' },
            { value: 'Double', label: 'ДВОЙНАЯ' },
            { value: 'None', label: 'НЕТ' }
        ]}
      />

      {/* Categorized Elements */}
      <div className="flex flex-col gap-4">
        {ELEMENT_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold font-mono">{group.title}</span>
                <div className="flex flex-wrap gap-1.5">
                    {group.items.map(item => (
                        <button 
                            key={item}
                            onClick={() => toggleElement(item)}
                            className={`px-2 py-1 text-[9px] uppercase font-mono border rounded-sm transition-all duration-150 ${
                                settings.elements.includes(item) 
                                ? 'bg-soviet-lime text-black border-soviet-lime shadow-[0_0_8px_rgba(204,255,0,0.4)]' 
                                : 'bg-soviet-gray/30 text-gray-400 border-soviet-gray/50 hover:border-soviet-blue hover:text-white'
                            }`}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>
        ))}
      </div>

      {/* Big Red Button */}
      <div className="mt-4 pt-4 border-t border-soviet-gray">
        <button
            onClick={onGenerate}
            disabled={isGenerating}
            className={`
                w-full py-4 font-display text-lg uppercase tracking-widest border-2 relative overflow-hidden group transition-all
                ${isGenerating 
                    ? 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed' 
                    : 'bg-soviet-black border-soviet-lime text-soviet-lime hover:bg-soviet-lime hover:text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]'}
            `}
        >
            {isGenerating ? (
                <span className="animate-pulse">ОЖИДАЙТЕ...</span>
            ) : (
                <>
                    <span className="relative z-10">ГЕНЕРИРОВАТЬ</span>
                </>
            )}
        </button>
      </div>

    </div>
  );
};