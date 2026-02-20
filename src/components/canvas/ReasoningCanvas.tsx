import { useCallback, useState, useRef, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  useReactFlow,
  ReactFlowProvider,
  Panel,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ReasoningNode, ReasoningNodeType, ConnectionType } from '@/types/case';
import ReasoningNodeComponent from './ReasoningNode';
import ConnectionEdge from './ConnectionEdge';
import { CanvasToolbar } from './CanvasToolbar';
import { ConnectionTypeSelector } from './ConnectionTypeSelector';
import { NodeEditDialog } from './NodeEditDialog';
import { useCanvasHistory } from '@/hooks/useCanvasHistory';
import { ScratchPadPanel } from './ScratchPadPanel';
import { SubGraphDialog } from './SubGraphDialog';
import { GraphIntelligencePanel } from './GraphIntelligencePanel';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Keyboard, X, Command } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ReasoningCanvasProps {
  caseId: string;
  onNotesUpdate?: (notes: string) => void;
  /** For collaborative mode: initial canvas state from the room */
  initialCanvasState?: { nodes: Node[]; edges: Edge[] } | null;
  /** For collaborative mode: callback to sync state changes to the room */
  onCanvasChange?: (state: { nodes: Node[]; edges: Edge[] }) => void;
  /** Track canvas metrics for Socratic prompts */
  onMetricsChange?: (metrics: { nodesCount: number; connectionsCount: number }) => void;
  /** Callback whenever canvas state changes (nodes or edges updated) */
  onStateChange?: (nodes: Node[], edges: Edge[]) => void;
  /** External control for Graph Intelligence panel visibility */
  externalShowIntelligence?: boolean;
  /** Callback when Graph Intelligence panel is closed */
  onIntelligenceClose?: () => void;
  /** Callback to toggle focus mode */
  onToggleFocusMode?: () => void;
}

import { forwardRef } from 'react';

const nodeTypes = {
  reasoning: ReasoningNodeComponent,
};

