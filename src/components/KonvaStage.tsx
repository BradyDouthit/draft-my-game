import { useState } from 'react';
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
  const [topics, setTopics] = useState<TopicState[]>([
    { id: '1', x: width / 3, y: height / 2, text: 'Rock Climbing' },
    { id: '2', x: (width * 2) / 3, y: height / 2, text: 'Web Development' },
  ]);

  const handleDragEnd = async (topicId: string, e: KonvaEventObject<DragEvent>) => {
    // Update the position of the dragged topic
    const draggedTopic = topics.find(t => t.id === topicId);
    if (!draggedTopic) return;

    const newX = e.target.x();
    const newY = e.target.y();

    // Check for collision with other topics
    const otherTopic = topics.find(t => 
      t.id !== topicId && 
      Math.hypot(t.x - newX, t.y - newY) < 100 // Check if topics are within 100px
    );

    if (otherTopic) {
      // Combine topics
      try {
        const response = await fetch('/api/combine-topics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic1: draggedTopic.text,
            topic2: otherTopic.text,
            useCase: useCase || 'hobbyist', // Default to hobbyist if no useCase provided
          }),
        });

        const result = await response.json();
        
        if (result.combinedTopic) {
          // Replace the two topics with the new combined topic
          setTopics(prev => [
            ...prev.filter(t => t.id !== topicId && t.id !== otherTopic.id),
            {
              id: Date.now().toString(),
              x: (newX + otherTopic.x) / 2, // Place new topic between the two combined topics
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