import { useState, useEffect, useRef } from 'react';
import { ThinkAloudNote } from '@/types/case';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PenLine, Clock, Lightbulb, Send, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ThinkAloudPanelProps {
  caseId: string;
  onNotesChange?: (notes: ThinkAloudNote[]) => void;
}

const promptSuggestions = [
  "What's your leading diagnosis right now?",
  "What evidence supports this diagnosis?",
  "What would change your mind?",
  "Are there any red flags you might be missing?",
  "What tests would confirm or rule out your hypothesis?",
];

export function ThinkAloudPanel({ caseId, onNotesChange }: ThinkAloudPanelProps) {
  const [notes, setNotes] = useState<ThinkAloudNote[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [showPrompt, setShowPrompt] = useState(true);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load saved notes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`notes-${caseId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotes(parsed.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) })));
      } catch {
        console.error('Failed to load saved notes');
      }
    }
  }, [caseId]);

  // Save notes to localStorage
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem(`notes-${caseId}`, JSON.stringify(notes));
      onNotesChange?.(notes);
    }
  }, [notes, caseId, onNotesChange]);

  // Rotate prompts
  useEffect(() => {
    const interval = setInterval(() => {
      if (showPrompt) {
        setCurrentPromptIndex((prev) => (prev + 1) % promptSuggestions.length);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [showPrompt]);

  const handleAddNote = () => {
    if (!currentNote.trim()) return;

    const newNote: ThinkAloudNote = {
      id: `note-${Date.now()}`,
      content: currentNote.trim(),
      timestamp: new Date(),
    };

    setNotes((prev) => [...prev, newNote]);
    setCurrentNote('');
    setShowPrompt(false);

    // Scroll to bottom
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <PenLine className="h-4 w-4 text-primary" />
          Think Aloud Notes
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Record your reasoning as you work through the case
        </p>
      </div>

      {/* Empty state or Notes list */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <AnimatePresence mode="popLayout">
          {notes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6"
            >
              <Lightbulb className="h-6 w-6 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm font-medium">No notes yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Use the box below to start documenting your thinking process.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {notes.map((note, index) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="group relative"
                >
                  <div className="rounded-lg border bg-card p-3 pr-8">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimestamp(note.timestamp)}</span>
                      <span className="text-muted-foreground/50">#{index + 1}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 border-t">
        <div className="relative">
          <Textarea
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={showPrompt && notes.length < 3 ? promptSuggestions[currentPromptIndex] : "What are you thinking right now?"}
            className="min-h-[80px] pr-12 resize-none"
          />
          <Button
            size="icon"
            className="absolute bottom-2 right-2 h-8 w-8"
            onClick={handleAddNote}
            disabled={!currentNote.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press Enter to add note, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
