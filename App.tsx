import React, { useState } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { CarpetDisplay } from './components/CarpetDisplay';
import { CarpetSettings, GeneratorState } from './types';
import { generateCarpet } from './services/gemini';

const App: React.FC = () => {
  const [settings, setSettings] = useState<CarpetSettings>({
    geometry: 'Floral',
    complexity: 7,
    wearAndTear: 3,
    borderThickness: 'Double',
    symmetry: 'Kaleidoscope',
    elements: ['Roses'],
    brandingMode: 'none' // Default
  });

  const [generatorState, setGeneratorState] = useState<GeneratorState>(GeneratorState.IDLE);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGeneratorState(GeneratorState.GENERATING);
    setErrorMessage(null);
    try {
      const imageUrl = await generateCarpet(settings);
      setGeneratedImage(imageUrl);
      setGeneratorState(GeneratorState.COMPLETE);
    } catch (e: any) {
      console.error(e);
      setGeneratorState(GeneratorState.ERROR);
      
      // Extract meaningful message
      let msg = e.message || "Unknown error";
      if (msg.includes("403")) msg += " (Check API Key Permissions/Enable API)";
      if (msg.includes("429")) msg += " (Quota Exceeded/Rate Limit)";
      setErrorMessage(msg);
    }
  };

  return (
    <div className="min-h-screen bg-soviet-black text-white font-sans flex flex-col overflow-hidden selection:bg-soviet-lime selection:text-black">
      <Header />
      
      <main className="flex-1 flex flex-col lg:flex-row mt-16 h-[calc(100vh-64px)]">
        {/* Left Control Panel */}
        <ControlPanel 
            settings={settings}
            setSettings={setSettings}
            onGenerate={handleGenerate}
            isGenerating={generatorState === GeneratorState.GENERATING}
        />

        {/* Right Display Area */}
        <CarpetDisplay 
            image={generatedImage} 
            state={generatorState}
            errorMessage={errorMessage}
        />
      </main>
    </div>
  );
};

export default App;