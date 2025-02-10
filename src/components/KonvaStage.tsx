import { useState, useEffect, useCallback, useMemo } from 'react';
import { Stage, Layer, Rect, Group, Line, Text } from 'react-konva';
import Topic from './Topic';
import Expansion from './Expansion';
import { KonvaEventObject } from 'konva/lib/Node';
import cytoscape from 'cytoscape';

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
}

interface TopicState {
  id: string;
  x: number;
  y: number;
  text: string;
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
}

export default function KonvaStage({ width, height, useCase, onLoadingChange }: KonvaStageProps) {
  const [topics, setTopics] = useState<TopicState[]>([]);
  const [expansions, setExpansions] = useState<ExpansionNode[]>([]);
  const [stagePos, setStagePos] = useState<StagePosition>({ x: 0, y: 0, scale: 1 });
  const [isDraggingTopic, setIsDraggingTopic] = useState(false);
  const [cursor, setCursor] = useState<string>('default');
  const [useCaseCard, setUseCaseCard] = useState<UseCaseCard | null>(null);

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

    setTopics(prev => prev.map((topic, i) => {
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

  const handleDragMove = useCallback((topicId: string, e: KonvaEventObject<DragEvent>) => {
    const newX = e.target.x();
    const newY = e.target.y();

    // Update topic position in real-time
    setTopics(prev =>
      prev.map(t =>
        t.id === topicId ? { ...t, x: newX, y: newY } : t
      )
    );
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
            useCase
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
  }, [topics, useCase]);

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

  // Calculate layout positions using Cytoscape
  const calculateLayout = useCallback((
    topics: TopicState[],
    expansions: ExpansionNode[],
    useCaseCard: UseCaseCard | null
  ) => {
    if (!useCaseCard) return { topics, expansions };

    // Create a Cytoscape instance for layout calculation
    const cy = cytoscape({
      headless: true,
      styleEnabled: false
    });

    // Add use case as root node
    cy.add({
      data: { id: 'useCase' },
      position: { x: useCaseCard.x + useCaseCard.width / 2, y: useCaseCard.y }
    });

    // Add topic nodes
    topics.forEach(topic => {
      cy.add({
        data: { id: topic.id, parent: 'useCase' }
      });
    });

    // Add expansion nodes
    expansions.forEach(expansion => {
      cy.add({
        data: { id: expansion.id, parent: expansion.parentId }
      });
    });

    // Add edges
    topics.forEach(topic => {
      cy.add({
        data: { id: `useCase-${topic.id}`, source: 'useCase', target: topic.id }
      });
    });

    expansions.forEach(expansion => {
      cy.add({
        data: { 
          id: `${expansion.parentId}-${expansion.id}`, 
          source: expansion.parentId, 
          target: expansion.id 
        }
      });
    });

    // Run the layout
    const layout = cy.layout({
      name: 'preset',
      positions: (node: any) => {
        if (node.id() === 'useCase') {
          return { x: useCaseCard.x + useCaseCard.width / 2, y: useCaseCard.y };
        }

        const nodeId = node.id();
        const isExpansion = expansions.some(e => e.id === nodeId);
        const parentId = isExpansion ? node.data('parent') : 'useCase';
        const siblings = isExpansion 
          ? expansions.filter(e => e.parentId === parentId)
          : topics;
        const index = isExpansion 
          ? expansions.findIndex(e => e.id === nodeId)
          : topics.findIndex(t => t.id === nodeId);
        const totalItems = siblings.length;

        const levelWidth = width * 0.8;
        const levelSpacing = 150;
        const horizontalSpacing = levelWidth / (totalItems + 1);
        const startX = (width - levelWidth) / 2 + horizontalSpacing;

        const y = isExpansion 
          ? useCaseCard.y + (levelSpacing * 2)
          : useCaseCard.y + levelSpacing;
        const x = startX + (index * horizontalSpacing);

        return { x, y };
      },
      animate: false,
      fit: false
    });

    layout.run();

    // Extract new positions
    const newTopics = topics.map(topic => {
      const node = cy.$id(topic.id);
      const position = node.position();
      return {
        ...topic,
        x: position.x,
        y: position.y
      };
    });

    const newExpansions = expansions.map(expansion => {
      const node = cy.$id(expansion.id);
      const position = node.position();
      return {
        ...expansion,
        x: position.x,
        y: position.y
      };
    });

    cy.destroy();
    return { topics: newTopics, expansions: newExpansions };
  }, []);

  // Update positions when topics, expansions, or use case changes
  useEffect(() => {
    const { topics: newTopics, expansions: newExpansions } = calculateLayout(topics, expansions, useCaseCard);
    setTopics(newTopics);
    setExpansions(newExpansions);
  }, [useCaseCard, calculateLayout]);

  // Modify handleTopicClick to use Cytoscape layout
  const handleTopicClick = useCallback(async (topicId: string, topicX: number, topicY: number) => {
    const existingExpansions = expansions.filter(e => e.parentId === topicId);

    if (existingExpansions.length > 0) {
      setExpansions(prev => prev.filter(e => e.parentId !== topicId));
      return;
    }

    const clickedTopic = topics.find(t => t.id === topicId);
    if (!clickedTopic) return;

    try {
      const response = await fetch('/api/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: clickedTopic.text, useCase })
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

      // Create new expansions with temporary positions
      const newExpansions = expansionsArray.map((expansion: string, i: number) => ({
        id: Date.now().toString() + '-' + i,
        parentId: topicId,
        x: topicX,
        y: topicY,
        text: expansion
      }));

      // Add new expansions and let the layout effect handle positioning
      setExpansions(prev => [...prev, ...newExpansions]);
    } catch (error) {
      console.error('Error fetching expansion:', error);
    }
  }, [expansions, topics, useCase]);

  const handleExpansionDragStart = () => {
    setIsDraggingTopic(true);
    setCursor('grabbing');
  };

  const handleExpansionDragEnd = (id: string, e: KonvaEventObject<DragEvent>) => {
    setIsDraggingTopic(false);
    setCursor('grab');

    const newX = e.target.x();
    const newY = e.target.y();

    setExpansions(prev =>
      prev.map(exp =>
        exp.id === id
          ? { ...exp, x: newX, y: newY }
          : exp
      )
    );
  };

  const handleExpansionDragMove = useCallback((id: string, e: KonvaEventObject<DragEvent>) => {
    const newX = e.target.x();
    const newY = e.target.y();

    // Update expansion position in real-time
    setExpansions(prev =>
      prev.map(exp =>
        exp.id === id ? { ...exp, x: newX, y: newY } : exp
      )
    );
  }, []);

  const handleTopicDelete = useCallback((topicId: string) => {
    // Remove the topic and its associated expansions
    setTopics(prev => prev.filter(t => t.id !== topicId));
    setExpansions(prev => prev.filter(e => e.parentId !== topicId));
  }, []);

  const handleExpansionDelete = useCallback((expansionId: string) => {
    setExpansions(prev => prev.filter(e => e.id !== expansionId));
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

  // Render connecting lines between use case and topics
  const renderConnectingLines = useMemo(() => {
    if (!useCaseCard || !topics.length) return null;

    return (
      <>
        {/* Use case to topic connections */}
        {topics.map((topic) => (
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
        ))}
        
        {/* Topic to expansion connections */}
        {expansions.map((expansion) => {
          const parentTopic = topics.find(t => t.id === expansion.parentId);
          if (!parentTopic) return null;
          
          return (
            <Line
              key={`expansion-line-${expansion.id}`}
              points={[
                parentTopic.x,
                parentTopic.y,
                expansion.x,
                expansion.y
              ]}
              stroke="#3a3a3a"
              strokeWidth={2}
              opacity={0.5}
              perfectDrawEnabled={false}
            />
          );
        })}
      </>
    );
  }, [useCaseCard, topics, expansions]);

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
          {renderConnectingLines}
          {renderUseCase}
          {topics.map((topic) => (
            <Topic
              key={topic.id}
              x={topic.x}
              y={topic.y}
              text={topic.text}
              onDragStart={() => handleDragStart(topic.id)}
              onDragMove={(e) => handleDragMove(topic.id, e)}
              onDragEnd={(e) => handleDragEnd(topic.id, e)}
              onClick={() => handleTopicClick(topic.id, topic.x, topic.y)}
              onDelete={() => handleTopicDelete(topic.id)}
            />
          ))}
          {expansions.map((expansion) => (
            <Expansion
              key={expansion.id}
              x={expansion.x}
              y={expansion.y}
              text={expansion.text}
              onDragStart={() => handleExpansionDragStart()}
              onDragMove={(e) => handleExpansionDragMove(expansion.id, e)}
              onDragEnd={(e) => handleExpansionDragEnd(expansion.id, e)}
              onDelete={() => handleExpansionDelete(expansion.id)}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
} 