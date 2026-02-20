/**
 * ECA Chat Panel Component
 * 
 * Collapsible chat panel for the Embedded Conversational Agent (ECA).
 * Renders as a slide-in sheet from the right side of the simulation view.
 * 
 * Features:
 * - Message bubbles with timestamps (ECA + learner)
 * - Typing indicator animation
 * - Markdown rendering in messages
 * - Hint display with severity-coded styling
 * - Accessibility: role="log", aria-live="polite"
 * - Quick-action suggestion chips
 */

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
    MessageCircle,
    Send,
    Bot,
    User,
    Lightbulb,
    AlertTriangle,
    Info,
    Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ======================
// Types
// ======================

export interface EcaMessage {
    id: string;
    role: 'eca' | 'learner' | 'system';
    content: string;
    timestamp: Date;
    /** Optional hint metadata */
    hint?: {
        level: 1 | 2 | 3;
        errorType: string;
        icon: string;
    };
    /** Optional suggestion chips */
    suggestions?: string[];
}

export interface EcaChatPanelProps {
    /** Whether the panel is open */
    isOpen: boolean;
    /** Toggle panel open/closed */
    onOpenChange: (open: boolean) => void;
    /** Chat message history */
    messages: EcaMessage[];
    /** Handle learner sending a message */
    onSendMessage: (message: string) => void;
    /** Handle suggestion chip click */
    onSuggestionClick?: (suggestion: string) => void;
    /** Whether the ECA is currently "typing" */
    isTyping?: boolean;
    /** Current clinical reasoning stage label */
    currentStage?: string;
    /** Number of unread messages (for trigger badge) */
    unreadCount?: number;
    /** Whether chat is disabled (e.g., simulation not active) */
    disabled?: boolean;
}

// ======================
// Sub-components
// ======================

function TypingIndicator() {
    return (
        <div className="flex items-start gap-3 px-4 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                <motion.span
                    className="h-2 w-2 rounded-full bg-muted-foreground/50"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.span
                    className="h-2 w-2 rounded-full bg-muted-foreground/50"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
                <motion.span
                    className="h-2 w-2 rounded-full bg-muted-foreground/50"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                />
            </div>
        </div>
    );
}

