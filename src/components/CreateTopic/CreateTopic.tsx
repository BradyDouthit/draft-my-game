import React, { useState } from 'react';
import { Plus } from 'react-feather';

interface CreateTopicProps {
  onCreateTopic: (text: string) => void;
}

interface CreateTopicButtonProps {
  onClick: () => void;
}

const CreateTopicButton: React.FC<CreateTopicButtonProps> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-3 py-2 rounded-md
      transition-colors duration-200 bg-gray-800 text-gray-200 
      hover:bg-gray-700 shadow-sm"
  >
    <span className="w-5 h-5"><Plus size={20} /></span>
    <span>New Topic</span>
  </button>
);

interface CreateTopicFormProps {
  onClose: () => void;
  onCreateTopic: (text: string) => void;
}

const CreateTopicForm: React.FC<CreateTopicFormProps> = ({ onClose, onCreateTopic }) => {
  const [topicName, setTopicName] = useState('');

  const handleCreateTopic = () => {
    if (topicName.trim() === '') return;
    onCreateTopic(topicName.trim());
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
        className="flex-1 px-3 py-2 rounded-md 
          bg-gray-800 text-gray-200 border border-gray-600
          focus:outline-none focus:ring-2 focus:ring-blue-500
          placeholder-gray-400"
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleCreateTopic();
          if (e.key === 'Escape') onClose();
        }}
        autoFocus
      />
      <button
        onClick={handleCreateTopic}
        className="px-3 py-2 bg-blue-600 text-gray-200 rounded-md 
          hover:bg-blue-700 transition-colors duration-200"
      >
        Create
      </button>
    </div>
  );
};

const CreateTopic: React.FC<CreateTopicProps> = ({ onCreateTopic }) => {
  const [isCreating, setIsCreating] = useState(false);

  return isCreating ? (
    <CreateTopicForm 
      onClose={() => setIsCreating(false)}
      onCreateTopic={onCreateTopic}
    />
  ) : (
    <CreateTopicButton onClick={() => setIsCreating(true)} />
  );
};

export default CreateTopic; 