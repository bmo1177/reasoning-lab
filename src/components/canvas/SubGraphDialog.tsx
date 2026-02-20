import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SubGraphItem {
  id: string;
  label: string;
  description: string;
}

interface SubGraphDialogProps {
  open: boolean;
  onClose: () => void;
  nodeLabel: string;
  nodeId: string;
  caseId: string;
}

export function SubGraphDialog({ open, onClose, nodeLabel, nodeId, caseId }: SubGraphDialogProps) {
  const storageKey = `subgraph-${caseId}-${nodeId}`;
  
  const [items, setItems] = useState<SubGraphItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch { return []; }
  });
  const [newLabel, setNewLabel] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const save = useCallback((updatedItems: SubGraphItem[]) => {
    setItems(updatedItems);
    localStorage.setItem(storageKey, JSON.stringify(updatedItems));
  }, [storageKey]);

  const addItem = () => {
    if (!newLabel.trim()) return;
    save([...items, { id: `sub-${Date.now()}`, label: newLabel.trim(), description: newDesc.trim() }]);
    setNewLabel('');
    setNewDesc('');
  };

  const removeItem = (id: string) => {
    save(items.filter(i => i.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-primary" />
            Drill Down: {nodeLabel}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Break down this concept into sub-components for deeper reasoning.
        </p>

        <ScrollArea className="max-h-[300px]">
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={item.id} className="flex items-start gap-2 p-2 rounded-lg border bg-muted/30 group">
                <Badge variant="secondary" className="mt-0.5 shrink-0">{i + 1}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                </div>
                <Button
                  variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="space-y-2 border-t pt-3">
          <Input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            placeholder="Sub-component label"
            onKeyDown={e => e.key === 'Enter' && addItem()}
          />
          <Textarea
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Details (optional)"
            className="min-h-[60px] resize-none"
          />
          <Button onClick={addItem} disabled={!newLabel.trim()} className="w-full gap-2">
            <Plus className="h-4 w-4" /> Add Sub-Component
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
