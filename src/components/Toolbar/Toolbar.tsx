import React from 'react';
import CreateTopic from '../CreateTopic/CreateTopic';

interface ToolbarProps {
  onCreateTopic: (text: string) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onCreateTopic }) => {
  return (
    <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2
      bg-gray-800 rounded-lg shadow-lg p-2 flex items-center gap-2"
    >
      <CreateTopic onCreateTopic={onCreateTopic} />
    </div>
  );
};

export default Toolbar; 