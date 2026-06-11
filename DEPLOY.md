# Deploying MabuhAi as a mobile app

This guide covers the two pieces of configuration the mobile build needs at
build time — the **Supabase project** (auth + mood/journal data) and the
**chat server** that proxies the Mistral API.

> **TL;DR for a new contributor**
>
> 1. Create a Supabase project, run `supabase/schema.sql`, copy the URL +
>    anon key.
> 2. Deploy the chat server with a `MISTRAL_API_KEY` env var set.
> 3. Copy `.env.example` to `.env`, fill in the four values.
> 4. `npm install && npm run build && cargo tauri android build --debug --apk`.
> 5. The APK is at
>    `src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk`.

---

## 1. Environment variables (the short list)

The mobile bundle reads only four `VITE_*` variables. They are inlined into
the JavaScript at `npm run build` time — there is no runtime env injection
on Android, so a rebuild is required to change them.

| Variable | What it does | Where to get it |
|---|---|---|
| `VITE_SUPABASE_URL` | Endpoint of your Supabase project | Supabase dashboard → **Settings → API** |
| `VITE_SUPABASE_ANON_KEY` | Public, publishable client key (safe to ship) | Same page. Starts with `sb_publishable_…` |
| `VITE_AUTH_GOOGLE_ENABLED` | `"true"` to show the "Continue with Google" button after you've enabled the provider | Boolean |
| `VITE_GOOGLE_WEB_CLIENT_ID` | Web OAuth client ID from Google Cloud Console (required for native Google sign-in on Android) | Google Cloud Console → Credentials |
| `VITE_CHAT_SERVER_URL` | Public URL of the Mistral proxy server (no trailing slash) | Deploy the server (section 3), paste its URL |

Everything else (the Mistral key, OpenAI keys, etc.) lives **on the chat
server**, never in the app.

---

## 2. Supabase setup

1. **Create a project** at [supabase.com](https://supabase.com).
2. **Run the schema**: in the dashboard go to **SQL Editor → New query**,
   paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql),
   and run. The script is idempotent — safe to re-run.
   It will create:
   - `profiles` (extends `auth.users` with `display_name`)
   - `mood_entries` (multiple check-ins per day allowed)
   - `journal_entries` (manual notes)
   - Row-Level-Security policies so a user can only read/write their own rows
   - The `delete_user()` self-service RPC used by the "Delete my account"
     flow in **Settings**
3. **Copy the API values**: **Settings → API** and copy
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Publishable key** (or legacy **anon** key) → `VITE_SUPABASE_ANON_KEY`
4. **Configure auth redirect URLs** in **Authentication → URL
   Configuration** so the Google OAuth round-trip works on Android:
   - `tauri://localhost`
   - `tauri://localhost/auth/callback`
   - `tauri://localhost/auth/reset`
   - (For desktop dev also add `http://localhost:1420/auth/callback` and
     `http://localhost:5173/auth/callback`.)
