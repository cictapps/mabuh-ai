# Agent Guidance for MabuhAi

## Product Context

- MabuhAi is built for **students**. UX decisions are optimised for student reflection, academic stress, late-night use, and **mobile-first** access.
- Tone: warm, non-clinical, supportive, non-judgmental.
- Mental-health features are supportive wellness tools — **not** replacements for licensed professional care.

## Support Data Scope

- Local support-provider data is currently scoped to the **Panay region**. Do **not** present the database as complete national coverage.
- Design support/resource code so additional regions and providers can be added without hard-coding Panay as the final scope.
- National hotlines may still appear where already included; local-locator copy should make clear that local listings are currently limited.
- Source-verifiable, structured provider records live in `src/data/providers.ts`.

## Stack & Layout

- **Frontend:** React 19 + TypeScript 5.8 + Vite 7 + Tailwind CSS v4.
- **App shell:** Tauri 2 (mobile-first; see `src-tauri/`).
- **State:** Zustand stores (auth, journey, onboarding, mood). No Redux/TanStack Query — see `.github/copilot-instructions.md` is partially aspirational; treat this file as the source of truth.
- **Routing:** React Router 7. `src/main.tsx` owns the routes; `src/App.tsx` is the protected shell that manages hub switching.
- **Backend:** Supabase (auth, Postgres with RLS). Migrations in `supabase/migrations/` — apply with `supabase db push`.
- **Path alias:** `@/*` → `./src/*` (both `tsconfig.json` and `vite.config.ts`).
- **Animations:** framer-motion + GSAP. Always honour `prefers-reduced-motion`.

### Where things live

