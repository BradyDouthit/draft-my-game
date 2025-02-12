import { Group, Rect } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { useEffect, useRef, useState, ReactNode } from 'react';
import Konva from 'konva';
import { COLORS, SHADOWS, DIMENSIONS } from '../utils/styles';
import { HTMLTextArea } from './HTMLTextArea';
import { NodeOverlay } from './NodeOverlay';

export interface DraggableNodeProps {
  x: number;
  y: number;
  text: string;
  width: number;
  height: number;
  onDragStart: () => void;
  onDragMove: (e: KonvaEventObject<DragEvent>) => void;
  onDragEnd: (e: KonvaEventObject<DragEvent>) => void;
  onEdit?: (newText: string) => void;
  onDelete?: () => void;
  onPlus?: () => void;
  renderContent: (isEditing: boolean) => ReactNode;
  padding?: number;
  fontSize?: number;
}

export function DraggableNode({ 
  x, 
  y, 
  text,
  width,
  height,
  onDragStart, 
  onDragMove, 
  onDragEnd,
  onEdit,
  onDelete,
  onPlus,
  renderContent,
  padding = 20,
  fontSize = 14
}: DraggableNodeProps) {
  const groupRef = useRef<any>(null);
  const [isHoveredCanvas, setIsHoveredCanvas] = useState(false);
  const [isHoveredOverlay, setIsHoveredOverlay] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text);

  const isHovered = isHoveredCanvas || isHoveredOverlay;

  // Update editValue when text prop changes
  useEffect(() => {
    setEditValue(text);
  }, [text]);

  // Cache when not hovered
  useEffect(() => {
    if (groupRef.current && !isHovered) {
      groupRef.current.cache();
    }
  }, [x, y, text, width, height, isHovered]);

  const handleEditComplete = () => {
    if (editValue !== text && onEdit) {
      onEdit(editValue);
    }
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditComplete();
    } else if (e.key === 'Escape') {
      setEditValue(text);
      setIsEditing(false);
    }
  };

  // Prepare overlay buttons
  const overlayButtons = [
    ...(onEdit ? [{
      icon: 'edit' as const,
      onClick: () => setIsEditing(true)
    }] : []),
    ...(onPlus ? [{
      icon: 'plus' as const,
      onClick: onPlus
    }] : []),
    ...(onDelete ? [{
      icon: 'delete' as const,
      onClick: onDelete,
      color: 'danger' as const
    }] : [])
  ];

  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      draggable
      onDragStart={() => {
        if (isEditing) return;
        if (groupRef.current) {
          groupRef.current.clearCache();
          groupRef.current.moveToTop();
        }
        onDragStart();
      }}
      onDragMove={(e) => {
        if (isEditing) return;
        onDragMove(e);
      }}
      onDragEnd={(e) => {
        if (isEditing) return;
        if (groupRef.current) {
          groupRef.current.cache();
        }
        onDragEnd(e);
      }}
      onMouseEnter={() => {
        if (groupRef.current) {
          groupRef.current.clearCache();
        }
        setIsHoveredCanvas(true);
      }}
      onMouseLeave={() => {
        if (groupRef.current) {
          groupRef.current.cache();
        }
        setIsHoveredCanvas(false);
      }}
      perfectDrawEnabled={false}
    >
      {/* Background */}
      <Rect
        width={width}
        height={height}
        cornerRadius={DIMENSIONS.cornerRadius}
        fill={COLORS.background}
        stroke={COLORS.border}
        strokeWidth={2}
        shadowColor={COLORS.shadow}
        shadowBlur={isHovered ? SHADOWS.hover.blur : SHADOWS.normal.blur}
        shadowOpacity={isHovered ? SHADOWS.hover.opacity : SHADOWS.normal.opacity}
        shadowOffset={SHADOWS.normal.offset}
        perfectDrawEnabled={false}
        offsetX={width / 2}
        offsetY={height / 2}
      />

      {/* Content */}
      {renderContent(isEditing)}

      {/* Edit overlay */}
      {isEditing && (
        <HTMLTextArea
          value={editValue}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditValue(e.target.value)}
          onKeyDown={handleEditKeyDown}
          onBlur={handleEditComplete}
          style={{
            position: 'absolute',
            top: -height / 2 + padding,
            left: -width / 2 + padding,
            width: width - (padding * 2),
            height: height - (padding * 2),
            background: 'transparent',
            border: 'none',
            color: COLORS.text,
            fontSize: `${fontSize}px`,
            lineHeight: '1.4',
            resize: 'none',
            textAlign: 'center',
            outline: 'none',
          }}
          autoFocus
        />
      )}
      
      {/* Hover overlay */}
      <>
        {/* Blur effect */}
        <Rect
          width={width}
          height={height}
          cornerRadius={DIMENSIONS.cornerRadius}
          fill={COLORS.overlay.fill}
          filters={[Konva.Filters.Blur]}
          blurRadius={COLORS.overlay.blur}
          perfectDrawEnabled={true}
          shadowForStrokeEnabled={false}
          offsetX={width / 2}
          offsetY={height / 2}
          listening={false}
          opacity={isHovered ? 1 : 0}
        />

        <NodeOverlay
          width={width}
          height={height}
          isVisible={isHovered}
          onMouseEnter={() => setIsHoveredOverlay(true)}
          onMouseLeave={() => setIsHoveredOverlay(false)}
          buttons={overlayButtons}
        />
      </>
    </Group>
  );
} 