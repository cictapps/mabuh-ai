-- 0008_delete_user_data.sql
-- Self-service "delete all my data" function. Wipes every user-scoped row
-- (mood_entries, journal_entries, journey_progress, journey_activity_events)
-- and resets the profile display name, while keeping the auth.users account
-- intact. The client calls this via Supabase RPC.

create or replace function public.delete_user_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.journal_entries where user_id = current_user_id;
  delete from public.mood_entries where user_id = current_user_id;
  delete from public.journey_activity_events where user_id = current_user_id;
  delete from public.journey_progress where user_id = current_user_id;
  update public.profiles
    set display_name = null
    where id = current_user_id;
end;
$$;

revoke all on function public.delete_user_data() from public;
grant execute on function public.delete_user_data() to authenticated;
