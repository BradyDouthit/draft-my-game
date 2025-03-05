import React, { useState } from 'react';
import { Plus } from 'react-feather';
import { track } from '@vercel/analytics';

interface CreateTopicProps {
  onCreateTopic: (text: string) => void;
}

interface CreateTopicButtonProps {
  onClick: () => void;
}

const CreateTopicButton: React.FC<CreateTopicButtonProps> = ({ onClick }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      console.log('CreateTopicButton clicked');
      
      // Track button click
      track('topic_button_click', {
        action: 'open_form'
      });
      
      onClick();
    }}
    className="flex items-center gap-2 px-3 py-2 rounded-md
      transition-colors duration-200 bg-[var(--accent-primary)] text-white
      hover:bg-[var(--accent-primary-hover)] shadow-sm cursor-pointer"
    title="Add New Topic"
  >
    <span className="w-5 h-5"><Plus size={20} /></span>
    <span>Add Topic</span>
  </button>
);

interface CreateTopicFormProps {
  onClose: () => void;
  onCreateTopic: (text: string) => void;
}

const CreateTopicForm: React.FC<CreateTopicFormProps> = ({ onClose, onCreateTopic }) => {
  const [topicName, setTopicName] = useState('');

  const handleCreateTopic = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (topicName.trim() === '') return;
    
    onCreateTopic(topicName.trim());
    
    // Track topic creation
    track('topic_created', {
      length: topicName.trim().length
    });
    
    setTopicName('');
    onClose();
  };

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <input
        type="text"
        value={topicName}
        onChange={(e) => {
          e.stopPropagation();
          setTopicName(e.target.value);
        }}
        placeholder="Enter topic name..."
        className="flex-1 px-3 py-2 rounded-md 
          bg-[var(--background)] text-[var(--text-primary)] border border-[var(--border)]
          focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]
          placeholder-[var(--text-secondary)]"
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') handleCreateTopic();
          if (e.key === 'Escape') onClose();
        }}
        autoFocus
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleCreateTopic(e);
        }}
        className="px-3 py-2 bg-[var(--accent-primary)] text-white rounded-md 
          hover:bg-[var(--accent-primary-hover)] transition-colors duration-200"
      >
        Create
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="p-1.5 rounded-md text-[var(--text-primary)] bg-[var(--surface)] 
          hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-colors"
        title="Cancel"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
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