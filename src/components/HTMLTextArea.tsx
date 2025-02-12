import { Html } from 'react-konva-utils';

interface HTMLTextAreaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onBlur: () => void;
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  style: React.CSSProperties;
  autoFocus?: boolean;
}

export function HTMLTextArea(props: HTMLTextAreaProps) {
  return (
    <Html>
      <textarea {...props} />
    </Html>
  );
} 