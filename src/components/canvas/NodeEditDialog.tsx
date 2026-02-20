import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ReasoningNodeType } from '@/types/case';

interface NodeEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { label: string; description?: string; confidence?: number }) => void;
  node: {
    label: string;
    nodeType: ReasoningNodeType;
    description?: string;
    confidence?: number;
  } | null;
  isNew?: boolean;
}

export function NodeEditDialog({ open, onClose, onSave, node, isNew = false }: NodeEditDialogProps) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [confidence, setConfidence] = useState(50);

  useEffect(() => {
    if (node) {
      setLabel(node.label);
      setDescription(node.description || '');
      setConfidence(node.confidence ?? 50);
    } else {
      setLabel('');
      setDescription('');
      setConfidence(50);
    }
  }, [node, open]);

  const handleSave = () => {
    if (!label.trim()) return;
    onSave({
      label: label.trim(),
      description: description.trim() || undefined,
      confidence: node?.nodeType === 'diagnosis' ? confidence : undefined,
    });
    onClose();
  };

  if (!node) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isNew ? 'Add' : 'Edit'} {node.nodeType.charAt(0).toUpperCase() + node.nodeType.slice(1)}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={`Enter ${node.nodeType} name...`}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add additional details..."
              rows={3}
            />
          </div>
          {node.nodeType === 'diagnosis' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Confidence Level</Label>
                <span className="text-sm font-medium">{confidence}%</span>
              </div>
              <Slider
                value={[confidence]}
                onValueChange={([val]) => setConfidence(val)}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!label.trim()}>
            {isNew ? 'Add Node' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
