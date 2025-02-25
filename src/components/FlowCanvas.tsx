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
  Node,
  Panel,
  ReactFlowInstance
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Custom CSS to override React Flow node styles
import './flow-styles.css';

import { useTheme } from '@/utils/ThemeProvider';
import { getTreeLayout } from '@/utils/treeLayout';

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

// Create a custom node that supports the data we need
function CustomNode({ data, isConnectable }: { 
  data: { text: string; expansions?: string[]; isRoot?: boolean },
  isConnectable: boolean
}) {
  const nodeClasses = `px-4 py-3 rounded-md border border-[var(--border)] bg-[var(--node-bg)] text-[var(--text-primary)] shadow-md ${
    data.isRoot ? 'border-2 border-[var(--accent-primary)]' : ''
  }`;

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <div className={nodeClasses}>
        <div className="flex flex-col">
          <div className={`font-medium ${data.isRoot ? 'text-[var(--accent-primary)]' : ''}`}>
            {data.text}
          </div>
          
          {data.expansions && data.expansions.length > 0 && (
            <div className="mt-2 space-y-1">
              {data.expansions.map((expansion, index) => (
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
    </>
  );
}

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
  const initialNodes: Node[] = [];
  const initialEdges: Edge[] = [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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
    
    const newNodes: Node[] = [];
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
        className: 'custom-node root-node'
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
        className: 'custom-node'
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

  // Define node types with our custom renderer
  const nodeTypes = React.useMemo(() => ({
    default: CustomNode,
  }), []);

  // Manual re-layout button handler
  const handleReLayout = useCallback(() => {
    contentChangedRef.current = true;
    if (!isLayoutingRef.current) {
      applyTreeLayout();
    }
  }, [applyTreeLayout]);

  return (
    <div className="w-full h-full">
      {mounted && (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          onInit={setReactFlowInstance}
          className="bg-[var(--background)]"
        >
          <Background
            color={isDarkMode ? '#2e2e2e' : '#9ca3af'}
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.5}
          />
          <Controls />
          <Panel position="bottom-right" className="mb-4">
            <button
              onClick={handleReLayout}
              className="px-3 py-2 bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] rounded shadow-md hover:bg-gray-200 transition-colors"
            >
              Organize
            </button>
          </Panel>
        </ReactFlow>
      )}
    </div>
  );
} 