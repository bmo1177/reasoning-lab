import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { ReasoningNodeType } from '@/types/case';
import { 
  Stethoscope, 
  Search, 
  Activity, 
  FlaskConical, 
  StickyNote, 
  GripVertical,
  Pill,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';

const nodeIcons: Record<ReasoningNodeType, React.ElementType> = {
  symptom: Stethoscope,
  finding: Search,
  diagnosis: Activity,
  test: FlaskConical,
  note: StickyNote,
  treatment: Pill,
  outcome: CheckCircle2,
  'risk-factor': ShieldAlert,
  complication: AlertTriangle,
};

const nodeStyles: Record<ReasoningNodeType, string> = {
  symptom: 'border-node-symptom bg-node-symptom/10 shadow-node-symptom/20',
  finding: 'border-node-finding bg-node-finding/10 shadow-node-finding/20',
  diagnosis: 'border-node-diagnosis bg-node-diagnosis/10 shadow-node-diagnosis/20',
  test: 'border-node-test bg-node-test/10 shadow-node-test/20',
  note: 'border-muted-foreground bg-muted/50 shadow-muted/20',
  treatment: 'border-emerald-500 bg-emerald-500/10 shadow-emerald-500/20',
  outcome: 'border-blue-500 bg-blue-500/10 shadow-blue-500/20',
  'risk-factor': 'border-orange-500 bg-orange-500/10 shadow-orange-500/20',
  complication: 'border-red-500 bg-red-500/10 shadow-red-500/20',
};

const iconStyles: Record<ReasoningNodeType, string> = {
  symptom: 'text-node-symptom bg-node-symptom/20',
  finding: 'text-node-finding bg-node-finding/20',
  diagnosis: 'text-node-diagnosis bg-node-diagnosis/20',
  test: 'text-node-test bg-node-test/20',
  note: 'text-muted-foreground bg-muted',
  treatment: 'text-emerald-600 bg-emerald-500/20',
  outcome: 'text-blue-600 bg-blue-500/20',
  'risk-factor': 'text-orange-600 bg-orange-500/20',
  complication: 'text-red-600 bg-red-500/20',
};

interface NodeData {
  label: string;
  nodeType: ReasoningNodeType;
  description?: string;
  confidence?: number;
}

function ReasoningNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as unknown as NodeData;
  const Icon = nodeIcons[nodeData.nodeType];

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
      <div
        className={cn(
          'group relative min-w-[140px] max-w-[200px] rounded-lg border-2 p-3 shadow-lg transition-all',
          nodeStyles[nodeData.nodeType],
          selected && 'ring-2 ring-primary ring-offset-2'
        )}
      >
        <div className="absolute -top-1 -left-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="flex items-start gap-2">
          <div className={cn('rounded-md p-1.5', iconStyles[nodeData.nodeType])}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm leading-tight text-foreground">
              {nodeData.label}
            </p>
            {nodeData.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {nodeData.description}
              </p>
            )}
            {nodeData.confidence !== undefined && nodeData.nodeType === 'diagnosis' && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-medium">{nodeData.confidence}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-node-diagnosis rounded-full transition-all"
                    style={{ width: `${nodeData.confidence}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
    </>
  );
}

export default memo(ReasoningNodeComponent);
