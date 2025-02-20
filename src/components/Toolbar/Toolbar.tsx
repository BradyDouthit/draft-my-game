import React from 'react';
import CreateTopic from '../CreateTopic/CreateTopic';
import DownloadGDD from './DownloadGDD';

interface ToolbarProps {
  onCreateTopic: (text: string) => void;
  useCase: string;
  topics: Array<{
    id: string;
    text: string;
    expansions?: string[];
  }>;
}

const Toolbar: React.FC<ToolbarProps> = ({ onCreateTopic, useCase, topics }) => {
  return (
    <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2
      bg-gray-800 rounded-lg shadow-lg p-2 flex items-center gap-2"
    >
      <CreateTopic onCreateTopic={onCreateTopic} />
      <div className="w-px h-8 bg-gray-600" /> {/* Vertical divider */}
      <DownloadGDD useCase={useCase} topics={topics} />
    </div>
  );
};

export default Toolbar; 