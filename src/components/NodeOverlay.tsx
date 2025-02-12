import { Group, Rect, Circle, Path } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';

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
  small: { radius: 12, iconScale: 0.4 },
  medium: { radius: 16, iconScale: 0.6 },
  large: { radius: 20, iconScale: 0.8 }
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
              
              {button.icon === 'edit' && (
                <Path
                  data="M20.8477 1.87868C19.6761 0.707109 17.7766 0.707105 16.605 1.87868L2.44744 16.0363C2.02864 16.4551 1.74317 16.9885 1.62702 17.5692L1.03995 20.5046C0.760062 21.904 1.9939 23.1379 3.39334 22.858L6.32868 22.2709C6.90945 22.1548 7.44285 21.8693 7.86165 21.4505L22.0192 7.29289C23.1908 6.12132 23.1908 4.22183 22.0192 3.05025L20.8477 1.87868ZM18.0192 3.29289C18.4098 2.90237 19.0429 2.90237 19.4335 3.29289L20.605 4.46447C20.9956 4.85499 20.9956 5.48815 20.605 5.87868L17.9334 8.55027L15.3477 5.96448L18.0192 3.29289ZM13.9334 7.3787L3.86165 17.4505C3.72205 17.5901 3.6269 17.7679 3.58818 17.9615L3.00111 20.8968L5.93645 20.3097C6.13004 20.271 6.30784 20.1759 6.44744 20.0363L16.5192 9.96448L13.9334 7.3787Z"
                  fill="#ffffff"
                  scale={{ x: size.iconScale, y: size.iconScale }}
                  x={-11 * size.iconScale}
                  y={-11 * size.iconScale}
                  perfectDrawEnabled={false}
                />
              )}
              {button.icon === 'delete' && (
                <Path
                  data="M6.2253 4.81108C5.83477 4.42056 5.20161 4.42056 4.81108 4.81108C4.42056 5.20161 4.42056 5.83477 4.81108 6.2253L10.5858 12L4.81114 17.7747C4.42062 18.1652 4.42062 18.7984 4.81114 19.1889C5.20167 19.5794 5.83483 19.5794 6.22535 19.1889L12 13.4142L17.7747 19.1889C18.1652 19.5794 18.7984 19.5794 19.1889 19.1889C19.5794 18.7984 19.5794 18.1652 19.1889 17.7747L13.4142 12L19.189 6.2253C19.5795 5.83477 19.5795 5.20161 19.189 4.81108C18.7985 4.42056 18.1653 4.42056 17.7748 4.81108L12 10.5858L6.2253 4.81108Z"
                  fill="#ffffff"
                  scale={{ x: size.iconScale, y: size.iconScale }}
                  x={-11 * size.iconScale}
                  y={-11 * size.iconScale}
                  perfectDrawEnabled={false}
                />
              )}
              {button.icon === 'plus' && (
                <Group>
                  <Rect
                    width={14}
                    height={2}
                    fill="#ffffff"
                    offsetX={7}
                    offsetY={1}
                    perfectDrawEnabled={false}
                  />
                  <Rect
                    width={2}
                    height={14}
                    fill="#ffffff"
                    offsetX={1}
                    offsetY={7}
                    perfectDrawEnabled={false}
                  />
                </Group>
              )}
            </Group>
          );
        })}
      </Group>
    </Group>
  );
} 