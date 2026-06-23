# More Rewarding Journey Progression

## Summary

Turn Journey into a gentle, account-synced progression system centered on personalization. Students earn capped XP from meaningful actions across Journey, Check-In, and Journal; levels unlock cosmetic rewards; milestones celebrate consistency without penalties or competitive language.

All wellness, pause, crisis-support, and reflection features remain available from level 1.

## Progression System

- Keep levels at `50 XP` each.
- Award XP through an idempotent activity ledger:
  - Preflight: `+3 XP`, once daily.
  - Checkpoint: `+1 XP`, up to three daily.
  - Final reflection: `+5 XP`, once daily.
  - Mood check-in: `+2 XP`, up to two daily.
  - Manual journal entry: `+3 XP`, once daily.
- Do not reward AI use, crisis-support access, repeated breathing taps, or opening screens.
- Prevent XP from manual phase switching and duplicate event submission.
- Show a brief accessible reward toast after earning XP and a larger celebration for level-ups or unlocks.
- At day completion, show an earned-XP summary, mood movement, and newly reached milestones.

## Rewards and Milestones

Use deterministic level unlocks:

| Level | Reward                                 |
| ----- | -------------------------------------- |
| 1     | Dusk sky and Trainer companion         |
| 2     | Dawn sky                               |
| 3     | Cruiser companion                      |
| 4     | Meadow sky                             |
| 5     | "Steady Ground" affirmation pack       |
| 6     | Glider companion                       |
| 7     | Warm amber card accent                 |
| 8     | "Late-Night Kindness" affirmation pack |
| 9     | Soft constellation background          |
| 10    | Custom Journey title selection         |

- Locked cosmetics remain previewable with their level requirement.
- Unlocks never expire and require no currency or purchase.
- Replace static milestone rows with collectible badge cards for first flight, 3, 5, 10, and 25 flights, plus first journal, first pause, and first completed weekly rhythm.
- Track `currentRhythm` and `bestRhythm`; missed days quietly restart the current value without warnings or lost-reward language.
- Pausing awards no XP but contributes to the "Rest is part of the journey" milestone.

## Data and Interfaces

- Add Supabase tables for `journey_progress` and `journey_activity_events`, protected by owner-only RLS.
- Store total XP, level, flights completed, current/best rhythm, last completion date, unlocked reward IDs, and selected cosmetics per account.
- Keep active phase, incomplete checklist state, checkpoint drafts, and trusted emergency contacts device-local.
- Add an atomic `award_journey_activity(action, sourceId, occurredAt)` repository operation that enforces unique events and daily caps.
- Introduce shared types for `JourneyActivityType`, `JourneyReward`, `JourneyMilestone`, and `JourneyProgress`.
- On first synced launch, migrate existing local totals by retaining the greater local/server totals, importing reached flight milestones, and marking migration complete.
- If sync fails, queue the event locally, show the reward optimistically, and reconcile without double-awarding when connectivity returns.

## Test Plan

- Verify XP values, daily caps, duplicate prevention, level boundaries, and multi-level awards.
- Verify whole-app XP is awarded only after successful mood or journal persistence.
- Test reward unlocking, selection restrictions, offline reconciliation, and local-to-cloud migration.
- Test same-day, consecutive-day, missed-day, future-date, and timezone rhythm transitions.
- Confirm phase switching cannot generate XP.
- Confirm support, pause, and crisis resources never require a level.
- Check reward announcements with screen readers and reduced-motion settings.
- Run `npm run build`, `npm test`, `npm run lint`, and relevant Supabase migration/RLS tests.

## Assumptions

- Progression is supportive rather than competitive; there are no leaderboards, penalties, loot mechanics, or paid rewards.
- Existing users retain their current XP and completed-flight totals.
- Cosmetic rewards are the primary incentive, with reflective summaries serving as completion feedback rather than unlock-gated functionality.
