-- MabuhAi — full schema (auth, profile, mood, journal)
-- Run this in the Supabase SQL Editor for a fresh project.
-- This file is idempotent: it can be re-run to upgrade the schema. Old
-- narrow tables (mood_logs and the original journal_entries) are dropped at
-- the top of the script so the new tables can take their place.

-- ════════════════════════════════════════════════════════════════════════════
-- 0. Drop legacy narrow tables so the wider tables below can be created
--    with the same names without conflicts.
-- ════════════════════════════════════════════════════════════════════════════
drop table if exists public.mood_logs cascade;
drop table if exists public.journal_entries cascade;

-- ════════════════════════════════════════════════════════════════════════════
-- 1. Profiles (extends auth.users with app-specific fields)
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles drop column if exists role;
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ════════════════════════════════════════════════════════════════════════════
-- 2. Auto-create a profile row whenever a new auth user signs up.
-- ════════════════════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'display_name', ''),
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Self-service account deletion
create or replace function public.delete_user()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_user() from public;
grant execute on function public.delete_user() to authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 3. Mood entries (multiple check-ins per day are allowed)
-- ════════════════════════════════════════════════════════════════════════════
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

-- Allow multiple check-ins per day: the (user_id, entry_date) unique index
-- is removed.  If you are upgrading an existing project that had the old
-- unique index in place, drop it first:
--   drop index if exists public.mood_entries_user_entry_date_unique;

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

-- ════════════════════════════════════════════════════════════════════════════
-- 4. Journal entries (manual notes; auto-snapshots of check-ins are also stored)
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  body text not null,
  source text not null default 'manual' check (source in ('manual','checkin')),
  mood_entry_id uuid references public.mood_entries(id) on delete cascade,
  mask_off boolean not null default false,
  entry_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists journal_entries_user_created_at_idx
  on public.journal_entries (user_id, created_at desc);

create index if not exists journal_entries_user_entry_date_idx
  on public.journal_entries (user_id, entry_date desc);

alter table public.journal_entries enable row level security;

drop policy if exists "journal_entries_owner_all" on public.journal_entries;
create policy "journal_entries_owner_all"
  on public.journal_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
