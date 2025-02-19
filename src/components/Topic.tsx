import { Text } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { useEffect, useRef, useState } from 'react';
import { DraggableNode } from './DraggableNode';

interface TopicProps {
  x: number;
  y: number;
  text: string;
  onDragStart: () => void;
  onDragMove: (e: KonvaEventObject<DragEvent>, dimensions: { width: number; height: number }) => void;
  onDragEnd: (e: KonvaEventObject<DragEvent>, dimensions: { width: number; height: number }) => void;
  onClick?: () => void;
  onDelete?: () => void;
  onEdit?: (newText: string) => void;
}

export default function Topic({ 
  x, 
  y, 
  text, 
  onDragStart, 
  onDragMove, 
  onDragEnd,
  onClick,
  onDelete,
  onEdit
}: TopicProps) {
  const textRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
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

  const renderContent = (isEditing: boolean) => {
    if (isEditing) return null;
    
    return (
      <Text
        ref={textRef}
        text={text}
        fontSize={16}
        fill="#ffffff"
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
      onDragMove={(e) => onDragMove(e, dimensions)}
      onDragEnd={(e) => onDragEnd(e, dimensions)}
      onEdit={onEdit}
      onDelete={onDelete}
      onPlus={onClick}
      renderContent={renderContent}
      padding={padding}
      fontSize={16}
    />
  );
} 