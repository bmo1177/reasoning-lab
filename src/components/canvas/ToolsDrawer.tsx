import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  StickyNote, 
  Brain, 
  Keyboard, 
  ChevronUp, 
  ChevronDown,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScratchPadPanel } from './ScratchPadPanel';

interface ToolsDrawerProps {
  caseId: string;
  showIntelligence: boolean;
  onToggleIntelligence: () => void;
  onShowShortcuts: () => void;
}

export function ToolsDrawer({ 
  caseId, 
  showIntelligence, 
  onToggleIntelligence,
  onShowShortcuts 
}: ToolsDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTool, setActiveTool] = useState<'scratchpad' | null>(null);

  const handleToolClick = (tool: 'scratchpad') => {
    if (activeTool === tool) {
      setActiveTool(null);
      setIsExpanded(false);
    } else {
      setActiveTool(tool);
      setIsExpanded(true);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute right-4 bottom-4 z-30 flex flex-col items-end gap-2">
        {/* Expanded Tools Panel */}
        {isExpanded && (
          <Card className="w-80 mb-2 shadow-lg animate-in slide-in-from-bottom-2">
            <CardHeader className="py-2 px-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">
                {activeTool === 'scratchpad' && 'Scratch Pad'}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => {
                  setIsExpanded(false);
                  setActiveTool(null);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {activeTool === 'scratchpad' && (
                <div className="h-64">
                  <ScratchPadPanel caseId={caseId} embedded />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tools Bar */}
        <div className="flex items-center gap-1 rounded-lg border bg-card p-1.5 shadow-lg">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8 relative',
                  activeTool === 'scratchpad' && 'bg-primary/10 text-primary'
                )}
                onClick={() => handleToolClick('scratchpad')}
              >
                <StickyNote className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Scratch Pad</TooltipContent>
          </Tooltip>

          <div className="w-px h-4 bg-border mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8 relative',
                  showIntelligence && 'bg-primary/10 text-primary'
                )}
                onClick={onToggleIntelligence}
              >
                <Brain className="h-4 w-4" />
                {!showIntelligence && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">AI Analysis</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onShowShortcuts}
              >
                <Keyboard className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Keyboard Shortcuts</TooltipContent>
          </Tooltip>

          <div className="w-px h-4 bg-border mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
