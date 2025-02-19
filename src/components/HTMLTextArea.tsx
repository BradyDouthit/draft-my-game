import { Html } from 'react-konva-utils';
import { useEffect, useRef } from 'react';

interface HTMLTextAreaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onBlur: () => void;
  style: React.CSSProperties;
  autoFocus?: boolean;
}

export function HTMLTextArea(props: HTMLTextAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const length = props.value.length;
        textareaRef.current.setSelectionRange(length, length);
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, []); // Empty dependency array = only run on mount

  return (
    <Html>
      <textarea 
        ref={textareaRef} 
        {...props} 
      />
    </Html>
  );
} 