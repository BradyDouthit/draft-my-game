import React from 'react';
import CreateTopic from '../CreateTopic/CreateTopic';
import DownloadGDD from './DownloadGDD';
import './toolbar-styles.css';

interface ToolbarProps {
  onCreateTopic: (text: string) => void;
  onDownloadGDD: () => void;
  topics: Array<{
    id: string;
    text: string;
    expansions?: string[];
  }>;
  useCase: string;
}

const Toolbar: React.FC<ToolbarProps> = ({ onCreateTopic, onDownloadGDD, useCase, topics }) => {
  return (
    <div className="bg-[var(--surface)] rounded-lg shadow-lg p-2 flex items-center gap-2
      border border-[var(--border)] toolbar-container" onClick={(e) => e.stopPropagation()}
    >
      <CreateTopic onCreateTopic={onCreateTopic} />
      <div className="w-px h-8 bg-[var(--border)]" /> {/* Vertical divider */}
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          console.log('Download GDD button clicked');
          onDownloadGDD();
        }}
        className="flex items-center px-4 py-2 rounded-md text-sm font-medium 
          bg-[var(--accent-primary)] text-white 
          hover:bg-[var(--accent-primary-hover)] transition-colors cursor-pointer"
        title="Download Game Design Document"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        Download GDD
      </button>
    </div>
  );
};

export default Toolbar; 