| Path                        | Purpose                                                                                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/main.tsx`              | Route definitions, lazy-loaded auth/legal pages, splash reveal.                                                                                             |
| `src/App.tsx`               | Protected shell, nav state, pull-to-refresh, hub switching (`checkin` / `review` / `journey` / `support` / `settings`).                                     |
| `src/screens/`              | Top-level feature screens (`CheckInScreen`, `ReviewHub`, `SupportHub`, `JourneyScreen`, `SettingsScreen`, …). Some are lazy-loaded.                         |
| `src/pages/`                | Standalone pages — `auth/*` (`AuthPage`, `AuthCallback`, `ResetPassword`) and `legal/*` (`PrivacyPolicyPage`, `TermsAndConditionsPage`).                    |
| `src/components/<feature>/` | Feature components grouped by area (`mood`, `journey`, `chatbot-components`, `history`, `insights`, `journal`, `suggestions`, `analytics`, `shared`, `ui`). |
| `src/components/ui/`        | shadcn-style primitives (`button`, `card`, `dialog`, `alert`, `alert-dialog`, `input`).                                                                     |
| `src/hooks/`                | Top-level hooks: `useMoodStore`, `useOnboarding`.                                                                                                           |
| `src/lib/auth/`             | Zustand auth store, `ProtectedRoute`, native OAuth, `deleteUserData`.                                                                                       |
| `src/lib/db/`               | Offline-first `moodRepository` + `localWellnessDb` (syncs to Supabase).                                                                                     |
| `src/lib/journey/`          | Gamification store + XP rules.                                                                                                                              |
| `src/services/`             | Network clients: `chatClient`, `achievementCardClient`, `reflect`.                                                                                          |
| `src/data/`                 | Static content: moods, suggestions, providers, insights.                                                                                                    |
| `src/types/index.ts`        | Shared TS types (`ScreenId`, `MoodType`, …).                                                                                                                |
| `supabase/migrations/`      | Versioned SQL migrations `0001`…`0009`. `schema.sql` is a backward-compat no-op.                                                                            |
| `src-tauri/`                | Rust shell + Tauri config. See **Tauri Quirks** below.                                                                                                      |

## Commands

Run from repo root. CI (`.github/workflows/ci.yml`) runs in this order: **format → lint → typecheck → test → build**.

| Command                           | Purpose                                                                                                   |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `npm install`                     | Install JS deps.                                                                                          |
| `npm run dev`                     | Vite dev server (port 5173).                                                                              |
| `npm run tauri dev`               | Tauri dev — runs Vite on port **1420** internally, then launches the Rust app. Primary mobile/dev target. |
| `npm run build`                   | `tsc && vite build`. Emits to `dist/` and always writes `dist/bundle-report.html` (rollup visualizer).    |
| `npm run analyze`                 | Same as build but `--mode analyze`.                                                                       |
| `npm run preview`                 | Serve the built `dist/` locally.                                                                          |
| `npm test`                        | Vitest single run (node env, `clearMocks: true`).                                                         |
| `npm run test:watch`              | Vitest watch mode.                                                                                        |
| `npm run lint` / `lint:fix`       | ESLint 9 flat config.                                                                                     |
| `npm run format` / `format:check` | Prettier (2-space, `"` quotes, trailing commas, `printWidth: 90`).                                        |
| `npm run typecheck`               | `tsc --noEmit`.                                                                                           |

Single test file: `npx vitest run src/lib/journey/xp.test.ts`.

## Environment

`.env` is gitignored; copy `.env.example`. The Supabase client **throws on first import** if either of these is missing:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Optional but commonly needed:

- `VITE_AUTH_GOOGLE_ENABLED=true|false`
- `VITE_GOOGLE_WEB_CLIENT_ID` / `VITE_GOOGLE_IOS_CLIENT_ID` (native Google sign-in on Tauri).
- `VITE_CHAT_SERVER_URL` — blank falls back to the bundled Render URL hard-coded in `src/services/chatClient.ts`.

Tauri-side runtime needs Rust + the Tauri 2 CLI. Android target additionally needs the Android SDK/NDK (see `DEPLOY.md`).

## Tauri Quirks (do not silently break these)

- Dev server **must** bind `localhost:1420` (`strictPort: true`). Pick a free port if 1420 is taken, don't relax `strictPort`.
- Vite watcher uses **polling** (`usePolling: true`) to avoid ENOSPC on environments with a low native watcher limit. Keep it on.
- `src-tauri/` is excluded from the Vite watcher — edits there don't HMR; restart `tauri dev`.
- Tauri injects `Referrer-Policy: no-referrer-when-downgrade` on dev responses so the Android WebView keeps cross-origin paths.
- `TAURI_DEV_HOST` env var switches HMR to `ws://<host>:1421` for remote device dev.
- Supabase sessions in Tauri use `LazyStore` (`src/lib/supabaseStorage.ts`), not `localStorage`.
- Network calls in Tauri go through `@tauri-apps/plugin-http` (`src/lib/http.ts`) to bypass WebView CORS. The `src/lib/http.ts` `getHttpFetch` helper auto-picks Tauri fetch vs `window.fetch`.
- Capability allow-lists in `src-tauri/capabilities/default.json` restrict HTTP to the chat server + Supabase + Google APIs, and FS writes to `$DOWNLOAD/mabuh-ai-quiet-win-*.png` (achievement card). **Add new URLs/paths there before using them in code.**
- Deep-link scheme: `mabuhai://` (mobile). Callback routes expect `/auth/callback` and `/auth/reset` on web.
- `src-tauri/gen/` is Tauri-generated (Android project + capability schemas). Don't hand-edit; regenerate via the Tauri CLI.
- `src-tauri/target/` is the Rust build cache; safe to delete to rebuild from scratch.
- CSP is locked in `src-tauri/tauri.conf.json`; new external hosts need both CSP and capability entries.

## Mobile-first Behaviour

- `<meta name="viewport" ... viewport-fit=cover, user-scalable=no>` in `index.html` — keep it.
- App container is `max-width: 430px` (`src/App.tsx`). Don't widen for desktop.
- Use `env(safe-area-inset-*)` for top/bottom padding; the standard screen recipe adds `paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)"`.
- Bottom nav hides on `Support → Chat` view.
- Splash hides until the `app-ready` class lands (`src/main.tsx` delays it on protected routes to avoid flash).
- Build for mobile via `npm run tauri build` (Android/iOS specifics in `DEPLOY.md`).

## Tests

- Vitest in **node** environment with `clearMocks: true`, `globals: false`. Import from `vitest` directly (`describe`, `it`, `expect`, `vi`).
- Test files match `src/**/*.test.ts` / `*.test.tsx` (already shipped tests live next to the code they cover).
- ESLint auto-adds Vitest globals for `*.test.ts(x)` files — don't redeclare them.
- HTTP calls in tests stub via `setHttpFetchForTests()` (`src/lib/http.ts`).
- CI uses dummy `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` so the build doesn't need a real Supabase project.

## UI Design System (Journey-style)

All major screens (Check-In, Review, Journey, Support hub, Settings header) share one visual language. The broader editorial philosophy lives in `DESIGN.md`; the recipes below are the enforceable tokens.

### 1. Page wrapper

Every screen root:

```
className="screen-enter relative flex w-full flex-col gap-4 px-4 pb-12 pt-5"
style={{
  paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)",
  minHeight: "100%",
}}
```

- `screen-enter` for the soft entry animation.
- `relative` so decorative blobs anchor to the page.
- `gap-4` (16px) for the vertical rhythm.
- Decorative blobs (amber top-right, lilac mid-left) go **immediately** after the wrapper opens, before any cards.

### 2. Background blobs

```
<div aria-hidden className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,185,84,0.10),transparent_60%)] blur-3xl" />
<div aria-hidden className="pointer-events-none absolute -left-20 top-40 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(188,194,255,0.10),transparent_60%)] blur-3xl" />
```

Both blobs must be `pointer-events-none aria-hidden` (don't intercept taps).

### 3. Cards

```
<div className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(188,194,255,0.10)] bg-card p-5 shadow-[0_28px_80px_-40px_rgba(8,10,18,0.85)] backdrop-blur-xl">
  <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,185,84,0.16),transparent_60%)] blur-2xl" />
  <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-12 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,rgba(188,194,255,0.16),transparent_60%)] blur-2xl" />
  <div className="relative">{/* content */}</div>
