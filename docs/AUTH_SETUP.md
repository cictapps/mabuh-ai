# Authentication & User Access - Setup Log

**Date added:** 2026-04-17  
**Last updated:** 2026-04-27  
**Scope:** Authentication and basic user access using Supabase Auth.

This document records the authentication/user-access work so other developers
can understand the current setup quickly. If the auth system changes, update
this file.

---

## 1. Current status

The app currently implements:

- Email/password sign-up
- Email/password sign-in
- Logout
- Supabase session persistence
- Protected routing for the home page
- User profile fetching from `public.profiles`
- Display of the signed-in user's name/email
- Forgot-password request modal

The app does not currently implement:

- A full reset-password page after the user clicks the email link
- OAuth login providers such as Google
- A hard email-verification gate before accessing the protected home page

## 2. Dependencies added

Installed via `npm install`:

| Package | Purpose |
| --- | --- |
| `@supabase/supabase-js` | Supabase client for auth and database access |
| `react-router-dom` | Client-side routing and route guards |
| `zustand` | Lightweight global store for auth state |

## 3. Important files

### Frontend

| Path | Purpose |
| --- | --- |
| [`src/lib/supabase.ts`](../src/lib/supabase.ts) | Supabase client singleton. Reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. |
| [`src/lib/auth/store.ts`](../src/lib/auth/store.ts) | Zustand auth store with `initialize`, `signIn`, `signUp`, `signOut`, profile fetch, `useAuth`, and `useAuthActions`. |
| [`src/lib/auth/ProtectedRoute.tsx`](../src/lib/auth/ProtectedRoute.tsx) | Route guard. Initializes auth and redirects unauthenticated users to `/login`. |
| [`src/lib/auth/index.ts`](../src/lib/auth/index.ts) | Barrel export for the auth module. |
| [`src/pages/auth/AuthPage.tsx`](../src/pages/auth/AuthPage.tsx) | Current combined sign-in/sign-up screen. Includes forgot-password request modal. |
| [`src/pages/auth/Login.tsx`](../src/pages/auth/Login.tsx) | Legacy standalone sign-in screen. Not currently used by routes. |
| [`src/pages/auth/Signup.tsx`](../src/pages/auth/Signup.tsx) | Legacy standalone sign-up screen. Not currently used by routes. |
| [`src/pages/Home.tsx`](../src/pages/Home.tsx) | Protected home page with signed-in user information and sign-out button. |

### Backend / database

| Path | Purpose |
| --- | --- |
| [`supabase/schema.sql`](../supabase/schema.sql) | SQL for `profiles`, signup trigger, RLS policies, and example future feature tables. |
| [`supabase/README.md`](../supabase/README.md) | Step-by-step Supabase project setup guide. |

### Config

| Path | Purpose |
| --- | --- |
| [`.env.example`](../.env.example) | Template for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. |

## 4. Current route flow

Routes are defined in [`src/App.tsx`](../src/App.tsx):

| Route | Behavior |
| --- | --- |
| `/login` | Shows `AuthPage` with the sign-in tab selected. |
| `/signup` | Shows `AuthPage` with the sign-up tab selected. |
| `/` | Protected route. Shows `Home` only when authenticated. |
| `*` | Redirects unknown routes to `/`. |

Authentication initialization currently happens inside
[`ProtectedRoute`](../src/lib/auth/ProtectedRoute.tsx). When a user opens `/`,
the route guard calls `useAuthStore.initialize()`, reads the existing Supabase
session, fetches the matching profile, and subscribes to auth-state changes.

## 5. Redirect behavior

Current redirect behavior:

- Unauthenticated user visits `/` -> redirected to `/login`
- Successful sign-in -> redirected to the originally requested page, or `/` by default
- Successful sign-up -> shows a success message, then switches back to the sign-in tab
- Sign-out from `Home` -> clears local auth state; the protected route sends the user to `/login`
- Unknown route -> redirected to `/`; then protected route decides whether to show `Home` or redirect to `/login`

## 6. Auth architecture

```txt
App
  BrowserRouter
    /login  -> AuthPage initialTab="sign-in"
    /signup -> AuthPage initialTab="sign-up"
    /       -> ProtectedRoute -> Home
    *       -> Navigate to /

ProtectedRoute
  calls useAuthStore.initialize()
  loading?        -> shows loading message
  no session?     -> redirects to /login with original location in state
  authenticated?  -> renders protected page

Auth store
  getSession()
  fetch profile from public.profiles
  subscribe to onAuthStateChange()
  expose signIn, signUp, signOut
```

Supabase handles session persistence, refresh tokens, and auth-state events.
The app wraps those features in a Zustand store for easier UI access.

## 7. Database profile fields

The auth-related database table is `public.profiles`.

Current profile fields:

- `id`
- `display_name`
- `created_at`
- `updated_at`

Profiles store only user-specific display metadata. The app treats every
signed-in person as a normal user. The enforced access rule is:

- Not logged in -> cannot access `/`
- Logged in -> can access `/`

## 8. Row Level Security (RLS)

RLS is enabled for `profiles`. The schema also includes example future-feature
tables for `journal_entries` and `mood_logs` with owner-only policies. Those
tables are outside the Authentication & User Access task, but they show the
same pattern other feature groups should follow for user-owned data.

Owner-only pattern:

```sql
alter table public.<new_table> enable row level security;

create policy "<table>_owner_all"
  on public.<new_table> for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

This matters because future MabuhAi features may store sensitive user data.
RLS enforces access at the database level, not only in the frontend.

## 9. Environment setup for new developers

1. Ask the team for the Supabase project URL and anon key, or create a personal
   dev project.
2. Copy `.env.example` to `.env`.
3. Fill in:

   ```env
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```

4. If using a new Supabase project, run [`supabase/schema.sql`](../supabase/schema.sql)
   in the Supabase SQL Editor.
5. In Supabase Authentication URL Configuration, add redirect URLs:
   - `http://localhost:1420` for Tauri dev
   - `http://localhost:5173` for Vite dev
   - `tauri://localhost` for Tauri production
6. Run the app:

   ```bash
   npm run tauri dev
   ```

## 10. Known gaps / not yet implemented

- **Password reset completion:** The forgot-password modal sends a reset email,
  but the app does not yet have a `/auth/reset` route where the user can enter
  a new password and call `supabase.auth.updateUser({ password })`.
- **OAuth providers:** Google and other providers are not wired yet.
- **Email verification gate:** The app does not currently block access based on
  `user.email_confirmed_at`.
- **Tauri deep-link handling:** Needed later for OAuth or production reset flows.
- **Secure session storage on Tauri:** Current Supabase sessions use browser
  storage through `supabase-js`. A hardened app can migrate to secure storage.

## 11. Security checklist for future changes

- [ ] Never ship the Supabase service-role key to the client. Only the anon key
      belongs in `VITE_*` environment variables.
- [ ] Enable RLS on every new table before inserting real user data.
- [ ] Prefer database-level checks, constraints, triggers, and RLS for sensitive
      authorization decisions.
- [ ] Treat community/group features as explicit opt-in sharing. Default to
      owner-only visibility.
