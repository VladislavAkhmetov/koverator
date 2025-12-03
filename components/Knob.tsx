import React, { useState, useEffect, useRef } from 'react';

interface KnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
}

export const Knob: React.FC<KnobProps> = ({ label, value, min, max, onChange }) => {
  const [dragging, setDragging] = useState(false);
  const [angle, setAngle] = useState(0);
  const knobRef = useRef<HTMLDivElement>(null);

  // Convert value to angle (start at -135deg, end at 135deg)
  useEffect(() => {
    const percentage = (value - min) / (max - min);
    setAngle(-135 + (percentage * 270));
  }, [value, min, max]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging || !knobRef.current) return;
      
      const rect = knobRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate angle from center
      const deltaX = e.clientX - centerX;
      const deltaY = centerY - e.clientY; // Invert Y because screen coords
      
      // Atan2 returns radians. Convert to degrees.
      // 0 is up (because we inverted Y). 
      let newAngle = Math.atan2(deltaX, deltaY) * (180 / Math.PI);
      
      // Clamp logic: we only want -135 to 135.
      // Atan2 returns -180 to 180.
      
      // Normalize to 0-360 for calculation easier
      if (newAngle < 0) newAngle += 360;
      
      // Map 0 (top) to 0. 
      // We want roughly 7 o'clock to 5 o'clock range.
      
      // Simplified interaction: Just use Y movement for sensitivity
    };

    const handleSimpleDrag = (e: MouseEvent) => {
        if (!dragging) return;
        const sensitivity = 0.5;
        // This is a virtual slider logic, easier for web
        // Calculate based on movementY?
        // Let's stick to a simpler implementation for reliability
    }
    
    // Replacing with standard slider behavior but radial visual
    
    const handleGlobalMouseUp = () => {
      setDragging(false);
    };

    if (dragging) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('mousemove', updateValueFromMouse);
    }
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', updateValueFromMouse);
    };
  }, [dragging]);


  const updateValueFromMouse = (e: MouseEvent) => {
     if(!knobRef.current) return;
     const rect = knobRef.current.getBoundingClientRect();
     const cy = rect.top + rect.height / 2;
     
     // Up decreases, Down increases
     const dy = (e.clientY - cy); 
     
     // Simple linear map for demo reliability
     // In a real sophisticated knob we'd use polar coordinates
     
     // Let's actually use a hidden range input for accessibility and perfect logic, 
     // but render the knob visually.
  };

  // Re-implementing simplified Knob logic
  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  return (
    <div className="flex flex-col items-center gap-2 group">
      <div className="relative w-16 h-16 rounded-full bg-soviet-dark border-2 border-soviet-gray shadow-lg flex items-center justify-center">
        {/* The Rotator */}
        <div 
            className="absolute w-full h-full rounded-full transition-transform duration-75 ease-out"
            style={{ transform: `rotate(${angle}deg)` }}
        >
             <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-soviet-lime shadow-[0_0_5px_#ccff00] rounded-sm"></div>
        </div>
        
        {/* Center Cap */}
        <div className="w-10 h-10 rounded-full bg-soviet-black border border-soviet-gray z-10 flex items-center justify-center">
           <span className="text-[10px] text-soviet-lime font-mono">{value}</span>
        </div>

        {/* Hidden Input overlay for interaction */}
        <input 
            type="range" 
            min={min} 
            max={max} 
            step={1}
            value={value}
            onChange={handleRangeChange}
            className="absolute w-full h-full opacity-0 cursor-pointer z-20"
            title={label}
        />
      </div>
      <span className="text-xs uppercase tracking-widest text-gray-500 font-mono group-hover:text-soviet-lime transition-colors">{label}</span>
    </div>
  );
};
