import { useState, useEffect } from 'react';
import { Stage, Layer } from 'react-konva';
import Topic from './Topic';
import { KonvaEventObject } from 'konva/lib/Node';

interface KonvaStageProps {
  width: number;
  height: number;
  useCase: string;
}

interface TopicState {
  id: string;
  x: number;
  y: number;
  text: string;
}

export default function KonvaStage({ width, height, useCase }: KonvaStageProps) {
  const [topics, setTopics] = useState<TopicState[]>([]);

  // Generate initial topics when useCase changes
  useEffect(() => {
    const generateTopics = async () => {
      if (!useCase) return;

      try {
        const response = await fetch('/api/generate-topics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ useCase }),
        });

        const result = await response.json();
        
        if (result.topics) {
          // Arrange topics in a circle
          const radius = Math.min(width, height) * 0.3; // 30% of the smaller dimension
          const centerX = width / 2;
          const centerY = height / 2;
          
          const arrangedTopics = result.topics.map((topic: string, i: number) => {
            const angle = (i / result.topics.length) * 2 * Math.PI;
            return {
              id: Date.now().toString() + i,
              x: centerX + radius * Math.cos(angle),
              y: centerY + radius * Math.sin(angle),
              text: topic,
            };
          });

          setTopics(arrangedTopics);
        }
      } catch (error) {
        console.error('Error generating initial topics:', error);
      }
    };

    generateTopics();
  }, [useCase, width, height]);

  const handleDragEnd = async (topicId: string, e: KonvaEventObject<DragEvent>) => {
    const draggedTopic = topics.find(t => t.id === topicId);
    if (!draggedTopic) return;

    const newX = e.target.x();
    const newY = e.target.y();

    // Check for collision with other topics
    const otherTopic = topics.find(t => 
      t.id !== topicId && 
      Math.hypot(t.x - newX, t.y - newY) < 100
    );

    if (otherTopic) {
      try {
        const response = await fetch('/api/combine-topics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic1: draggedTopic.text,
            topic2: otherTopic.text,
          }),
        });

        const result = await response.json();
        
        if (result.combinedTopic) {
          setTopics(prev => [
            ...prev.filter(t => t.id !== topicId && t.id !== otherTopic.id),
            {
              id: Date.now().toString(),
              x: (newX + otherTopic.x) / 2,
              y: (newY + otherTopic.y) / 2,
              text: result.combinedTopic,
            },
          ]);
          return;
        }
      } catch (error) {
        console.error('Error combining topics:', error);
      }
    }

    // If no combination occurred, just update the position
    setTopics(prev =>
      prev.map(t =>
        t.id === topicId ? { ...t, x: newX, y: newY } : t
      )
    );
  };

  return (
    <Stage width={width} height={height}>
      <Layer>
        {topics.map((topic) => (
          <Topic
            key={topic.id}
            x={topic.x}
            y={topic.y}
            text={topic.text}
            onDragEnd={(e) => handleDragEnd(topic.id, e)}
          />
        ))}
      </Layer>
    </Stage>
  );
} 