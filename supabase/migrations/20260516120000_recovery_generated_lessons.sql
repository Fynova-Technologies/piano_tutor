-- AI Mistake Recovery: persisted generated MusicXML drills (cache + history)
create table if not exists public.recovery_generated_lessons (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_lesson_uid text not null,
  source_lesson_title text not null default '',
  source_lesson_source text not null default '',
  title text not null default 'Recovery drill',
  music_xml text not null,
  mistake_snapshot jsonb not null default '{}'::jsonb,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists recovery_generated_lessons_user_created_idx
  on public.recovery_generated_lessons (user_id, created_at desc);

alter table public.recovery_generated_lessons enable row level security;

create policy "recovery_generated_lessons_select_own"
  on public.recovery_generated_lessons for select
  using (auth.uid() = user_id);

create policy "recovery_generated_lessons_insert_own"
  on public.recovery_generated_lessons for insert
  with check (auth.uid() = user_id);

create policy "recovery_generated_lessons_delete_own"
  on public.recovery_generated_lessons for delete
  using (auth.uid() = user_id);
