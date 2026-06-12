-- Dual Journey modes and persistent Garden progression.

alter table public.journey_progress
  add column if not exists selected_mode text not null default 'flight'
    check (selected_mode in ('flight', 'garden')),
  add column if not exists mode_date date,
  add column if not exists last_journey_date date,
  add column if not exists garden_phase text not null default 'prepare'
    check (garden_phase in ('prepare', 'growing', 'care', 'reflect', 'rest')),
  add column if not exists garden_plant text not null default 'sunflower'
    check (garden_plant in ('sunflower', 'fern', 'lavender', 'monstera', 'cherry-blossom')),
  add column if not exists garden_stage integer not null default 0
    check (garden_stage between 0 and 7),
  add column if not exists garden_mood text
    check (garden_mood is null or garden_mood in ('stressed', 'worried', 'okay', 'calm', 'happy')),
  add column if not exists last_growth_date date,
  add column if not exists garden_days_completed integer not null default 0,
  add column if not exists plants_completed integer not null default 0;

update public.journey_progress
set
  last_journey_date = coalesce(last_journey_date, last_flight_date),
  unlocked_rewards = case
    when not ('plant-sunflower' = any(unlocked_rewards))
      then array_append(unlocked_rewards, 'plant-sunflower')
    else unlocked_rewards
  end;

alter table public.journey_activity_events
  drop constraint if exists journey_activity_events_action_check;

alter table public.journey_activity_events
  add constraint journey_activity_events_action_check
  check (
    action in (
      'preflight',
      'checkpoint',
      'final',
      'garden_start',
      'garden_care',
      'garden_finish',
      'mood_checkin',
      'journal_entry'
    )
  );
