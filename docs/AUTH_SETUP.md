# Authentication & User Access — Setup Log

**Date added:** 2026-04-17
**Scope:** Initial authentication and user access layer using Supabase Auth.

This document records everything introduced for auth so other developers can
get oriented quickly. If you change the auth system, update this file.

---

## 1. Dependencies added

Installed via `npm install`:

| Package                   | Purpose                                    |
| ------------------------- | ------------------------------------------ |
| `@supabase/supabase-js`   | Supabase client (auth + DB)                |
| `react-router-dom`        | Client-side routing and route guards       |
| `zustand`                 | Lightweight global store for auth state    |

## 2. Files created

### Frontend

| Path                                                      | Purpose                                                      |
| --------------------------------------------------------- | ------------------------------------------------------------ |
| [`src/lib/supabase.ts`](../src/lib/supabase.ts)           | Supabase client singleton. Reads `VITE_SUPABASE_*` env vars. |
| [`src/lib/auth/store.ts`](../src/lib/auth/store.ts)       | Zustand store with `initialize`, `signIn`, `signUp`, `signOut`, profile fetch. Exposes `useAuth`, `useAuthActions`. |
| [`src/lib/auth/ProtectedRoute.tsx`](../src/lib/auth/ProtectedRoute.tsx) | Route guard. Redirects unauthenticated users to `/login`. Supports optional `allowedRoles` prop. |
| [`src/lib/auth/index.ts`](../src/lib/auth/index.ts)       | Barrel export for the auth module.                           |
| [`src/pages/auth/Login.tsx`](../src/pages/auth/Login.tsx) | Email + password sign-in form.                               |
| [`src/pages/auth/Signup.tsx`](../src/pages/auth/Signup.tsx) | Email + password sign-up form, captures `display_name`.    |
| [`src/pages/Home.tsx`](../src/pages/Home.tsx)             | Placeholder protected home page with sign-out.               |

### Backend / database

| Path                                                     | Purpose                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------- |
| [`supabase/schema.sql`](../supabase/schema.sql)          | SQL to provision `profiles`, signup trigger, RLS policies, and example `journal_entries` / `mood_logs` tables. |
| [`supabase/README.md`](../supabase/README.md)            | Step-by-step Supabase project setup guide.                    |

### Config

| Path                                                     | Purpose                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------- |
| [`.env.example`](../.env.example)                        | Template for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. |

## 3. Files modified

| Path                                  | Change                                                        |
| ------------------------------------- | ------------------------------------------------------------- |
| [`src/App.tsx`](../src/App.tsx)       | Replaced the Tauri greet demo with `BrowserRouter` + routes (`/login`, `/signup`, `/` protected). Calls `useAuthStore.initialize()` on mount. |
| [`.gitignore`](../.gitignore)         | Added `.env`, `.env.local`, `.env.*.local` to ignore list.    |

## 4. Architecture at a glance

```
App (src/App.tsx)
 ├── calls useAuthStore.initialize() on mount
 │     └── reads existing Supabase session + subscribes to auth changes
 ├── BrowserRouter
 │    ├── /login    → Login page
 │    ├── /signup   → Signup page
 │    └── /         → ProtectedRoute → Home
 └── ProtectedRoute
      ├── loading?  → spinner
      ├── no session? → redirect to /login
      └── role mismatch? → redirect to /
```

Session persistence, auto-refresh, and sign-out broadcasting are all handled
by `supabase-js`. We only wrap it for UI convenience.

## 5. User roles

`profiles.role` is a text column with a CHECK constraint. Allowed values:

- `user` (default, assigned on signup)
- `moderator`
- `admin`

Use `ProtectedRoute`'s `allowedRoles` prop to gate routes. Promote a user with:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'someone@example.com');
```

## 6. Row Level Security (RLS)

**Every table that holds user data must enable RLS.** The schema sets this up
for `profiles`, `journal_entries`, and `mood_logs`. When adding new tables,
follow the owner-only pattern:

```sql
alter table public.<new_table> enable row level security;

create policy "<table>_owner_all"
  on public.<new_table> for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

This matters especially because MabuhAi stores journaling, mood, and
"Mask-Off" entries — highly sensitive data. RLS enforces isolation at the
database, so a frontend bug cannot leak other users' data.

## 7. Environment setup for new developers

1. Ask the team for the Supabase project URL and anon key (or create your own
   dev project — see [`supabase/README.md`](../supabase/README.md)).
2. Copy `.env.example` to `.env` and fill in the values.
3. If using your own dev project, run [`supabase/schema.sql`](../supabase/schema.sql)
   in the Supabase SQL Editor.
4. In Supabase → Authentication → URL Configuration, add redirect URLs:
   - `http://localhost:1420` (Tauri dev)
   - `http://localhost:5173` (Vite dev)
   - `tauri://localhost` (Tauri production)
5. `npm run tauri dev` to run the app.

## 8. Known gaps / not yet implemented

- **OAuth providers** (Google, etc.) — not wired yet. Add via Supabase dashboard
  and call `supabase.auth.signInWithOAuth({ provider: 'google' })`.
- **Password reset** — Supabase supports it out of the box, but no UI page yet.
- **Email verification gate** — users can sign in without confirming email. If
  required, check `user.email_confirmed_at` in `ProtectedRoute`.
- **Tauri deep-link handling** for OAuth callbacks — will need the
  `@tauri-apps/plugin-deep-link` plugin when OAuth is added.
- **Rate limiting / abuse protection** — rely on Supabase defaults for now.
- **Secure session storage on Tauri** — currently uses `localStorage` via
  `supabase-js`. For a hardened build, migrate to Tauri secure storage.

## 9. Security checklist for future changes

- [ ] Never ship the Supabase **service role** key to the client. Only the
      `anon` key belongs in `VITE_*` env vars.
- [ ] Enable RLS on every new table before inserting real data.
- [ ] Prefer database-level checks (RLS, CHECK constraints, triggers) over
      frontend-only validation for anything security-sensitive.
- [ ] Treat community/group features as explicit opt-in sharing — default to
      owner-only visibility.
