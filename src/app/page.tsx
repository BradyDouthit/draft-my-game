'use client';

import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import FlowCanvas, { TopicNode } from '@/components/FlowCanvas';
import CommandPalette from '@/components/CommandPalette';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { ThemeProvider } from '@/utils/ThemeProvider';

export default function Home() {
  const [topics, setTopics] = useState<TopicNode[]>([]);
  const [rootNode, setRootNode] = useState<TopicNode | null>(null);

  // Handle receiving topics from CommandPalette
  const handleTopicsGenerated = (newTopics: TopicNode[], inputValue: string) => {
    // Create a root node with the input value
    const newRootNode: TopicNode = {
      id: `root-${Date.now()}`,
      text: inputValue,
      isRoot: true
    };
    
    setRootNode(newRootNode);
    setTopics(newTopics);
  };

  return (
    <ThemeProvider>
      <ReactFlowProvider>
        <main className="relative w-screen h-screen overflow-hidden bg-[var(--background)]">
          <FlowCanvas 
            topics={topics} 
            rootNode={rootNode}
          />
          
          <CommandPalette
            onTopicsGenerated={handleTopicsGenerated}
          />

          <ThemeSwitcher />
        </main>
      </ReactFlowProvider>
    </ThemeProvider>
  );
}
