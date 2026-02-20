import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PenLine, Plus, Trash2, Save, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ScratchPad {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface ScratchPadPanelProps {
  caseId: string;
  embedded?: boolean;
}

export function ScratchPadPanel({ caseId, embedded }: ScratchPadPanelProps) {
  const [pads, setPads] = useState<ScratchPad[]>([]);
  const [activePadId, setActivePadId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`scratch-pads-${caseId}`);
    if (saved) {
      try {
        setPads(JSON.parse(saved));
      } catch { /* ignore */ }
    }
  }, [caseId]);

  // Save
  useEffect(() => {
    if (pads.length > 0) {
      localStorage.setItem(`scratch-pads-${caseId}`, JSON.stringify(pads));
    }
  }, [pads, caseId]);

  const addPad = useCallback(() => {
    const newPad: ScratchPad = {
      id: `pad-${Date.now()}`,
      title: `Scratch ${pads.length + 1}`,
      content: '',
      createdAt: new Date().toISOString(),
    };
    setPads(prev => [...prev, newPad]);
    setActivePadId(newPad.id);
    setIsCollapsed(false);
  }, [pads.length]);

  const updatePad = useCallback((id: string, updates: Partial<ScratchPad>) => {
    setPads(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deletePad = useCallback((id: string) => {
    setPads(prev => prev.filter(p => p.id !== id));
    if (activePadId === id) setActivePadId(null);
  }, [activePadId]);

  const activePad = pads.find(p => p.id === activePadId);

  return (
    <div className={cn(
      embedded ? 'w-full h-full' : 'absolute right-4 bottom-4 z-10 w-72'
    )}>
      <div className={cn(
        'overflow-hidden',
        embedded ? 'h-full border-0' : 'rounded-lg border bg-card shadow-lg'
      )}>
        {/* Header */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-accent/50 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <PenLine className="h-4 w-4 text-primary" />
            Scratch Pad
            {pads.length > 0 && (
              <span className="text-xs text-muted-foreground">({pads.length})</span>
            )}
          </span>
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <Separator />
              
              {/* Pad list */}
              <div className="flex items-center gap-1 px-2 py-1.5 border-b overflow-x-auto">
                {pads.map(pad => (
                  <button
                    key={pad.id}
                    onClick={() => setActivePadId(pad.id)}
                    className={cn(
                      'text-xs px-2 py-1 rounded whitespace-nowrap transition-colors',
                      activePadId === pad.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted text-muted-foreground'
                    )}
                  >
                    {pad.title}
                  </button>
                ))}
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={addPad}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* Active pad content */}
              {activePad ? (
                <div className="p-2 space-y-2">
                  <div className="flex items-center gap-1">
                    <Input
                      value={activePad.title}
                      onChange={e => updatePad(activePad.id, { title: e.target.value })}
                      className="h-7 text-xs"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-destructive"
                      onClick={() => deletePad(activePad.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <Textarea
                    value={activePad.content}
                    onChange={e => updatePad(activePad.id, { content: e.target.value })}
                    placeholder="Quick notes, sketches, ideas..."
                    className="min-h-[120px] text-xs resize-none"
                  />
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  <p>No pads yet.</p>
                  <Button variant="link" size="sm" onClick={addPad} className="text-xs mt-1">
                    Create one
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