5. **Enable Google sign-in (optional)**:
   - **Native (Android):** uses `tauri-plugin-google-auth` (Credential
     Manager). Configure Google Cloud Console:
     1. **APIs & Services → Credentials → Create OAuth client ID → Android**
        with package name `com.user.mabuhai` and the SHA-1 of your release
        keystore (`keytool -list -v -keystore ~/keystores/cictappskey.keystore
        -alias cictappskey`). Add the debug SHA-1 too if you'll run dev
        builds.
     2. **APIs & Services → Credentials → Create OAuth client ID → Web
        application**. Copy the **Client ID** (not the secret — native
        flow doesn't need it).
     3. In **Authentication → Providers → Google** in the Supabase
        dashboard, paste the **Web** client ID and secret.
     4. Set `VITE_GOOGLE_WEB_CLIENT_ID=<web-client-id>` and
        `VITE_AUTH_GOOGLE_ENABLED=true` in `.env`.
   - **Web/desktop** (the fallback used when the app is not on Android):
     the Supabase redirect URLs above (step 4) are still required.

### Database migration note (existing projects)

If you are upgrading an installation that already had the old "one mood
per day" schema, the new `schema.sql` no longer creates the unique index
`mood_entries_user_entry_date_unique`. To upgrade, run this once in the
SQL editor before applying the new schema:

```sql
drop index if exists public.mood_entries_user_entry_date_unique;
```

After running the new schema, multiple check-ins per day are allowed.

---

## 3. Chat server (the Mistral proxy)

The mobile app **never** calls `api.mistral.ai` directly — the Mistral
key is too sensitive to ship in a public bundle, and rotating it would
force an app release. Instead the app calls a tiny server you control,
which holds the key server-side.

### 3.1 What the app expects

A single endpoint:

```
POST {VITE_CHAT_SERVER_URL}/chat
Authorization: Bearer <supabase access_token>
Content-Type: application/json

{ "message": "…", "intent": "general" | "support" | "grounding", "history": [],
  "context": { …user/mood/journal/journey snapshot… } }
→ 200 { "reply": "…" }
```

The client obtains the `access_token` from the user's live Supabase
session via `supabase.auth.getSession()`. The server **must** verify
the JWT against your Supabase project's JWKS endpoint — do **not**
compare the token against a static `CHAT_API_KEYS` secret. The full
flow lives in `src/services/chatClient.ts` and the test suite at
`src/services/chatClient.test.ts` covers the auth contract.

The server is free to ignore any field it doesn't understand. The original
three fields (`message`, `intent`, `history`) are still the only required
ones; `context` is optional and only used to make the model more relevant
to the current student. See **§3.5 Context payload** for the full shape.

**Status codes the app handles explicitly:**

| Status | Client behaviour |
|---|---|
| 200 | Show the reply. |
| 401 | Refresh the Supabase session once, retry once. If it still 401s, clear the session and route the user to `/login`. |
| 429 | "You're sending messages too quickly." |
| 503 | "The chat service is temporarily unavailable." |
| Network failure | "I couldn't reach the chat server." |
| Malformed JSON | Generic parser error. |

### 3.2 Minimal Express server (~30 lines)

```js
// server/server.js
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  const { message, intent = "general", history = [] } = req.body ?? {};
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message is required" });
  }

  // Crisis routing — short-circuit to a safety message for high-risk intents.
  if (intent === "support") {
    return res.json({
      reply:
        "It sounds heavy. You don't have to carry this alone — tap Support to reach a person who can listen.",
    });
  }

  const resp = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.MISTRAL_MODEL ?? "mistral-small-latest",
      temperature: 0.6,
      max_tokens: 320,
      messages: [
        {
          role: "system",
          content:
            "You are a warm, brief, non-clinical companion for a Filipino student. " +
            "Use plain language. Never diagnose. Suggest professional help if the user " +
            "mentions self-harm or crisis.",
        },
        ...history,
        { role: "user", content: message },
      ],
    }),
  });

  if (!resp.ok) {
    return res.status(502).json({ error: `mistral ${resp.status}` });
  }
  const data = await resp.json();
  res.json({ reply: data.choices?.[0]?.message?.content ?? "" });
});

const port = process.env.PORT ?? 3000;
app.listen(port, () => console.log(`mabuh chat server on :${port}`));
```

### 3.5 Context payload

When the user is signed in and **not** in Mask Mode, the app attaches a
`context` object to every `/chat` request so the model can be aware of
their recent state. Mask Mode sends only `{ anonymous: true, timestamp }`
to honour the "no identity, no memory" promise.

```ts
context: {
  user: { displayName: string | null },

  mood: {
    recent: Array<{                // last 7 mood check-ins, oldest → newest
      date: "YYYY-MM-DD",
      mood: "stressed" | "worried" | "okay" | "calm" | "happy",
      tags: string[],
      schoolLoad: 1 | 2 | 3 | 4 | 5,
      activityMinutes: number,
      activities: { work: [], health: [], sleep: [], food: [],
                    hobbies: [], weather: [], sports: [] },
      socialInteractions: Array<{ name, relationship, interactionType,
                                   durationMinutes, feelings, notes? }>,
      dayNote: string,
    }>,
    dominantMood: "stressed" | "worried" | "okay" | "calm" | "happy" | null,
    trend: Array<{ date, score: 1-5, mood }>,            // last 14 days
    distribution: Array<{ mood, count, pct }>,           // day-level mix
  },

  journal: {
    recent: Array<{                // last 5 entries, newest first
      date: "YYYY-MM-DD",
      content: string,
      source: "manual" | "checkin",
      mood?: "stressed" | "worried" | "okay" | "calm" | "happy",
    }>,
  },

  journey: {                      // gamified daily-routine tracker
    phase: "preflight" | "airborne" | "checkpoint" | "pause"
         | "final" | "rest",
    streak: number,                // consecutive-day count
    totalXp: number,
    flightsCompleted: number,      // lifetime flights finished
    lastFlightDate: "YYYY-MM-DD" | null,
    preflightMood: "stressed" | "worried" | "okay" | "calm" | "happy" | null,
    checkpointMood: "stressed" | "worried" | "okay" | "calm" | "happy" | null,
    finalMood:    "stressed" | "worried" | "okay" | "calm" | "happy" | null,
  },

  social: {                        // last 7 days
    totalInteractions: number,
    topPerson: string | null,
    topFeeling: string | null,
  },

  analytics: {
    currentStreak: number | null,
    lifetimeDays: number | null,
    stabilityScore: number | null,  // 0-100
  },

  timestamp: number,               // ms epoch, when the request was built
}
```

**How the server should use it.** The reference implementation in §3.2
ignores `context` entirely — that's still a valid response, and the chat
keeps working. To make the model context-aware, fold the fields into the
system prompt. A minimal pattern:

```js
const ctx = req.body?.context ?? {};
const sysParts = [
  "You are a warm, brief, non-clinical companion for a Filipino student.",
  "Use plain language. Never diagnose. Suggest professional help if the user mentions self-harm or crisis.",
  "Scope: this assistant is for EMOTIONAL SUPPORT ONLY. Do NOT answer coding, programming, debugging, homework, factual lookup, math, or general-knowledge questions. If the user asks for any of those, politely decline, name yourself as their emotional support companion, and invite them to talk about how they feel instead.",
];
if (ctx.mood?.dominantMood) {
  sysParts.push(`The student's recent dominant mood is "${ctx.mood.dominantMood}".`);
}
if (ctx.mood?.trend?.length) {
  const last = ctx.mood.trend.at(-1);
  if (last) sysParts.push(`Today's mood score: ${last.score}/5 (${last.mood}).`);
}
if (ctx.journal?.recent?.length) {
  const latest = ctx.journal.recent[0];
  sysParts.push(`Their latest journal entry (${latest.date}, ${latest.source}): "${latest.content.slice(0, 240)}"`);
}
if (ctx.journey?.streak) {
  sysParts.push(`They are on a ${ctx.journey.streak}-day self-care streak.`);
}
if (ctx.social?.topPerson) {
  sysParts.push(`They recently spent time with ${ctx.social.topPerson}.`);
}
const systemPrompt = sysParts.join(" ");
```

The server may also short-circuit the LLM call (or add safety rails) when
the context shows a sharp mood drop, multiple "stressed" days in a row,
or journal content matching crisis keywords.

**Scope / guardrails.** This assistant is **emotional support only**. The
server's system prompt must instruct the model to refuse coding help,
homework help, factual lookups, and similar non-support tasks, and to
re-direct the user back to feelings. The client (`src/screens/ChatBot.tsx`)
performs a first-pass regex check and answers those locally with a fixed
declination, so the request never reaches Mistral in the common cases —
but the server-side instruction is still required as a backstop for
phrasing the regex misses.

**Privacy.** Everything in `context` is already on the user's own
device. The server must not log it, forward it to a third party, or
include it in telemetry. The Supabase anon key + RLS are what protect the
data at rest; the chat server should treat the request body as
short-lived and forget it after the response is sent.

### 3.3 Environment variables for the **server** (not the app)

| Var | Required | Notes |
|---|---|---|
| `MISTRAL_API_KEY` | **Yes** | From [console.mistral.ai](https://console.mistral.ai) → API Keys |
| `MISTRAL_MODEL` | No | Defaults to `mistral-small-latest` |
| `PORT` | No | Defaults to `3000` |

Add a `server/.env` (and `.env.example` for documentation) — **never**
commit the real key.

### 3.4 Deploying the server

Any Node-friendly host works. Two free options:

- **Render** — connect a GitHub repo, set the start command to `node
  server/server.js`, add `MISTRAL_API_KEY` as a secret environment
  variable. Render will give you a URL like
  `https://your-app.onrender.com` — that's your
  `VITE_CHAT_SERVER_URL`.
