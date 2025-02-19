import React from 'react';

interface ToolbarButtonProps {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  label,
  onClick,
  active = false,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-md
        transition-colors duration-200
        ${active 
          ? 'bg-blue-500 text-white hover:bg-blue-600' 
          : 'bg-white text-gray-700 hover:bg-gray-100'}
        shadow-sm
      `}
    >
      {icon && <span className="w-5 h-5">{icon}</span>}
      <span>{label}</span>
    </button>
  );
};

export default ToolbarButton; 