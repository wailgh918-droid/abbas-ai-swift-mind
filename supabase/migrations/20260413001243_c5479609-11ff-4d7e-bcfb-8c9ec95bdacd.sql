
CREATE TABLE public.focus_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 25,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own sessions"
ON public.focus_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
ON public.focus_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view completed sessions for leaderboard"
ON public.focus_sessions FOR SELECT
USING (true);

CREATE INDEX idx_focus_sessions_user ON public.focus_sessions(user_id);
CREATE INDEX idx_focus_sessions_created ON public.focus_sessions(created_at);
