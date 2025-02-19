import { Image } from 'react-konva';
import { Icon } from 'react-feather';
import { renderToStaticMarkup } from 'react-dom/server';
import { useEffect, useState } from 'react';

interface KonvaFeatherIconProps {
  icon: Icon;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
  opacity?: number;
}

export function KonvaFeatherIcon({
  icon: FeatherIcon,
  x = 0,
  y = 0,
  size = 24,
  color = 'white',
  opacity = 1
}: KonvaFeatherIconProps) {
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    // Create SVG string with the icon
    const svgString = renderToStaticMarkup(
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <FeatherIcon color={color} size={24} />
      </svg>
    );

    // Convert SVG string to base64
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);

    // Create and load the image
    const img = new window.Image();
    img.src = url;
    img.onload = () => {
      setImageElement(img);
      URL.revokeObjectURL(url);
    };

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [FeatherIcon, size, color]);

  if (!imageElement) {
    return null;
  }

  return (
    <Image
      image={imageElement}
      x={x}
      y={y}
      width={size}
      height={size}
      offsetX={size / 2}
      offsetY={size / 2}
      opacity={opacity}
      perfectDrawEnabled={false}
    />
  );
} 