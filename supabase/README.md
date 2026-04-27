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
- `http://localhost:5173` (Vite dev)
- `tauri://localhost` (Tauri production)

For OAuth providers (Google, etc.), configure them in Authentication → Providers
and add the same redirect URLs.

## 4. Why RLS matters here

MabuhAi stores journaling, mood, and "Mask-Off" entries — highly sensitive data.
RLS enforces owner-only access **at the database**, so even if the frontend has
a bug, Supabase will refuse to return other users' rows. Always:

- Enable RLS on every new table that holds user data.
- Write the policy *before* you insert any real data.
- Never ship the service role key to the client — only the anon key.
