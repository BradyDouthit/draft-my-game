import { Circle, Text, Group } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { useEffect, useRef, useMemo } from 'react';

interface TopicProps {
  x: number;
  y: number;
  text: string;
  isDarkMode: boolean;
  onDragStart: () => void;
  onDragEnd: (e: KonvaEventObject<DragEvent>) => void;
}

export default function Topic({ x, y, text, isDarkMode, onDragStart, onDragEnd }: TopicProps) {
  const groupRef = useRef<any>(null);
  
  // Memoize calculations and text wrapping
  const {
    radius,
    lines,
    bgColor,
    strokeColor,
    textColor,
    shadowColor
  } = useMemo(() => {
    // Calculate radius based on text length
    const radius = Math.max(70, Math.min(text.length * 4, 120));
    
    // Break text into multiple lines if needed
    const wrapText = (text: string, maxWidth: number) => {
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = currentLine.length + word.length + 1;
        
        if (width > maxWidth) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine += ' ' + word;
        }
      }
      lines.push(currentLine);
      return lines;
    };

    const lines = wrapText(text, 20);

    // Theme-based colors
    const bgColor = isDarkMode ? '#2a2a2a' : 'white';
    const strokeColor = isDarkMode ? '#555' : '#333';
    const textColor = isDarkMode ? '#fff' : '#333';
    const shadowColor = isDarkMode ? 'black' : 'rgba(0, 0, 0, 0.2)';

    return {
      radius,
      lines,
      bgColor,
      strokeColor,
      textColor,
      shadowColor
    };
  }, [text, isDarkMode]);

  // Cache the topic when it's not being dragged
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.cache();
    }
  }, [x, y, text, isDarkMode]);

  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      draggable
      onDragStart={() => {
        if (groupRef.current) {
          groupRef.current.clearCache();
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
      <Circle
        radius={radius}
        fill={bgColor}
        stroke={strokeColor}
        strokeWidth={2}
        shadowColor={shadowColor}
        shadowBlur={10}
        shadowOpacity={isDarkMode ? 0.5 : 0.2}
        shadowOffset={{ x: 2, y: 2 }}
        perfectDrawEnabled={false}
      />
      <Text
        text={lines.join('\n')}
        fontSize={16}
        fill={textColor}
        align="center"
        verticalAlign="middle"
        width={radius * 2}
        height={radius * 2}
        offsetX={radius}
        offsetY={radius}
        lineHeight={1.2}
        perfectDrawEnabled={false}
      />
    </Group>
  );
} 