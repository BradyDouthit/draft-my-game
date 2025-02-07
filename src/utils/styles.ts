export const COLORS = {
  background: '#2a2a2a',
  border: '#3a3a3a',
  text: '#ffffff',
  shadow: 'black',
  hover: '#3a3a3a',
  overlay: {
    fill: 'rgba(0, 0, 0, 0.5)',
    blur: 8
  },
  button: {
    background: '#3a3a3a',
    hover: '#4a4a4a',
    text: '#ffffff'
  },
  delete: {
    background: '#cc3333',
    hover: '#dd4444',
    text: '#ffffff'
  }
} as const;

export const SHADOWS = {
  normal: {
    blur: 10,
    opacity: 0.2,
    offset: { x: 2, y: 2 }
  },
  hover: {
    blur: 15,
    opacity: 0.4,
    offset: { x: 2, y: 2 }
  }
} as const;

export const DIMENSIONS = {
  cornerRadius: 12,
  buttonSpacing: 24
} as const; 