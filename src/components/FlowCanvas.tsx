import React, { useCallback, useState, useEffect, useRef } from 'react';
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

import { useTheme } from '@/utils/ThemeProvider';
import { getTreeLayout } from '@/utils/treeLayout';
import { Node } from './Node';

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
  
  // Set mounted state after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Initialize with empty arrays
  const initialNodes: ReactFlowNode[] = [];
  const initialEdges: Edge[] = [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Handle node deletion
  const handleNodeDelete = useCallback((nodeId: string) => {
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
    
    // Mark as needing layout
    contentChangedRef.current = true;
    
    console.log(`Node ${nodeId} deleted`);
  }, [nodes, setNodes, setEdges]);

  // Define node types with the delete handler passed to the custom node
  const nodeTypes = React.useMemo(() => ({
    custom: (props: any) => <Node {...props} onDelete={handleNodeDelete} />
  }), [handleNodeDelete]);

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
          isRoot: true
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
          label: topic.text
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
    if (nodes.length === 0 || isLayoutingRef.current) return;
    
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
    
    // Only apply layout if nodes are initialized and not currently layouting
    if (nodesInitializedRef.current && !isLayoutingRef.current && contentChangedRef.current) {
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

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
        className="bg-[var(--background)]"
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} className="bg-[var(--background)]" />
        <Controls className="!bg-[var(--surface)] !text-[var(--text-primary)] !border-[var(--border)]" />
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
      </ReactFlow>
    </div>
  );
} 