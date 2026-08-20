-- Phase 1: Multilingual support for AI assistant

alter table public.ai_configurations
    add column if not exists preferred_language text not null default 'auto';

comment on column public.ai_configurations.preferred_language is
    'Language code (en, fr, es, auto). auto = detect from customer message.';
