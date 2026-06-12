-- 0006_journey_progress.sql
-- Account-synced journey progression: total XP, level, unlocked rewards,
-- selected cosmetics, rhythm tracking, and a write-once activity event log
-- for idempotent XP awarding.

-- ── journey_progress ────────────────────────────────────────────────────

create table if not exists public.journey_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  total_xp integer not null default 0,
  flights_completed integer not null default 0,
  streak integer not null default 0,
  best_rhythm integer not null default 0,
  last_flight_date date,
  unlocked_rewards text[] not null default '{dusk-trainer}',
  selected_theme text,
  selected_plane text,
  selected_title text,
  pause_count integer not null default 0,
  journal_entry_count integer not null default 0,
  migration_complete boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint journey_progress_user_unique unique (user_id)
);

create index if not exists journey_progress_user_idx
  on public.journey_progress (user_id);

alter table public.journey_progress enable row level security;

drop policy if exists "journey_progress_owner_all" on public.journey_progress;
create policy "journey_progress_owner_all"
  on public.journey_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── journey_activity_events (write-once ledger for idempotent XP) ──────

create table if not exists public.journey_activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('preflight','checkpoint','final','mood_checkin','journal_entry')),
  source_id text not null,
  xp_awarded integer not null default 0,
  occurred_at timestamptz not null default now(),

  -- Enforce unique events per source — the client generates a unique
  -- source_id for each action attempt so re-syncs cannot double-award.
  constraint journey_activity_events_source_unique unique (user_id, action, source_id)
);

create index if not exists journey_activity_events_user_occurred_idx
  on public.journey_activity_events (user_id, occurred_at desc);

alter table public.journey_activity_events enable row level security;

drop policy if exists "journey_activity_events_owner_all" on public.journey_activity_events;
create policy "journey_activity_events_owner_all"
  on public.journey_activity_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Trigger to bump journey_progress.updated_at ────────────────────────

drop trigger if exists journey_progress_set_updated_at on public.journey_progress;
create trigger journey_progress_set_updated_at
  before update on public.journey_progress
  for each row execute function public.set_updated_at();
