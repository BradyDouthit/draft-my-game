import React, { useState } from 'react';
import { Download } from 'react-feather';

interface DownloadGDDProps {
  useCase: string;
  topics: Array<{
    id: string;
    text: string;
    expansions?: string[];
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
        throw new Error('Failed to generate document');
      }

      // Get the HTML content
      const htmlContent = await response.text();

      // Create a blob from the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      
      // Create a temporary download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${useCase.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-gdd.html`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setIsLoading(false);
    } catch (error) {
      console.error('Error downloading GDD:', error);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      className="flex items-center gap-2 px-3 py-2 rounded-md
        transition-colors duration-200 bg-blue-600 text-gray-200 
        hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="w-5 h-5">
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
        ) : (
          <Download size={20} />
        )}
      </span>
      <span>Download GDD</span>
    </button>
  );
};

export default DownloadGDD; 