-- Per-note / per-beat mistake telemetry for AI recovery generation
alter table public.practice_session_records
  add column if not exists mistake_events jsonb not null default '[]'::jsonb;

comment on column public.practice_session_records.mistake_events is
  'Array of {cursorStep, expectedMidi[], playedMidi, kind, at} for personalized drills';
