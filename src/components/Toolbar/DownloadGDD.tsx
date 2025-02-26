import React, { useState } from 'react';
import { Download } from 'react-feather';
import { jsPDF } from 'jspdf';
import { track } from '@vercel/analytics';

interface DownloadGDDProps {
  useCase: string;
  topics: Array<{
    id: string;
    text: string;
  }>;
}

const DownloadGDD: React.FC<DownloadGDDProps> = ({ useCase, topics }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/create-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ useCase, topics }),
      });

      if (!response.ok) {
        track('gdd_download_failed', {
          error: 'API request failed',
          useCase,
          topicCount: topics.length
        });
        throw new Error('Failed to generate document');
      }

      // Get the markdown content directly
      const markdownContent = await response.text();

      // Create a Blob with the markdown content
      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'game-design-document.md';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Track successful download
      track('gdd_download_success', {
        useCase,
        topicCount: topics.length,
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error downloading document:', error);
      track('gdd_download_error', {
        useCase,
        topicCount: topics.length
      });
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
        transition-colors duration-200 bg-[var(--accent-primary)] text-white
        hover:bg-[var(--accent-primary-hover)] shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
      title="Download Game Design Document"
    >
      <span className="w-5 h-5">
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
        ) : (
          <Download size={20} />
        )}
      </span>
      <span>Download GDD</span>
    </button>
  );
};

export default DownloadGDD; 