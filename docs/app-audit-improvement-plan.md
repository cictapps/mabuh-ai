# Mabuh-ai Audit and Improvement Plan

## Critical Findings

### 1. Privacy disclosures contradict runtime behavior

- The chat policy claims no personal identifiers and temporary chat-only data, but chat requests include display name, recent journals, moods, social interactions, and analytics.
- Mask Mode still sends an authenticated Supabase token, so "No identity" is misleading.
- Consolidate both privacy policies and document the exact payload, retention, provider, region, and deletion behavior.

References:

- `src/screens/PrivacyPolicy.tsx`
- `src/screens/ChatBot.tsx`
- `src/services/chatClient.ts`

### 2. The database schema destroys journal data when rerun

- The "idempotent" installer unconditionally drops `journal_entries`.
- Replace it with versioned, non-destructive Supabase migrations before production use.

Reference: `supabase/schema.sql`

### 3. Crisis and provider data needs a verification system

- Providers are hard-coded as `verified: true` without a source, verification date, or expiry.
- Hotline lists differ between Support Hub and GIS, while "free," "confidential," and "24/7" claims are not traceable.
- Create structured provider records with `sourceUrl`, `region`, `lastVerifiedAt`, `verifiedBy`, and service hours.
- Centralize hotline data and clearly state that local listings currently focus on Panay.

References:

- `src/screens/GISFeature.tsx`
- `src/screens/SupportHub.tsx`

## High-Priority Improvements

### Fix journey streak calculation

The current implementation compares `new Date()` with itself, so streaks never increase. Use `lastFlightDate` and explicitly handle same-day, consecutive-day, and broken streaks.

Reference: `src/lib/journey/useJourneyStore.ts`

### Implement or remove reminders

Settings currently stores reminder preferences but schedules no browser or native notification.

Reference: `src/screens/SettingsScreen.tsx`

### Harden native security

- Enable a restrictive content security policy.
- Remove production access to `http://localhost:*`.
- Bundle Leaflet instead of injecting scripts from `unpkg.com`.
- Store refresh tokens using OS-backed secure storage instead of a regular Tauri store file.

References:

- `src-tauri/tauri.conf.json`
- `src-tauri/capabilities/default.json`
- `src/lib/supabaseStorage.ts`

### Minimize AI payloads

- Require separate informed consent for mood and journal context.
- Omit names and social-contact details by default.
- Trim all journal content.
- Give users a payload preview or context toggle.

### Add deterministic crisis handling

Crisis language should immediately display human-help resources before waiting for the AI server. The repository currently contains policy claims about crisis detection but no verifiable client implementation.

## Quality and UX Work

- Split the 1.04 MB main bundle by lazy-loading GIS, chat, journey, charts, and animation libraries.
- Replace the monolithic GIS component with typed provider data, map adapters, and accessible controls.
- Add focus trapping and focus restoration to custom dialogs.
- Align remaining legacy colors, radii, page wrappers, and typography with `AGENTS.md`.
- Remove unused production dependencies such as server-side Express and CORS packages unless they are intentionally bundled.
- Derive the app version from package or Tauri metadata instead of conflicting hard-coded versions.

## Test Plan

- Add tests for streak transitions, mood and journal CRUD, RLS expectations, account deletion, exports, reminders, and AI-context redaction.
- Add component tests for authentication, check-in saving, journal reflection consent, crisis escalation, and settings.
- Add mobile viewport accessibility tests and an Android smoke test.
- Make `build`, `test`, `lint`, `format:check`, and `cargo check --locked` required CI checks.

## Current Baseline

- Build: passes, with an oversized bundle warning.
- Tests: 25 pass, all confined to `chatClient`.
- Rust check: passes.
- Production dependency audit: zero reported vulnerabilities.
- Lint: fails with 4 errors and 40 warnings.
- Formatting: fails across 78 files.

## Recommended Order

1. Correct privacy, AI consent, and crisis-resource claims.
2. Replace destructive schema setup with migrations.
3. Verify and centralize provider and hotline data.
4. Fix streaks and implement real reminders.
5. Harden Tauri storage, CSP, HTTP permissions, and external assets.
6. Expand tests and enforce CI quality gates.
7. Improve bundle size, accessibility, and design consistency.
