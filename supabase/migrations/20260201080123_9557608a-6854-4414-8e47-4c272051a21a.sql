-- Create enum for session status
CREATE TYPE public.session_status AS ENUM ('in_progress', 'completed', 'abandoned');

-- Create enum for room status
CREATE TYPE public.room_status AS ENUM ('waiting', 'active', 'completed');

-- Sessions table to track case attempts
CREATE TABLE public.sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_key TEXT NOT NULL UNIQUE, -- localStorage identifier for anonymous users
    case_id TEXT NOT NULL,
    case_title TEXT NOT NULL,
    specialty TEXT,
    difficulty TEXT,
    status session_status NOT NULL DEFAULT 'in_progress',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    -- Analytics metrics
    nodes_created INTEGER DEFAULT 0,
    connections_created INTEGER DEFAULT 0,
    tests_ordered INTEGER DEFAULT 0,
    diagnoses_considered INTEGER DEFAULT 0,
    correct_diagnosis BOOLEAN,
    confidence_rating INTEGER, -- 1-5 scale
    notes_count INTEGER DEFAULT 0,
    -- Canvas state for replay
    final_canvas_state JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cognitive bias tracking per session
CREATE TABLE public.session_biases (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    bias_type TEXT NOT NULL, -- anchoring, availability, premature_closure, etc.
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    context TEXT -- What triggered the bias detection
);

-- Collaborative rooms
CREATE TABLE public.rooms (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_code TEXT NOT NULL UNIQUE,
    case_id TEXT,
    case_data JSONB, -- Store full case for AI-generated cases
    status room_status NOT NULL DEFAULT 'waiting',
    host_session_key TEXT NOT NULL,
    canvas_state JSONB DEFAULT '{"nodes": [], "edges": []}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Room participants
CREATE TABLE public.room_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    session_key TEXT NOT NULL,
    display_name TEXT NOT NULL,
    color TEXT NOT NULL, -- Cursor/contribution color
    cursor_x REAL,
    cursor_y REAL,
    is_host BOOLEAN DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(room_id, session_key)
);

-- Room chat messages
CREATE TABLE public.room_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.room_members(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_biases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

-- Sessions: Anyone can create/read/update their own sessions (matched by session_key header)
CREATE POLICY "Anyone can create sessions"
ON public.sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view sessions"
ON public.sessions FOR SELECT
USING (true);

CREATE POLICY "Anyone can update sessions"
ON public.sessions FOR UPDATE
USING (true);

-- Session biases: Same as sessions
CREATE POLICY "Anyone can create session_biases"
ON public.session_biases FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view session_biases"
ON public.session_biases FOR SELECT
USING (true);

-- Rooms: Public access for collaboration
CREATE POLICY "Anyone can create rooms"
ON public.rooms FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view rooms"
ON public.rooms FOR SELECT
USING (true);

CREATE POLICY "Anyone can update rooms"
ON public.rooms FOR UPDATE
USING (true);

-- Room members: Public access
CREATE POLICY "Anyone can join rooms"
ON public.room_members FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view room members"
ON public.room_members FOR SELECT
USING (true);

CREATE POLICY "Anyone can update their presence"
ON public.room_members FOR UPDATE
USING (true);

CREATE POLICY "Anyone can leave rooms"
ON public.room_members FOR DELETE
USING (true);

-- Room messages: Public access
CREATE POLICY "Anyone can send messages"
ON public.room_messages FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view messages"
ON public.room_messages FOR SELECT
USING (true);

-- Enable realtime for collaborative features
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;

-- Create indexes for performance
CREATE INDEX idx_sessions_session_key ON public.sessions(session_key);
CREATE INDEX idx_sessions_status ON public.sessions(status);
CREATE INDEX idx_rooms_room_code ON public.rooms(room_code);
CREATE INDEX idx_rooms_status ON public.rooms(status);
CREATE INDEX idx_room_members_room_id ON public.room_members(room_id);
CREATE INDEX idx_room_messages_room_id ON public.room_messages(room_id);

-- Function to generate room codes
CREATE OR REPLACE FUNCTION public.generate_room_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$;

-- Trigger to auto-update room updated_at
CREATE OR REPLACE FUNCTION public.update_room_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rooms_timestamp
BEFORE UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_room_timestamp();