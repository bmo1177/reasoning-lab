import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface GraphNode {
  id: string;
  label: string;
  type: 'note' | 'case' | 'diagnosis' | 'symptom' | 'concept';
  x: number;
  y: number;
  radius: number;
  color: string;
  connections: number;
}

interface GraphEdge {
  source: string;
  target: string;
  strength: number;
}

interface KnowledgeGraphProps {
  notes: Array<{
    id: string;
    title: string;
    content: string;
    type?: string;
  }>;
  cases?: Array<{
    id: string;
    title: string;
    specialty: string;
  }>;
  onNodeClick?: (nodeId: string) => void;
  className?: string;
}

export function KnowledgeGraph({ notes, cases = [], onNodeClick, className }: KnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<string | null>(null);
  const animationRef = useRef<number>();

  // Generate nodes from notes and cases
  const { nodes, edges } = useMemo(() => {
    const nodeList: GraphNode[] = [];
    const edgeList: GraphEdge[] = [];
    
    // Add notes as nodes
    notes.forEach((note, index) => {
      const angle = (index / notes.length) * Math.PI * 2;
      const distance = 150 + Math.random() * 100;
      
      nodeList.push({
        id: note.id,
        label: note.title,
        type: 'note',
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        radius: 8 + Math.min(note.content.length / 500, 12),
        color: '#3B82F6',
        connections: 0,
      });
      
      // Extract concepts from note content
      const concepts = extractConcepts(note.content);
      concepts.forEach((concept, cIndex) => {
        const conceptId = `concept-${note.id}-${cIndex}`;
        const conceptAngle = angle + (cIndex - concepts.length / 2) * 0.3;
        const conceptDistance = distance + 80 + Math.random() * 40;
        
        nodeList.push({
          id: conceptId,
          label: concept,
          type: 'concept',
          x: Math.cos(conceptAngle) * conceptDistance,
          y: Math.sin(conceptAngle) * conceptDistance,
          radius: 5,
          color: '#10B981',
          connections: 1,
        });
        
        edgeList.push({
          source: note.id,
          target: conceptId,
          strength: 0.5,
        });
      });
    });
    
    // Add cases as nodes
    cases.forEach((caseItem, index) => {
      const angle = Math.PI + (index / cases.length) * Math.PI;
      const distance = 200 + Math.random() * 100;
      
      nodeList.push({
        id: `case-${caseItem.id}`,
        label: caseItem.title,
        type: 'case',
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        radius: 10,
        color: '#F59E0B',
        connections: 0,
      });
    });
    
    // Create connections between related notes
    for (let i = 0; i < notes.length; i++) {
      for (let j = i + 1; j < notes.length; j++) {
        const similarity = calculateSimilarity(notes[i].content, notes[j].content);
        if (similarity > 0.3) {
          edgeList.push({
            source: notes[i].id,
            target: notes[j].id,
            strength: similarity,
          });
          
          const node1 = nodeList.find(n => n.id === notes[i].id);
          const node2 = nodeList.find(n => n.id === notes[j].id);
          if (node1) node1.connections++;
          if (node2) node2.connections++;
        }
      }
    }
    
    return { nodes: nodeList, edges: edgeList };
  }, [notes, cases]);

  // Filter nodes based on search and type filter
  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      if (searchQuery && !node.label.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (filter && node.type !== filter) {
        return false;
      }
      return true;
    });
  }, [nodes, searchQuery, filter]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2 + offset.x;
      const centerY = canvas.height / 2 + offset.y;
      
      // Draw edges
      edges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        
        if (sourceNode && targetNode) {
          const isHighlighted = hoveredNode === edge.source || 
                               hoveredNode === edge.target ||
                               selectedNode === edge.source ||
                               selectedNode === edge.target;
          
          ctx.beginPath();
          ctx.moveTo(centerX + sourceNode.x * zoom, centerY + sourceNode.y * zoom);
          ctx.lineTo(centerX + targetNode.x * zoom, centerY + targetNode.y * zoom);
          ctx.strokeStyle = isHighlighted 
            ? `rgba(59, 130, 246, ${edge.strength})` 
            : `rgba(148, 163, 184, ${edge.strength * 0.3})`;
          ctx.lineWidth = isHighlighted ? 2 : 1;
          ctx.stroke();
        }
      });
      
      // Draw nodes
      filteredNodes.forEach(node => {
        const x = centerX + node.x * zoom;
        const y = centerY + node.y * zoom;
        const radius = node.radius * zoom;
        
        const isHovered = hoveredNode === node.id;
        const isSelected = selectedNode === node.id;
        
        // Glow effect for hovered/selected nodes
        if (isHovered || isSelected) {
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
          gradient.addColorStop(0, `${node.color}40`);
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Node circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        
        // Border
        ctx.strokeStyle = isSelected ? '#fff' : 'rgba(255,255,255,0.5)';
        ctx.lineWidth = isSelected ? 3 : 1;
        ctx.stroke();
        
        // Label
        if (zoom > 0.6 || isHovered || isSelected) {
          ctx.font = `${isHovered || isSelected ? 'bold' : 'normal'} ${12 * zoom}px sans-serif`;
          ctx.fillStyle = '#1f2937';
          ctx.textAlign = 'center';
          ctx.fillText(node.label, x, y + radius + 15 * zoom);
        }
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes, edges, filteredNodes, zoom, offset, hoveredNode, selectedNode]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
    
    // Check for node hover
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - canvas.width / 2 - offset.x;
    const y = e.clientY - rect.top - canvas.height / 2 - offset.y;
    
    const hovered = nodes.find(node => {
      const dx = node.x * zoom - x;
      const dy = node.y * zoom - y;
      return Math.sqrt(dx * dx + dy * dy) < node.radius * zoom + 5;
    });
    
    setHoveredNode(hovered?.id || null);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (hoveredNode) {
      setSelectedNode(hoveredNode);
      onNodeClick?.(hoveredNode);
    } else {
      setSelectedNode(null);
    }
  };

  const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.2, 0.3));
  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div ref={containerRef} className={cn("relative w-full h-[600px] bg-muted/30 rounded-lg overflow-hidden", className)}>
      {/* Controls */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-background/80 backdrop-blur"
          />
        </div>
        
        <div className="flex gap-1">
          {(['all', 'note', 'case', 'concept'] as const).map((type) => (
            <Badge
              key={type}
              variant={filter === type || (type === 'all' && !filter) ? 'default' : 'outline'}
              className="cursor-pointer capitalize"
              onClick={() => setFilter(type === 'all' ? null : type)}
            >
              {type}
            </Badge>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={containerRef.current?.clientWidth || 800}
        height={containerRef.current?.clientHeight || 600}
        className={cn(
          "w-full h-full cursor-grab",
          isDragging && "cursor-grabbing"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
      />

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <Button variant="secondary" size="icon" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={handleReset}>
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur rounded-lg p-3 text-xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Notes ({notes.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Cases ({cases.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Concepts</span>
        </div>
      </div>

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="absolute top-16 right-4 w-64 bg-background border rounded-lg p-4 shadow-lg">
          <h3 className="font-semibold mb-2">
            {nodes.find(n => n.id === selectedNode)?.label}
          </h3>
          <p className="text-sm text-muted-foreground">
            Type: {nodes.find(n => n.id === selectedNode)?.type}
          </p>
          <p className="text-sm text-muted-foreground">
            Connections: {nodes.find(n => n.id === selectedNode)?.connections || 0}
          </p>
        </div>
      )}
    </div>
  );
}

// Helper function to extract key concepts from text
function extractConcepts(text: string): string[] {
  const concepts: string[] = [];
  
  // Extract words that appear multiple times and are likely important
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 4 && !isCommonWord(word));
  
  const wordCount: Record<string, number> = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Get top words that appear more than once
  Object.entries(wordCount)
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([word]) => {
      concepts.push(word.charAt(0).toUpperCase() + word.slice(1));
    });
  
  return concepts;
}

function isCommonWord(word: string): boolean {
  const commonWords = [
    'about', 'above', 'after', 'again', 'against', 'among', 'before', 'being',
    'below', 'between', 'both', 'could', 'does', 'doing', 'down', 'during',
    'each', 'from', 'further', 'have', 'having', 'here', 'how', 'into',
    'more', 'most', 'much', 'only', 'other', 'over', 'same', 'should',
    'some', 'such', 'than', 'that', 'their', 'them', 'then', 'there',
    'these', 'they', 'this', 'those', 'through', 'under', 'very', 'what',
    'when', 'where', 'which', 'while', 'with', 'would', 'your', 'patient',
    'symptom', 'diagnosis', 'treatment', 'medical', 'clinical'
  ];
  return commonWords.includes(word);
}

// Simple similarity calculation between two texts
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}
