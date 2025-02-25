import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';

// This function takes nodes and edges and returns nodes with calculated positions
export function getTreeLayout(nodes: Node[], edges: Edge[], direction: 'TB' | 'LR' = 'TB'): Node[] {
  if (nodes.length === 0) return [];

  const dagreGraph = new dagre.graphlib.Graph();
  
  // Set an object for the graph label
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 120,  // Increased horizontal spacing between nodes
    ranksep: 150,  // Increased vertical spacing between ranks
    marginx: 50,
    marginy: 50,
    align: 'UL',  // Align nodes within their rank (Up Left)
    ranker: 'network-simplex'  // Type of ranking algorithm (alternatives: tight-tree, longest-path)
  });

  // Default to assigning a new object as a label for each new edge.
  dagreGraph.setDefaultEdgeLabel(() => ({}));

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

  // Update node positions based on dagre calculations
  return nodes.map((node) => {
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
} 