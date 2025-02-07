import { Rect, Text, Group } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { useEffect, useRef, useMemo, useState } from 'react';

interface TopicProps {
  x: number;
  y: number;
  text: string;
  onDragStart: () => void;
  onDragEnd: (e: KonvaEventObject<DragEvent>) => void;
}

export default function Topic({ x, y, text, onDragStart, onDragEnd }: TopicProps) {
  const groupRef = useRef<any>(null);
  const textRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Calculate dimensions when text changes
  useEffect(() => {
    if (textRef.current) {
      // First measure text without width constraint
      textRef.current.width(undefined);
      const textWidth = Math.max(Math.min(textRef.current.getWidth(), 400), 100); // Min 100, Max 400
      
      // Now set constrained width and measure height
      textRef.current.width(textWidth);
      const textHeight = Math.max(textRef.current.getHeight(), 40);
      
      const padding = 24;
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
    shadow: 'black'
  }), []);

  // Cache the topic when it's not being dragged
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.cache();
    }
  }, [x, y, text, dimensions]);

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
      onDragEnd={(e) => {
        if (groupRef.current) {
          groupRef.current.cache();
        }
        onDragEnd(e);
      }}
      perfectDrawEnabled={false}
    >
      <Rect
        width={dimensions.width}
        height={dimensions.height}
        cornerRadius={12}
        fill={colors.background}
        stroke={colors.border}
        strokeWidth={2}
        shadowColor={colors.shadow}
        shadowBlur={10}
        shadowOpacity={0.2}
        shadowOffset={{ x: 2, y: 2 }}
        perfectDrawEnabled={false}
        offsetX={dimensions.width / 2}  // Center the rectangle
        offsetY={dimensions.height / 2}
      />
      <Text
        ref={textRef}
        text={text}
        fontSize={16}
        fill={colors.text}
        align="center"
        verticalAlign="middle"
        width={dimensions.width - 48}
        height={dimensions.height - 48}
        x={-dimensions.width / 2 + 24}  // Adjust for centering
        y={-dimensions.height / 2 + 24}
        lineHeight={1.2}
        perfectDrawEnabled={false}
      />
    </Group>
  );
} 