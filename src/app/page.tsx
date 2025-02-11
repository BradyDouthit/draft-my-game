'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import CommandPalette from '@/components/CommandPalette';

const KonvaStage = dynamic(() => import('../components/KonvaStage'), {
  ssr: false,
});

export default function Home() {
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [useCase, setUseCase] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

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

  const handleSubmit = (value: string) => {
    setUseCase(value);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {/* Canvas */}
      <KonvaStage 
        width={stageSize.width} 
        height={stageSize.height} 
        useCase={useCase}
        onLoadingChange={setIsLoading}
      />

      <CommandPalette
        isLoading={isLoading}
        isDarkMode={isDarkMode}
        onSubmit={handleSubmit}
      />
    </main>
  );
}
