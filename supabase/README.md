# Supabase setup

## 1. Create project

1. Create a new project at [supabase.com](https://supabase.com).
2. Copy `Project URL` and the `anon` public key from Project Settings → API.
3. In the app root, copy `.env.example` to `.env` and paste the values:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```

## 2. Run the schema

Open the Supabase SQL Editor and run [`schema.sql`](./schema.sql). It creates:

- `profiles` table linked to `auth.users` (RLS: owner-only)
- Trigger to auto-insert a profile row on signup
- Example `journal_entries` and `mood_logs` tables with owner-only RLS

## 3. Auth settings

In Supabase dashboard → Authentication → URL Configuration, add the redirect
URLs for local dev and Tauri:

- `http://localhost:1420` (Tauri dev)
- `http://localhost:1420/auth/callback` (Tauri dev auth callbacks)
- `http://localhost:1420/auth/reset` (Tauri dev password reset)
- `http://localhost:5173` (Vite dev)
- `http://localhost:5173/auth/callback` (Vite dev auth callbacks)
- `http://localhost:5173/auth/reset` (Vite dev password reset)
- `tauri://localhost` (Tauri production)
- `tauri://localhost/auth/callback` (Tauri production auth callbacks)
- `tauri://localhost/auth/reset` (Tauri production password reset)
- `mabuhai://auth/callback` (installed Android/iOS Google OAuth callback)

Keep email confirmations enabled for production-like testing.

### Google OAuth

The app has Google sign-in and sign-up buttons. Web builds use the browser
callback route; installed Tauri mobile builds open Google in the system browser
through the opener plugin and return through the `mabuhai://` deep link.

1. In Google Cloud / Google Auth Platform, create a Web application OAuth
   client.
2. Add app origins under Authorized JavaScript origins:
   - `http://localhost:5173` for Vite dev
   - `http://localhost:1420` for Tauri dev
   - Your production web origin, if you deploy a web build
3. Add the Supabase Auth callback URL under Authorized redirect URIs:
   - `https://<project-ref>.supabase.co/auth/v1/callback`
   - Copy the exact URL from Supabase Dashboard -> Authentication -> Providers -> Google.
4. In Supabase Dashboard -> Authentication -> Providers -> Google:
   - Enable Google.
   - Paste the Google Client ID and Client Secret.
5. In Supabase Dashboard -> Authentication -> URL Configuration, keep the app
   redirect URLs listed above, especially `/auth/callback` and
   `mabuhai://auth/callback`.
6. In `.env`, set:
   ```env
   VITE_AUTH_GOOGLE_ENABLED=true
   ```
7. Restart the dev server.

## 4. Email templates

Paste [`email-templates/confirm-signup.html`](./email-templates/confirm-signup.html)
into Supabase Dashboard -> Authentication -> Email Templates -> Confirm signup.
Keep the `{{ .ConfirmationURL }}` variable intact.

## 5. Why RLS matters here

MabuhAi stores journaling, mood, and "Mask-Off" entries — highly sensitive data.
RLS enforces owner-only access **at the database**, so even if the frontend has
a bug, Supabase will refuse to return other users' rows. Always:

- Enable RLS on every new table that holds user data.
- Write the policy *before* you insert any real data.
- Never ship the service role key to the client — only the anon key.
