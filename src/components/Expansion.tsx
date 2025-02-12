import { Text } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { useEffect, useRef, useState } from 'react';
import { DraggableNode } from './DraggableNode';

interface ExpansionProps {
  x: number;
  y: number;
  text: string;
  onDragStart: () => void;
  onDragMove: (e: KonvaEventObject<DragEvent>) => void;
  onDragEnd: (e: KonvaEventObject<DragEvent>) => void;
  onDelete?: () => void;
  onEdit?: (newText: string) => void;
}

export default function Expansion({ 
  x, 
  y, 
  text, 
  onDragStart, 
  onDragMove, 
  onDragEnd,
  onDelete,
  onEdit
}: ExpansionProps) {
  const textRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const padding = 20;

  // Calculate dimensions when text changes
  useEffect(() => {
    if (textRef.current) {
      // Set a fixed width for the text
      const maxWidth = 300;
      textRef.current.width(maxWidth);
      
      // Let the height adjust automatically based on content
      const textHeight = textRef.current.getHeight();
      
      setDimensions({
        width: maxWidth + (padding * 2),
        height: textHeight + (padding * 2)
      });
    }
  }, [text, padding]);

  const renderContent = (isEditing: boolean) => {
    if (isEditing) return null;
    
    return (
      <Text
        ref={textRef}
        text={text}
        fontSize={14}
        fill="#ffffff"
        align="center"
        verticalAlign="middle"
        width={dimensions.width - (padding * 2)}
        wrap="word"
        x={-dimensions.width / 2 + padding}
        y={-dimensions.height / 2 + padding}
        lineHeight={1.4}
        perfectDrawEnabled={false}
      />
    );
  };

  return (
    <DraggableNode
      x={x}
      y={y}
      text={text}
      width={dimensions.width}
      height={dimensions.height}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onEdit={onEdit}
      onDelete={onDelete}
      renderContent={renderContent}
      padding={padding}
      fontSize={14}
    />
  );
} 