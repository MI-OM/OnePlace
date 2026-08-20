-- Add voice_enabled to ai_configurations for LiveKit voice sessions (F7)

alter table public.ai_configurations
add column if not exists voice_enabled boolean not null default false;

comment on column public.ai_configurations.voice_enabled
  is 'When true, customers can start LiveKit voice sessions with this business.';
