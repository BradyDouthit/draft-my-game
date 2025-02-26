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
    { data, isConnectable, id, onDelete, onEdit }: CustomNodeProps,
) {
    const [showToolbar, setShowToolbar] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
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
