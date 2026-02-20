import { Badge } from '@/components/ui/badge';
import { Heart, Thermometer, Activity, Wind, Droplets } from 'lucide-react';
import { PatientState } from '@/types/simulation';
import { cn } from '@/lib/utils';

/**
 * Automatically detect critical status based on vital signs.
 */
export function calculateCriticalStatus(state: PatientState): string {
    const vitals = state.vitalSigns;
    let criticalScore = 0;

    const bpMatch = vitals.bloodPressure.match(/(\d+)\/(\d+)/);
    if (bpMatch) {
        const systolic = parseInt(bpMatch[1]);
        const diastolic = parseInt(bpMatch[2]);
        if (systolic < 90 || diastolic < 60) criticalScore += 2;
        if (systolic < 80) criticalScore += 2;
    }

    if (vitals.heartRate > 120 || vitals.heartRate < 50) criticalScore += 2;
    if (vitals.heartRate > 140 || vitals.heartRate < 40) criticalScore += 2;
    if (vitals.respiratoryRate > 24 || vitals.respiratoryRate < 12) criticalScore += 1;
    if (vitals.respiratoryRate > 30 || vitals.respiratoryRate < 8) criticalScore += 2;
    if (vitals.temperature > 39 || vitals.temperature < 35) criticalScore += 1;
    if (vitals.temperature > 40 || vitals.temperature < 34) criticalScore += 2;
    if (vitals.oxygenSaturation < 94) criticalScore += 1;
    if (vitals.oxygenSaturation < 90) criticalScore += 3;

    const criticalSymptoms = ['unconscious', 'unresponsive', 'severe pain', 'chest pain', 'difficulty breathing'];
    const hasCriticalSymptoms = state.symptoms.some(s =>
        criticalSymptoms.some(cs => s.toLowerCase().includes(cs))
    );
    if (hasCriticalSymptoms) criticalScore += 2;

    let autoStatus = state.status;
    if (criticalScore >= 5) autoStatus = 'critical';
    else if (criticalScore >= 3) autoStatus = 'declining';
    else if (criticalScore >= 1) autoStatus = 'stable';

    const severity: Record<string, number> = { resolved: 0, stable: 1, improving: 1, declining: 2, critical: 3 };
    if (severity[autoStatus] > (severity[state.status] || 0)) {
        return autoStatus;
    }
    return state.status;
}

const statusColors: Record<string, string> = {
    stable: 'text-emerald-600 bg-emerald-500/15 border-emerald-300/50',
    improving: 'text-blue-600 bg-blue-500/15 border-blue-300/50',
    declining: 'text-amber-600 bg-amber-500/15 border-amber-300/50',
    critical: 'text-red-600 bg-red-500/15 border-red-300/50 animate-pulse',
    resolved: 'text-emerald-600 bg-emerald-500/15 border-emerald-300/50',
};

interface VitalItemProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    critical?: boolean;
}

function VitalItem({ icon, label, value, critical }: VitalItemProps) {
    return (
        <div className={cn(
            "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs",
            critical ? "bg-red-500/10 text-red-600" : "bg-muted/50"
        )}>
            <span className="text-muted-foreground shrink-0">{icon}</span>
            <span className="text-muted-foreground shrink-0">{label}</span>
            <span className={cn("font-semibold ml-auto tabular-nums", critical && "text-red-600")}>{value}</span>
        </div>
    );
}

export function PatientVitals({ state }: { state: PatientState }) {
    const calculatedStatus = calculateCriticalStatus(state);
    const displayStatus = calculatedStatus !== state.status ? calculatedStatus : state.status;
    const isCritical = displayStatus === 'critical';
    const v = state.vitalSigns;

    return (
        <div className="space-y-2">
            {/* Status badge */}
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Patient Status</span>
                <Badge
                    variant="outline"
                    className={cn(statusColors[displayStatus], 'capitalize text-[10px] font-semibold px-1.5 py-0')}
                >
                    {isCritical && '⚠️ '}
                    {displayStatus}
                    {calculatedStatus !== state.status && ' (Auto)'}
                </Badge>
            </div>

            {/* Vitals — compact 2-column grid */}
            <div className="grid grid-cols-2 gap-1">
                <VitalItem icon={<Activity className="h-3 w-3" />} label="BP" value={v.bloodPressure} />
                <VitalItem
                    icon={<Heart className="h-3 w-3" />}
                    label="HR"
                    value={`${v.heartRate}`}
                    critical={v.heartRate > 120 || v.heartRate < 50}
                />
                <VitalItem icon={<Wind className="h-3 w-3" />} label="RR" value={`${v.respiratoryRate}/m`} />
                <VitalItem
                    icon={<Thermometer className="h-3 w-3" />}
                    label="T°"
                    value={`${v.temperature}°C`}
                    critical={v.temperature > 39}
                />
                <VitalItem
                    icon={<Droplets className="h-3 w-3" />}
                    label="SpO₂"
                    value={`${v.oxygenSaturation}%`}
                    critical={v.oxygenSaturation < 94}
                />
            </div>

            {/* Symptoms */}
            {state.symptoms.length > 0 && (
                <div className="pt-1 border-t border-border/50">
                    <p className="text-[10px] text-muted-foreground mb-1">Symptoms</p>
                    <div className="flex flex-wrap gap-1">
                        {state.symptoms.map((symptom, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                                {symptom}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
