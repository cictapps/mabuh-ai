-- Metadata used by Android's local-first synchronization.

alter table public.mood_entries
  add column if not exists updated_at timestamptz not null default now();

alter table public.journal_entries
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists mood_entries_set_updated_at on public.mood_entries;
create trigger mood_entries_set_updated_at
  before update on public.mood_entries
  for each row execute function public.set_updated_at();

drop trigger if exists journal_entries_set_updated_at on public.journal_entries;
create trigger journal_entries_set_updated_at
  before update on public.journal_entries
  for each row execute function public.set_updated_at();

create table if not exists public.wellness_tombstones (
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('mood', 'journal')),
  entity_id uuid not null,
  deleted_at timestamptz not null default now(),
  primary key (user_id, entity_type, entity_id)
);

create index if not exists wellness_tombstones_user_deleted_at_idx
  on public.wellness_tombstones (user_id, deleted_at desc);

alter table public.wellness_tombstones enable row level security;

drop policy if exists "wellness_tombstones_owner_all" on public.wellness_tombstones;
create policy "wellness_tombstones_owner_all"
  on public.wellness_tombstones for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.record_wellness_tombstone()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.wellness_tombstones (user_id, entity_type, entity_id, deleted_at)
  values (old.user_id, tg_argv[0], old.id, now())
  on conflict (user_id, entity_type, entity_id)
  do update set deleted_at = excluded.deleted_at;
  return old;
end;
$$;

drop trigger if exists mood_entries_record_tombstone on public.mood_entries;
create trigger mood_entries_record_tombstone
  after delete on public.mood_entries
  for each row execute function public.record_wellness_tombstone('mood');

drop trigger if exists journal_entries_record_tombstone on public.journal_entries;
create trigger journal_entries_record_tombstone
  after delete on public.journal_entries
  for each row execute function public.record_wellness_tombstone('journal');
