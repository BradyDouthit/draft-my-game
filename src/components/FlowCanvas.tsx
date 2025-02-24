import React from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export default function FlowCanvas() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        defaultNodes={[]}
        defaultEdges={[]}
        fitView
        className="bg-white dark:bg-gray-900"
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
} 