/**
 * HintOverlay Component
 * 
 * Displays error hints from the ECA hint engine as a floating toast-like
 * notification over the simulation area. Auto-dismisses after a delay.
 * Supports 3 severity levels with distinct styling.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Lightbulb, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Hint } from '@/services/hintEngine';
import { formatHintForDisplay } from '@/services/hintEngine';

interface HintOverlayProps {
    /** The current hint to display, or null to hide */
    hint: Hint | null;
    /** Called when hint is dismissed */
    onDismiss: () => void;
    /** Auto-dismiss delay in ms (default: 8000) */
    autoDismissMs?: number;
}

const levelConfig = {
    1: {
        icon: Info,
        bg: 'bg-blue-50 dark:bg-blue-950/80',
        border: 'border-blue-200 dark:border-blue-800',
        iconColor: 'text-blue-500',
        title: 'text-blue-900 dark:text-blue-100',
        body: 'text-blue-800 dark:text-blue-200',
        label: 'Gentle Nudge',
    },
    2: {
        icon: Lightbulb,
        bg: 'bg-amber-50 dark:bg-amber-950/80',
        border: 'border-amber-200 dark:border-amber-800',
        iconColor: 'text-amber-500',
        title: 'text-amber-900 dark:text-amber-100',
        body: 'text-amber-800 dark:text-amber-200',
        label: 'Guided Hint',
    },
    3: {
        icon: AlertTriangle,
        bg: 'bg-rose-50 dark:bg-rose-950/80',
        border: 'border-rose-200 dark:border-rose-800',
        iconColor: 'text-rose-500',
        title: 'text-rose-900 dark:text-rose-100',
        body: 'text-rose-800 dark:text-rose-200',
        label: 'Direct Guidance',
    },
} as const;

export function HintOverlay({ hint, onDismiss, autoDismissMs = 8000 }: HintOverlayProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (hint) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(onDismiss, 300); // Wait for exit animation
            }, autoDismissMs);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [hint, autoDismissMs, onDismiss]);

    if (!hint) return null;

    const formatted = formatHintForDisplay(hint);
    const level = hint.level as 1 | 2 | 3;
    const config = levelConfig[level] || levelConfig[1];
    const Icon = config.icon;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
                >
                    <div
                        className={cn(
                            'rounded-xl border shadow-lg backdrop-blur-sm p-4',
                            config.bg,
                            config.border,
                        )}
                        role="alert"
                        aria-live="assertive"
                    >
                        <div className="flex items-start gap-3">
                            <div className={cn('mt-0.5 shrink-0', config.iconColor)}>
                                <Icon className="h-5 w-5" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={cn('text-sm font-semibold', config.title)}>
                                        {formatted.title}
                                    </span>
                                    <span className={cn(
                                        'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                                        config.bg, config.border, 'border',
                                    )}>
                                        L{level} — {config.label}
                                    </span>
                                </div>
                                <p className={cn('text-sm leading-relaxed', config.body)}>
                                    {formatted.message}
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setIsVisible(false);
                                    setTimeout(onDismiss, 300);
                                }}
                                className={cn(
                                    'shrink-0 rounded-lg p-1 transition-colors',
                                    'hover:bg-black/5 dark:hover:bg-white/5',
                                )}
                                aria-label="Dismiss hint"
                            >
                                <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </div>

                        {/* Progress bar for auto-dismiss */}
                        <motion.div
                            initial={{ scaleX: 1 }}
                            animate={{ scaleX: 0 }}
                            transition={{ duration: autoDismissMs / 1000, ease: 'linear' }}
                            className={cn(
                                'mt-3 h-0.5 rounded-full origin-left',
                                level === 1 && 'bg-blue-300 dark:bg-blue-600',
                                level === 2 && 'bg-amber-300 dark:bg-amber-600',
                                level === 3 && 'bg-rose-300 dark:bg-rose-600',
                            )}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
