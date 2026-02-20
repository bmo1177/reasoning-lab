-- Create role enum
CREATE TYPE public.app_role AS ENUM ('learner', 'expert', 'admin');

-- Create expert status enum  
CREATE TYPE public.expert_status AS ENUM ('pending', 'approved', 'rejected');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'learner',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    specialty TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expert applications table
CREATE TABLE public.expert_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    qualifications TEXT NOT NULL,
    experience_years INTEGER NOT NULL,
    specialty TEXT NOT NULL,
    reason TEXT NOT NULL,
    status expert_status NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create saved_cases table (for bookmarking)
CREATE TABLE public.saved_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    case_id TEXT NOT NULL,
    case_title TEXT NOT NULL,
    case_data JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, case_id)
);

-- Create research_notes table (markdown files)
CREATE TABLE public.research_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case_solutions table (completed cases for review)
CREATE TABLE public.case_solutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    case_id TEXT NOT NULL,
    case_title TEXT NOT NULL,
    canvas_state JSONB NOT NULL,
    final_diagnosis TEXT,
    confidence_rating INTEGER,
    reflection TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create review_requests table
CREATE TABLE public.review_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solution_id UUID REFERENCES public.case_solutions(id) ON DELETE CASCADE NOT NULL,
    requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create solution_reviews table (comments/ratings)
CREATE TABLE public.solution_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solution_id UUID REFERENCES public.case_solutions(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solution_reviews ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.user_roles 
    WHERE user_id = _user_id 
    ORDER BY 
        CASE role 
            WHEN 'admin' THEN 1 
            WHEN 'expert' THEN 2 
            WHEN 'learner' THEN 3 
        END
    LIMIT 1
$$;

-- Trigger to create profile and learner role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, display_name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), NEW.email);
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'learner');
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_room_timestamp();

CREATE TRIGGER update_research_notes_updated_at
    BEFORE UPDATE ON public.research_notes
    FOR EACH ROW EXECUTE FUNCTION public.update_room_timestamp();

CREATE TRIGGER update_case_solutions_updated_at
    BEFORE UPDATE ON public.case_solutions
    FOR EACH ROW EXECUTE FUNCTION public.update_room_timestamp();

-- RLS Policies

-- user_roles: Users can view their own, admins can view all
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- profiles: Public read, own write
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- expert_applications: Own view, admin manage
CREATE POLICY "Users can view own application" ON public.expert_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create application" ON public.expert_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all applications" ON public.expert_applications FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update applications" ON public.expert_applications FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- saved_cases: Own only
CREATE POLICY "Users can manage own saved cases" ON public.saved_cases FOR ALL USING (auth.uid() = user_id);

-- research_notes: Own manage, public read if is_public
CREATE POLICY "Users can manage own notes" ON public.research_notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public notes are viewable" ON public.research_notes FOR SELECT USING (is_public = true);

-- case_solutions: Own manage, public read if is_public
CREATE POLICY "Users can manage own solutions" ON public.case_solutions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public solutions are viewable" ON public.case_solutions FOR SELECT USING (is_public = true);

-- review_requests: Requester and reviewer can view
CREATE POLICY "Users can view own review requests" ON public.review_requests FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = reviewer_id);
CREATE POLICY "Users can create review requests" ON public.review_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Reviewers can update requests" ON public.review_requests FOR UPDATE USING (auth.uid() = reviewer_id);

-- solution_reviews: Viewable on public solutions, own manage
CREATE POLICY "Reviews on public solutions are viewable" ON public.solution_reviews FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.case_solutions WHERE id = solution_id AND is_public = true));
CREATE POLICY "Users can create reviews" ON public.solution_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users can manage own reviews" ON public.solution_reviews FOR ALL USING (auth.uid() = reviewer_id);