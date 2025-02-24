import React, { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
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

// Define types for our nodes
export interface TopicNode {
  id: string;
  text: string;
  expansions?: string[];
}

// Default node component
const defaultNodeStyle = {
  padding: '10px',
  borderRadius: '6px',
  minWidth: '150px',
  maxWidth: '300px'
};

// Create a custom node that supports the data we need
function CustomNode({ data, isConnectable }: { 
  data: { text: string; expansions?: string[] },
  isConnectable: boolean
}) {
  return (
    <div className="px-4 py-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-2 h-2 !bg-gray-400 dark:!bg-gray-500"
      />
      <div className="flex flex-col">
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {data.text}
        </div>
        
        {data.expansions && data.expansions.length > 0 && (
          <div className="mt-2 space-y-1">
            {data.expansions.map((expansion, index) => (
              <div 
                key={index} 
                className="text-xs text-gray-500 dark:text-gray-400 border-l-2 border-gray-300 dark:border-gray-600 pl-2"
              >
                {expansion}
              </div>
            ))}
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-2 h-2 !bg-gray-400 dark:!bg-gray-500"
      />
    </div>
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
    style: defaultNodeStyle
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
      // Look for existing node using a function parameter instead of referencing nodes directly
      return {
        id: topic.id,
        // We'll get the position during the setNodes call
        position: { 
          x: 250 + (index % 3) * 300, 
          y: 100 + Math.floor(index / 3) * 200 
        },
        data: { 
          text: topic.text,
          expansions: topic.expansions,
          label: topic.text // Include a label for accessibility
        },
        style: defaultNodeStyle
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
  }, [topics, setNodes]); // Remove nodes from dependency array

  // Handle edge connections
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge({
          ...params,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          style: {
            stroke: isDarkMode ? '#6b7280' : '#9ca3af',
            strokeWidth: 2
          }
        }, eds)
      );
    },
    [setEdges, isDarkMode]
  );

  // Define node types with our custom renderer
  const nodeTypes = React.useMemo(() => ({
    default: CustomNode,
  }), []);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className={isDarkMode ? 'react-flow-dark' : 'react-flow-light'}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={12} 
          size={1} 
          color={isDarkMode ? '#4b5563' : '#e5e7eb'} 
        />
        <Controls className="!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-700" />
        <MiniMap 
          className="!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-700"
          maskColor={isDarkMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(240, 240, 240, 0.1)'}
          nodeColor={isDarkMode ? '#4b5563' : '#e5e7eb'}
          nodeStrokeColor={isDarkMode ? '#1f2937' : '#ffffff'}
        />
        <Panel position="top-left" className="bg-white dark:bg-gray-800 p-2 rounded shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Idea Generator</h3>
        </Panel>
      </ReactFlow>
    </div>
  );
} 