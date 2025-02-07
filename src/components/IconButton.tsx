import { Group, Circle, Rect } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';

interface IconButtonProps {
  x?: number;
  y?: number;
  type: 'plus' | 'delete';
  isHovered: boolean;
  colors: {
    background: string;
    hover: string;
    text: string;
  };
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: (e: KonvaEventObject<MouseEvent>) => void;
}

export default function IconButton({ 
  x = 0, 
  y = 0, 
  type, 
  isHovered, 
  colors, 
  onMouseEnter, 
  onMouseLeave, 
  onClick 
}: IconButtonProps) {
  const radius = 16;

  return (
    <Group
      x={x}
      y={y}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <Circle
        radius={radius}
        fill={isHovered ? colors.hover : colors.background}
        perfectDrawEnabled={false}
      />
      
      {type === 'plus' ? (
        <>
          <Rect
            width={12}
            height={2}
            fill={colors.text}
            offsetX={6}
            offsetY={1}
            perfectDrawEnabled={false}
          />
          <Rect
            width={2}
            height={12}
            fill={colors.text}
            offsetX={1}
            offsetY={6}
            perfectDrawEnabled={false}
          />
        </>
      ) : (
        <>
          <Rect
            width={12}
            height={2}
            fill={colors.text}
            rotation={45}
            offsetX={6}
            offsetY={1}
            perfectDrawEnabled={false}
          />
          <Rect
            width={12}
            height={2}
            fill={colors.text}
            rotation={-45}
            offsetX={6}
            offsetY={1}
            perfectDrawEnabled={false}
          />
        </>
      )}
    </Group>
  );
} 