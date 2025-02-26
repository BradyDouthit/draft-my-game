import React from 'react';
import CreateTopic from '../CreateTopic/CreateTopic';
import DownloadGDD from './DownloadGDD';
import './toolbar-styles.css';

interface ToolbarProps {
  onCreateTopic: (text: string) => void;
  topics: Array<{
    id: string;
    text: string;
  }>;
  useCase: string;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  onCreateTopic, 
  useCase, 
  topics
}) => {
  return (
    <div className="bg-[var(--surface)] rounded-lg shadow-lg p-2 flex items-center gap-2
      border border-[var(--border)] toolbar-container" onClick={(e) => e.stopPropagation()}
    >
      <CreateTopic onCreateTopic={onCreateTopic} />
      <div className="w-px h-8 bg-[var(--border)]" /> {/* Vertical divider */}
      
      <DownloadGDD useCase={useCase} topics={topics} />
    </div>
  );
};

export default Toolbar; 