-- Practice analytics for AI Review (run in Supabase SQL editor or via CLI)
-- Requires auth.users; RLS uses auth.uid().

create table if not exists public.practice_session_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_session_id text not null,
  session_category text not null,
  lesson_uid text not null default '',
  lesson_id text not null default '',
  lesson_title text not null default '',
  lesson_source text not null default '',
  lesson_file text,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_sec int not null,
  attempts int not null default 1,
  score int not null,
  accuracy_pct int,
  correct_notes int,
  incorrect_notes int,
  total_scoreable int,
  tempo_bpm int,
  rhythm_inaccuracy jsonb not null default '[]'::jsonb,
  mistakes jsonb not null default '[]'::jsonb,
  weak_areas jsonb not null default '[]'::jsonb,
  completion_status text not null default 'completed',
  ai_feedback_snapshot jsonb,
  progress_metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, client_session_id)
);

create index if not exists practice_session_records_user_ended_idx
  on public.practice_session_records (user_id, ended_at desc);

alter table public.practice_session_records enable row level security;

create policy "practice_session_records_select_own"
  on public.practice_session_records for select
  using (auth.uid() = user_id);

create policy "practice_session_records_insert_own"
  on public.practice_session_records for insert
  with check (auth.uid() = user_id);

create policy "practice_session_records_update_own"
  on public.practice_session_records for update
  using (auth.uid() = user_id);

create policy "practice_session_records_delete_own"
  on public.practice_session_records for delete
  using (auth.uid() = user_id);