</div>
```

- `rounded-[1.75rem]` (28px) is the standard outer radius. **Never** below 20px.
- Border: `rgba(188,194,255,0.10)` default, `rgba(188,194,255,0.22)` warm/calm filled, `rgba(255,123,123,0.22)` danger.
- Use `bg-card` from the Tailwind theme — don't override the surface background.
- Shadow: `0_28px_80px_-40px_rgba(8,10,18,0.85)`. Never tighter or brighter.
- `backdrop-blur-xl` is required; never drop it.
- Inner content must live in `<div className="relative">` so it sits above the blobs.
- Smaller cards may use 36/36 inner blob sizes instead of 44/44.

### 4. Typography

Three roles, used consistently:

- **Kicker** (above titles): `fontSize: 11`, `fontWeight: 600`, `letterSpacing: "0.22em"`, `textTransform: "uppercase"`, `color: "#d8d4eb"`. `tracking-[0.22em]` is the journey signature.
- **Title** (page h1/h2): `className="font-serif"`, `fontSize: 30` (or `clamp(...)`), `fontWeight: 500`, `lineHeight: 1.15`, `color: "#eef1f6"`, `letterSpacing: "-0.03em"`. Always serif, always the same weight.
- **Body**: `fontSize: 13`, `color: "rgba(216,212,235,0.7)"` (muted) or `"rgba(216,212,235,0.55)"` (ultra-muted), `lineHeight: 1.55`.

Avoid `rgba(220,224,255,...)` — that's the **legacy** palette. Use `rgba(216,212,235,...)` and `#d8d4eb`.

### 5. Inner containers (tabs, segmented controls)

```
<div className="flex items-stretch gap-1 rounded-2xl border border-[rgba(188,194,255,0.10)] bg-[rgba(188,194,255,0.03)] p-1">
  {items.map((item) => {
    const isActive = item.id === activeId;
    return (
      <button
        className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 transition-all duration-200 active:scale-[0.97]"
        style={{
          background: isActive ? "linear-gradient(to right, var(--primary), var(--secondary), var(--primary))" : "transparent",
          color: isActive ? "var(--primary-foreground)" : "rgba(216,212,235,0.6)",
          boxShadow: isActive ? "0 14px 32px -18px rgba(188,194,255,0.85)" : "none",
        }}
      >
        {/* icon + label */}
      </button>
    );
  })}
</div>
```

