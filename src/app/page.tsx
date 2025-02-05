'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

const KonvaStage = dynamic(() => import('../components/KonvaStage'), {
  ssr: false,
});

export default function Home() {
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [inputValue, setInputValue] = useState('');
  const [debouncedUseCase, setDebouncedUseCase] = useState('');
  const [showTooltip, setShowTooltip] = useState(true);

  // Check if tooltip has been dismissed before
  useEffect(() => {
    const hasBeenDismissed = localStorage.getItem('tooltipDismissed') === 'true';
    setShowTooltip(!hasBeenDismissed);
  }, []);

  // Debounce the input value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUseCase(inputValue);
    }, 800);

    return () => clearTimeout(timer);
  }, [inputValue]);

  // Update stage size on mount and window resize
  useEffect(() => {
    const updateSize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleDismissTooltip = () => {
    setShowTooltip(false);
    localStorage.setItem('tooltipDismissed', 'true');
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {/* Canvas */}
      <KonvaStage width={stageSize.width} height={stageSize.height} useCase={debouncedUseCase} />

      {/* Command Palette */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
        <div className="relative">
          <input
            type="text"
            className="w-96 px-4 py-2 text-lg bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg"
            placeholder={'What are you trying to do? Example: "Writing a book about zombies'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          
          {/* Tooltip */}
          <div 
            className={`
              absolute top-full left-1/2 transform -translate-x-1/2 mt-2
              transition-all duration-200 ease-in-out w-[600px]
              ${showTooltip ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}
            `}
          >
            {/* Tooltip Arrow */}
            <div className="
              absolute -top-2 left-1/2 transform -translate-x-1/2
              border-8 border-transparent border-b-black/90
              w-0 h-0
            "/>
            
            {/* Tooltip Content */}
            <div className="
              relative
              bg-black/90 text-white px-6 py-4 rounded-lg text-sm
              shadow-lg
            ">
              {/* Dismiss Button */}
              <button
                onClick={handleDismissTooltip}
                className="absolute top-2 right-2 text-white/60 hover:text-white transition-colors"
                aria-label="Dismiss tooltip"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </button>

              <div className="space-y-2">
                <p className="font-medium mb-2">How to use this tool:</p>
                <p>1. Enter your role or use case above (e.g., "entrepreneur", "author", "student")</p>
                <p>2. Drag and combine topics on the canvas to generate new ideas</p>
                <p>3. The AI will tailor combinations based on your specified role</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
