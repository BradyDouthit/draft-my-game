import { Group, Rect, Circle } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import { KonvaFeatherIcon } from './KonvaFeatherIcon';
import { Edit2, Trash2, Plus } from 'react-feather';

// Button configuration types
type ButtonIcon = 'edit' | 'delete' | 'plus';
type ButtonColor = 'default' | 'danger' | 'success' | 'warning';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonConfig {
  icon: ButtonIcon;
  onClick: () => void;
  color?: ButtonColor;
  size?: ButtonSize;
}

interface NodeOverlayProps {
  width: number;
  height: number;
  isVisible: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  buttons: ButtonConfig[];
}

// Color configurations
const COLORS: Record<ButtonColor, { normal: string; hover: string }> = {
  default: { normal: '#3a3a3a', hover: '#4a4a4a' },
  danger: { normal: '#cc3333', hover: '#dd4444' },
  success: { normal: '#2fb344', hover: '#37cc50' },
  warning: { normal: '#f0ad4e', hover: '#ffc107' }
};

// Size configurations
const SIZES: Record<ButtonSize, { radius: number; iconScale: number }> = {
  small: { radius: 12, iconScale: 0.35 },
  medium: { radius: 16, iconScale: 0.5 },
  large: { radius: 20, iconScale: 0.7 }
};

const getIconForType = (type: ButtonIcon) => {
  switch (type) {
    case 'edit': return Edit2;
    case 'delete': return Trash2;
    case 'plus': return Plus;
  }
};

export function NodeOverlay({ 
  width, 
  height, 
  isVisible,
  onMouseEnter,
  onMouseLeave,
  buttons
}: NodeOverlayProps) {
  if (!isVisible) return null;

  const buttonSize = 32;
  const buttonSpacing = 16;
  const totalWidth = buttons.length * buttonSize + (buttons.length - 1) * buttonSpacing;
  const startX = -totalWidth / 2 + buttonSize / 2;

  return (
    <Group
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      x={-width / 2}
      y={-height / 2}
    >
      {/* Semi-transparent overlay */}
      <Rect
        width={width}
        height={height}
        fill="rgba(0, 0, 0, 0.5)"
        cornerRadius={12}
        perfectDrawEnabled={false}
      />
      
      {/* Buttons */}
      <Group 
        x={width / 2}
        y={height / 2}
      >
        {buttons.map((button, index) => {
          const x = startX + index * (buttonSize + buttonSpacing);
          const size = SIZES[button.size || 'medium'];
          const colors = COLORS[button.color || 'default'];

          return (
            <Group
              key={`${button.icon}-${index}`}
              x={x}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'pointer';
                const parent = e.target.getParent();
                if (parent) {
                  const circle = parent.findOne('Circle') as Konva.Circle;
                  if (circle) circle.fill(colors.hover);
                }
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';
                const parent = e.target.getParent();
                if (parent) {
                  const circle = parent.findOne('Circle') as Konva.Circle;
                  if (circle) circle.fill(colors.normal);
                }
              }}
              onClick={(e: KonvaEventObject<MouseEvent>) => {
                e.cancelBubble = true;
                button.onClick();
              }}
            >
              <Circle
                radius={size.radius}
                fill={colors.normal}
                perfectDrawEnabled={false}
              />
              <KonvaFeatherIcon
                icon={getIconForType(button.icon)}
                size={size.radius * 2 * size.iconScale}
                color="#ffffff"
              />
            </Group>
          );
        })}
      </Group>
    </Group>
  );
} 