Active state = primary → secondary → primary gradient with a soft glow. Inactive = single translucent text colour, no background.

### 6. Stat badges / chips inside cards

```
<button className="flex items-center gap-3 rounded-2xl border border-[rgba(188,194,255,0.12)] bg-[rgba(188,194,255,0.04)] px-4 py-3 text-left transition-all duration-200 hover:border-[rgba(188,194,255,0.22)] hover:bg-[rgba(188,194,255,0.07)] active:scale-[0.98]">
  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[rgba(188,194,255,0.16)] text-primary">
    {/* icon */}
  </span>
  <span className="min-w-0 flex-1">
    <span className="block text-sm font-semibold text-foreground">{title}</span>
    <span className="mt-0.5 block text-[12px] leading-relaxed text-[#d8d4eb]">{description}</span>
  </span>
</button>
```

For warm/tertiary variants, swap `rgba(188,194,255,...)` → `rgba(255,185,84,...)` and the text colour to `text-tertiary` / `text-[#ffd99a]`. For danger/crisis, use `rgba(255,123,123,...)` and `rgba(255,170,170,0.95)`.

### 7. Palette cheat sheet

| Token             | Use                        | Colour                                            |
| ----------------- | -------------------------- | ------------------------------------------------- |
| `primary`         | default UI accent          | `rgba(188,194,255,...)` (lilac), `var(--primary)` |
| `secondary`       | gradient companion         | `rgba(212,187,255,...)` (fuchsia)                 |
| `tertiary` / warm | encouragement, XP, streaks | `rgba(255,185,84,...)` (amber)                    |
| `success`         | positive feedback          | `rgba(109,186,132,...)` (sage)                    |
| `destructive`     | crisis, danger             | `rgba(255,123,123,...)` (rose)                    |
| muted text        | secondary copy             | `#d8d4eb`, `rgba(216,212,235,...)`                |
| surface           | cards                      | `bg-card`, `rgba(188,194,255,0.04)` (low)         |

### 8. Top-bar settings & back buttons

Major screens get a `<TopBarSettingsButton onClick={onOpenSettings} />`. The settings screen gets a `<TopBarBackButton onClick={onBack} />` in a flex header with the title. Bottom nav is hidden on the settings screen.

### 9. Animations

- Use `screen-enter` on every page root.
- Honour `prefers-reduced-motion` (existing `[style*="onb-glow"]` selectors in `index.css` show the pattern).
- Decorative blobs and cards must never block clicks: `pointer-events-none aria-hidden`.

## What NOT to do

- Don't put large, themable content (mood arc, primary CTA) inside a card wrapper — let it breathe in the open air with its own background glow.
- Don't use the legacy `rgba(220,224,255,...)` palette or 1.3px-letter-spacing kickers.
- Don't hardcode corner radii below 20px. The system is 28px on cards, 16px on inner chips, 12px on small icon tiles.
- Don't add gradients to inactive buttons/tabs.
- Don't introduce TanStack Query, Redux, or other state libs — Zustand + the existing stores cover the app.
- Don't commit `.env`, Supabase service-role keys, or any secrets. Only `VITE_*` anon keys belong in `.env`.
- Don't hand-edit `src-tauri/gen/`; regenerate with the Tauri CLI.
- Don't add new HTTP URLs or FS paths in Tauri code without updating `src-tauri/capabilities/default.json` and the CSP in `tauri.conf.json`.
- Don't ship feature work without `npm run format:check && npm run lint && npm run typecheck && npm test` passing — that's exactly what CI runs.

## Where to Read More

- `DESIGN.md` — "Editorial Nurture / Celestial Cocoon" philosophy (twilight palette, tonal layering, ghost borders, etc.).
- `docs/AUTH_SETUP.md` — Auth flows, Supabase URL config, Google OAuth, redirect URLs.
- `supabase/README.md` — Supabase project setup, migrations, RLS expectations.
- `DEPLOY.md` — Tauri Android/iOS build & deployment.
- `FEATURES.md` — Product feature inventory.
- `.github/copilot-instructions.md` — partial stack preferences; treat this file as the source of truth.
