import React, { useState, useEffect } from "react";
import { NodeToolbar as ReactFlowNodeToolbar, Position } from "@xyflow/react";
import { track } from '@vercel/analytics';

interface NodeToolbarProps {
    nodeId: string;
    nodeText: string;
    isVisible: boolean;
    isDragging: boolean;
    isExpanding: boolean;
    onEdit: (nodeId: string) => void;
    onDelete: (nodeId: string) => void;
    onExpand: (nodeId: string, nodeText: string) => void;
    onToolbarMouseEnter: () => void;
}

export function NodeToolbar({
    nodeId,
    nodeText,
    isVisible,
    isDragging,
    isExpanding,
    onEdit,
    onDelete,
    onExpand,
    onToolbarMouseEnter,
}: NodeToolbarProps) {
    const [copySuccess, setCopySuccess] = useState(false);

    // Handler for copy to clipboard
    const handleCopyToClipboard = (e: React.MouseEvent) => {
        // Stop event propagation
        e.stopPropagation();
        
        // Copy text to clipboard
        navigator.clipboard.writeText(nodeText)
            .then(() => {
                // Show success indicator
                setCopySuccess(true);
                
                // Track copy action
                track('node_copy', {
                    text_length: nodeText.length
                });
                
                // Hide success indicator after short delay
                setTimeout(() => {
                    setCopySuccess(false);
                }, 1500);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
            });
    };

    // Handler for edit button
    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(nodeId);
        
        // Track edit action
        track('node_edit', {
            id: nodeId
        });
    };

    // Handler for delete button
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(nodeId);
        
        // Track delete action
        track('node_delete', {
            id: nodeId
        });
    };

    // Handler for lightbulb/expand button
    const handleLightbulb = (e: React.MouseEvent) => {
        e.stopPropagation();
        onExpand(nodeId, nodeText);
        
        // Track expand action
        track('node_expand', {
            text_length: nodeText.length
        });
    };
    
    return (
        <div
            onMouseEnter={onToolbarMouseEnter}
            className="absolute left-0 right-0 top-0 z-10 transform -translate-y-full"
        >
            <ReactFlowNodeToolbar
                isVisible={isVisible && !isDragging}
                position={Position.Top}
                className="flex bg-[var(--surface)] rounded-md shadow-md border border-[var(--border)] p-1"
            >
                <button
                    onClick={handleEdit}
                    className="flex items-center justify-center p-1 hover:bg-[var(--surface-hover)] rounded text-[var(--text-primary)] transition-colors mx-1"
                    title="Edit"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                </button>
                <button
                    onClick={handleLightbulb}
                    disabled={isExpanding}
                    className="flex items-center justify-center p-1 hover:bg-[var(--surface-hover)] rounded text-[var(--text-primary)] transition-colors mx-1 disabled:opacity-50 disabled:cursor-wait"
                    title="Expand on this idea"
                >
                    {isExpanding
                        ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--text-primary)]" />
                        )
                        : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                            </svg>
                        )}
                </button>
                <button
                    onClick={handleCopyToClipboard}
                    className="flex items-center justify-center p-1 hover:bg-[var(--surface-hover)] rounded text-[var(--text-primary)] transition-colors mx-1"
                    title="Copy to clipboard"
                >
                    {copySuccess ? (
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-4 w-4 text-green-500" 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                        >
                            <path 
                                fillRule="evenodd" 
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                                clipRule="evenodd" 
                            />
                        </svg>
                    ) : (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                            <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                        </svg>
                    )}
                </button>
                <button
                    onClick={handleDelete}
                    className="flex items-center justify-center p-1 hover:bg-[var(--surface-hover)] rounded text-[var(--text-primary)] transition-colors mx-1"
                    title="Delete"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            </ReactFlowNodeToolbar>
        </div>
    );
} 