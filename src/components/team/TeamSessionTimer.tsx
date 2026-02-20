import { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface TeamSessionTimerProps {
  startTime?: Date;
  isRunning?: boolean;
  onTimeUpdate?: (seconds: number) => void;
}

export function TeamSessionTimer({ 
  startTime = new Date(), 
  isRunning = true,
  onTimeUpdate 
}: TeamSessionTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef(startTime);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000);
      setElapsedSeconds(seconds);
      onTimeUpdate?.(seconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onTimeUpdate]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 text-sm font-mono bg-muted/50 px-3 py-1.5 rounded-lg">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <span>{formatTime(elapsedSeconds)}</span>
    </div>
  );
}
