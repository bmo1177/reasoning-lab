import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TeamMember, TeamMessage, CanvasState } from '@/types/simulation';

const MEMBER_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

function getRandomColor(): string {
  return MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)];
}

function getSessionKey(): string {
  let key = localStorage.getItem('session-key');
  if (!key) {
    key = `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem('session-key', key);
  }
  return key;
}

interface UseTeamRoomOptions {
  /** If provided, auto-reconnect to this room on mount */
  initialRoomId?: string;
}

interface UseTeamRoomReturn {
  // Room state
  roomId: string | null;
  roomCode: string | null;
  roomStatus: 'waiting' | 'active' | 'completed' | null;
  isHost: boolean;
  
  // Members
  members: TeamMember[];
  currentMember: TeamMember | null;
  
  // Messages
  messages: TeamMessage[];
  sendMessage: (text: string) => Promise<void>;
  
  // Canvas state
  canvasState: CanvasState | null;
  updateCanvasState: (state: CanvasState) => Promise<void>;
  
  // Case data
  caseData: Record<string, unknown> | null;
  setCaseData: (data: Record<string, unknown>) => Promise<void>;
  
  // Actions
  createRoom: (displayName: string) => Promise<string | null>;
  joinRoom: (code: string, displayName: string) => Promise<boolean>;
  reconnectToRoom: (roomId: string) => Promise<boolean>;
  leaveRoom: () => Promise<void>;
  startSession: () => Promise<void>;
  
  // Cursor tracking
  updateCursor: (x: number, y: number) => void;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
}

export function useTeamRoom(options?: UseTeamRoomOptions): UseTeamRoomReturn {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomStatus, setRoomStatus] = useState<'waiting' | 'active' | 'completed' | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentMember, setCurrentMember] = useState<TeamMember | null>(null);
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [canvasState, setCanvasState] = useState<CanvasState | null>(null);
  const [caseData, setCaseDataState] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = useRef<any>(null);
  const presenceChannelRef = useRef<any>(null);
  const cursorThrottleRef = useRef<number>(0);
  const hasReconnectedRef = useRef(false);
  const sessionKey = getSessionKey();

  // Cleanup function
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (presenceChannelRef.current) {
      supabase.removeChannel(presenceChannelRef.current);
      presenceChannelRef.current = null;
    }
  }, []);

  // Subscribe to room changes
  const subscribeToRoom = useCallback((roomIdToSubscribe: string) => {
    cleanup();
    
    // Subscribe to room updates
    channelRef.current = supabase
      .channel(`room:${roomIdToSubscribe}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomIdToSubscribe}` },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const room = payload.new as any;
            setRoomStatus(room.status);
            setCanvasState(room.canvas_state);
            setCaseDataState(room.case_data);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomIdToSubscribe}` },
        async () => {
          // Refresh members list
          const { data } = await supabase
            .from('room_members')
            .select('*')
            .eq('room_id', roomIdToSubscribe)
            .order('joined_at', { ascending: true });
          
          if (data) {
            setMembers(data.map(m => ({
              id: m.id,
              displayName: m.display_name,
              color: m.color,
              isHost: m.is_host || false,
              cursorPosition: m.cursor_x && m.cursor_y ? { x: m.cursor_x, y: m.cursor_y } : undefined,
              lastSeenAt: new Date(m.last_seen_at),
            })));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${roomIdToSubscribe}` },
        async (payload) => {
          const msg = payload.new as any;
          // Get member info
          const { data: member } = await supabase
            .from('room_members')
            .select('display_name, color')
            .eq('id', msg.member_id)
            .single();
          
          if (member) {
            setMessages(prev => [...prev, {
              id: msg.id,
              roomId: msg.room_id,
              memberId: msg.member_id,
              memberName: member.display_name,
              memberColor: member.color,
              message: msg.message,
              createdAt: new Date(msg.created_at),
            }]);
          }
        }
      )
      .subscribe();

    // Subscribe to presence for cursor updates
    presenceChannelRef.current = supabase.channel(`presence:${roomIdToSubscribe}`);
    
    presenceChannelRef.current
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannelRef.current.presenceState();
        // Update cursor positions from presence
        const cursors: Record<string, { x: number; y: number }> = {};
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.cursor_x && presence.cursor_y) {
              cursors[presence.member_id] = { x: presence.cursor_x, y: presence.cursor_y };
            }
          });
        });
        
        setMembers(prev => prev.map(m => ({
          ...m,
          cursorPosition: cursors[m.id] || m.cursorPosition,
        })));
      })
      .subscribe();
  }, [cleanup]);

  // Reconnect to an existing room by roomId (used when navigating to TeamSession)
  const reconnectToRoom = useCallback(async (targetRoomId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch room data
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', targetRoomId)
        .single();
      
      if (roomError || !roomData) {
        throw new Error('Room not found.');
      }
      
      // Find our member record
      const { data: memberData, error: memberError } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', targetRoomId)
        .eq('session_key', sessionKey)
        .single();
      
      if (memberError || !memberData) {
        throw new Error('You are not a member of this room.');
      }
      
      // Update last_seen
      await supabase
        .from('room_members')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', memberData.id);
      
      // Load all members
      const { data: allMembers } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', targetRoomId)
        .order('joined_at', { ascending: true });
      
      if (allMembers) {
        setMembers(allMembers.map(m => ({
          id: m.id,
          displayName: m.display_name,
          color: m.color,
          isHost: m.is_host || false,
          cursorPosition: m.cursor_x && m.cursor_y ? { x: m.cursor_x, y: m.cursor_y } : undefined,
          lastSeenAt: new Date(m.last_seen_at),
        })));
      }
      
      // Load existing messages
      const { data: messagesData } = await supabase
        .from('room_messages')
        .select('*, room_members!inner(display_name, color)')
        .eq('room_id', targetRoomId)
        .order('created_at', { ascending: true });
      
      if (messagesData) {
        setMessages(messagesData.map((m: { id: string; room_id: string; member_id: string; room_members: { display_name: string; color: string }; message: string; created_at: string }) => ({
          id: m.id,
          roomId: m.room_id,
          memberId: m.member_id,
          memberName: m.room_members.display_name,
          memberColor: m.room_members.color,
          message: m.message,
          createdAt: new Date(m.created_at),
        })));
      }
      
      setRoomId(roomData.id);
      setRoomCode(roomData.room_code);
      setRoomStatus(roomData.status);
      setCanvasState(roomData.canvas_state as CanvasState | null);
      setCaseDataState(roomData.case_data as Record<string, unknown> | null);
      setIsHost(roomData.host_session_key === sessionKey);
      setCurrentMember({
        id: memberData.id,
        displayName: memberData.display_name,
        color: memberData.color,
        isHost: memberData.is_host || false,
        lastSeenAt: new Date(),
      });
      
      subscribeToRoom(roomData.id);
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reconnect to room';
      setError(message);
      console.error('Reconnect error:', message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionKey, subscribeToRoom]);

  // Auto-reconnect on mount if initialRoomId is provided
  useEffect(() => {
    if (options?.initialRoomId && !hasReconnectedRef.current && !roomId) {
      hasReconnectedRef.current = true;
      reconnectToRoom(options.initialRoomId);
    }
  }, [options?.initialRoomId, roomId, reconnectToRoom]);

  // Create room
  const createRoom = useCallback(async (displayName: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate room code using database function
      const { data: codeData, error: codeError } = await supabase.rpc('generate_room_code');
      if (codeError) throw codeError;
      
      const newRoomCode = codeData as string;
      
      // Create room
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert({
          room_code: newRoomCode,
          host_session_key: sessionKey,
          status: 'waiting',
        })
        .select()
        .single();
      
      if (roomError) throw roomError;
      
      // Create host member
      const { data: memberData, error: memberError } = await supabase
        .from('room_members')
        .insert({
          room_id: roomData.id,
          session_key: sessionKey,
          display_name: displayName,
          color: getRandomColor(),
          is_host: true,
        })
        .select()
        .single();
      
      if (memberError) throw memberError;
      
      setRoomId(roomData.id);
      setRoomCode(newRoomCode);
      setRoomStatus('waiting');
      setIsHost(true);
      setCurrentMember({
        id: memberData.id,
        displayName: memberData.display_name,
        color: memberData.color,
        isHost: true,
        lastSeenAt: new Date(),
      });
      
      subscribeToRoom(roomData.id);
      
      toast.success(`Room created! Code: ${newRoomCode}`);
      return newRoomCode;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create room';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionKey, subscribeToRoom]);

  // Join room
  const joinRoom = useCallback(async (code: string, displayName: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Find room by code
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', code.toUpperCase())
        .single();
      
      if (roomError || !roomData) {
        throw new Error('Room not found. Check the code and try again.');
      }
      
      if (roomData.status === 'completed') {
        throw new Error('This room session has ended.');
      }
      
      // Check if already a member
      const { data: existingMember } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', roomData.id)
        .eq('session_key', sessionKey)
        .single();
      
      let memberData;
      
      if (existingMember) {
        // Update existing member
        const { data, error } = await supabase
          .from('room_members')
          .update({ display_name: displayName, last_seen_at: new Date().toISOString() })
          .eq('id', existingMember.id)
          .select()
          .single();
        
        if (error) throw error;
        memberData = data;
      } else {
        // Create new member
        const { data, error } = await supabase
          .from('room_members')
          .insert({
            room_id: roomData.id,
            session_key: sessionKey,
            display_name: displayName,
            color: getRandomColor(),
            is_host: false,
          })
          .select()
          .single();
        
        if (error) throw error;
        memberData = data;
      }
      
      // Load existing messages
      const { data: messagesData } = await supabase
        .from('room_messages')
        .select('*, room_members!inner(display_name, color)')
        .eq('room_id', roomData.id)
        .order('created_at', { ascending: true });
      
      if (messagesData) {
        setMessages(messagesData.map((m: { id: string; room_id: string; member_id: string; room_members: { display_name: string; color: string }; message: string; created_at: string }) => ({
          id: m.id,
          roomId: m.room_id,
          memberId: m.member_id,
          memberName: m.room_members.display_name,
          memberColor: m.room_members.color,
          message: m.message,
          createdAt: new Date(m.created_at),
        })));
      }
      
      setRoomId(roomData.id);
      setRoomCode(roomData.room_code);
      setRoomStatus(roomData.status);
      setCanvasState(roomData.canvas_state as CanvasState | null);
      setCaseDataState(roomData.case_data as Record<string, unknown> | null);
      setIsHost(roomData.host_session_key === sessionKey);
      setCurrentMember({
        id: memberData.id,
        displayName: memberData.display_name,
        color: memberData.color,
        isHost: memberData.is_host || false,
        lastSeenAt: new Date(),
      });
      
      subscribeToRoom(roomData.id);
      
      toast.success('Joined room successfully!');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join room';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionKey, subscribeToRoom]);

  // Leave room
  const leaveRoom = useCallback(async () => {
    if (!roomId || !currentMember) return;
    
    try {
      await supabase
        .from('room_members')
        .delete()
        .eq('id', currentMember.id);
      
      cleanup();
      setRoomId(null);
      setRoomCode(null);
      setRoomStatus(null);
      setIsHost(false);
      setMembers([]);
      setCurrentMember(null);
      setMessages([]);
      setCanvasState(null);
      setCaseDataState(null);
      hasReconnectedRef.current = false;
      
      toast.success('Left room');
    } catch (err) {
      console.error('Error leaving room:', err);
    }
  }, [roomId, currentMember, cleanup]);

  // Start session
  const startSession = useCallback(async () => {
    if (!roomId || !isHost) return;
    
    try {
      await supabase
        .from('rooms')
        .update({ status: 'active' })
        .eq('id', roomId);
      
      toast.success('Session started!');
    } catch (err) {
      toast.error('Failed to start session');
    }
  }, [roomId, isHost]);

  // Send message
  const sendMessage = useCallback(async (text: string) => {
    if (!roomId || !currentMember || !text.trim()) return;
    
    try {
      await supabase
        .from('room_messages')
        .insert({
          room_id: roomId,
          member_id: currentMember.id,
          message: text.trim(),
        });
    } catch (err) {
      toast.error('Failed to send message');
    }
  }, [roomId, currentMember]);

  // Update canvas state
  const updateCanvasState = useCallback(async (state: any) => {
    if (!roomId) return;
    
    try {
      await supabase
        .from('rooms')
        .update({ canvas_state: state })
        .eq('id', roomId);
    } catch (err) {
      console.error('Failed to update canvas state:', err);
    }
  }, [roomId]);

  // Set case data
  const setCaseData = useCallback(async (data: any) => {
    if (!roomId) return;
    
    try {
      await supabase
        .from('rooms')
        .update({ case_data: data, case_id: data?.id })
        .eq('id', roomId);
    } catch (err) {
      console.error('Failed to set case data:', err);
    }
  }, [roomId]);

  // Update cursor position
  const updateCursor = useCallback((x: number, y: number) => {
    if (!presenceChannelRef.current || !currentMember) return;
    
    const now = Date.now();
    if (now - cursorThrottleRef.current < 50) return; // Throttle to 20fps
    cursorThrottleRef.current = now;
    
    presenceChannelRef.current.track({
      member_id: currentMember.id,
      cursor_x: x,
      cursor_y: y,
    });
  }, [currentMember]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Heartbeat to update last_seen_at
  useEffect(() => {
    if (!currentMember) return;
    
    const interval = setInterval(async () => {
      await supabase
        .from('room_members')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', currentMember.id);
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [currentMember]);

  return {
    roomId,
    roomCode,
    roomStatus,
    isHost,
    members,
    currentMember,
    messages,
    sendMessage,
    canvasState,
    updateCanvasState,
    caseData,
    setCaseData,
    createRoom,
    joinRoom,
    reconnectToRoom,
    leaveRoom,
    startSession,
    updateCursor,
    isLoading,
    error,
  };
}
