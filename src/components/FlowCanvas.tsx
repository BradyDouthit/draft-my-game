import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  Edge,
  Handle,
  Position,
  Node as ReactFlowNode,
  Panel,
  ReactFlowInstance,
  getConnectedEdges
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Custom CSS to override React Flow node styles
import './flow-styles.css';
import '../components/Toolbar/toolbar-styles.css';

import { useTheme } from '@/utils/ThemeProvider';
import { getTreeLayout } from '@/utils/treeLayout';
import { Node } from './Node';
import Toolbar from './Toolbar/Toolbar';

// Define types for our nodes
export interface TopicNode {
  id: string;
  text: string;
  expansions?: string[];
  isRoot?: boolean;
}

// Default node component styles (using CSS variables to support dark mode)
const defaultNodeStyle = {
  borderRadius: '6px',
  minWidth: '150px',
  maxWidth: '300px',
  padding: 0,
  background: 'transparent'
};

interface FlowCanvasProps {
  topics: TopicNode[];
  rootNode: TopicNode | null;
}

export default function FlowCanvas({ topics, rootNode }: FlowCanvasProps) {
  const { isDarkMode } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  // Refs to prevent infinite loops
  const isLayoutingRef = useRef(false);
  const nodesInitializedRef = useRef(false);
  const contentChangedRef = useRef(false);
  
  // Keep track of nodes being dragged using a ref instead of state to avoid rerenders
  const draggingNodeIdsRef = useRef<Set<string>>(new Set());
  
  // Track last drag end time to prevent immediate layout after dragging
  const lastDragEndTimeRef = useRef<number>(0);
  
  // Set mounted state after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Initialize with empty arrays
  const initialNodes: ReactFlowNode[] = [];
  const initialEdges: Edge[] = [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Handle node drag events
  const onNodeDragStart = useCallback((event: React.MouseEvent, node: ReactFlowNode) => {
    draggingNodeIdsRef.current.add(node.id);
    
    // Instead of rebuilding the entire tree, just update this specific node
    setNodes(prevNodes => 
      prevNodes.map(n => {
        if (n.id === node.id) {
          return {
            ...n,
            data: {
              ...n.data,
              isDragging: true
            }
          };
        }
        return n;
      })
    );
  }, [setNodes]);
  
  const onNodeDragStop = useCallback((event: React.MouseEvent, node: ReactFlowNode) => {
    draggingNodeIdsRef.current.delete(node.id);
    
    // Update just this node's dragging state WITHOUT changing its position
    setNodes(prevNodes => 
      prevNodes.map(n => {
        if (n.id === node.id) {
          return {
            ...n,
            data: {
              ...n.data,
              isDragging: false
            }
            // Don't update the position here - React Flow's onNodesChange has already handled that
          };
        }
        return n;
      })
    );
    
    // Record the time of the drag end to prevent immediate layout recalculation
    lastDragEndTimeRef.current = Date.now();
    
    // Don't mark content as changed immediately to prevent auto-layout
    // This will allow the node to stay where the user dragged it
  }, [setNodes]);
  
  // Handle node deletion
  const handleNodeDelete = useCallback((nodeId: string, skipLayout = true) => {
    // Find the node to delete
    const nodeToDelete = nodes.find(node => node.id === nodeId);
    
    if (!nodeToDelete) return;
    
    // Don't allow deleting the root node
    if (nodeToDelete.data?.isRoot) {
      console.log('Cannot delete the root node');
      return;
    }
    
    // Remove the node
    setNodes(prevNodes => prevNodes.filter(node => node.id !== nodeId));
    
    // Remove any edges connected to this node
    setEdges(prevEdges => 
      prevEdges.filter(edge => 
        edge.source !== nodeId && edge.target !== nodeId
      )
    );
    
    // Only mark as needing layout if skipLayout is false
    if (!skipLayout) {
      contentChangedRef.current = true;
    }
    
    console.log(`Node ${nodeId} deleted${skipLayout ? ' (layout preserved)' : ''}`);
  }, [nodes, setNodes, setEdges]);

  // Handle node text updates
  const handleNodeEdit = useCallback((nodeId: string, newText: string) => {
    // Update the node text
    setNodes(prevNodes => 
      prevNodes.map(node => {
        if (node.id === nodeId) {
          // Copy the node and update the text in data
          return {
            ...node,
            data: {
              ...node.data,
              text: newText,
              label: newText // Update label as well if it's used
            }
          };
        }
        return node;
      })
    );
    
    console.log(`Node ${nodeId} updated with text: ${newText}`);
  }, [setNodes]);

  // Define node types with proper memoization to prevent re-renders
  const nodeTypes = useMemo(() => ({
    custom: (props: any) => <Node {...props} onDelete={handleNodeDelete} onEdit={handleNodeEdit} />
  }), [handleNodeDelete, handleNodeEdit]);

  // Update nodes when topics or rootNode change
  React.useEffect(() => {
    // Skip if already layouting to prevent loops
    if (isLayoutingRef.current) return;
    
    // Flag content as changed for later layout
    contentChangedRef.current = true;
    
    if (!rootNode && topics.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }
    
    const newNodes: ReactFlowNode[] = [];
    const newEdges: Edge[] = [];
    
    // Add root node if it exists
    if (rootNode) {
      newNodes.push({
        id: rootNode.id,
        // Position will be calculated by dagre
        position: { x: 0, y: 0 },
        data: { 
          text: rootNode.text,
          expansions: rootNode.expansions,
          label: rootNode.text,
          isRoot: true,
          isDragging: false // Initialize as not dragging
        },
        style: {
          ...defaultNodeStyle,
          borderWidth: 2,
          borderColor: 'var(--accent-primary)'
        },
        className: 'custom-node root-node',
        type: 'custom' // Use our custom node with toolbar
      });
      
      // Create edges from root node to each topic
      topics.forEach((topic) => {
        newEdges.push({
          id: `edge-${rootNode.id}-${topic.id}`,
          source: rootNode.id,
          target: topic.id,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
          }
        });
      });
    }
    
    // Add topic nodes
    topics.forEach((topic) => {
      newNodes.push({
        id: topic.id,
        // Position will be calculated by dagre
        position: { x: 0, y: 0 },
        data: { 
          text: topic.text,
          expansions: topic.expansions,
          label: topic.text,
          isDragging: false // Initialize as not dragging
        },
        style: defaultNodeStyle,
        className: 'custom-node',
        type: 'custom' // Use our custom node with toolbar
      });
    });
    
    // Set nodes and edges without layout first
    setNodes(newNodes);
    setEdges(newEdges);
    
    // Mark as initialized when first setting nodes
    if (newNodes.length > 0) {
      nodesInitializedRef.current = true;
    }
  }, [topics, rootNode, setNodes, setEdges]);

  // Function to calculate and apply the tree layout
  const applyTreeLayout = useCallback(() => {
    // Don't apply layout if there are nodes being dragged
    if (nodes.length === 0 || isLayoutingRef.current || draggingNodeIdsRef.current.size > 0) return;
    
    // Set flag to prevent layout loops
    isLayoutingRef.current = true;
    
    try {
      // Use vertical TB (top-to-bottom) layout
      const layoutedNodes = getTreeLayout([...nodes], [...edges], 'TB');
      setNodes(layoutedNodes);
      
      // Reset content changed flag since we've applied layout
      contentChangedRef.current = false;
      
      // Fit view after layout with a small delay
      setTimeout(() => {
        if (reactFlowInstance) {
          reactFlowInstance.fitView({ padding: 0.2 });
        }
        // Reset layouting flag after everything is done
        isLayoutingRef.current = false;
      }, 100);
    } catch (error) {
      console.error('Error applying tree layout:', error);
      isLayoutingRef.current = false;
    }
  }, [nodes, edges, setNodes, reactFlowInstance]);

  // Apply layout when required
  useEffect(() => {
    if (!mounted || nodes.length === 0) return;
    
    // Don't apply layout if:
    // 1. Nodes aren't initialized
    // 2. We're already layouting
    // 3. No content has changed requiring layout
    // 4. Nodes are being dragged
    // 5. It's within 1 second of the last drag end
    const isDragCooldownActive = Date.now() - lastDragEndTimeRef.current < 1000;
    
    if (nodesInitializedRef.current && 
        !isLayoutingRef.current && 
        contentChangedRef.current &&
        draggingNodeIdsRef.current.size === 0 &&
        !isDragCooldownActive) {
      // Add delay to ensure DOM is ready
      const timer = setTimeout(() => {
        applyTreeLayout();
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [mounted, nodes.length, applyTreeLayout, nodesInitializedRef]);

  // Handle edge connections
  const onConnect = useCallback(
    (params: Connection) => {
      contentChangedRef.current = true; // Mark as needing layout after connection
      setEdges((eds) =>
        addEdge({
          ...params,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
          }
        }, eds)
      );
    },
    [setEdges]
  );

  // Handle downloading the Game Design Document (GDD)
  const handleDownloadGDD = useCallback(() => {
    if (!nodes.length) {
      alert('No content to download');
      return;
    }

    try {
      // Create a structured JSON representation of the flow
      const gddData = {
        title: "Game Design Document",
        created: new Date().toISOString(),
        rootNode: nodes.find(node => node.data.isRoot)?.data?.text || "",
        nodes: nodes.map(node => ({
          id: node.id,
          text: node.data.text,
          expansions: node.data.expansions || [],
          isRoot: node.data.isRoot || false,
          position: node.position
        })),
        connections: edges.map(edge => ({
          source: edge.source,
          target: edge.target
        }))
      };

      // Convert to JSON string with pretty formatting
      const jsonString = JSON.stringify(gddData, null, 2);
      
      // Create a blob and download link
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'game-design-document.json';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading GDD:', error);
      alert('Failed to download GDD');
    }
  }, [nodes, edges]);

  // Handle adding a new node to the canvas
  const handleAddNode = useCallback((topicText: string) => {
    if (!topicText.trim()) return;
    
    const newNodeId = `node-${Date.now()}`;
    
    // Create a new node with the provided topic text
    const newNode: ReactFlowNode = {
      id: newNodeId,
      // Position will be near the center but slightly offset to be visible
      position: { 
        x: Math.random() * 100 - 50, 
        y: Math.random() * 100 - 50 
      },
      data: {
        text: topicText.trim(),
        expansions: [],
        label: topicText.trim(),
        isDragging: false
      },
      style: defaultNodeStyle,
      className: 'custom-node',
      type: 'custom'
    };
    
    // Add the node
    setNodes(prevNodes => [...prevNodes, newNode]);
    
    // If there's a root node, create an edge from root to new node
    const rootNode = nodes.find(node => node.data.isRoot);
    if (rootNode) {
      const newEdge: Edge = {
        id: `edge-${rootNode.id}-${newNodeId}`,
        source: rootNode.id,
        target: newNodeId,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
        }
      };
      setEdges(prevEdges => [...prevEdges, newEdge]);
    }
    
    // Mark content as changed to trigger layout
    contentChangedRef.current = true;
    
  }, [nodes, setNodes, setEdges]);

  return (
    <div className="w-full h-full bg-[var(--canvas-bg)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        className={isDarkMode ? 'dark-theme' : 'light-theme'}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} className="bg-[var(--background)]" />
        <Controls className="!bg-[var(--surface)] !text-[var(--text-primary)] !border-[var(--border)]" />
        
        {/* Re-organize button */}
        <Panel position="bottom-right" className="mb-4">
          <button
            onClick={applyTreeLayout}
            className={`
              px-3 py-1.5 rounded-md text-sm font-medium
              bg-[var(--surface)] text-[var(--text-primary)]
              border border-[var(--border)]
              hover:bg-[var(--surface-hover)]
              transition-colors duration-200
            `}
          >
            Re-organize
          </button>
        </Panel>
        
        {/* Wrap the toolbar in a Panel component so it receives events correctly */}
        <Panel 
          position="bottom-center" 
          className="mb-6 z-10 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Toolbar 
            onCreateTopic={handleAddNode} 
            onDownloadGDD={handleDownloadGDD} 
            useCase="game-design" 
            topics={nodes.map(node => ({
              id: node.id,
              text: node.data.text as string,
              expansions: (node.data.expansions || []) as string[]
            }))} 
          />
        </Panel>
      </ReactFlow>
    </div>
  );
} 