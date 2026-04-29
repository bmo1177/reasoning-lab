import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ReasoningNodeType } from '@/types/case';
import {
  Stethoscope,
  Search,
  Activity,
  FlaskConical,
  StickyNote,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Brain,
  Pill,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { OCRUploadButton } from './OCRUploadButton';

interface CanvasToolbarProps {
  onAddNode: (type: ReasoningNodeType) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onToggleIntelligence?: () => void;
  showIntelligence?: boolean;
}

const nodeTools: { type: ReasoningNodeType; icon: React.ElementType; label: string; color: string; shortcut: string }[] = [
  { type: 'symptom', icon: Stethoscope, label: 'Symptom', color: 'text-node-symptom hover:bg-node-symptom/10', shortcut: 'S' },
  { type: 'finding', icon: Search, label: 'Finding', color: 'text-node-finding hover:bg-node-finding/10', shortcut: 'F' },
  { type: 'diagnosis', icon: Activity, label: 'Diagnosis', color: 'text-node-diagnosis hover:bg-node-diagnosis/10', shortcut: 'D' },
  { type: 'test', icon: FlaskConical, label: 'Test', color: 'text-node-test hover:bg-node-test/10', shortcut: 'T' },
  { type: 'treatment', icon: Pill, label: 'Treatment', color: 'text-emerald-500 hover:bg-emerald-500/10', shortcut: 'R' },
  { type: 'outcome', icon: CheckCircle2, label: 'Outcome', color: 'text-blue-500 hover:bg-blue-500/10', shortcut: 'O' },
  { type: 'risk-factor', icon: ShieldAlert, label: 'Risk Factor', color: 'text-orange-500 hover:bg-orange-500/10', shortcut: 'K' },
  { type: 'complication', icon: AlertTriangle, label: 'Complication', color: 'text-red-500 hover:bg-red-500/10', shortcut: 'C' },
  { type: 'note', icon: StickyNote, label: 'Note', color: 'text-muted-foreground hover:bg-muted', shortcut: 'N' },
];

export function CanvasToolbar({
  onAddNode,
  onZoomIn,
  onZoomOut,
  onFitView,
  onUndo,
  onRedo,
  onClear,
  onExport,
  canUndo,
  canRedo,
  onToggleIntelligence,
  showIntelligence,
}: CanvasToolbarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute left-4 top-4 z-30 flex flex-col gap-2">
        {/* Node tools */}
        <div className="flex flex-col gap-1 rounded-lg border bg-card p-1.5 shadow-lg">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 bg-primary/10 text-primary hover:bg-primary/20">
                    <Plus className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right">Add Node</TooltipContent>
            </Tooltip>
            <DropdownMenuContent side="right" align="start" className="w-48">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Clinical Data
              </DropdownMenuLabel>
              {nodeTools.slice(0, 4).map(({ type, icon: Icon, label, color, shortcut }) => (
                <DropdownMenuItem key={type} onClick={() => onAddNode(type)} className="cursor-pointer">
                  <Icon className={cn("mr-2 h-4 w-4", color)} />
                  <span className="flex-1">{label}</span>
                  <span className="text-xs text-muted-foreground">{shortcut}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Reasoning & Outcomes
              </DropdownMenuLabel>
              {nodeTools.slice(4).map(({ type, icon: Icon, label, color, shortcut }) => (
                <DropdownMenuItem key={type} onClick={() => onAddNode(type)} className="cursor-pointer">
                  <Icon className={cn("mr-2 h-4 w-4", color)} />
                  <span className="flex-1">{label}</span>
                  <span className="text-xs text-muted-foreground">{shortcut}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Canvas controls */}
        <div className="flex flex-col gap-1 rounded-lg border bg-card p-1.5 shadow-lg">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Zoom In</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Zoom Out</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onFitView}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Fit View</TooltipContent>
          </Tooltip>
        </div>

        {/* History controls */}
        <div className="flex flex-col gap-1 rounded-lg border bg-card p-1.5 shadow-lg">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onUndo}
                disabled={!canUndo}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Undo</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onRedo}
                disabled={!canRedo}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Redo</TooltipContent>
          </Tooltip>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 rounded-lg border bg-card p-1.5 shadow-lg">
          {onToggleIntelligence && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('h-8 w-8', showIntelligence && 'bg-primary/10 text-primary')}
                  onClick={onToggleIntelligence}
                >
                  <Brain className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Graph Intelligence</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onExport}>
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Export as Image</TooltipContent>
          </Tooltip>
          <OCRUploadButton />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                onClick={onClear}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Clear Canvas</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
