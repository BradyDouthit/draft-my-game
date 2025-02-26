import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';

// This function takes nodes and edges and returns nodes with calculated positions
export function getTreeLayout(nodes: Node[], edges: Edge[], direction: 'TB' | 'LR' = 'TB'): Node[] {
  if (nodes.length === 0) return [];

  const dagreGraph = new dagre.graphlib.Graph();
  
  // Set an object for the graph label
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 150,  // Horizontal spacing between nodes in the same rank
    ranksep: 120,  // Vertical spacing between ranks
    marginx: 50,
    marginy: 50,
    align: 'UL',  // Align nodes within their rank (Up Left)
    ranker: 'network-simplex'  // Type of ranking algorithm (alternatives: tight-tree, longest-path)
  });

  // Default to assigning a new object as a label for each new edge.
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Find the root node for special handling
  const rootNode = nodes.find(node => {
    const nodeData = node.data as any;
    return nodeData?.isRoot === true;
  });

  // Add nodes to dagre with their dimensions
  nodes.forEach((node) => {
    // Find root nodes to ensure they're at the top
    const nodeData = node.data as { 
      text?: string; 
      expansions?: string[];
      label?: string;
      isRoot?: boolean;
    };
    const isRoot = nodeData?.isRoot || false;
    
    // Use different dimensions based on content
    let width = 180;
    let height = 80;
    
    // Add extra height for nodes with expansions
    if (nodeData?.expansions && Array.isArray(nodeData.expansions) && nodeData.expansions.length > 0) {
      height += (nodeData.expansions.length * 20);
    }
    
    // Adjust dimensions for root node
    if (isRoot) {
      width = 200;
      height = 90;
    }
    
    dagreGraph.setNode(node.id, { width, height });
  });

  // Add edges to dagre
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Get computed positions
  const positionedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    return {
      ...node,
      // Center the node on the position
      position: {
        x: nodeWithPosition.x - (nodeWithPosition.width / 2),
        y: nodeWithPosition.y - (nodeWithPosition.height / 2)
      }
    };
  });

  // Now ensure the root node is centered horizontally if we're using TB layout
  if (direction === 'TB' && rootNode) {
    // Find all nodes that are directly connected to the root
    const childNodes = positionedNodes.filter(node => 
      edges.some(edge => edge.source === rootNode.id && edge.target === node.id)
    );
    
    if (childNodes.length > 0) {
      // Find average X position of all child nodes
      const totalX = childNodes.reduce((sum, node) => sum + node.position.x, 0);
      const averageX = totalX / childNodes.length;
      
      // Find the root node in the positioned nodes
      const positionedRoot = positionedNodes.find(n => n.id === rootNode.id);
      
      if (positionedRoot) {
        // Find the index of the root node to update it
        const rootIndex = positionedNodes.findIndex(n => n.id === rootNode.id);
        
        // Update the root node's position to be centered horizontally
        if (rootIndex !== -1) {
          positionedNodes[rootIndex] = {
            ...positionedRoot,
            position: {
              ...positionedRoot.position,
              x: averageX  // Center it horizontally at the average X of child nodes
            }
          };
        }
      }
    }
  }

  return positionedNodes;
} 