function MessageBubble({ message }: { message: EcaMessage }) {
    const isEca = message.role === 'eca';
    const isSystem = message.role === 'system';

    if (isSystem) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center px-4 py-1"
            >
                <span className="text-xs text-muted-foreground italic px-3 py-1 rounded-full bg-muted/50">
                    {message.content}
                </span>
            </motion.div>
        );
    }

    const hintLevelStyles: Record<number, string> = {
        1: 'border-l-4 border-l-blue-400 bg-blue-50/50 dark:bg-blue-950/30',
        2: 'border-l-4 border-l-amber-400 bg-amber-50/50 dark:bg-amber-950/30',
        3: 'border-l-4 border-l-rose-400 bg-rose-50/50 dark:bg-rose-950/30',
    };

    const hintIcon = message.hint ? (
        message.hint.level === 1 ? <Info className="h-3.5 w-3.5 text-blue-500" /> :
            message.hint.level === 2 ? <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> :
                <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
    ) : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
            className={cn(
                'flex items-start gap-3 px-4 py-1.5',
                !isEca && 'flex-row-reverse'
            )}
        >
            {/* Avatar */}
            <div
                className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    isEca ? 'bg-primary/10' : 'bg-emerald-500/10'
                )}
            >
                {isEca ? (
                    <Bot className="h-4 w-4 text-primary" />
                ) : (
                    <User className="h-4 w-4 text-emerald-600" />
                )}
            </div>

            {/* Bubble */}
            <div className={cn('max-w-[80%] space-y-1')}>
                <div
                    className={cn(
                        'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                        isEca
                            ? 'rounded-tl-sm bg-muted text-foreground'
                            : 'rounded-tr-sm bg-primary text-primary-foreground',
                        message.hint && hintLevelStyles[message.hint.level]
                    )}
                >
                    {message.hint && (
                        <div className="flex items-center gap-1.5 mb-1.5">
                            {hintIcon}
                            <span className="text-xs font-medium opacity-80">
                                Hint (Level {message.hint.level})
                            </span>
                        </div>
                    )}
                    {/* Simple markdown-like rendering */}
                    <div className="whitespace-pre-wrap">
                        {message.content.split('**').map((part, i) =>
                            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                        )}
                    </div>
                </div>

                {/* Timestamp */}
                <span className={cn(
                    'text-[10px] text-muted-foreground px-2',
                    !isEca && 'text-right block'
                )}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                {/* Suggestion chips */}
                {message.suggestions && message.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1 px-1">
                        {message.suggestions.map((suggestion, idx) => (
                            <SuggestionChip key={idx} label={suggestion} />
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function SuggestionChip({ label, onClick }: { label: string; onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors cursor-pointer"
        >
            <Sparkles className="h-3 w-3" />
            {label}
        </button>
    );
}

// ======================
// Main Component
// ======================

// ======================
// Main Component
// ======================

export function EcaChatPanel({
    isOpen,
    onOpenChange,
    messages,
    onSendMessage,
    onSuggestionClick,
    isTyping = false,
    currentStage,
    unreadCount = 0,
    disabled = false,
    mode = 'sheet',
}: EcaChatPanelProps & { mode?: 'sheet' | 'embedded' }) {
    const [inputValue, setInputValue] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            const el = scrollRef.current;
            // Small timeout to let animation complete
            setTimeout(() => {
                el.scrollTop = el.scrollHeight;
            }, 100);
        }
    }, [messages.length, isTyping]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const handleSend = useCallback(() => {
        const trimmed = inputValue.trim();
        if (!trimmed || disabled) return;
        onSendMessage(trimmed);
        setInputValue('');
    }, [inputValue, disabled, onSendMessage]);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const ChatContent = (
        <div className="flex flex-col h-full min-h-0 bg-background/50 backdrop-blur-sm">
            {/* Header (Embedded only) */}
            {mode === 'embedded' && (
                <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b bg-card/50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground">Clinical Tutor</h3>
                        <p className="text-xs text-muted-foreground truncate">
                            {currentStage ? `Stage: ${currentStage}` : 'AI Guidance Active'}
                        </p>
                    </div>
                    {isTyping && (
                        <Badge variant="secondary" className="text-[10px] animate-pulse">
                            typing...
                        </Badge>
                    )}
                </div>
            )}

            {/* Messages area */}
            <div
                ref={scrollRef}
                role="log"
                aria-live="polite"
                aria-label="Chat messages"
                className="flex-1 min-h-0 overflow-y-auto py-4 space-y-2 px-2 custom-scrollbar"
            >
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground px-8 text-center opacity-70">
                        <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center">
                            <Bot className="h-6 w-6 text-primary/40" />
                        </div>
                        <p className="text-xs">
                            Checking your clinical decisions...
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((msg) => (
                            <MessageBubble
                                key={msg.id}
                                message={msg}
                            />
                        ))}
                    </>
                )}

                <AnimatePresence>
                    {isTyping && <TypingIndicator />}
                </AnimatePresence>
            </div>

            {/* Input area */}
            <div className="shrink-0 border-t border-border/50 bg-background/80 p-3">
                <div className="flex items-end gap-2">
                    <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={disabled ? 'Chat unavailable' : 'Ask tutor...'}
                        disabled={disabled}
                        rows={1}
                        className={cn(
                            'flex-1 resize-none rounded-xl border bg-muted/50 px-3 py-2 text-sm',
                            'placeholder:text-muted-foreground/60',
                            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            'max-h-32'
                        )}
                        style={{
                            height: 'auto',
                            minHeight: '2.5rem',
                        }}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                        }}
                    />
                    <Button
                        onClick={handleSend}
                        size="icon"
                        className="rounded-xl h-9 w-9 shrink-0"
                        disabled={!inputValue.trim() || disabled}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );

    if (mode === 'embedded') {
        return <div className="h-full min-h-0 border-l border-border/50 bg-card rounded-l-xl overflow-hidden shadow-sm flex flex-col">{ChatContent}</div>;
    }

    return (
        <>
            {/* Floating trigger button */}
            {!isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="fixed bottom-6 right-6 z-40"
                >
                    <Button
                        onClick={() => onOpenChange?.(true)}
                        size="lg"
                        className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-shadow relative"
                        disabled={disabled}
                    >
                        <MessageCircle className="h-6 w-6" />
                        {unreadCount > 0 && (
                            <Badge
                                variant="destructive"
                                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
                            >
                                {unreadCount}
                            </Badge>
                        )}
                    </Button>
                </motion.div>
            )}

            {/* Chat panel */}
            <Sheet open={isOpen} onOpenChange={onOpenChange}>
                <SheetContent
                    side="right"
                    className="w-full sm:max-w-md p-0 flex flex-col"
                >
                    <SheetHeader className="px-4 py-3 border-b bg-gradient-to-r from-primary/5 to-transparent">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                <Bot className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <SheetTitle className="text-base">Clinical Tutor</SheetTitle>
                                <SheetDescription className="text-xs truncate">
                                    {currentStage
                                        ? `Stage: ${currentStage}`
                                        : 'I\'m here to guide your clinical reasoning'}
                                </SheetDescription>
                            </div>
                            {isTyping && (
                                <Badge variant="secondary" className="text-[10px] animate-pulse">
                                    typing...
                                </Badge>
                            )}
                        </div>
                    </SheetHeader>

                    {/* Render specific sheet content if needed, but reusing ChatContent logic implies extraction. 
                        For now, duplicate slightly or wrap. 
                        Actually, ChatContent const above includes wrappers. 
                        Let's extract the internals of ChatContent to be cleaner if we have time, 
                        or just copy-paste the body for the Sheet to ensure full styling.
                    */}

                    {/* Re-implementing body for Sheet to ensure correct styling context */}
                    <div
                        ref={scrollRef}
                        role="log"
                        aria-live="polite"
                        aria-label="Chat messages"
                        className="flex-1 overflow-y-auto py-4 space-y-1"
                    >
                        {/* ... (Same message rendering logic) ... */}
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground px-8 text-center">
                                <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center">
                                    <Bot className="h-8 w-8 text-primary/40" />
                                </div>
                                <p className="text-sm font-medium">
                                    Your clinical tutor is ready
                                </p>
                            </div>
                        ) : (
                            <>
                                {messages.map((msg) => (
                                    <MessageBubble
                                        key={msg.id}
                                        message={msg}
                                    />
                                ))}
                            </>
                        )}
                        <AnimatePresence>
                            {isTyping && <TypingIndicator />}
                        </AnimatePresence>
                    </div>

                    {/* Input for Sheet */}
                    <div className="border-t bg-background p-3">
                        <div className="flex items-end gap-2">
                            <textarea
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={disabled ? 'Chat unavailable' : 'Ask about the case...'}
                                disabled={disabled}
                                rows={1}
                                className="flex-1 resize-none rounded-xl border bg-muted/50 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 disabled:opacity-50 disabled:cursor-not-allowed max-h-32"
                                style={{ height: 'auto', minHeight: '2.5rem' }}
                                onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    target.style.height = 'auto';
                                    target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                                }}
                            />
                            <Button
                                onClick={handleSend}
                                size="icon"
                                className="rounded-xl h-10 w-10 shrink-0"
                                disabled={!inputValue.trim() || disabled}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                </SheetContent>
            </Sheet>
        </>
    );
}
