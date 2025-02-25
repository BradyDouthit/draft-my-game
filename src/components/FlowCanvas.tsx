import React, { useCallback } from 'react';
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
  Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Custom CSS to override React Flow node styles
import './flow-styles.css';
import '../styles/theme.css';

// Define types for our nodes
export interface TopicNode {
  id: string;
  text: string;
  expansions?: string[];
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
  data: { text: string; expansions?: string[] },
  isConnectable: boolean
}) {
  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <div className="px-4 py-3 rounded-md border border-[var(--border)] bg-[var(--node-bg)] text-[var(--text-primary)] shadow-md">
        <div className="flex flex-col">
          <div className="font-medium">
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
  isDarkMode: boolean;
}

export default function FlowCanvas({ topics, isDarkMode }: FlowCanvasProps) {
  // Convert topics to nodes format expected by React Flow
  const initialNodes: Node[] = topics.map((topic, index) => ({
    id: topic.id,
    // No specific type - use the default node with our own renderer
    position: { 
      x: 250 + (index % 3) * 300, 
      y: 100 + Math.floor(index / 3) * 200 
    },
    data: { 
      text: topic.text,
      expansions: topic.expansions,
      label: topic.text // Include a label for accessibility
    },
    // This ensures the node has our styling without needing a custom type
    style: defaultNodeStyle,
    className: 'custom-node'
  }));

  // Create edges to connect parent-child relationships if they exist
  const initialEdges: Edge[] = [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when topics change
  React.useEffect(() => {
    if (topics.length === 0) {
      setNodes([]);
      return;
    }
    
    const newNodes: Node[] = topics.map((topic, index) => {
      return {
        id: topic.id,
        position: { 
          x: 250 + (index % 3) * 300, 
          y: 100 + Math.floor(index / 3) * 200 
        },
        data: { 
          text: topic.text,
          expansions: topic.expansions,
          label: topic.text
        },
        style: defaultNodeStyle,
        className: 'custom-node'
      };
    });
    
    // Use functional update to access current state while avoiding the dependency
    setNodes(currentNodes => {
      return newNodes.map(newNode => {
        // Check if there's an existing node with the same ID
        const existingNode = currentNodes.find(n => n.id === newNode.id);
        // If it exists, preserve its position, otherwise use the calculated position
        return existingNode 
          ? { ...newNode, position: existingNode.position }
          : newNode;
      });
    });
  }, [topics, setNodes]); // Removed isDarkMode from dependencies since we're using CSS variables

  // Handle edge connections
  const onConnect = useCallback(
    (params: Connection) => {
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

  return (
    <div className={`w-full h-full ${isDarkMode ? 'dark' : ''}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={12} 
          size={1}
          color="var(--border)" 
        />
        <Controls />
      </ReactFlow>
    </div>
  );
} 