-- MabuhAi — initial auth & profile schema
-- Run this in the Supabase SQL Editor for a fresh project.

-- 1. Profiles table (extends auth.users with app-specific fields)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles drop column if exists role;

alter table public.profiles enable row level security;

-- Each user can read and update only their own profile.
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

-- 2. Auto-create a profile row whenever a new auth user signs up.
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

-- 2b. Self-service account deletion. The client can call this via
-- supabase.rpc("delete_user") and the auth.users row (plus all rows that
-- cascade from it) will be removed. The session is then invalidated locally.
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

-- 3. Example: journal entries (owner-only)
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  body text not null,
  mask_off boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.journal_entries enable row level security;

drop policy if exists "journal_owner_all" on public.journal_entries;
create policy "journal_owner_all"
  on public.journal_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Example: mood logs (owner-only)
create table if not exists public.mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood smallint not null check (mood between 1 and 5),
  note text,
  logged_at timestamptz not null default now()
);

alter table public.mood_logs enable row level security;

drop policy if exists "mood_owner_all" on public.mood_logs;
create policy "mood_owner_all"
  on public.mood_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
