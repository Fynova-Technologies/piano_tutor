-- Per-user instrument and app preference documents (merged with client defaults).
-- Requires auth.users; RLS uses auth.uid().

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table if not exists public.instrument_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists instrument_settings_updated_idx
  on public.instrument_settings (user_id, updated_at desc);

create index if not exists user_preferences_updated_idx
  on public.user_preferences (user_id, updated_at desc);

drop trigger if exists instrument_settings_touch_updated_at on public.instrument_settings;
create trigger instrument_settings_touch_updated_at
  before update on public.instrument_settings
  for each row execute procedure public.touch_updated_at();

drop trigger if exists user_preferences_touch_updated_at on public.user_preferences;
create trigger user_preferences_touch_updated_at
  before update on public.user_preferences
  for each row execute procedure public.touch_updated_at();

alter table public.instrument_settings enable row level security;
alter table public.user_preferences enable row level security;

create policy "instrument_settings_select_own"
  on public.instrument_settings for select
  using (auth.uid() = user_id);

create policy "instrument_settings_insert_own"
  on public.instrument_settings for insert
  with check (auth.uid() = user_id);

create policy "instrument_settings_update_own"
  on public.instrument_settings for update
  using (auth.uid() = user_id);

create policy "instrument_settings_delete_own"
  on public.instrument_settings for delete
  using (auth.uid() = user_id);

create policy "user_preferences_select_own"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "user_preferences_insert_own"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "user_preferences_update_own"
  on public.user_preferences for update
  using (auth.uid() = user_id);

create policy "user_preferences_delete_own"
  on public.user_preferences for delete
  using (auth.uid() = user_id);

comment on table public.instrument_settings is
  'JSON patch merged with client defaults for MIDI, playback, visuals, latency.';
comment on table public.user_preferences is
  'JSON patch merged with client defaults for appearance, learning, notifications.';