- **Fly.io / Railway / Vercel (serverless)** — same env vars, point at
  the `server/server.js` entrypoint.

If you want to lock the endpoint down, the recommended approach is to
verify the user's Supabase JWT on every request — **not** to compare the
token against a static secret. Use your Supabase project's JWKS endpoint
and the `jose` (or `jsonwebtoken` + `jwks-rsa`) library. The flow below
uses `jose` because it caches the JWKS for you:

```js
// server/server.js (add right after app.use(express.json()))
import { createRemoteJWKSet, jwtVerify } from "jose";

const SUPABASE_URL = process.env.SUPABASE_URL; // e.g. https://abcdefg.supabase.co
const JWKS = createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`));

app.use("/chat", async (req, res, next) => {
  const auth = req.header("authorization") || "";
  const [scheme, token] = auth.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Missing bearer token" },
    });
  }
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: SUPABASE_URL,
      audience: "authenticated",
    });
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Invalid or expired session" },
    });
  }
});
```

Do **not** compare the bearer token against a `CHAT_API_KEYS` array. The
client obtains its token from the user's live Supabase session and
rotates it via `supabase.auth.refreshSession()`; a static API key would
defeat that rotation and force the app to ship a secret.

After deploying, smoke-test:

```bash
# Pull a fresh access token from your local Supabase session (any way
# you like — e.g. supabase.auth.getSession() in the browser devtools
# console) and use it here:
curl -X POST https://your-app.example.com/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"message":"hello","intent":"general","history":[]}'
```

You should get a JSON `{"reply": "…"}` back.

---

## 4. Putting it together for the Android build

### 4.1 Local dev (sanity check)

```bash
cp .env.example .env
# edit .env and fill in the four values

