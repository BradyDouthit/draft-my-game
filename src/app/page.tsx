'use client';

import { useState, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import FlowCanvas from '@/components/FlowCanvas';

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <ReactFlowProvider>
      <main className={`relative w-screen h-screen overflow-hidden ${isDarkMode ? 'dark' : ''}`}>
        <FlowCanvas />
      </main>
    </ReactFlowProvider>
  );
}
