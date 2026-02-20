import { useState, useRef, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { TeamMessage, TeamMember } from '@/types/simulation';
import { cn } from '@/lib/utils';

interface TeamChatProps {
  messages: TeamMessage[];
  members: TeamMember[];
  currentMemberId: string;
  onSendMessage: (message: string) => void;
}

export function TeamChat({ messages, members, currentMemberId, onSendMessage }: TeamChatProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  // Auto-scroll on new messages
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <h3 className="font-semibold text-sm">Team Chat</h3>
        <div className="flex flex-wrap gap-1 mt-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
              style={{ backgroundColor: `${member.color}20`, color: member.color }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: member.color }}
              />
              {member.displayName}
              {member.isHost && <span className="text-[10px] opacity-70">(host)</span>}
            </div>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.memberId === currentMemberId;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex flex-col',
                    isOwn ? 'items-end' : 'items-start'
                  )}
                >
                  {!isOwn && (
                    <span
                      className="text-xs font-medium mb-0.5"
                      style={{ color: msg.memberColor }}
                    >
                      {msg.memberName}
                    </span>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {msg.message}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-3 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
