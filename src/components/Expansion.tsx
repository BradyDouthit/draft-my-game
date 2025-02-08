import { Rect, Text, Group } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { useEffect, useRef, useMemo, useState } from 'react';
import IconButton from './IconButton';
import Konva from 'konva';
import { COLORS, SHADOWS, DIMENSIONS } from '../utils/styles';

interface ExpansionProps {
  x: number;
  y: number;
  text: string;
  onDragStart: () => void;
  onDragMove: (e: KonvaEventObject<DragEvent>) => void;
  onDragEnd: (e: KonvaEventObject<DragEvent>) => void;
  onDelete?: () => void;
}

export default function Expansion({ x, y, text, onDragStart, onDragMove, onDragEnd, onDelete }: ExpansionProps) {
  const groupRef = useRef<any>(null);
  const textRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleteButtonHovered, setIsDeleteButtonHovered] = useState(false);

  // Calculate dimensions when text changes
  useEffect(() => {
    if (textRef.current) {
      // Set a fixed width for the text
      const maxWidth = 300;
      textRef.current.width(maxWidth);
      
      // Let the height adjust automatically based on content
      const textHeight = textRef.current.getHeight();
      
      const padding = 20;
      setDimensions({
        width: maxWidth + (padding * 2),
        height: textHeight + (padding * 2)
      });
    }
  }, [text]);

  // Cache the expansion when it's not being dragged or hovered
  useEffect(() => {
    if (groupRef.current && !isHovered) {
      groupRef.current.cache();
    }
  }, [x, y, text, dimensions, isHovered]);

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
        fontSize={14}
        fill={COLORS.text}
        align="center"
        verticalAlign="middle"
        width={dimensions.width - 40}
        wrap="word"
        x={-dimensions.width / 2 + 20}
        y={-dimensions.height / 2 + 20}
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

          {/* Delete button - Centered */}
          <IconButton
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