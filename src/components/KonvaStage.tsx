import { useState, useEffect, useCallback, useMemo } from 'react';
import { Stage, Layer } from 'react-konva';
import Topic from './Topic';
import { KonvaEventObject } from 'konva/lib/Node';

// Add throttle function
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

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

interface StagePosition {
  x: number;
  y: number;
  scale: number;
}

export default function KonvaStage({ width, height, useCase }: KonvaStageProps) {
  const [topics, setTopics] = useState<TopicState[]>([]);
  const [stagePos, setStagePos] = useState<StagePosition>({ x: 0, y: 0, scale: 1 });
  const [isDraggingTopic, setIsDraggingTopic] = useState(false);
  const [cursor, setCursor] = useState<string>('default');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Throttled stage position update
  const setThrottledStagePos = useCallback(
    throttle((newPos: StagePosition) => {
      setStagePos(newPos);
    }, 16), // ~60fps
    []
  );

  // Check system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Throttled wheel handler
  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const scaleBy = 1.1;
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stagePos.scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    // Limit zoom scale
    if (newScale < 0.1 || newScale > 5) return;

    setThrottledStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
      scale: newScale,
    });
  }, [stagePos, setThrottledStagePos]);

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
          const radius = Math.min(width, height) * 0.3;
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
          setStagePos({ x: 0, y: 0, scale: 1 });
        }
      } catch (error) {
        console.error('Error generating initial topics:', error);
      }
    };

    generateTopics();
  }, [useCase, width, height]);

  const handleDragStart = useCallback((topicId: string) => {
    setIsDraggingTopic(true);
    setCursor('grabbing');
  }, []);

  const handleDragEnd = useCallback(async (topicId: string, e: KonvaEventObject<DragEvent>) => {
    setIsDraggingTopic(false);
    setCursor('grab');
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
  }, [topics]);

  const handleStageDragEnd = useCallback((e: KonvaEventObject<DragEvent>) => {
    if (!isDraggingTopic) {
      setThrottledStagePos({
        ...stagePos,
        x: e.target.x(),
        y: e.target.y(),
      });
    }
  }, [isDraggingTopic, stagePos, setThrottledStagePos]);

  const handleMouseEnter = useCallback(() => {
    if (!isDraggingTopic) {
      setCursor('grab');
    }
  }, [isDraggingTopic]);

  const handleMouseLeave = useCallback(() => {
    setCursor('default');
  }, []);

  return (
    <div style={{ cursor, background: isDarkMode ? '#1a1a1a' : '#ffffff' }}>
      <Stage 
        width={width} 
        height={height}
        draggable={!isDraggingTopic}
        onDragEnd={handleStageDragEnd}
        onWheel={handleWheel}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stagePos.scale}
        scaleY={stagePos.scale}
        perfectDrawEnabled={false}
      >
        <Layer>
          {topics.map((topic) => (
            <Topic
              key={topic.id}
              x={topic.x}
              y={topic.y}
              text={topic.text}
              isDarkMode={isDarkMode}
              onDragStart={() => handleDragStart(topic.id)}
              onDragEnd={(e) => handleDragEnd(topic.id, e)}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
} 