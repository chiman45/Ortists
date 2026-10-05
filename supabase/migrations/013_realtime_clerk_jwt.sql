-- Realtime Authorization for private chat channels.
--
-- Requires the Clerk → Supabase JWT integration (Supabase Third-Party Auth
-- with Clerk, and the `role: "authenticated"` claim on Clerk session tokens —
-- see src/utils/supabase/clerk-client.ts). Once the app subscribes with
-- `private: true`, Supabase evaluates these policies against the user's JWT:
-- only the two participants of a conversation may join `messages:<conv id>`
-- to receive broadcasts / presence or send typing events.
--
-- The server-side REST broadcasts use the service role and bypass RLS.

DROP POLICY IF EXISTS "chat participants can receive" ON realtime.messages;
DROP POLICY IF EXISTS "chat participants can send"    ON realtime.messages;

CREATE POLICY "chat participants can receive"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'messages:%'
  AND EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id::text = split_part(realtime.topic(), ':', 2)
      AND (auth.jwt() ->> 'sub') = ANY (c.participant_ids)   -- Clerk user id
  )
);

CREATE POLICY "chat participants can send"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() LIKE 'messages:%'
  AND EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id::text = split_part(realtime.topic(), ':', 2)
      AND (auth.jwt() ->> 'sub') = ANY (c.participant_ids)
  )
);
