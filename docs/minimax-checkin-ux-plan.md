# Check-In UX Improvement Plan for MiniMax AI

## Summary

Redesign the check-in screen into a progressive-card flow: mood selection stays primary, essential inputs remain immediately available, and long optional sections become compact expandable cards. Users can still interact with every component, but the default screen avoids exposing all activities, social fields, suggestions, and custom inputs at once.

## Key Changes

- Keep the top mood arc, mood label, crisis hint, and sticky save bar.
- Replace the long detail stack with compact cards:
  - `Today's load`: expanded by default after mood selection.
  - `Words / tags`: compact tag preview plus journal entry.
  - `Activities`: collapsed by default, showing selected count and selected chips.
  - `Social`: collapsed by default, showing tracked-person count and summary.
  - `Suggestions`: collapsed by default, showing one small recommendation preview.
- Each card header should show icon, title, optional/filled state, count/summary, and expand/collapse affordance.
- Allow only one heavy optional card expanded at a time for `Activities`, `Social`, and `Suggestions` to prevent stacked long content.
- Preserve all existing state, callbacks, save behavior, keyboard shortcut, and journal persistence.

## Implementation Details

- Add a reusable `CheckInDetailCard` component local to `src/screens/CheckInScreen.tsx` or in `src/components/mood/` if preferred later.
- Add local state for expanded cards, e.g. `expandedCard`, with these defaults:
  - `load` open after mood selection.
  - `tagsJournal` open.
  - `activities`, `social`, and `suggestions` collapsed.
- Update `ActivitySectionsPanel` so collapsed mode shows only selected activity summaries; expanded mode shows all seven categories and custom inputs.
- Update `SocialTrackingPanel` so collapsed mode shows empty-state summary or existing people summaries; expanded mode shows full add/edit controls.
- Keep the sticky save bar visible and simplify the helper text so it does not imply users must scroll upward.

## Test Plan

- Verify selecting a mood reveals compact detail cards without a long immediate scroll.
- Verify expanding and collapsing each card preserves entered values.
- Verify activity selections, custom activities, social interactions, journal text, load, and day note still save correctly.
- Verify sticky save works from any scroll position.
- Run `npm run build`.
- If the existing test setup supports it, run the current test command before final handoff.

## Assumptions

- The goal is to reduce default scroll length, not remove any existing check-in fields.
- Progressive cards are preferred over a wizard or tabs.
- Existing visual style should be preserved rather than redesigned from scratch.
