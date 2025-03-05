import React, { useEffect, useRef, useState } from "react";
import { Handle, NodeProps, NodeToolbar, Position } from "@xyflow/react";
import NodeEditModal from "./NodeEditModal";

// Node data interface
interface NodeData {
    text: string;
    expansions?: string[];
    isRoot?: boolean;
    label?: string;
    isDragging?: boolean; // Add this to receive drag state from parent
}

// Extended NodeProps with custom handlers
interface CustomNodeProps extends NodeProps {
    onDelete?: (nodeId: string) => void;
    onEdit?: (nodeId: string, newText: string) => void;
    onExpand?: (nodeId: string, nodeText: string) => void;
}

// Default node styles
const defaultNodeStyle = {
    borderRadius: "6px",
    minWidth: "150px",
    maxWidth: "300px",
    padding: 0,
    background: "transparent",
};

export function Node(
    { data, isConnectable, id, onDelete, onEdit, onExpand }: CustomNodeProps,
) {
    const [showToolbar, setShowToolbar] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isExpanding, setIsExpanding] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const nodeRef = useRef<HTMLDivElement>(null);

    // Safely access data properties
    const text = data?.text as string || "";
    const isRoot = data?.isRoot as boolean || false;
    const expansions = data?.expansions as string[] || [];
    const isDragging = data?.isDragging as boolean || false;

    const nodeClasses =
        `px-4 py-3 rounded-md border border-[var(--border)] bg-[var(--node-bg)] text-[var(--text-primary)] shadow-md ${
            isRoot ? "border-2 border-[var(--accent-primary)]" : ""
        }`;

    // Handle edit modal state changes and ensure toolbar is hidden
    // when edit modal is opened
    useEffect(() => {
        if (showEditModal) {
            setShowToolbar(false);

            // Clear any hiding timeouts
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = null;
            }
        }
    }, [showEditModal]);

    // When dragging status changes, update toolbar visibility
    useEffect(() => {
        if (isDragging && showToolbar) {
            setShowToolbar(false);
        }
    }, [isDragging]);

    // Handlers for toolbar actions
    const handleEdit = (e: React.MouseEvent) => {
        // Stop event propagation to prevent any parent handlers from firing
        e.stopPropagation();

        // Clear any hide timeouts
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }

        // Ensure the toolbar is hidden and show the modal
        setShowToolbar(false);

        // Use a small delay to ensure state updates in the correct order
        setTimeout(() => {
            setShowEditModal(true);
        }, 0);
    };

    const handleSaveEdit = (newText: string) => {
        if (onEdit && id) {
            onEdit(id, newText);
        } else {
            console.log(
                "Edit node:",
                text,
                "→",
                newText,
                "(No edit handler provided)",
            );
        }
        setShowEditModal(false);
    };

    const handleCancelEdit = () => {
        setShowEditModal(false);
    };

    const handleDelete = (e: React.MouseEvent) => {
        // Stop event propagation
        e.stopPropagation();

        if (onDelete && id) {
            onDelete(id);
        } else {
            console.log("Delete node:", text, "(No delete handler provided)");
        }
    };

    // Handler for lightbulb icon click
    const handleLightbulb = (e: React.MouseEvent) => {
        // Stop event propagation
        e.stopPropagation();

        // Ensure the toolbar is hidden to prevent multiple clicks
        setShowToolbar(false);

        // Set expanding state to show loading indicator
        setIsExpanding(true);

        if (onExpand && id) {
            onExpand(id, text);

            // Reset expanding state after a reasonable timeout in case the callback doesn't complete
            setTimeout(() => {
                setIsExpanding(false);
            }, 5000);
        } else {
            console.log("Expand node:", text, "(No expand handler provided)");
            setIsExpanding(false);
        }
    };

    // Handler for copy to clipboard
    const handleCopyToClipboard = (e: React.MouseEvent) => {
        // Stop event propagation
        e.stopPropagation();

        // Copy text to clipboard
        navigator.clipboard.writeText(text)
            .then(() => {
                // Show success indicator
                setCopySuccess(true);

                // Hide success indicator after short delay
                setTimeout(() => {
                    setCopySuccess(false);
                }, 1500);
            })
            .catch((err) => {
                console.error("Failed to copy text: ", err);
            });

        // Hide toolbar
        setShowToolbar(false);
    };

    // Clear any hide timeouts when component unmounts
    useEffect(() => {
        return () => {
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, []);

    const handleMouseEnter = () => {
        // Don't show toolbar if edit modal is open or if node is being dragged
        if (showEditModal || isDragging) return;

        // Clear any pending hide timeout
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
        setShowToolbar(true);
    };

    const handleMouseLeave = () => {
        // Don't hide toolbar if edit modal is open
        if (showEditModal) return;

        // Set a timeout to hide the toolbar, giving time to move to it
        hideTimeoutRef.current = setTimeout(() => {
            setShowToolbar(false);
        }, 300); // 300ms delay should be enough to move to the toolbar
    };

    // The toolbar itself should stop the hiding timeout when hovered
    const handleToolbarMouseEnter = () => {
        // Don't interact with toolbar if edit modal is open or if node is being dragged
        if (showEditModal || isDragging) return;

        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
    };

    return (
        <>
            <div
                ref={nodeRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="relative group"
                data-dragging={isDragging ? "true" : "false"}
            >
                {/* Create a transparent buffer zone between node and toolbar */}
                <div
                    className="absolute left-0 right-0 h-8 -top-8"
                    onMouseEnter={handleMouseEnter}
                />

                <div
                    onMouseEnter={handleToolbarMouseEnter}
                    className="absolute left-0 right-0 top-0 z-10 transform -translate-y-full"
                >
                    <NodeToolbar
                        isVisible={showToolbar && !showEditModal && !isDragging}
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
                            {copySuccess
                                ? (
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
                                )
                                : (
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
                    </NodeToolbar>
                </div>

                <Handle
                    type="target"
                    position={Position.Top}
                    isConnectable={isConnectable}
                />
                <div className={nodeClasses}>
                    <div className="flex flex-col">
                        <div
                            className={`font-medium ${
                                isRoot ? "text-[var(--accent-primary)]" : ""
                            }`}
                        >
                            {text}
                        </div>

                        {expansions && expansions.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {expansions.map((
                                    expansion: string,
                                    index: number,
                                ) => (
                                    <div
                                        key={index}
                                        className="text-xs text-[var(--text-secondary)] border-l-2 border-[var(--border)] pl-2"
                                    >
                                        {expansion}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <Handle
                    type="source"
                    position={Position.Bottom}
                    isConnectable={isConnectable}
                />
            </div>

            {/* Edit Modal */}
            <NodeEditModal
                isOpen={showEditModal}
                nodeText={text}
                onClose={handleCancelEdit}
                onSave={handleSaveEdit}
            />
        </>
    );
}
