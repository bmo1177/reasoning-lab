/**
 * Simulation Timer Hook
 * 
 * Manages simulation countdown timer and critical window monitoring.
 * Extracted from useSimulationAnalytics to improve maintainability.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { PatientState, SimulationStage } from '@/types/simulation';

interface UseSimulationTimerOptions {
    hasTimeLimit: boolean;
    timeLimitSeconds: number | null;
    isActive: boolean;
    isCompleted: boolean;
    currentStage: SimulationStage | undefined;
    onTimeout: () => void;
}

interface UseSimulationTimerReturn {
    timeRemaining: number | null;
    setTimeRemaining: React.Dispatch<React.SetStateAction<number | null>>;
    deductTime: (seconds: number) => void;
    resetTimer: (timeLimitSeconds: number | null) => void;
    clearTimers: () => void;
}

export function useSimulationTimer({
    hasTimeLimit,
    timeLimitSeconds,
    isActive,
    isCompleted,
    currentStage,
    onTimeout,
}: UseSimulationTimerOptions): UseSimulationTimerReturn {
    const [timeRemaining, setTimeRemaining] = useState<number | null>(
        hasTimeLimit ? timeLimitSeconds ?? 600 : null
    );

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const criticalWindowRef = useRef<NodeJS.Timeout | null>(null);

    // Countdown timer
    useEffect(() => {
        if (!isActive || !hasTimeLimit || isCompleted) {
            return;
        }

        timerRef.current = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev === null) return null;
                if (prev <= 1) {
                    onTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isActive, hasTimeLimit, isCompleted, onTimeout]);

    // Critical window monitoring
    useEffect(() => {
        if (!currentStage?.criticalWindow || isCompleted) {
            return;
        }

        criticalWindowRef.current = setTimeout(() => {
            // Signal handled by parent via patient state update
        }, currentStage.criticalWindow * 1000);

        return () => {
            if (criticalWindowRef.current) {
                clearTimeout(criticalWindowRef.current);
            }
        };
    }, [currentStage, isCompleted]);

    const deductTime = useCallback((seconds: number) => {
        if (hasTimeLimit) {
            setTimeRemaining((prev) => (prev !== null ? Math.max(0, prev - seconds) : null));
        }
    }, [hasTimeLimit]);

    const resetTimer = useCallback((newTimeLimitSeconds: number | null) => {
        setTimeRemaining(newTimeLimitSeconds);
        if (timerRef.current) clearInterval(timerRef.current);
        if (criticalWindowRef.current) clearTimeout(criticalWindowRef.current);
    }, []);

    const clearTimers = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (criticalWindowRef.current) clearTimeout(criticalWindowRef.current);
    }, []);

    return {
        timeRemaining,
        setTimeRemaining,
        deductTime,
        resetTimer,
        clearTimers,
    };
}
