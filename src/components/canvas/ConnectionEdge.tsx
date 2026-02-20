import { memo } from 'react';
import { BaseEdge, EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import { ConnectionType } from '@/types/case';
import { cn } from '@/lib/utils';

const connectionStyles: Record<ConnectionType, { stroke: string; strokeWidth: number; className: string }> = {
  'supports-strong': { stroke: 'hsl(var(--supports-strong))', strokeWidth: 3, className: 'text-supports-strong' },
  'supports-weak': { stroke: 'hsl(var(--supports-weak))', strokeWidth: 2, className: 'text-supports-weak' },
  'contradicts': { stroke: 'hsl(var(--contradicts))', strokeWidth: 2, className: 'text-contradicts' },
  'neutral': { stroke: 'hsl(var(--neutral-connection))', strokeWidth: 1.5, className: 'text-muted-foreground' },
};

interface EdgeData {
  connectionType: ConnectionType;
  label?: string;
}

function ConnectionEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const edgeData = (data || { connectionType: 'neutral' }) as unknown as EdgeData;
  const style = connectionStyles[edgeData.connectionType];

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: style.stroke,
          strokeWidth: selected ? style.strokeWidth + 1 : style.strokeWidth,
          strokeDasharray: edgeData.connectionType === 'neutral' ? '5,5' : undefined,
        }}
      />
      {edgeData.label && (
        <EdgeLabelRenderer>
          <div
            className={cn(
              'absolute text-xs font-medium px-2 py-0.5 rounded-full bg-background border shadow-sm pointer-events-none',
              style.className
            )}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
          >
            {edgeData.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(ConnectionEdgeComponent);