const edgeTypes = {
  connection: ConnectionEdge,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

// Keyboard shortcuts configuration
const keyboardShortcuts = [
  { key: 'Ctrl/Cmd + Z', action: 'Undo' },
  { key: 'Ctrl/Cmd + Y', action: 'Redo' },
  { key: 'Ctrl/Cmd + F', action: 'Search nodes' },
  { key: 'Ctrl/Cmd + E', action: 'Export canvas' },
  { key: 'Ctrl/Cmd + 0', action: 'Fit view' },
  { key: 'F11', action: 'Toggle Focus Mode' },
  { key: 'Delete', action: 'Delete selected node' },
  { key: 'S', action: 'Add Symptom node' },
  { key: 'F', action: 'Add Finding node' },
  { key: 'D', action: 'Add Diagnosis node' },
  { key: 'T', action: 'Add Test node' },
  { key: 'R', action: 'Add Treatment node' },
  { key: 'O', action: 'Add Outcome node' },
  { key: 'K', action: 'Add Risk Factor node' },
  { key: 'C', action: 'Add Complication node' },
  { key: 'N', action: 'Add Note node' },
  { key: '?', action: 'Show keyboard shortcuts' },
];

const ReasoningCanvasInner = forwardRef<HTMLDivElement, ReasoningCanvasProps>(function ReasoningCanvasInner({
  caseId,
  initialCanvasState,
  onCanvasChange,
  onMetricsChange,
  onStateChange,
  externalShowIntelligence,
  onIntelligenceClose,
  onToggleFocusMode
}, ref) {
  const isCollaborativeMode = !!onCanvasChange;
  const internalRef = useRef<HTMLDivElement>(null);
  const reactFlowWrapper = (ref as React.RefObject<HTMLDivElement>) || internalRef;
  const { fitView, zoomIn, zoomOut, getViewport, setCenter } = useReactFlow();
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
  const [selectorPosition, setSelectorPosition] = useState({ x: 0, y: 0 });
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [newNodeType, setNewNodeType] = useState<ReasoningNode['type'] | null>(null);
  const [subGraphNode, setSubGraphNode] = useState<Node | null>(null);
  const [internalShowIntelligence, setInternalShowIntelligence] = useState(false);
  
  // Use external control if provided, otherwise use internal state
  const showIntelligence = externalShowIntelligence !== undefined ? externalShowIntelligence : internalShowIntelligence;
  const handleIntelligenceToggle = () => {
    if (externalShowIntelligence !== undefined) {
      onIntelligenceClose?.();
    } else {
      setInternalShowIntelligence(v => !v);
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const { pushState, undo, redo, canUndo, canRedo, clear: clearHistory } = useCanvasHistory();
  
  // Track if we've initialized the canvas to avoid re-setting on every update
  const hasInitializedRef = useRef(false);
  const lastSyncedStateRef = useRef<string | null>(null);

  // Load saved state from localStorage OR collaborative state (only on initial mount)
  useEffect(() => {
    if (hasInitializedRef.current) return;
    
    if (isCollaborativeMode) {
      if (initialCanvasState) {
        setNodes(initialCanvasState.nodes || []);
        setEdges(initialCanvasState.edges || []);
        hasInitializedRef.current = true;
      }
    } else {
      const saved = localStorage.getItem(`canvas-${caseId}`);
      if (saved) {
        try {
          const { nodes: savedNodes, edges: savedEdges } = JSON.parse(saved);
          setNodes(savedNodes || []);
          setEdges(savedEdges || []);
        } catch {
          console.error('Failed to load saved canvas state');
        }
      }
      hasInitializedRef.current = true;
    }
  }, [caseId, setNodes, setEdges, isCollaborativeMode, initialCanvasState]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? event.metaKey : event.ctrlKey;

      // Search
      if (ctrlKey && event.key === 'f') {
        event.preventDefault();
        setShowSearch(true);
        return;
      }

      // Export
      if (ctrlKey && event.key === 'e') {
        event.preventDefault();
        handleExport();
        return;
      }

      // Fit view
      if (ctrlKey && event.key === '0') {
        event.preventDefault();
        fitView();
        return;
      }

      // Undo/Redo
      if (ctrlKey && event.key === 'z') {
        event.preventDefault();
        handleUndo();
        return;
      }

      if (ctrlKey && event.key === 'y') {
        event.preventDefault();
        handleRedo();
        return;
      }

      // Delete selected node
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedNodeId) {
          event.preventDefault();
          deleteNode(selectedNodeId);
        }
        return;
      }

      // Focus Mode Toggle
      if (event.key === 'F11') {
        event.preventDefault();
        onToggleFocusMode?.();
        return;
      }

      // Quick node creation
      if (!ctrlKey && !event.shiftKey && !event.altKey) {
        switch (event.key.toLowerCase()) {
          case 's':
            event.preventDefault();
            handleAddNode('symptom');
            return;
          case 'f':
            event.preventDefault();
            handleAddNode('finding');
            return;
          case 'd':
            event.preventDefault();
            handleAddNode('diagnosis');
            return;
          case 't':
            event.preventDefault();
            handleAddNode('test');
            return;
          case 'r':
            event.preventDefault();
            handleAddNode('treatment');
            return;
          case 'o':
            event.preventDefault();
            handleAddNode('outcome');
            return;
          case 'k':
            event.preventDefault();
            handleAddNode('risk-factor');
            return;
          case 'c':
            event.preventDefault();
            handleAddNode('complication');
            return;
          case 'n':
            event.preventDefault();
            handleAddNode('note');
            return;
          case '?':
            event.preventDefault();
            setShowShortcuts(true);
            return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, nodes, edges]);

  // Listen for external canvas updates from other team members
  useEffect(() => {
    if (!isCollaborativeMode || !hasInitializedRef.current || !initialCanvasState) return;
    
    const incomingStateStr = JSON.stringify(initialCanvasState);
    
    if (lastSyncedStateRef.current !== incomingStateStr) {
      const currentNodesCount = nodes.length;
      const incomingNodesCount = initialCanvasState.nodes?.length || 0;
      const currentEdgesCount = edges.length;
      const incomingEdgesCount = initialCanvasState.edges?.length || 0;
      
      if (incomingNodesCount > currentNodesCount || incomingEdgesCount > currentEdgesCount) {
        setNodes(initialCanvasState.nodes || []);
        setEdges(initialCanvasState.edges || []);
        lastSyncedStateRef.current = incomingStateStr;
      }
    }
  }, [initialCanvasState, isCollaborativeMode, nodes.length, edges.length, setNodes, setEdges]);

  // Save state to localStorage (solo mode only)
  useEffect(() => {
    if (!isCollaborativeMode && (nodes.length > 0 || edges.length > 0)) {
      localStorage.setItem(`canvas-${caseId}`, JSON.stringify({ nodes, edges }));
    }
  }, [nodes, edges, caseId, isCollaborativeMode]);

  // Sync canvas changes to room (collaborative mode)
  const syncToRoom = useCallback(() => {
    if (isCollaborativeMode && onCanvasChange) {
      const state = { nodes, edges };
      lastSyncedStateRef.current = JSON.stringify(state);
      onCanvasChange(state);
    }
    onMetricsChange?.({ nodesCount: nodes.length, connectionsCount: edges.length });
    onStateChange?.(nodes, edges);
  }, [isCollaborativeMode, onCanvasChange, onMetricsChange, onStateChange, nodes, edges]);

  const saveToHistory = useCallback(() => {
    pushState(nodes, edges);
    syncToRoom();
  }, [nodes, edges, pushState, syncToRoom]);

  const handleConnect = useCallback((connection: Connection) => {
    if (reactFlowWrapper.current) {
      const rect = reactFlowWrapper.current.getBoundingClientRect();
      setSelectorPosition({
        x: rect.width / 2,
        y: rect.height / 2,
      });
    }
    setPendingConnection(connection);
  }, []);

  const handleConnectionTypeSelect = useCallback((type: ConnectionType) => {
    if (pendingConnection) {
      const newEdge: Edge = {
        id: `e${pendingConnection.source}-${pendingConnection.target}`,
        source: pendingConnection.source!,
        target: pendingConnection.target!,
        type: 'connection',
        data: {
          connectionType: type,
          label: type === 'supports-strong' ? 'Supports' : 
                 type === 'supports-weak' ? 'Weak' :
                 type === 'contradicts' ? 'Against' : undefined,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
      saveToHistory();
    }
    setPendingConnection(null);
  }, [pendingConnection, setEdges, saveToHistory]);

  const handleAddNode = useCallback((type: ReasoningNodeType) => {
    setNewNodeType(type);
    setEditingNode(null);
    setEditDialogOpen(true);
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    saveToHistory();
    setSelectedNodeId(null);
    toast.success('Node deleted');
  }, [setNodes, setEdges, saveToHistory]);

  const handleNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    setEditingNode(node);
    setNewNodeType(null);
    setEditDialogOpen(true);
  }, []);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handleNodeSave = useCallback((data: { label: string; description?: string; confidence?: number }) => {
    if (editingNode) {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === editingNode.id
            ? { ...n, data: { ...n.data, ...data } }
            : n
        )
      );
    } else if (newNodeType) {
      const viewport = getViewport();
      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'reasoning',
        position: {
          x: (reactFlowWrapper.current?.clientWidth || 500) / 2 / viewport.zoom - viewport.x / viewport.zoom + Math.random() * 100 - 50,
          y: (reactFlowWrapper.current?.clientHeight || 400) / 2 / viewport.zoom - viewport.y / viewport.zoom + Math.random() * 100 - 50,
        },
        data: {
          nodeType: newNodeType,
          ...data,
        },
      };
      setNodes((nds) => [...nds, newNode]);
    }
    saveToHistory();
    setEditDialogOpen(false);
    setEditingNode(null);
    setNewNodeType(null);
  }, [editingNode, newNodeType, setNodes, getViewport, saveToHistory]);

  const handleUndo = useCallback(() => {
    const state = undo();
    if (state) {
      setNodes(state.nodes);
      setEdges(state.edges);
    }
  }, [undo, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    const state = redo();
    if (state) {
      setNodes(state.nodes);
      setEdges(state.edges);
    }
  }, [redo, setNodes, setEdges]);

  const handleClear = useCallback(() => {
    if (nodes.length === 0 && edges.length === 0) return;
    if (confirm('Are you sure you want to clear the canvas? This cannot be undone.')) {
      saveToHistory();
      setNodes([]);
      setEdges([]);
      clearHistory();
      localStorage.removeItem(`canvas-${caseId}`);
      toast.success('Canvas cleared');
    }
  }, [nodes.length, edges.length, setNodes, setEdges, clearHistory, caseId, saveToHistory]);

  const handleExport = useCallback(async () => {
    if (!reactFlowWrapper.current) return;
    
    try {
      const dataUrl = await toPng(reactFlowWrapper.current.querySelector('.react-flow') as HTMLElement, {
        backgroundColor: 'hsl(var(--background))',
        quality: 0.95,
      });
      
      const link = document.createElement('a');
      link.download = `reasoning-map-${caseId}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Canvas exported as image');
    } catch {
      toast.error('Failed to export canvas');
    }
  }, [caseId]);

  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    const hasPositionChange = changes.some((c: any) => c.type === 'position' && c.dragging === false);
    if (hasPositionChange) {
      saveToHistory();
    }
  }, [onNodesChange, saveToHistory]);

  const minimapNodeColor = useCallback((node: Node) => {
    const type = node.data?.nodeType as ReasoningNodeType;
    const colors: Record<ReasoningNodeType, string> = {
      symptom: 'hsl(var(--node-symptom))',
      finding: 'hsl(var(--node-finding))',
      diagnosis: 'hsl(var(--node-diagnosis))',
      test: 'hsl(var(--node-test))',
      note: 'hsl(var(--muted-foreground))',
      treatment: '#10b981',
      outcome: '#3b82f6',
      'risk-factor': '#f97316',
      complication: '#ef4444',
    };
    return colors[type] || 'hsl(var(--primary))';
  }, []);

  // Filtered nodes for search
  const filteredNodes = useMemo(() => {
    if (!searchQuery) return [];
    return nodes.filter((node) =>
      (node.data?.label as string)?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [nodes, searchQuery]);

  const focusNode = useCallback((node: Node) => {
    setCenter(node.position.x, node.position.y, { zoom: 1.5, duration: 500 });
    setSelectedNodeId(node.id);
    setShowSearch(false);
    setSearchQuery('');
  }, [setCenter]);

  return (
    <div ref={reactFlowWrapper} className="h-full w-full relative">
      <ReactFlow
        nodes={nodes.map((node) => ({
          ...node,
          selected: node.id === selectedNodeId,
        }))}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeDoubleClick={handleNodeDoubleClick}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'connection' }}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        className="bg-canvas-background"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="opacity-50" />
        <MiniMap
          nodeColor={minimapNodeColor}
          maskColor="hsl(var(--background) / 0.8)"
          className="!bg-card !border !border-border rounded-lg"
        />
      </ReactFlow>

      <CanvasToolbar
        onAddNode={handleAddNode}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFitView={fitView}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onExport={handleExport}
        canUndo={canUndo}
        canRedo={canRedo}
        onToggleIntelligence={handleIntelligenceToggle}
        showIntelligence={showIntelligence}
      />

      {/* Search Panel */}
      {showSearch && (
        <Panel position="top-center" className="!top-4">
          <div className="bg-card border rounded-lg shadow-lg p-3 w-80">
            <div className="flex items-center gap-2 mb-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-8"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {filteredNodes.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredNodes.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => focusNode(node)}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-muted text-sm flex items-center gap-2"
                  >
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        node.data?.nodeType === 'symptom' && 'bg-node-symptom',
                        node.data?.nodeType === 'finding' && 'bg-node-finding',
                        node.data?.nodeType === 'diagnosis' && 'bg-node-diagnosis',
                        node.data?.nodeType === 'test' && 'bg-node-test',
                        node.data?.nodeType === 'note' && 'bg-muted-foreground',
                        node.data?.nodeType === 'treatment' && 'bg-emerald-500',
                        node.data?.nodeType === 'outcome' && 'bg-blue-500',
                        node.data?.nodeType === 'risk-factor' && 'bg-orange-500',
                        node.data?.nodeType === 'complication' && 'bg-red-500'
                      )}
                    />
                    <span className="truncate">{node.data?.label as string}</span>
                  </button>
                ))}
              </div>
            )}
            {searchQuery && filteredNodes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                No nodes found
              </p>
            )}
          </div>
        </Panel>
      )}

      {/* Keyboard shortcuts help button */}
      <Panel position="bottom-right" className="!bottom-4 !right-4">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setShowShortcuts(true)}
        >
          <Keyboard className="h-4 w-4" />
          Shortcuts (?)
        </Button>
      </Panel>

      {pendingConnection && (
        <ConnectionTypeSelector
          position={selectorPosition}
          onSelect={handleConnectionTypeSelect}
          onCancel={() => setPendingConnection(null)}
        />
      )}

      <NodeEditDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingNode(null);
          setNewNodeType(null);
        }}
        onSave={handleNodeSave}
        node={
          editingNode
            ? {
                label: editingNode.data.label as string,
                nodeType: editingNode.data.nodeType as ReasoningNode['type'],
                description: editingNode.data.description as string | undefined,
                confidence: editingNode.data.confidence as number | undefined,
              }
            : newNodeType
            ? { label: '', nodeType: newNodeType }
            : null
        }
        isNew={!editingNode}
      />

      {/* Canvas instructions */}
      {nodes.length === 0 && (
        <Panel position="top-center" className="!top-4">
          <div className="bg-card/95 backdrop-blur border rounded-lg px-4 py-3 shadow-lg text-center max-w-md">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Start mapping your reasoning!</span>
              <br />
              Use the toolbar on the left or press keys:
              <br />
              <span className="text-xs">S=Symptom, F=Finding, D=Diagnosis, T=Test, N=Note</span>
            </p>
          </div>
        </Panel>
      )}

      {/* Scratch Pad */}
      <ScratchPadPanel caseId={caseId} />

      {/* Graph Intelligence Panel */}
      <GraphIntelligencePanel
        nodes={nodes}
        edges={edges}
        caseId={caseId}
        isOpen={showIntelligence}
        onToggle={handleIntelligenceToggle}
      />

      {/* Sub-graph drill-down dialog */}
      {subGraphNode && (
        <SubGraphDialog
          open={!!subGraphNode}
          onClose={() => setSubGraphNode(null)}
          nodeLabel={subGraphNode.data?.label as string}
          nodeId={subGraphNode.id}
          caseId={caseId}
        />
      )}

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {keyboardShortcuts.map(({ key, action }) => (
                <div key={key} className="flex items-center justify-between p-2 rounded bg-muted">
                  <kbd className="px-2 py-0.5 bg-background border rounded text-xs font-mono">
                    {key}
                  </kbd>
                  <span className="text-muted-foreground">{action}</span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export const ReasoningCanvas = forwardRef<HTMLDivElement, ReasoningCanvasProps>(function ReasoningCanvas(props, ref) {
  return (
    <ReactFlowProvider>
      <ReasoningCanvasInner {...props} ref={ref} />
    </ReactFlowProvider>
  );
});
