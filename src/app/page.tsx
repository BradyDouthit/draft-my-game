'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import CommandPalette from '@/components/CommandPalette';
import Toolbar from '@/components/Toolbar/Toolbar';

interface Topic {
  id: string;
  x: number;
  y: number;
  text: string;
  parentId?: string;
  expansions?: string[];
}

const KonvaStage = dynamic(() => import('../components/KonvaStage'), {
  ssr: false,
});

export default function Home() {
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [useCase, setUseCase] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0, scale: 1 });

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

  const handleCreateTopic = (text: string) => {
    // Calculate the center of the viewport in stage coordinates
    const viewportCenterX = (-stagePos.x + stageSize.width / 2) / stagePos.scale;
    const viewportCenterY = (-stagePos.y + stageSize.height / 2) / stagePos.scale;

    const newTopic: Topic = {
      id: Date.now().toString(),
      text,
      x: viewportCenterX,
      y: viewportCenterY,
      parentId: useCase ? undefined : topics[0]?.id
    };
    
    setTopics(prev => [...prev, newTopic]);
  };

  // Get expansions for a topic
  const getTopicExpansions = (topicId: string): string[] => {
    const expansions = topics.find(t => t.id === topicId)?.expansions || [];
    return expansions;
  };

  // Prepare topics with their expansions for the GDD
  const topicsWithExpansions = topics.map(topic => ({
    id: topic.id,
    text: topic.text,
    expansions: getTopicExpansions(topic.id)
  }));

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {/* Canvas */}
      <KonvaStage 
        width={stageSize.width} 
        height={stageSize.height} 
        useCase={useCase}
        onLoadingChange={setIsLoading}
        topics={topics}
        setTopics={setTopics}
        stagePos={stagePos}
        setStagePos={setStagePos}
      />

      <CommandPalette
        isLoading={isLoading}
        isDarkMode={isDarkMode}
        onSubmit={handleSubmit}
      />

      {useCase !== '' && topics.length > 0 && (
        <Toolbar 
          onCreateTopic={handleCreateTopic}
          useCase={useCase}
          topics={topicsWithExpansions}
        />
      )}
    </main>
  );
}
