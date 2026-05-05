
-- 1. focus_sessions: drop overly permissive SELECT, restrict to owner
DROP POLICY IF EXISTS "Everyone can view completed sessions for leaderboard" ON public.focus_sessions;
CREATE POLICY "Users can view their own sessions"
ON public.focus_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. user_ranks: prevent users from manipulating their own points/counters
DROP POLICY IF EXISTS "Users can update their own ranks" ON public.user_ranks;

-- 3. storage.objects: restrict listing of avatars bucket to owner only
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Users can list their own avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 4. Revoke EXECUTE on SECURITY DEFINER trigger function from API roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
