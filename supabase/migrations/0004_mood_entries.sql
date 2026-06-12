-- 0004_mood_entries.sql
-- Mood check-ins. Multiple entries per day are allowed (no unique index on
-- (user_id, entry_date)). Owner-only RLS.

create table if not exists public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood text not null check (mood in ('stressed','worried','okay','calm','happy')),
  tags text[] not null default '{}',
  journal text not null default '',
  school_load smallint check (school_load is null or school_load between 1 and 5),
  activity_minutes integer check (activity_minutes is null or activity_minutes >= 0),
  day_note text,
  social_interactions jsonb not null default '[]'::jsonb,
  activities jsonb not null default '{}'::jsonb,
  entry_date date not null,
  logged_at timestamptz not null default now()
);

create index if not exists mood_entries_user_logged_at_idx
  on public.mood_entries (user_id, logged_at desc);

create index if not exists mood_entries_user_entry_date_idx
  on public.mood_entries (user_id, entry_date desc);

alter table public.mood_entries enable row level security;

drop policy if exists "mood_entries_owner_all" on public.mood_entries;
create policy "mood_entries_owner_all"
  on public.mood_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
