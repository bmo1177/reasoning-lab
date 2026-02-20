import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlowProvider,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ReasoningNodeComponent from '@/components/canvas/ReasoningNode';
import ConnectionEdge from '@/components/canvas/ConnectionEdge';
import { ReasoningNode } from '@/types/case';

interface CanvasViewerProps {
  canvasState: { nodes?: Node[]; edges?: Edge[] };
  className?: string;
}

const nodeTypes = { reasoning: ReasoningNodeComponent };
const edgeTypes = { connection: ConnectionEdge };

function CanvasViewerInner({ canvasState, className }: CanvasViewerProps) {
  const nodes = useMemo(() => canvasState.nodes || [], [canvasState.nodes]);
  const edges = useMemo(() => canvasState.edges || [], [canvasState.edges]);

  const minimapNodeColor = (node: Node) => {
    const type = node.data?.nodeType as ReasoningNode['type'];
    const colors: Record<string, string> = {
      symptom: 'hsl(var(--node-symptom))',
      finding: 'hsl(var(--node-finding))',
      diagnosis: 'hsl(var(--node-diagnosis))',
      test: 'hsl(var(--node-test))',
      note: 'hsl(var(--muted-foreground))',
    };
    return colors[type] || 'hsl(var(--primary))';
  };

  if (nodes.length === 0) {
    return (
      <div className={`flex items-center justify-center rounded-lg border bg-muted/30 ${className}`}>
        <p className="text-sm text-muted-foreground">No canvas data available</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border overflow-hidden ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        className="bg-canvas-background"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="opacity-30" />
        <MiniMap
          nodeColor={minimapNodeColor}
          maskColor="hsl(var(--background) / 0.8)"
          className="!bg-card !border !border-border rounded-lg"
          pannable={false}
          zoomable={false}
        />
      </ReactFlow>
    </div>
  );
}

export function CanvasViewer(props: CanvasViewerProps) {
  return (
    <ReactFlowProvider>
      <CanvasViewerInner {...props} />
    </ReactFlowProvider>
  );
}
