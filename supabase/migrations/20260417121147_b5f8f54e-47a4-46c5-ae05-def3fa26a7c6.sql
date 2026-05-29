
-- Tighten waitlist: only allow public to insert, no one can read except service role
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
CREATE POLICY "Public can submit waitlist" ON public.waitlist
  FOR INSERT TO anon, authenticated
  WITH CHECK (email IS NOT NULL AND char_length(email) BETWEEN 3 AND 320);
