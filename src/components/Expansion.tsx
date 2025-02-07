import { Rect, Text, Group } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { useEffect, useRef, useMemo, useState } from 'react';

interface ExpansionProps {
  x: number;
  y: number;
  text: string;
  onDragStart: () => void;
  onDragMove: (e: KonvaEventObject<DragEvent>) => void;
  onDragEnd: (e: KonvaEventObject<DragEvent>) => void;
}

export default function Expansion({ x, y, text, onDragStart, onDragMove, onDragEnd }: ExpansionProps) {
  const groupRef = useRef<any>(null);
  const textRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Calculate dimensions when text changes
  useEffect(() => {
    if (textRef.current) {
      // First measure text without width constraint
      textRef.current.width(undefined);
      const textWidth = Math.max(Math.min(textRef.current.getWidth(), 300), 80); // Slightly smaller than Topics
      
      // Now set constrained width and measure height
      textRef.current.width(textWidth);
      const textHeight = Math.max(textRef.current.getHeight(), 30);
      
      const padding = 20;
      setDimensions({
        width: textWidth + (padding * 2),
        height: textHeight + (padding * 2)
      });
    }
  }, [text]);

  // Memoize colors and styles
  const colors = useMemo(() => ({
    background: '#2a2a2a',
    border: '#3a3a3a',
    text: '#ffffff',
    shadow: 'black',
    hover: '#3a3a3a'
  }), []);

  // Cache the expansion when it's not being dragged or hovered
  useEffect(() => {
    if (groupRef.current && !isHovered) {
      groupRef.current.cache();
    }
  }, [x, y, text, dimensions, isHovered]);

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
      }}
      perfectDrawEnabled={false}
    >
      <Rect
        width={dimensions.width}
        height={dimensions.height}
        cornerRadius={12}
        fill={isHovered ? colors.hover : colors.background}
        stroke={colors.border}
        strokeWidth={2}
        shadowColor={colors.shadow}
        shadowBlur={isHovered ? 15 : 10}
        shadowOpacity={isHovered ? 0.4 : 0.2}
        shadowOffset={{ x: 2, y: 2 }}
        perfectDrawEnabled={false}
        offsetX={dimensions.width / 2}
        offsetY={dimensions.height / 2}
      />
      <Text
        ref={textRef}
        text={text}
        fontSize={14} // Slightly smaller than Topics
        fill={colors.text}
        align="center"
        verticalAlign="middle"
        width={dimensions.width - 40}
        height={dimensions.height - 40}
        x={-dimensions.width / 2 + 20}
        y={-dimensions.height / 2 + 20}
        lineHeight={1.2}
        perfectDrawEnabled={false}
      />
    </Group>
  );
} 