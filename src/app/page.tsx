'use client';

import { useState, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import FlowCanvas, { TopicNode } from '@/components/FlowCanvas';
import CommandPalette from '@/components/CommandPalette';

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [topics, setTopics] = useState<TopicNode[]>([]);
  const [useCase, setUseCase] = useState('');

  // Check system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Handle command palette submission
  const handleSubmit = async (value: string) => {
    if (!value.trim()) return;
    
    setUseCase(value);
    setIsLoading(true);
    
    try {
      // Call the API to generate topics
      const response = await fetch('/api/generate-topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ useCase: value }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate topics');
      }
      
      const data = await response.json();
      
      // Create topic nodes from the generated topics
      const newTopics: TopicNode[] = data.topics.map((topic: string) => ({
        id: `topic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: topic
      }));
      
      setTopics(newTopics);
    } catch (error) {
      console.error('Error generating topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <ReactFlowProvider>
        <main className="relative w-screen h-screen overflow-hidden bg-white dark:bg-gray-900">
          <FlowCanvas topics={topics} isDarkMode={isDarkMode} />
          
          <CommandPalette
            isLoading={isLoading}
            isDarkMode={isDarkMode}
            onSubmit={handleSubmit}
          />
        </main>
      </ReactFlowProvider>
    </div>
  );
}
