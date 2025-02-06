import { Group, Shape } from 'react-konva';

interface GridProps {
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  isDarkMode: boolean;
}

export default function Grid({ width, height, scale, offsetX, offsetY, isDarkMode }: GridProps) {
  const spacing = 50; // Fixed spacing between dots
  const dotColor = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
  const dotSize = 2.5;
  const bufferMultiplier = 2;

  return (
    <Shape
      sceneFunc={(context, shape) => {
        // Ensure we're not trying to draw too many dots when zoomed out
        if (scale < 0.3) return;

        const bufferX = width * bufferMultiplier;
        const bufferY = height * bufferMultiplier;

        // Calculate visible area in world coordinates
        const startX = (-offsetX - bufferX) / scale;
        const startY = (-offsetY - bufferY) / scale;
        const endX = (width - offsetX + bufferX) / scale;
        const endY = (height - offsetY + bufferY) / scale;

        // Snap to grid to prevent jumping
        const snapToGrid = (value: number) => Math.round(value / spacing) * spacing;
        
        const gridStartX = snapToGrid(startX);
        const gridStartY = snapToGrid(startY);
        const gridEndX = snapToGrid(endX);
        const gridEndY = snapToGrid(endY);

        // Keep dot size reasonable
        const scaledDotSize = Math.min(dotSize, dotSize / scale);

        // Draw dots
        context.fillStyle = dotColor;
        
        for (let x = gridStartX; x <= gridEndX; x += spacing) {
          for (let y = gridStartY; y <= gridEndY; y += spacing) {
            context.beginPath();
            context.arc(x, y, scaledDotSize / 2, 0, Math.PI * 2);
            context.fill();
          }
        }
      }}
      width={width}
      height={height}
    />
  );
} 