import { useState, useEffect, useCallback, useMemo } from 'react';
import { Stage, Layer, Rect, Group, Line, Text } from 'react-konva';
import Topic from './Topic';
import Expansion from './Expansion';
import { KonvaEventObject } from 'konva/lib/Node';
import { CombineIndicator } from './CombineIndicator';

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
  onLoadingChange?: (isLoading: boolean) => void;
  topics: TopicState[];
  setTopics: React.Dispatch<React.SetStateAction<TopicState[]>>;
  stagePos: StagePosition;
  setStagePos: React.Dispatch<React.SetStateAction<StagePosition>>;
}

interface TopicState {
  id: string;
  x: number;
  y: number;
  text: string;
  parentId?: string;
  width?: number;
  height?: number;
}

interface TopicDimensions {
  width: number;
  height: number;
}

interface UseCaseCard {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
}

interface StagePosition {
  x: number;
  y: number;
  scale: number;
}

interface ExpansionNode {
  id: string;
  parentId: string;
  x: number;
  y: number;
  text: string;
  width?: number;
  height?: number;
}

export default function KonvaStage({ 
  width, 
  height, 
  useCase, 
  onLoadingChange,
  topics,
  setTopics,
  stagePos,
  setStagePos
}: KonvaStageProps) {
  const [expansions, setExpansions] = useState<ExpansionNode[]>([]);
  const [isDraggingTopic, setIsDraggingTopic] = useState(false);
  const [cursor, setCursor] = useState<string>('default');
  const [useCaseCard, setUseCaseCard] = useState<UseCaseCard | null>(null);
  const [combineTarget, setCombineTarget] = useState<{
    sourceId: string;
    targetId: string;
  } | null>(null);

  const COMBINE_DISTANCE = 100; // Distance threshold for combining topics

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

  // Generate initial topics and set up use case card when useCase changes
  useEffect(() => {
    const generateTopics = async () => {
      if (!useCase) return;
      
      onLoadingChange?.(true);
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
          // Set up use case card dimensions and position
          const cardWidth = 300;
          const cardHeight = 60;
          const cardX = (width - cardWidth) / 2;
          const cardY = height * 0.15; // Position card at 15% from top

          setUseCaseCard({
            x: cardX,
            y: cardY,
            width: cardWidth,
            height: cardHeight,
            text: useCase
          });

          // Calculate grid layout for topics below the use case card
          const gridWidth = width * 0.8;
          const topicsStartY = cardY + cardHeight + 100; // Start topics below the card
          const verticalGap = 100;
          const columns = 3;
          const horizontalGap = gridWidth / (columns - 1);
          const startX = (width - gridWidth) / 2;

          const arrangedTopics = result.topics.map((topic: string, i: number) => {
            const row = Math.floor(i / columns);
            const col = i % columns;
            return {
              id: Date.now().toString() + i,
              x: startX + (col * horizontalGap),
              y: topicsStartY + (row * verticalGap),
              text: topic,
            };
          });

          setTopics(arrangedTopics);
          setStagePos({ x: 0, y: 0, scale: 1 });
        }
      } catch (error) {
        console.error('Error generating initial topics:', error);
      } finally {
        onLoadingChange?.(false);
      }
    };

    generateTopics();
  }, [useCase, width, height, onLoadingChange]);

  // Add a separate effect to reposition topics when window size changes
  useEffect(() => {
    if (topics.length === 0) return;

    // Recalculate positions with new dimensions
    const gridWidth = width * 0.6;
    const verticalGap = 100;
    const columns = 3;
    const horizontalGap = gridWidth / (columns - 1);
    const startX = (width - gridWidth) / 2;
    const startY = (height - verticalGap * 3) / 2;

    setTopics((prev: TopicState[]) => prev.map((topic: TopicState, i: number) => {
      const row = Math.floor(i / columns);
      const col = i % columns;
      return {
        ...topic,
        x: startX + (col * horizontalGap),
        y: startY + (row * verticalGap),
      };
    }));
  }, [width, height]);

  const handleDragStart = useCallback((topicId: string) => {
    setIsDraggingTopic(true);
    setCursor('grabbing');
  }, []);

  const handleDragMove = useCallback((
    topicId: string, 
    e: KonvaEventObject<DragEvent>,
    dimensions?: TopicDimensions
  ) => {
    const newX = e.target.x();
    const newY = e.target.y();

    // Check if the dragged item is an expansion
    const isDraggingExpansion = expansions.some(exp => exp.id === topicId);
    
    if (isDraggingExpansion) {
      // Update expansion position and dimensions
      setExpansions(prev => 
        prev.map(exp =>
          exp.id === topicId 
            ? { 
                ...exp, 
                x: newX, 
                y: newY,
                width: dimensions?.width,
                height: dimensions?.height
              }
            : exp
        )
      );
    } else {
      // Update topic position and dimensions
      setTopics(prev => 
        prev.map(t =>
          t.id === topicId 
            ? { 
                ...t, 
                x: newX, 
                y: newY,
                width: dimensions?.width,
                height: dimensions?.height
              } 
            : t
        )
      );
    }

    // Check for potential combine targets among both topics and expansions
    const draggedItem = isDraggingExpansion 
      ? expansions.find(exp => exp.id === topicId)
      : topics.find(t => t.id === topicId);
    
    if (!draggedItem) return;

    // Find nearby items (both topics and expansions)
    const nearbyTopic = topics.find(t => 
      t.id !== topicId && 
      Math.hypot(t.x - newX, t.y - newY) < COMBINE_DISTANCE
    );

    const nearbyExpansion = expansions.find(exp => 
      exp.id !== topicId && 
      Math.hypot(exp.x - newX, exp.y - newY) < COMBINE_DISTANCE
    );

    if (nearbyTopic) {
      setCombineTarget({ sourceId: topicId, targetId: nearbyTopic.id });
      setCursor('copy');
    } else if (nearbyExpansion) {
      setCombineTarget({ sourceId: topicId, targetId: nearbyExpansion.id });
      setCursor('copy');
    } else {
      setCombineTarget(null);
      setCursor('grabbing');
    }
  }, [topics, expansions]);

  const handleDragEnd = useCallback(async (
    topicId: string, 
    e: KonvaEventObject<DragEvent>,
    dimensions?: TopicDimensions
  ) => {
    setIsDraggingTopic(false);
    setCursor('grab');
    setCombineTarget(null);
    
    const isDraggingExpansion = expansions.some(exp => exp.id === topicId);
    const draggedItem = isDraggingExpansion 
      ? expansions.find(exp => exp.id === topicId)
      : topics.find(t => t.id === topicId);
    
    if (!draggedItem) return;

    const newX = e.target.x();
    const newY = e.target.y();

    // Check for collision with other items (both topics and expansions)
    const otherTopic = topics.find(t => 
      t.id !== topicId && 
      Math.hypot(t.x - newX, t.y - newY) < COMBINE_DISTANCE
    );

    const otherExpansion = expansions.find(exp => 
      exp.id !== topicId && 
      Math.hypot(exp.x - newX, exp.y - newY) < COMBINE_DISTANCE
    );

    if (otherTopic || otherExpansion) {
      const otherItem = otherTopic || otherExpansion;
      if (!otherItem) return;
      
      try {
        const response = await fetch('/api/combine-topics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic1: draggedItem.text,
            topic2: otherItem.text,
            useCase
          }),
        });

        const result = await response.json();
        
        if (result.combinedTopic) {
          // When creating a new combined topic:
          if (isDraggingExpansion) {
            // Remove the dragged expansion
            setExpansions(prev => prev.filter(exp => exp.id !== topicId));
          } else {
            // Remove the dragged topic
            setTopics(prev => prev.filter(t => t.id !== topicId));
          }

          // Remove the target item
          if (otherExpansion) {
            setExpansions(prev => prev.filter(exp => exp.id !== otherExpansion.id));
          } else if (otherTopic) {
            setTopics(prev => prev.filter(t => t.id !== otherTopic.id));
          }

          // Add the new combined topic
          const newTopic = {
            id: Date.now().toString(),
            x: newX,
            y: newY,
            text: result.combinedTopic,
          };

          setTopics(prev => [...prev, newTopic]);
        }
      } catch (error) {
        console.error('Error combining topics:', error);
      }
    }
  }, [topics, expansions, useCase]);

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

  const handleTopicClick = useCallback(async (topicId: string, topicX: number, topicY: number) => {
    // Check if topic already has expansions
    const existingExpansions = expansions.filter(e => e.parentId === topicId);

    if (existingExpansions.length > 0) {
      // Remove existing expansions for this topic
      console.log('Removing expansions for topic:', topicId);
      setExpansions(prev => prev.filter(e => e.parentId !== topicId));
      return;
    }

    // Find the clicked topic to get its text
    const clickedTopic = topics.find(t => t.id === topicId);
    if (!clickedTopic) return;

    try {
      const response = await fetch('/api/expand-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic: clickedTopic.text,
          useCase
        })
      });

      if (!response.ok) {
        console.error('Failed to fetch expansion data', await response.text());
        return;
      }

      const data = await response.json();
      const expansionsArray: string[] = data.expansions;
      if (!expansionsArray || expansionsArray.length === 0) {
        console.warn('No expansions returned from the API');
        return;
      }

      const radius = 150;
      const n = expansionsArray.length;
      // Use a fixed angle delta of 30 degrees (pi/6) if more than one expansion is returned
      const angleDelta = n > 1 ? Math.PI / 6 : 0;
      const startAngle = n > 1 ? (Math.PI / 2 - ((n - 1) * angleDelta) / 2) : Math.PI / 2;

      const newExpansions = expansionsArray.map((expansion: string, i: number) => {
        const angle = startAngle + (n > 1 ? i * angleDelta : 0);
        return {
          id: Date.now().toString() + '-' + i,
          parentId: topicId,
          x: topicX + radius * Math.cos(angle),
          y: topicY - radius * Math.sin(angle),
          text: expansion,
          width: 340, // Set initial width
          height: 80  // Set initial height (will be updated by onDimensionsChange)
        };
      });
      console.log('Creating new expansions:', newExpansions);
      setExpansions(prev => [...prev, ...newExpansions]);
    } catch (error) {
      console.error('Error fetching expansion:', error);
    }
  }, [expansions, topics, useCase]);

  // Add handler for expansion dimension updates
  const handleExpansionDimensionsChange = useCallback((expansionId: string, dimensions: TopicDimensions) => {
    setExpansions(prev => 
      prev.map(exp =>
        exp.id === expansionId 
          ? { ...exp, width: dimensions.width, height: dimensions.height }
          : exp
      )
    );
  }, []);

  const handleExpansionDragStart = () => {
    setIsDraggingTopic(true);
    setCursor('grabbing');
  };

  const handleExpansionDragEnd = (id: string, e: KonvaEventObject<DragEvent>, dimensions?: TopicDimensions) => {
    // Use the main handleDragEnd function for consistent behavior
    handleDragEnd(id, e, dimensions);
  };

  const handleExpansionDragMove = useCallback((id: string, e: KonvaEventObject<DragEvent>, dimensions?: TopicDimensions) => {
    // Use the main handleDragMove function for consistent behavior
    handleDragMove(id, e, dimensions);
  }, [handleDragMove]);

  const handleTopicDelete = useCallback((topicId: string) => {
    // Remove the topic and its associated expansions
    setTopics(prev => prev.filter(t => t.id !== topicId));
    setExpansions(prev => prev.filter(e => e.parentId !== topicId));
  }, []);

  const handleExpansionDelete = useCallback((expansionId: string) => {
    setExpansions(prev => prev.filter(e => e.id !== expansionId));
  }, []);

  const handleTopicEdit = useCallback((topicId: string, newText: string) => {
    setTopics(prev => prev.map(t => 
      t.id === topicId ? { ...t, text: newText } : t
    ));
  }, []);

  const handleExpansionEdit = useCallback((expansionId: string, newText: string) => {
    setExpansions(prev => prev.map(e => 
      e.id === expansionId ? { ...e, text: newText } : e
    ));
  }, []);

  // Render function for the use case card
  const renderUseCase = useMemo(() => {
    if (!useCaseCard) return null;

    return (
      <Group>
        <Rect
          x={useCaseCard.x}
          y={useCaseCard.y}
          width={useCaseCard.width}
          height={useCaseCard.height}
          fill="#4A90E2"
          cornerRadius={8}
          shadowColor="black"
          shadowBlur={10}
          shadowOpacity={0.2}
          shadowOffset={{ x: 0, y: 2 }}
        />
        <Text
          x={useCaseCard.x}
          y={useCaseCard.y}
          width={useCaseCard.width}
          height={useCaseCard.height}
          text={useCaseCard.text}
          fontSize={16}
          fill="white"
          align="center"
          verticalAlign="middle"
          padding={10}
          wrap="word"
        />
      </Group>
    );
  }, [useCaseCard]);

  // Render lines connecting topics to their parents or use case
  const renderLines = useMemo(() => {
    if (!topics.length) return null;

    return (
      <>
        {/* Lines from topics to use case card */}
        {useCaseCard && topics.map(topic => {
          // If topic has no parentId, it's connected to the use case
          if (!topic.parentId) {
            return (
              <Line
                key={`usecase-line-${topic.id}`}
                points={[
                  useCaseCard.x + useCaseCard.width / 2,
                  useCaseCard.y + useCaseCard.height,
                  topic.x,
                  topic.y
                ]}
                stroke="#4A90E2"
                strokeWidth={1}
                opacity={0.3}
                dash={[5, 5]}
              />
            );
          }
          return null;
        })}

        {/* Lines between topics */}
        {topics.map(topic => {
          if (!topic.parentId) return null;
          
          const parentTopic = topics.find(t => t.id === topic.parentId);
          if (!parentTopic) return null;

          return (
            <Line
              key={`topic-line-${topic.id}-${parentTopic.id}`}
              points={[
                parentTopic.x,
                parentTopic.y,
                topic.x,
                topic.y
              ]}
              stroke="#999"
              strokeWidth={1}
              opacity={0.5}
            />
          );
        })}

        {/* Lines from expansions to their parent topics */}
        {expansions.map(expansion => {
          const parentTopic = topics.find(t => t.id === expansion.parentId);
          if (!parentTopic) return null;

          return (
            <Line
              key={`expansion-line-${expansion.id}-${parentTopic.id}`}
              points={[
                parentTopic.x,
                parentTopic.y,
                expansion.x,
                expansion.y
              ]}
              stroke="#666"
              strokeWidth={1}
              opacity={0.3}
              dash={[3, 3]}
            />
          );
        })}
      </>
    );
  }, [topics, useCaseCard, expansions]);

  // Render combine indicator
  const renderCombineIndicator = useMemo(() => {
    if (!combineTarget) return null;

    // Look for source in both topics and expansions
    const sourceTopic = topics.find(t => t.id === combineTarget.sourceId) || 
                       expansions.find(e => e.id === combineTarget.sourceId);
    
    // Look for target in both topics and expansions
    const targetTopic = topics.find(t => t.id === combineTarget.targetId) ||
                       expansions.find(e => e.id === combineTarget.targetId);

    if (!sourceTopic || !targetTopic) return null;

    // Helper function to get node dimensions
    const getNodeDimensions = (node: TopicState | ExpansionNode) => {
      // For expansions, use actual dimensions or fixed defaults
      if ('parentId' in node) {
        return {
          width: node.width || 340, // 300 (text width) + 40 (padding)
          height: node.height || 80
        };
      }
      // For topics, use their dimensions or defaults
      return {
        width: node.width || 400,
        height: node.height || 80
      };
    };

    const sourceDimensions = getNodeDimensions(sourceTopic);
    const targetDimensions = getNodeDimensions(targetTopic);

    return (
      <CombineIndicator
        sourceTopic={{
          x: sourceTopic.x,
          y: sourceTopic.y,
          width: sourceDimensions.width,
          height: sourceDimensions.height
        }}
        targetTopic={{
          x: targetTopic.x,
          y: targetTopic.y,
          width: targetDimensions.width,
          height: targetDimensions.height
        }}
      />
    );
  }, [combineTarget, topics, expansions]);

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
        {/* Base layer for topics and regular connections */}
        <Layer>
          {renderLines}
          {renderUseCase}
          {topics.map((topic) => (
            <Topic
              key={topic.id}
              x={topic.x}
              y={topic.y}
              text={topic.text}
              onDragStart={() => handleDragStart(topic.id)}
              onDragMove={(e, dimensions) => handleDragMove(topic.id, e, dimensions)}
              onDragEnd={(e, dimensions) => handleDragEnd(topic.id, e, dimensions)}
              onClick={() => handleTopicClick(topic.id, topic.x, topic.y)}
              onDelete={() => handleTopicDelete(topic.id)}
              onEdit={(newText) => handleTopicEdit(topic.id, newText)}
            />
          ))}
          {expansions.map((expansion) => (
            <Expansion
              key={expansion.id}
              x={expansion.x}
              y={expansion.y}
              text={expansion.text}
              onDragStart={() => handleExpansionDragStart()}
              onDragMove={(e, dimensions) => handleExpansionDragMove(expansion.id, e, dimensions)}
              onDragEnd={(e, dimensions) => handleExpansionDragEnd(expansion.id, e, dimensions)}
              onDelete={() => handleExpansionDelete(expansion.id)}
              onEdit={(newText) => handleExpansionEdit(expansion.id, newText)}
              onDimensionsChange={(dimensions) => handleExpansionDimensionsChange(expansion.id, dimensions)}
            />
          ))}
        </Layer>

        {/* Overlay layer for combine indicators */}
        <Layer>
          {renderCombineIndicator}
        </Layer>
      </Stage>
    </div>
  );
} 