import { ConnectionType } from '@/types/case';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, X, Minus, HelpCircle } from 'lucide-react';

interface ConnectionTypeSelectorProps {
  position: { x: number; y: number };
  onSelect: (type: ConnectionType) => void;
  onCancel: () => void;
}

const connectionOptions: { type: ConnectionType; label: string; icon: React.ElementType; color: string }[] = [
  { type: 'supports-strong', label: 'Strongly Supports', icon: Check, color: 'bg-supports-strong/10 text-supports-strong hover:bg-supports-strong/20 border-supports-strong' },
  { type: 'supports-weak', label: 'Weakly Supports', icon: Check, color: 'bg-supports-weak/10 text-supports-weak hover:bg-supports-weak/20 border-supports-weak' },
  { type: 'contradicts', label: 'Contradicts', icon: X, color: 'bg-contradicts/10 text-contradicts hover:bg-contradicts/20 border-contradicts' },
  { type: 'neutral', label: 'Neutral/Unknown', icon: HelpCircle, color: 'bg-muted text-muted-foreground hover:bg-muted/80 border-muted-foreground' },
];

export function ConnectionTypeSelector({ position, onSelect, onCancel }: ConnectionTypeSelectorProps) {
  return (
    <div
      className="absolute z-50 rounded-lg border bg-card p-2 shadow-xl"
      style={{ left: position.x, top: position.y, transform: 'translate(-50%, -50%)' }}
    >
      <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Connection Type</p>
      <div className="flex flex-col gap-1">
        {connectionOptions.map(({ type, label, icon: Icon, color }) => (
          <Button
            key={type}
            variant="ghost"
            size="sm"
            className={cn('justify-start gap-2 border', color)}
            onClick={() => onSelect(type)}
          >
            <Icon className="h-3 w-3" />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full mt-2 text-xs"
        onClick={onCancel}
      >
        <Minus className="h-3 w-3 mr-1" />
        Cancel
      </Button>
    </div>
  );
}
