import { useState, useEffect, useCallback, useMemo } from 'react';
import { Stage, Layer, Rect, Group } from 'react-konva';
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

function LoadingTopics({ width, height }: { width: number; height: number }) {
  // Calculate grid layout for ghost topics
  const gridWidth = width * 0.6;
  const verticalGap = 100;
  const columns = 3;
  const horizontalGap = gridWidth / (columns - 1);
  const startX = (width - gridWidth) / 2;
  const startY = (height - verticalGap * 3) / 2;

  return (
    <Group>
      {Array(10).fill(0).map((_, i) => {
        const row = Math.floor(i / columns);
        const col = i % columns;
        return (
          <Rect
            key={i}
            x={startX + (col * horizontalGap)}
            y={startY + (row * verticalGap)}
            width={180}
            height={60}
            cornerRadius={12}
            fill="#2a2a2a"
            opacity={0.3}
            perfectDrawEnabled={false}
            offsetX={90}
            offsetY={30}
          />
        );
      })}
    </Group>
  );
}

export default function KonvaStage({ width, height, useCase }: KonvaStageProps) {
  const [topics, setTopics] = useState<TopicState[]>([]);
  const [stagePos, setStagePos] = useState<StagePosition>({ x: 0, y: 0, scale: 1 });
  const [isDraggingTopic, setIsDraggingTopic] = useState(false);
  const [cursor, setCursor] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(false);

  // Throttled stage position update
  const setThrottledStagePos = useCallback(
    throttle((newPos: StagePosition) => {
      setStagePos(newPos);
    }, 16), // ~60fps
    []
  );

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
      
      setIsLoading(true);
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
          // Calculate grid layout
          const gridWidth = width * 0.6;
          const verticalGap = 100;
          const gridHeight = verticalGap * 3;
          const columns = 3;
          const rows = 4;
          const horizontalGap = gridWidth / (columns - 1);

          // Center the entire grid in the viewport
          const startX = (width - gridWidth) / 2;
          const startY = (height - gridHeight) / 2;

          const arrangedTopics = result.topics.map((topic: string, i: number) => {
            const row = Math.floor(i / columns);
            const col = i % columns;
            return {
              id: Date.now().toString() + i,
              x: startX + (col * horizontalGap),
              y: startY + (row * verticalGap),
              text: topic,
            };
          });

          setTopics(arrangedTopics);
          setStagePos({ x: 0, y: 0, scale: 1 });
        }
      } catch (error) {
        console.error('Error generating initial topics:', error);
      } finally {
        setIsLoading(false);
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
    <div style={{ cursor, background: '#1a1a1a' }}>
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
          {isLoading ? (
            <LoadingTopics width={width} height={height} />
          ) : (
            topics.map((topic) => (
              <Topic
                key={topic.id}
                x={topic.x}
                y={topic.y}
                text={topic.text}
                onDragStart={() => handleDragStart(topic.id)}
                onDragEnd={(e) => handleDragEnd(topic.id, e)}
              />
            ))
          )}
        </Layer>
      </Stage>
    </div>
  );
} 