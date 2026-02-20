import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, X, Info, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ConstraintValidation } from '@/services/constraintValidator';

interface ConstraintWarningProps {
  validation: ConstraintValidation;
  onProceed: () => void;
  onChooseAlternative: (alternative?: string) => void;
  className?: string;
}

export function ConstraintWarning({
  validation,
  onProceed,
  onChooseAlternative,
  className,
}: ConstraintWarningProps) {
  const [showRationale, setShowRationale] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (validation.isValid || isDismissed) return null;

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          icon: AlertCircle,
          colors: 'bg-red-50 border-red-300 text-red-900',
          iconColor: 'text-red-600',
          buttonVariant: 'destructive' as const,
          title: 'Critical Safety Concern',
        };
      case 'error':
        return {
          icon: AlertTriangle,
          colors: 'bg-orange-50 border-orange-300 text-orange-900',
          iconColor: 'text-orange-600',
          buttonVariant: 'default' as const,
          title: 'Clinical Error',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          colors: 'bg-yellow-50 border-yellow-300 text-yellow-900',
          iconColor: 'text-yellow-600',
          buttonVariant: 'outline' as const,
          title: 'Clinical Warning',
        };
      default:
        return {
          icon: Info,
          colors: 'bg-blue-50 border-blue-300 text-blue-900',
          iconColor: 'text-blue-600',
          buttonVariant: 'outline' as const,
          title: 'Clinical Note',
        };
    }
  };

  const config = getSeverityConfig(validation.severity);
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn("w-full", className)}
      >
        <Card className={cn("border-2 shadow-lg", config.colors)}>
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className={cn("mt-0.5", config.iconColor)}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold">{config.title}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 -mt-1 -mr-2"
                    onClick={() => setIsDismissed(true)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <p className="mt-1 text-sm opacity-90">
                  {validation.message}
                </p>
              </div>
            </div>

            {/* Rationale (Expandable) */}
            {validation.clinicalRationale && (
              <div className="mt-3">
                <button
                  onClick={() => setShowRationale(!showRationale)}
                  className="flex items-center gap-1 text-sm font-medium opacity-80 hover:opacity-100 transition-opacity"
                >
                  {showRationale ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Hide Clinical Rationale
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show Clinical Rationale
                    </>
                  )}
                </button>
                
                <AnimatePresence>
                  {showRationale && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="mt-2 text-sm opacity-80 border-t border-current border-opacity-20 pt-2">
                        {validation.clinicalRationale}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              {validation.suggestedAlternative && (
                <Button
                  onClick={() => onChooseAlternative(validation.suggestedAlternative)}
                  variant={config.buttonVariant}
                  size="sm"
                  className="gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Choose: {validation.suggestedAlternative}
                </Button>
              )}
              
              <Button
                onClick={onProceed}
                variant="outline"
                size="sm"
                className={cn(
                  "gap-2",
                  validation.severity === 'critical' && 'border-red-300 hover:bg-red-100'
                )}
              >
                Proceed Anyway
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

// Inline version for compact display
interface ConstraintBadgeProps {
  severity: 'safe' | 'warning' | 'error' | 'critical';
  message: string;
  onClick?: () => void;
}

export function ConstraintBadge({ severity, message, onClick }: ConstraintBadgeProps) {
  const getStyles = () => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'error':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getIcon = () => {
    switch (severity) {
      case 'critical':
      case 'error':
        return <AlertCircle className="w-3 h-3" />;
      case 'warning':
        return <AlertTriangle className="w-3 h-3" />;
      default:
        return <Info className="w-3 h-3" />;
    }
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        getStyles(),
        onClick && "cursor-pointer hover:opacity-80"
      )}
    >
      {getIcon()}
      <span className="truncate max-w-[200px]">{message}</span>
    </button>
  );
}

// Toast notification version
interface ConstraintToastProps {
  validation: ConstraintValidation;
  onViewDetails: () => void;
  onDismiss: () => void;
}

export function ConstraintToast({ validation, onViewDetails, onDismiss }: ConstraintToastProps) {
  if (validation.isValid) return null;

  const getIcon = () => {
    switch (validation.severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed bottom-4 right-4 z-50 max-w-sm"
    >
      <Card className="border-l-4 border-l-yellow-500 shadow-xl">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {getIcon()}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Clinical Warning</p>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {validation.message}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-2 shrink-0"
              onClick={onDismiss}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={onViewDetails}>
              View Details
            </Button>
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              Dismiss
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
