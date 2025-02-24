'use client';

import { useState, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import FlowCanvas, { TopicNode } from '@/components/FlowCanvas';
import CommandPalette from '@/components/CommandPalette';
import '@/styles/theme.css';

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [topics, setTopics] = useState<TopicNode[]>([]);

  // Check system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Handle receiving topics from CommandPalette
  const handleTopicsGenerated = (newTopics: TopicNode[]) => {
    setTopics(newTopics);
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <ReactFlowProvider>
        <main className="relative w-screen h-screen overflow-hidden bg-[var(--background)]">
          <FlowCanvas topics={topics} isDarkMode={isDarkMode} />
          
          <CommandPalette
            isDarkMode={isDarkMode}
            onTopicsGenerated={handleTopicsGenerated}
          />
        </main>
      </ReactFlowProvider>
    </div>
  );
}
