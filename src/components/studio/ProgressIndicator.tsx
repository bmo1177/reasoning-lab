import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Stethoscope, 
  Search, 
  Activity, 
  GitBranch,
  CheckCircle2,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  nodes: Array<{ type: string; label: string }>;
  connections: number;
  className?: string;
}

export function ProgressIndicator({ nodes, connections, className }: ProgressIndicatorProps) {
  const stats = useMemo(() => {
    const symptoms = nodes.filter(n => n.type === 'symptom').length;
    const findings = nodes.filter(n => n.type === 'finding').length;
    const diagnoses = nodes.filter(n => n.type === 'diagnosis').length;
    const tests = nodes.filter(n => n.type === 'test').length;
    
    // Calculate progress based on milestones
    const milestones = [
      { label: 'First Node', complete: nodes.length >= 1, weight: 10 },
      { label: 'Multiple Symptoms', complete: symptoms >= 2, weight: 15 },
      { label: 'Added Findings', complete: findings >= 1, weight: 15 },
      { label: 'First Diagnosis', complete: diagnoses >= 1, weight: 20 },
      { label: 'Connected Nodes', complete: connections >= 2, weight: 20 },
      { label: 'Added Tests', complete: tests >= 1, weight: 10 },
      { label: 'Rich Map', complete: nodes.length >= 5 && connections >= 3, weight: 10 },
    ];
    
    const completedWeight = milestones
      .filter(m => m.complete)
      .reduce((sum, m) => sum + m.weight, 0);
    
    const nextMilestone = milestones.find(m => !m.complete);
    
    return {
      percent: completedWeight,
      symptoms,
      findings,
      diagnoses,
      tests,
      totalNodes: nodes.length,
      connections,
      nextMilestone: nextMilestone?.label || 'Map Complete!',
    };
  }, [nodes, connections]);

  if (nodes.length === 0) {
    return (
      <Card className={cn('bg-muted/50', className)}>
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Lightbulb className="h-4 w-4" />
            <span className="text-sm">Start adding nodes to track your progress</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="py-3 px-4 space-y-3">
        {/* Overall Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Reasoning Map Progress</span>
            <span className="text-muted-foreground">{stats.percent}%</span>
          </div>
          <Progress value={stats.percent} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Next: {stats.nextMilestone}
          </p>
        </div>

        {/* Node Stats */}
        <div className="flex items-center justify-around pt-2 border-t">
          <StatBadge 
            icon={Stethoscope} 
            count={stats.symptoms} 
            label="Symptoms"
            color="text-node-symptom"
          />
          <StatBadge 
            icon={Search} 
            count={stats.findings} 
            label="Findings"
            color="text-node-finding"
          />
          <StatBadge 
            icon={Activity} 
            count={stats.diagnoses} 
            label="Diagnoses"
            color="text-node-diagnosis"
          />
          <StatBadge 
            icon={GitBranch} 
            count={stats.connections} 
            label="Links"
            color="text-primary"
          />
        </div>

        {/* Completion Badge */}
        {stats.percent >= 100 && (
          <div className="flex items-center justify-center gap-2 pt-2 border-t text-supports-strong">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Excellent work! Your map is comprehensive.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatBadge({ 
  icon: Icon, 
  count, 
  label,
  color 
}: { 
  icon: React.ElementType; 
  count: number; 
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1">
        <Icon className={cn('h-3.5 w-3.5', color)} />
        <span className="text-sm font-semibold">{count}</span>
      </div>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
  );
}
