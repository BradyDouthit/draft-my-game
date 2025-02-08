import { Rect, Text, Group, Circle } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { useEffect, useRef, useMemo, useState } from 'react';
import IconButton from './IconButton';
import Konva from 'konva';
import { COLORS, SHADOWS, DIMENSIONS } from '../utils/styles';

interface TopicProps {
  x: number;
  y: number;
  text: string;
  onDragStart: () => void;
  onDragMove: (e: KonvaEventObject<DragEvent>) => void;
  onDragEnd: (e: KonvaEventObject<DragEvent>) => void;
  onClick?: () => void;
  onDelete?: () => void;
}

export default function Topic({ x, y, text, onDragStart, onDragMove, onDragEnd, onClick, onDelete }: TopicProps) {
  const groupRef = useRef<any>(null);
  const textRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [isDeleteButtonHovered, setIsDeleteButtonHovered] = useState(false);
  
  const padding = 24;
  
  // Calculate dimensions when text changes
  useEffect(() => {
    if (textRef.current) {
      const maxWidth = 400;
      const textNode = textRef.current;

      // Reset any previous constraints
      textNode.width(undefined);
      textNode.height(undefined);
      
      // Set width and wrap mode
      textNode.width(maxWidth - (padding * 2));
      textNode.wrap('word');
      
      // Force a redraw to get accurate height
      const layer = textNode.getLayer();
      if (layer) {
        layer.batchDraw();
      }

      // Get the wrapped height
      const wrappedHeight = textNode.height();
      const finalHeight = Math.max(wrappedHeight + (padding * 2), 80);

      setDimensions({
        width: maxWidth,
        height: finalHeight
      });

      // Update text height to match container
      textNode.height(finalHeight - (padding * 2));
    }
  }, [text, padding]);

  // Memoize colors and styles
  const colors = useMemo(() => ({
    background: '#2a2a2a',
    border: '#3a3a3a',
    text: '#ffffff',
    shadow: 'black',
    hover: '#3a3a3a',
    overlay: {
      fill: 'rgba(0, 0, 0, 0.7)',
      blur: 3
    },
    button: {
      background: '#3a3a3a',
      hover: '#4a4a4a',
      text: '#ffffff'
    },
    delete: {
      background: '#cc3333',
      hover: '#dd4444',
      text: '#ffffff'
    }
  }), []);

  // Cache the topic when it's not being dragged or hovered
  useEffect(() => {
    if (groupRef.current && !isHovered) {
      groupRef.current.cache();
    }
  }, [x, y, text, dimensions, isHovered]);

  const handleButtonClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true; // Stop event propagation
    onClick?.();
  };

  const handleDeleteClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true; // Stop event propagation
    onDelete?.();
  };

  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      draggable
      onDragStart={() => {
        if (groupRef.current) {
          groupRef.current.clearCache();
          groupRef.current.moveToTop();
        }
        onDragStart();
      }}
      onDragMove={onDragMove}
      onDragEnd={(e) => {
        if (groupRef.current) {
          groupRef.current.cache();
        }
        onDragEnd(e);
      }}
      onMouseEnter={() => {
        if (groupRef.current) {
          groupRef.current.clearCache();
        }
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        if (groupRef.current) {
          groupRef.current.cache();
        }
        setIsHovered(false);
        setIsButtonHovered(false);
        setIsDeleteButtonHovered(false);
      }}
      perfectDrawEnabled={false}
    >
      <Rect
        width={dimensions.width}
        height={dimensions.height}
        cornerRadius={DIMENSIONS.cornerRadius}
        fill={COLORS.background}
        stroke={COLORS.border}
        strokeWidth={2}
        shadowColor={COLORS.shadow}
        shadowBlur={isHovered ? SHADOWS.hover.blur : SHADOWS.normal.blur}
        shadowOpacity={isHovered ? SHADOWS.hover.opacity : SHADOWS.normal.opacity}
        shadowOffset={SHADOWS.normal.offset}
        perfectDrawEnabled={false}
        offsetX={dimensions.width / 2}
        offsetY={dimensions.height / 2}
      />
      
      <Text
        ref={textRef}
        text={text}
        fontSize={16}
        fill={COLORS.text}
        align="center"
        verticalAlign="middle"
        width={dimensions.width - (padding * 2)}
        wrap="word"
        x={-dimensions.width / 2 + padding}
        y={-dimensions.height / 2 + padding}
        height={dimensions.height - (padding * 2)}
        lineHeight={1.4}
        perfectDrawEnabled={false}
      />
      
      {isHovered && (
        <>
          {/* Blur overlay */}
          <Rect
            width={dimensions.width}
            height={dimensions.height}
            cornerRadius={DIMENSIONS.cornerRadius}
            fill={COLORS.overlay.fill}
            filters={[Konva.Filters.Blur]}
            blurRadius={COLORS.overlay.blur}
            perfectDrawEnabled={true}
            shadowForStrokeEnabled={false}
            offsetX={dimensions.width / 2}
            offsetY={dimensions.height / 2}
            listening={false}
          />

          {/* Plus button - Left side */}
          <IconButton
            x={-DIMENSIONS.buttonSpacing}
            type="plus"
            isHovered={isButtonHovered}
            colors={COLORS.button}
            onMouseEnter={() => {
              setIsButtonHovered(true);
              const stage = groupRef.current?.getStage();
              if (stage) {
                stage.container().style.cursor = 'pointer';
              }
            }}
            onMouseLeave={() => {
              setIsButtonHovered(false);
              const stage = groupRef.current?.getStage();
              if (stage) {
                stage.container().style.cursor = 'grab';
              }
            }}
            onClick={handleButtonClick}
          />

          {/* Delete button - Right side */}
          <IconButton
            x={DIMENSIONS.buttonSpacing}
            type="delete"
            isHovered={isDeleteButtonHovered}
            colors={COLORS.delete}
            onMouseEnter={() => {
              setIsDeleteButtonHovered(true);
              const stage = groupRef.current?.getStage();
              if (stage) {
                stage.container().style.cursor = 'pointer';
              }
            }}
            onMouseLeave={() => {
              setIsDeleteButtonHovered(false);
              const stage = groupRef.current?.getStage();
              if (stage) {
                stage.container().style.cursor = 'grab';
              }
            }}
            onClick={handleDeleteClick}
          />
        </>
      )}
    </Group>
  );
} 