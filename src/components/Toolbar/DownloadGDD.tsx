import React, { useState } from 'react';
import { Download } from 'react-feather';
import { jsPDF } from 'jspdf';

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

      // Create a temporary div to parse the HTML
      const container = document.createElement('div');
      container.innerHTML = htmlContent;

      // Create PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      // Get all the content sections, including expansions
      const sections = container.querySelectorAll('h1, h2, h3, h4, p, ul, .expansion');
      let yPos = 40;
      const margin = 40;
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const maxWidth = pageWidth - (margin * 2);

      // Process each section
      sections.forEach((section) => {
        // Handle different section types
        switch (section.tagName.toLowerCase()) {
          case 'h1':
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            break;
          case 'h2':
            // Add a page break before each major section
            if (yPos > pageHeight - 200) {
              doc.addPage();
              yPos = 40;
            }
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            break;
          case 'h3':
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            break;
          default:
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
        }

        // Handle lists
        if (section.tagName.toLowerCase() === 'ul') {
          const items = section.querySelectorAll('li');
          items.forEach((item) => {
            const text = '• ' + item.textContent?.trim();
            const lines = doc.splitTextToSize(text, maxWidth);
            
            lines.forEach((line: string) => {
              if (yPos > pageHeight - 40) {
                doc.addPage();
                yPos = 40;
              }
              doc.text(line, margin, yPos);
              yPos += 14;
            });
            yPos += 5; // Extra space between list items
          });
        } else {
          // Handle regular text
          const text = section.textContent?.trim() || '';
          const lines = doc.splitTextToSize(text, maxWidth);
          
          lines.forEach((line: string) => {
            if (yPos > pageHeight - 40) {
              doc.addPage();
              yPos = 40;
            }
            doc.text(line, margin, yPos);
            yPos += 14;
          });

          // Add spacing after sections
          yPos += section.tagName.toLowerCase().startsWith('h') ? 20 : 10;
        }
      });

      // Save the PDF
      const filename = `${useCase.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-gdd.pdf`;
      doc.save(filename);

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