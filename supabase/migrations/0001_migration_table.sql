-- 0001_migration_table.sql
-- Bootstrap the Supabase CLI migration tracking table. The CLI writes into
-- this table automatically, but a fresh database needs the table to exist
-- before the first CLI-driven migration can be recorded.

create schema if not exists supabase_migrations;

create table if not exists supabase_migrations.schema_migrations (
  version text primary key,
  statements text[],
  name text,
  created_at timestamptz not null default now()
);

alter table supabase_migrations.schema_migrations enable row level security;
-- No policies: the table is server-side only. The anon/authenticated roles
-- cannot read or write to it.
