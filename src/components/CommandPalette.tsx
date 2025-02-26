import { useState, useEffect } from 'react';
import { TopicNode } from './FlowCanvas';
import { useTheme } from '@/utils/ThemeProvider';

interface CommandPaletteProps {
  onTopicsGenerated: (topics: TopicNode[], inputValue: string) => void;
}

export default function CommandPalette({ onTopicsGenerated }: CommandPaletteProps) {
  const { isDarkMode } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [isDocked, setIsDocked] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Mark component as mounted
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Check if tooltip has been dismissed before
  useEffect(() => {
    if (!mounted) return;
    
    try {
      const hasBeenDismissed = localStorage.getItem('tooltipDismissed') === 'true';
      setShowTooltip(!hasBeenDismissed);
    } catch (error) {
      console.warn('Could not access localStorage for tooltip state:', error);
    }
  }, [mounted]);

  const handleDismissTooltip = () => {
    setShowTooltip(false);
    try {
      localStorage.setItem('tooltipDismissed', 'true');
    } catch (error) {
      console.warn('Could not save tooltip state to localStorage:', error);
    }
  };

  // Handle submission and API call
  const handleSubmit = async (value: string) => {
    if (!value.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Call the API to generate topics
      const response = await fetch('/api/generate-topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ useCase: value }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate topics');
      }
      
      const data = await response.json();
      
      // Create topic nodes from the generated topics
      const newTopics: TopicNode[] = data.topics.map((topic: string) => ({
        id: `topic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: topic
      }));
      
      // Send the topics back to the parent component along with the input value
      onTopicsGenerated(newTopics, value);
    } catch (error) {
      console.error('Error generating topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const currentInput = inputValue.trim();
      if (currentInput) {
        handleSubmit(currentInput);
        setInputValue('');
        setIsDocked(true);
        setShowTooltip(false);
      }
    }
  };

  const toggleDock = () => {
    setIsDocked(!isDocked);
    if (!isDocked) {
      setInputValue('');
    }
  };

  return (
    <div 
      className={`
        fixed transition-all duration-300 ease-in-out
        ${(!isLoading && isDocked)
          ? 'top-4 left-4 transform-none' 
          : 'top-8 left-1/2 -translate-x-1/2'
        }
      `}
    >
      <div className="relative">
        {/* Input Container */}
        <div className={`
          relative transition-all duration-300
          ${(!isLoading && isDocked) ? 'w-12 h-12' : 'w-96'}
        `}>
          {/* Search Icon - Only visible when docked and not loading */}
          {(!isLoading && isDocked) && (
            <button
              onClick={toggleDock}
              className={`
                absolute inset-0 flex items-center justify-center
                rounded-lg shadow-lg
                bg-[var(--surface)] text-[var(--text-primary)]
                transition-colors duration-200
                border border-[var(--border)]
                ${isDarkMode 
                  ? 'hover:bg-[#3a3a3a]' 
                  : 'hover:bg-gray-200'
                }
              `}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
            </button>
          )}

          {/* Textarea with animated border when loading */}
          <div className="relative">
            <textarea
              rows={4}
              cols={50}
              className={`
                relative px-4 py-2 text-lg rounded-lg
                bg-[var(--surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)]
                shadow-lg
                border ${isLoading ? 'border-transparent' : 'border-[var(--border)]'}
                focus:outline-none
                resize-none
                transition-all duration-300
                w-full h-full
                flex
                ${(!isLoading && isDocked) ? 'opacity-0 pointer-events-none' : ''}
              `}
              placeholder={isLoading ? 'Generating topics...' : 'Enter your video game concept'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            
            {/* Animated border for loading state - without spinner and text */}
            {isLoading && (
              <div className="absolute inset-0 rounded-lg pointer-events-none overflow-hidden">
                <div className="absolute inset-0 rounded-lg border-[3px] border-[var(--accent-primary)] animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.3)]"></div>
                
                {/* Animated gradient spinner */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent animate-shimmer"></div>
              </div>
            )}
          </div>
        </div>

        {/* Tooltip */}
        <div 
          className={`
            absolute top-full left-1/2 transform -translate-x-1/2 mt-2
            transition-all duration-200 ease-in-out w-[600px]
            ${showTooltip ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}
          `}
        >
          {/* Tooltip Arrow */}
          <div className="
            absolute -top-2 left-1/2 transform -translate-x-1/2
            border-8 border-transparent border-b-black/90
            w-0 h-0
          "/>
          
          {/* Tooltip Content */}
          <div className="
            relative
            bg-black/90 text-white px-6 py-4 rounded-lg text-sm
            shadow-lg
          ">
            {/* Dismiss Button */}
            <button
              onClick={handleDismissTooltip}
              className="absolute top-2 right-2 text-white/60 hover:text-white transition-colors"
              aria-label="Dismiss tooltip"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                  clipRule="evenodd" 
                />
              </svg>
            </button>

            <div className="space-y-2">
              <p className="font-medium mb-2">How to use this tool:</p>
              <p>1. Enter your video game concept</p>
              <p>2. Press Enter to generate topics which serve as a starting point for your game design</p>
              <p>3. Drag and combine topics on the canvas to generate new ideas or click the plus to expand on an idea</p>
              <p>4. The AI will tailor combinations based on your specified role</p>
              <p>5. Click the "Download GDD" button to generate a game design document!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 