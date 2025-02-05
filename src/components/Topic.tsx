import { Circle, Text, Group } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';

interface TopicProps {
  x: number;
  y: number;
  text: string;
  onDragEnd: (e: KonvaEventObject<DragEvent>) => void;
}

export default function Topic({ x, y, text, onDragEnd }: TopicProps) {
  return (
    <Group
      x={x}
      y={y}
      draggable
      onDragEnd={onDragEnd}
    >
      <Circle
        radius={50}
        fill="white"
        stroke="#333"
        strokeWidth={2}
      />
      <Text
        text={text}
        fontSize={16}
        fill="#333"
        align="center"
        verticalAlign="middle"
        width={100}
        height={100}
        offsetX={50}
        offsetY={50}
      />
    </Group>
  );
} 