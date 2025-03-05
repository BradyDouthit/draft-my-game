import React, { useState } from 'react';
import { track } from '@vercel/analytics';

interface NewTopicToolProps {
  originalTopicId: string;
  createTopic: (params: { name: string; parentId: string }) => void;
  onClose: () => void;
}

const NewTopicTool: React.FC<NewTopicToolProps> = ({
  originalTopicId,
  createTopic,
  onClose,
}) => {
  const [topicName, setTopicName] = useState('');

  const handleCreateTopic = () => {
    if (topicName.trim() === '') return;
    createTopic({ name: topicName, parentId: originalTopicId });
    
    // Track new related topic creation
    track('new_topic_created', {
      parent_id: originalTopicId
    });
    
    setTopicName('');
    onClose();
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={topicName}
        onChange={(e) => setTopicName(e.target.value)}
        placeholder="Enter new topic"
        className="flex-1 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleCreateTopic();
          if (e.key === 'Escape') onClose();
        }}
        autoFocus
      />
      <button
        onClick={handleCreateTopic}
        className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
      >
        Create
      </button>
    </div>
  );
};

export default NewTopicTool; 