import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';

interface NodeEditModalProps {
  isOpen: boolean;
  nodeText: string;
  onClose: () => void;
  onSave: (text: string) => void;
}

export default function NodeEditModal({ isOpen, nodeText, onClose, onSave }: NodeEditModalProps) {
  const [text, setText] = useState(nodeText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Set focus on textarea immediately when modal opens using useLayoutEffect
  useLayoutEffect(() => {
    if (isOpen && textareaRef.current) {
      // Small delay to ensure the modal is rendered first
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          // Place cursor at the end of the text
          textareaRef.current.selectionStart = textareaRef.current.value.length;
          textareaRef.current.selectionEnd = textareaRef.current.value.length;
        }
      });
    }
  }, [isOpen]);

  // Reset text when nodeText changes (e.g., when editing a different node)
  useEffect(() => {
    setText(nodeText);
  }, [nodeText]);

  // Handle clicks outside the modal to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      // Use capture phase to ensure we get the event first
      document.addEventListener('mousedown', handleClickOutside, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen, onClose]);

  // Handle global key presses (using capture to ensure we get events before other handlers)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown, true);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, onClose]);

  // Handle textarea key presses
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Save on Enter (without Shift)
      e.preventDefault();
      e.stopPropagation();
      if (text.trim()) {
        onSave(text);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        ref={modalRef}
        className="bg-[var(--surface)] rounded-lg shadow-xl border border-[var(--border)] w-[500px] max-w-[90vw] transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="text-lg font-medium text-[var(--text-primary)]">Edit Node</h3>
        </div>
        
        <div className="p-4">
          <textarea
            ref={textareaRef}
            className="w-full px-3 py-2 text-[var(--text-primary)] bg-[var(--background)] border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter node text..."
            onClick={(e) => e.stopPropagation()}
          />
          
          <div className="mt-4 flex justify-end space-x-2">
            <button
              className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--surface)] border border-[var(--border)] rounded-md hover:bg-[var(--surface-hover)] transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--accent-primary)] rounded-md hover:bg-[var(--accent-primary-hover)] transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                if (text.trim()) {
                  onSave(text);
                }
              }}
              disabled={!text.trim()}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 