import { Group, Line, Circle, Rect } from 'react-konva';
import { GitMerge } from 'react-feather';
import { KonvaFeatherIcon } from './KonvaFeatherIcon';

interface CombineIndicatorProps {
  sourceTopic: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  targetTopic: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export function CombineIndicator({ sourceTopic, targetTopic }: CombineIndicatorProps) {
  // Calculate midpoint for the merge indicator
  const midX = (sourceTopic.x + targetTopic.x) / 2;
  const midY = (sourceTopic.y + targetTopic.y) / 2;

  const circleRadius = 18;
  const iconSize = 24; // Use the default Feather icon size

  return (
    <>
      {/* Glow effect around both topics */}
      <Rect
        x={targetTopic.x}
        y={targetTopic.y}
        width={targetTopic.width}
        height={targetTopic.height}
        cornerRadius={8}
        fill="transparent"
        stroke="#4A90E2"
        strokeWidth={3}
        opacity={0.8}
        perfectDrawEnabled={false}
        offsetX={targetTopic.width / 2}
        offsetY={targetTopic.height / 2}
        shadowColor="#4A90E2"
        shadowBlur={15}
        shadowOpacity={0.5}
      />
      <Rect
        x={sourceTopic.x}
        y={sourceTopic.y}
        width={sourceTopic.width}
        height={sourceTopic.height}
        cornerRadius={8}
        fill="transparent"
        stroke="#4A90E2"
        strokeWidth={3}
        opacity={0.8}
        perfectDrawEnabled={false}
        offsetX={sourceTopic.width / 2}
        offsetY={sourceTopic.height / 2}
        shadowColor="#4A90E2"
        shadowBlur={15}
        shadowOpacity={0.5}
      />

      {/* Connection line with gradient */}
      <Line
        points={[
          sourceTopic.x,
          sourceTopic.y,
          targetTopic.x,
          targetTopic.y
        ]}
        stroke="#4A90E2"
        strokeWidth={3}
        opacity={0.8}
        dash={[10, 5]}
      />

      {/* Merge indicator in the middle */}
      <Group x={midX} y={midY}>
        {/* Background circle */}
        <Circle
          radius={circleRadius}
          fill="#4A90E2"
          opacity={0.9}
          perfectDrawEnabled={false}
        />
        {/* Merge icon */}
        <KonvaFeatherIcon
          icon={GitMerge}
          size={iconSize}
          color="white"
          x={0}
          y={0}
        />
      </Group>

      {/* Pulsing animation on target */}
      <Circle
        x={targetTopic.x}
        y={targetTopic.y}
        radius={Math.max(targetTopic.width, targetTopic.height) / 4}
        stroke="#4A90E2"
        strokeWidth={2}
        opacity={0.5}
        perfectDrawEnabled={false}
      />
    </>
  );
} 