-- Add 'pending' status for voice call handshake

ALTER TABLE public.voice_sessions
    DROP CONSTRAINT IF EXISTS voice_sessions_status_check;

ALTER TABLE public.voice_sessions
    ADD CONSTRAINT voice_sessions_status_check
    CHECK (status = ANY (ARRAY['pending'::text, 'created'::text, 'connecting'::text, 'active'::text, 'ended'::text, 'failed'::text, 'declined'::text, 'timed_out'::text]));
