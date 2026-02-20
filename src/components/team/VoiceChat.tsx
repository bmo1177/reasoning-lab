import { useState, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface VoiceChatProps {
  onTranscript?: (text: string, role: 'user' | 'agent') => void;
  className?: string;
}

export function VoiceChat({ onTranscript, className }: VoiceChatProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const conversation = useConversation({
    onConnect: () => {
      toast.success('Voice chat connected');
    },
    onDisconnect: () => {
      toast.info('Voice chat disconnected');
    },
    onMessage: (payload) => {
      // payload has { message, source, role }
      onTranscript?.(payload.message, payload.role);
    },
    onError: (error) => {
      console.error('Voice chat error:', error);
      toast.error('Voice chat error occurred');
    },
  });

  const startVoiceChat = useCallback(async () => {
    setIsConnecting(true);
    
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Get token from edge function
      const { data, error } = await supabase.functions.invoke('voice-token', {
        body: {},
      });
      
      if (error || !data?.token) {
        throw new Error(error?.message || 'Failed to get voice token');
      }
      
      // Start the conversation with signed URL
      await conversation.startSession({
        signedUrl: data.token,
      });
    } catch (err) {
      console.error('Failed to start voice chat:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to start voice chat');
    } finally {
      setIsConnecting(false);
    }
  }, [conversation]);

  const stopVoiceChat = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      conversation.setVolume({ volume: 1 });
    } else {
      conversation.setVolume({ volume: 0 });
    }
    setIsMuted(!isMuted);
  }, [conversation, isMuted]);

  const isConnected = conversation.status === 'connected';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {isConnected ? (
        <>
          <Button
            variant="destructive"
            size="sm"
            onClick={stopVoiceChat}
            className="gap-2"
          >
            <MicOff className="h-4 w-4" />
            End Voice
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={toggleMute}
            className="h-8 w-8"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>

          {conversation.isSpeaking && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Speaking...
            </span>
          )}
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={startVoiceChat}
          disabled={isConnecting}
          className="gap-2"
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              Voice Chat
            </>
          )}
        </Button>
      )}
    </div>
  );
}
