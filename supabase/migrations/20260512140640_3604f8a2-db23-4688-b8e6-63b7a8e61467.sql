
-- Remove client-side INSERT on user_ranks (initial row created by handle_new_user trigger)
DROP POLICY IF EXISTS "Users can insert their own ranks" ON public.user_ranks;

-- Scope focus_sessions write policies to authenticated role
DROP POLICY IF EXISTS "Users can create their own sessions" ON public.focus_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.focus_sessions;

CREATE POLICY "Users can create their own sessions"
ON public.focus_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
ON public.focus_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
