'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

const KonvaStage = dynamic(() => import('../components/KonvaStage'), {
  ssr: false,
});

export default function Home() {
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

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

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {/* Canvas */}
      <KonvaStage width={stageSize.width} height={stageSize.height} />

      {/* Command Palette */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <input
          type="text"
          className="w-96 px-4 py-2 text-lg bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg"
          placeholder="Enter your topic..."
          onClick={() => setIsCommandPaletteOpen(true)}
        />
      </div>
    </main>
  );
}
