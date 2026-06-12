-- 0005_journal_entries.sql
-- Manual journal notes and auto-snapshots from check-ins. The `mask_off`
-- flag marks entries the user explicitly wrote in mask-off mode. Owner-only
-- RLS.

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
