import React, { useEffect, useRef, useState } from "react";
import { Handle, NodeProps, Position } from "@xyflow/react";
import NodeEditModal from "./NodeEditModal";
import { NodeToolbar } from "./NodeToolbar";

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

    // Handle edit action from toolbar
    const handleEditRequest = (nodeId: string) => {
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

    // Save edit handler
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

    // Cancel edit handler
    const handleCancelEdit = () => {
        setShowEditModal(false);
    };

    // Handler for delete action from toolbar
    const handleDeleteRequest = (nodeId: string) => {
        if (onDelete && id) {
            onDelete(id);
        } else {
            console.log("Delete node:", text, "(No delete handler provided)");
        }
    };

    // Handler for expand action from toolbar
    const handleExpandRequest = (nodeId: string, nodeText: string) => {
        // Set expanding state to show loading indicator
        setIsExpanding(true);

        if (onExpand && id) {
            onExpand(id, nodeText);

            // Reset expanding state after a reasonable timeout in case the callback doesn't complete
            setTimeout(() => {
                setIsExpanding(false);
            }, 5000);
        } else {
            console.log("Expand node:", text, "(No expand handler provided)");
            setIsExpanding(false);
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

                <NodeToolbar
                    nodeId={id}
                    nodeText={text}
                    isVisible={showToolbar && !showEditModal}
                    isDragging={isDragging}
                    isExpanding={isExpanding}
                    onEdit={handleEditRequest}
                    onDelete={handleDeleteRequest}
                    onExpand={handleExpandRequest}
                    onToolbarMouseEnter={handleToolbarMouseEnter}
                />

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