npm install
npm run dev
```

The app should boot, you can sign up, save a mood, and chat. The dev
build reads the same `.env` as the production build.

### 4.2 Building a debug APK

```bash
npm run build                  # inlines the VITE_* vars into dist/
cargo tauri android build --debug --apk --target aarch64
# or for a per-ABI split (much smaller):
cargo tauri android build --debug --apk --split-per-abi
```

The APK is at:

```
src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk
# or for split:
src-tauri/gen/android/app/build/outputs/apk/arm64-v8a/debug/app-arm64-v8a-debug.apk
```

Install it on a connected device with:

```bash
adb install -r src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk
```

### 4.3 Release build (for the Play Store)

```bash
# 1. Generate a release keystore (one time)
keytool -genkey -v -keystore ~/keystores/cictappskey.keystore \
  -alias cictkey -keyalg RSA -keysize 2048 -validity 10000

# 2. Create src-tauri/gen/android/key.properties (gitignored, never commit)
#    Copy from key.properties.example and fill in the real values.
cp src-tauri/gen/android/key.properties.example \
   src-tauri/gen/android/key.properties
# edit the four fields (storeFile, storePassword, keyAlias, keyPassword)

# 3. Build
npm run build
cargo tauri android build --apk --aab --target aarch64
```

The signed `.aab` lands at
`src-tauri/gen/android/app/build/outputs/bundle/release/app.aab`.

#### 4.3.1 CI / build-machine signing

In CI, do **not** create `key.properties` from a checked-in template. Pass
the four values as environment variables; `build.gradle.kts` will pick them
up automatically:

| Env var | What |
|---|---|
| `TAURI_SIGNING_STORE_FILE` | Absolute path to the keystore on the build machine |
| `TAURI_SIGNING_STORE_PASSWORD` | Keystore password |
| `TAURI_SIGNING_KEY_ALIAS` | Key alias (e.g. `cictkey`) |
| `TAURI_SIGNING_KEY_PASSWORD` | Key password |

Example GitHub Actions step:

```yaml
- name: Build signed Android release
  env:
    TAURI_SIGNING_STORE_FILE: ${{ github.workspace }}/keystores/cictappskey.keystore
    TAURI_SIGNING_STORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
    TAURI_SIGNING_KEY_ALIAS: cictkey
    TAURI_SIGNING_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
  run: |
    npm run build
    cargo tauri android build --apk --aab --target aarch64
```

If none of `key.properties` or the env vars are present, the `release`
build type falls back to the debug signing key — the APK will not install
on a release device, so watch for that in CI logs.

### 4.4 CI / build-machine env vars

The Android build needs these in the build environment (in addition to
the four Vite vars in `.env`):

| Var | Why |
|---|---|
| `ANDROID_HOME` / `ANDROID_SDK_ROOT` | Location of the Android SDK |
| `ANDROID_NDK_HOME` | NDK used by the Tauri Rust build |
| `JAVA_HOME` | JDK 17+ |
| `PATH` | Must include `$ANDROID_HOME/platform-tools` (for `adb`) and the JDK bin |

---

## 5. What does **not** go in `.env`

A few things people often try to put in the client env. Don't.

- **`MISTRAL_API_KEY`** — goes on the chat server only.
- **Supabase service-role key** — never used; the app talks to Supabase
  with the publishable/anon key, which respects RLS. If you ever need
  admin work, do it in the Supabase dashboard.
- **JWT secrets / OAuth client secrets** — go in the Supabase dashboard
  or your auth provider's console, never in the app.

---

## 6. Troubleshooting

- **"Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY"** at boot → your
  `.env` is missing or Vite couldn't see it. Make sure the file is in
  the repo root, not in `src/`, and that you ran `npm run build` after
  editing it.
- **Mood saves return 409 conflict** → your database still has the old
  `mood_entries_user_entry_date_unique` index. Run `drop index if
  exists public.mood_entries_user_entry_date_unique;` in the SQL editor.
- **Chat says "Network request failed"** → your `VITE_CHAT_SERVER_URL` is
  wrong, the server is down, or the server's CORS config doesn't allow
  the WebView origin. The WebView sends an `Origin` header that often
  looks like `tauri://localhost` or `https://tauri.localhost`; make sure
  the chat server's CORS allowlist includes both (or use `*` during
  testing).
- **Google sign-in loops back without logging in** → the redirect URL
  isn't on Supabase's allowlist. Add the four URLs from step 2.4
  above.
- **The APK works in dev but not after a Play Store release** → most
  often `usesCleartextTraffic` — set the release manifest placeholder
  to `"false"` in `gen/android/app/build.gradle.kts` (this is the
  default), and make sure your chat server is HTTPS.
