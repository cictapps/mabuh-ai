# Authentication & User Access - Setup Log

**Date added:** 2026-04-17  
**Last updated:** 2026-05-07

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
- Hard email-verification gate before protected access
- Resend-verification action for signed-in but unverified users
- User profile fetching from `public.profiles`
- Display of the signed-in user's name/email
- Forgot-password request modal
- Reset-password completion page at `/auth/reset`
- Optional Google OAuth login behind `VITE_AUTH_GOOGLE_ENABLED=true`
- OAuth/email-confirmation callback route at `/auth/callback`

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
| [`src/pages/auth/AuthCallback.tsx`](../src/pages/auth/AuthCallback.tsx) | OAuth and email-confirmation callback page. Safely redirects back into the app. |
| [`src/pages/auth/ResetPassword.tsx`](../src/pages/auth/ResetPassword.tsx) | Password reset completion page. Lets a user save a new password after opening the recovery email link. |
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
| `/auth/callback` | Handles OAuth and email-confirmation callbacks. |
| `/auth/reset` | Shows the reset-password completion page for recovery email links. |
| `/` | Protected route. Shows `Home` only when authenticated. |
| `*` | Redirects unknown routes to `/`. |

Authentication initialization happens from the auth store whenever a protected,
auth, or callback page needs it. The store reads the existing Supabase session,
fetches the matching profile, subscribes to auth-state changes, and exposes
verified-email state to the route guard.

## 5. Redirect behavior

Current redirect behavior:

- Unauthenticated user visits `/` -> redirected to `/login`
- Successful sign-in -> redirected to the originally requested page, or `/` by default
- Successful sign-up -> shows a success message, then switches back to the sign-in tab
- Successful sign-up with an immediate Supabase session -> redirected to `/`
- Signed-in but unverified user visits `/` -> sees a verification gate with resend/sign-out actions
- Email confirmation callback -> returns to `/`; then the protected route checks verified state
- Google OAuth callback -> returns to the originally requested route, or `/` by default
- Forgot password -> sends a recovery email to `/auth/reset`; successful update signs out and returns to `/login`
- Sign-out from `Home` -> clears local auth state; the protected route sends the user to `/login`
- Unknown route -> redirected to `/`; then protected route decides whether to show `Home` or redirect to `/login`

## 6. Auth architecture

```txt
App
  BrowserRouter
    /login  -> AuthPage initialTab="sign-in"
    /signup -> AuthPage initialTab="sign-up"
    /auth/callback -> AuthCallback
    /auth/reset -> ResetPassword
    /       -> ProtectedRoute -> Home
    *       -> Navigate to /

ProtectedRoute
  calls useAuthStore.initialize()
  loading?             -> shows loading message
  no session?          -> redirects to /login with original location in state
  unverified email?    -> shows resend/sign-out gate
  verified session?    -> renders protected page

Auth store
  getSession()
  fetch profile from public.profiles
  subscribe to onAuthStateChange()
  expose signIn, signUp, signInWithGoogle, resendConfirmation, signOut
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
verified signed-in person as a normal user. The enforced access rule is:

- Not logged in -> cannot access `/`
- Logged in but email unverified -> cannot access `/`
- Logged in with verified email -> can access `/`

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
   VITE_AUTH_GOOGLE_ENABLED=false
   ```

4. If using a new Supabase project, run [`supabase/schema.sql`](../supabase/schema.sql)
   in the Supabase SQL Editor.
5. In Supabase Authentication URL Configuration, add redirect URLs:
   - `http://localhost:1420` for Tauri dev
   - `http://localhost:1420/auth/callback` for Tauri dev auth callbacks
   - `http://localhost:1420/auth/reset` for Tauri dev password reset
   - `http://localhost:5173` for Vite dev
   - `http://localhost:5173/auth/callback` for Vite dev auth callbacks
   - `http://localhost:5173/auth/reset` for Vite dev password reset
   - `tauri://localhost` for Tauri production
   - `tauri://localhost/auth/callback` for Tauri production auth callbacks
   - `tauri://localhost/auth/reset` for Tauri production password reset
6. In Supabase Authentication settings, keep email confirmations enabled for
   production-like testing.
7. To enable Google OAuth:
   - In Google Cloud / Google Auth Platform, create a Web application OAuth
     client.
   - Add app origins under Authorized JavaScript origins, for example
     `http://localhost:5173` for Vite dev and `http://localhost:1420` for
     Tauri dev.
   - Add the Supabase Auth callback URL under Authorized redirect URIs:
     `https://<project-ref>.supabase.co/auth/v1/callback`. Copy the exact URL
     from Supabase Dashboard -> Authentication -> Providers -> Google.
   - In Supabase Dashboard -> Authentication -> Providers -> Google, enable
     Google and paste the Google Client ID and Client Secret.
   - In `.env`, set `VITE_AUTH_GOOGLE_ENABLED=true` and restart the dev server.
8. Run the app:

   ```bash
   npm run tauri dev
   ```

## 10. Production notes

- **Google OAuth dashboard dependency:** The code path is implemented, but the
  Google provider must be enabled in Supabase before turning on
  `VITE_AUTH_GOOGLE_ENABLED`.
- **Tauri production deep links:** OAuth and reset callbacks use normal web
  redirects in browser/Vite dev. Production Tauri packaging should verify the
  custom scheme and platform deep-link behavior before release.
- **Secure session storage on Tauri:** Current Supabase sessions use browser
  storage through `supabase-js`. A hardened desktop release can migrate to a
  Tauri secure-storage strategy.

## 11. Security checklist for future changes

- [ ] Never ship the Supabase service-role key to the client. Only the anon key
      belongs in `VITE_*` environment variables.
- [ ] Enable RLS on every new table before inserting real user data.
- [ ] Prefer database-level checks, constraints, triggers, and RLS for sensitive
      authorization decisions.
- [ ] Treat community/group features as explicit opt-in sharing. Default to
      owner-only visibility.
