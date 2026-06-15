# Backend prompt: cloud-rendered achievement card

You are implementing a single new endpoint on the existing Express server in
this repo. The client app (a Tauri + React student wellbeing app called
Mabuh-ai) used to render the achievement card locally with
`<foreignObject>` + an SVG sprite + a canvas. That produced inconsistent
output across WebViews, so the client now asks the server to render the
square PNG and returns it as base64. The visible preview inside the app is
still rendered in React, so the cloud renderer only has to match the visual
contract below — it does **not** have to share components with the client.

## 1. Endpoint

```
POST /achievements/card
Authorization: Bearer <supabase access_token>
Content-Type: application/json
```

Mirror the existing `POST /chat` flow in `src/app.js`,
`src/routes/chat.js`, `src/middleware/supabase-auth.js`, and
`src/middleware/error-handler.js` exactly. That means:

- Mount the router in `src/app.js` after the existing `/chat` mount, e.g.
  `app.use("/achievements", createAchievementCardRouter({ authVerifier, rateLimit, rateWindowMs }))`.
- Apply the same `createSupabaseAuth(authVerifier)` middleware, the same
  per-IP `rateLimit` + per-user `userLimiter` pair, and the same
  `notFound` + `errorHandler` chain.
- Reuse the existing `requestId` middleware so failures carry
  `requestId` in the JSON body.
- No new global middleware. The card route is self-contained.

### Request body

```json
{
  "level": 3,
  "totalXp": 120,
  "streak": 5,
  "journeysCompleted": 7,
  "milestoneLabel": "Steady skies" | null,
  "tierLabel": "Steady companion" | null,
  "nextMilestone": { "label": "City hops", "hint": "2 more flights" } | null,
  "xpPerLevel": 50,
  "maxLevel": 10
}
```

Validation rules (return `400` with the same `{ error: { code, message,
requestId } }` shape the chat route uses):

- `level` integer, `1 ≤ level ≤ maxLevel`.
- `totalXp`, `streak`, `journeysCompleted` non-negative integers.
- `milestoneLabel`, `tierLabel` either a non-empty string or `null` /
  omitted.
- `nextMilestone` either `null` / omitted, or `{ label: string, hint:
  string }`.
- `xpPerLevel` defaults to `50`; `maxLevel` defaults to `10`. The client
  always sends both, so trust them only if you also want the cloud to be
  the source of truth.

Reject anything that does not match with a `ValidationError` from
`src/errors.js` so the existing error handler maps it to HTTP 400.

### Response body

```json
{
  "imageBase64": "<base64-encoded PNG bytes, no data: URL prefix>",
  "mimeType": "image/png",
  "width": 1080,
  "height": 1080
}
```

Always set `Cache-Control: no-store` on the response (same as the chat
route). Always set `Content-Type: application/json; charset=utf-8`.

### Error responses

Use the same `AppError` + `errorHandler` pipeline as the chat route:

- `401` with code `UNAUTHENTICATED` if the JWT is missing or invalid.
- `429` with code `RATE_LIMITED` from the existing `rateLimit` /
  `userLimiter`.
- `400` with code `VALIDATION_ERROR` for bad payloads.
- `503` with code `CARD_RENDERER_UNAVAILABLE` if the renderer itself
  cannot start (missing dependency, OOM, etc.) — throw a new
  `CapacityError`-style class in `src/errors.js` if needed.
- `500` with code `CARD_RENDERER_FAILED` for any other renderer
  exception, logged to `console.error` with the request id.

Never log the request body, the user's `access_token`, or the rendered
PNG bytes. Never echo `req.body` in error messages.

## 2. Render contract

The card is a **1080 × 1080 PNG**, sRGB, exported at the exact dimensions
in the request. Do not letterbox, do not rescale the user's input — if
`width` / `height` differ from 1080, that is a contract bug and the
endpoint should still return a 1080×1080 image.

Compute progress locally so the client and server can never disagree:

```js
const xpInto = totalXp % xpPerLevel;
const xpRemaining = xpPerLevel - xpInto;
const xpPct = Math.max(2, Math.min(100, (xpInto / xpPerLevel) * 100));
```

The 2% floor exists so the bar is visible at the start of a level; the
100% ceiling exists so the bar never spills out of its track. Do not
change those clamps.

The fixed copy strings are:

| Field | Value |
| --- | --- |
| `quoteText` | `milestoneLabel ? "Milestone reached: " + milestoneLabel : "Small steps are still meaningful progress."` |
| `quoteSubtext` | `"I kept showing up for myself. That is worth noticing."` |
| `nextStepText` | `nextMilestone ? nextMilestone.label + " — " + nextMilestone.hint : "All milestones reached — keep going."` |

The brand text is `"Mabuh-ai"` (note the lowercase `ai`) followed by the
kicker `"A QUIET WIN"`.

## 3. Visual recipe

The client renders the same recipe in
`src/components/journey/AchievementShareCard.tsx`. Use whatever renderer
you prefer (Sharp + SVG `<foreignObject>`, Resvg, headless Chromium via
`@sparticuz/chromium`, Playwright, etc.) — the only hard rule is that the
resulting PNG must match the recipe below pixel-for-pixel at 1080 × 1080.

### 3.1 Frame

- Outer size: 1080 × 1080, no padding, no shadow outside the card.
- `border-radius: 56` on the outer container. Achieved by clipping the
  canvas to a rounded rectangle, **not** by leaving transparent corners.
- `border: 1.5px solid rgba(188,194,255,0.22)`.
- Background: `linear-gradient(150deg, #1a1d2c 0%, #131623 55%, #0c0f17 100%)`.
- Drop shadow: `0 32px 80px -40px rgba(8,10,18,0.95)` (it falls off the
  card edge in the React version, so the PNG can either include it or
  omit it — do not include it in the export).
- Inner text colour: `#f3eef7` baseline, `#f5f1ff` for serif headlines.

### 3.2 Decorative blobs (clipped to the rounded card)

- Amber blob top-right: positioned at `right: -120, top: -100`, 540 × 540,
  `radial-gradient(circle_at_center, rgba(255,185,84,0.28), transparent 65%)`,
  `filter: blur(40px)`. Equivalent in the export: a 540×540 ellipse whose
  visible colour is `rgba(255,185,84,0.28)` fading to transparent over
  ~65% of its radius.
- Primary blob bottom-left: positioned at `left: -140, bottom: -140`,
  600 × 600, `radial-gradient(circle_at_center, rgba(188,194,255,0.32),
  transparent 65%)`, `filter: blur(50px)`.
- Fuchsia accent: positioned at `right: 200, top: 360`, 360 × 360,
  `radial-gradient(circle_at_center, rgba(212,187,255,0.18), transparent
  70%)`, `filter: blur(40px)`.

All three blobs are decorative, not interactive. They are clipped to the
rounded card and must not bleed outside it.

### 3.3 Content padding

- Outer padding inside the card: 72 on every side (`padding: 72,
  box-sizing: border-box`).
- Content column: `display: flex, flex-direction: column, height: 100%`.
- The five sections stack with these `marginTop` values (in the React
  source they are unconditional, in the export you can compute the
  exact y coordinates directly):
  1. Header row (logo + brand + rank badge), no margin top.
  2. "My wellbeing journey" kicker + `Level N` heading, `marginTop: 56`.
  3. Progress block, `marginTop: 38`.
  4. Quote block, `marginTop: auto` (sticks to the bottom of the column
     above the next-step row).
  5. Next-step row, `marginTop: 22`.

### 3.4 Header row (logo + brand + rank badge)

- `display: flex, align-items: flex-start, justify-content: space-between,
  gap: 24`.
- Left group: `display: flex, align-items: center, gap: 22`.
  - Logo: 84 × 84, `object-fit: contain`. Source: load
    `/app-logo.svg` from the client `public/` directory at build time
    and embed it as a data URL, or fetch it from
    `https://mabuh-ai-server-29h8.onrender.com/public/app-logo.svg` if
    you mirror the file. The logo is a stylised spark; the export
    cannot use a broken-image placeholder, so make sure the asset is
    reachable.
  - Brand name `Mabuh-ai`: `font-family: Newsreader, ui-serif, Georgia,
    serif`, `font-weight: 500`, `font-size: 44`, `line-height: 1`,
    `letter-spacing: -0.02em`, `color: #f5f1ff`.
  - Kicker `A QUIET WIN`: `font-size: 14`, `font-weight: 600`,
    `letter-spacing: 0.32em`, `text-transform: uppercase`,
    `color: rgba(188,194,255,0.65)`, `margin-top: 8` from the brand
    name.
- Right side: rank badge (see 3.5).

### 3.5 Rank badge (top-right)

- 168 × 168 circle, `flex-shrink: 0`.
- Outer glow: `inset: -16`, 200 × 200 (use a 200×200 circle for the
  visible glow), `radial-gradient(circle_at_center,
  rgba(188,194,255,0.22), transparent 70%)`, `filter: blur(16px)`.
- Conic ring: 168 × 168, 2px stroke using a 1.5px padding + `mask`
  trick. Background: `conic-gradient(from 220deg, #bcc2ff 0deg, #d4bbff
  160deg, #ffb954 300deg, #bcc2ff 360deg)`. Easiest implementation:
  draw a stroked circle with `stroke-width: 2`,
  `stroke-dasharray`/`stroke-dashoffset` is **not** used — it's a solid
  ring.
- Inner disc: 168 × 168, `background: rgba(20,22,32,0.7)`,
  `backdrop-filter: blur(8px)`, centered grid.
- Text inside, centered:
  - Kicker `RANK`: `font-size: 12`, `font-weight: 600`,
    `letter-spacing: 0.32em`, `text-transform: uppercase`,
    `color: #ffd99a`.
  - Number (the level): `font-family: Newsreader, ui-serif, Georgia,
    serif`, `font-weight: 500`, `font-size: 72`, `line-height: 1`,
    `letter-spacing: -0.02em`, `color: #f5f1ff`,
    `margin: 10px 0 6px`.
  - `OF 10` line: `font-size: 10`, `font-weight: 500`,
    `letter-spacing: 0.28em`, `text-transform: uppercase`,
    `color: rgba(216,212,235,0.6)`.

### 3.6 Level heading

- Kicker `MY WELLBEING JOURNEY`: `font-size: 15`, `font-weight: 600`,
  `letter-spacing: 0.32em`, `text-transform: uppercase`,
  `color: rgba(188,194,255,0.6)`.
- Heading `Level N` next to the tier pill, in a `flex` row with
  `gap: 22, flex-wrap: wrap, marginTop: 14, align-items: center`.
- Heading itself: `font-family: Newsreader, ui-serif, Georgia, serif`,
  `font-weight: 500`, `font-size: 124`, `line-height: 1`,
  `letter-spacing: -0.035em`, `color: #f5f1ff`.
- Tier pill: only render when `tierLabel` is truthy. Pill has
  `display: inline-flex, align-items: center, gap: 12,
  padding: 12px 22px, border-radius: 999,
  border: 1.5px solid rgba(188,194,255,0.32),
  background: linear-gradient(90deg, rgba(188,194,255,0.10) 0%,
  rgba(212,187,255,0.14) 100%)`. The leading icon is a 4-point sparkle
  (`viewBox="0 0 24 24"`, path
  `M12 0l1.6 8.4L22 10l-8.4 1.6L12 20l-1.6-8.4L2 10l8.4-1.6L12 0z`),
  18 × 18, `color: rgba(188,194,255,0.95)`. The label uses
  `font-family: Newsreader, ui-serif, Georgia, serif, font-weight: 500,
  font-size: 22, color: #d8d4eb`.

### 3.7 Progress block

- A two-line header row: `display: flex, align-items: baseline,
  justify-content: space-between, gap: 16, margin-bottom: 14`.
  - Left kicker `PROGRESS TO LEVEL N+1`: same kicker style as above
    (`font-size: 14, font-weight: 600, letter-spacing: 0.32em,
    text-transform: uppercase, color: rgba(188,194,255,0.6)`).
  - Right caption `{xpRemaining} XP TO GO`: `font-size: 15,
    font-weight: 600, letter-spacing: 0.04em, color:
    rgba(255,217,154,0.95)`.
- Track: 18 px tall, full width, `border-radius: 999`,
  `background: rgba(188,194,255,0.12)`. Clipped with `overflow: hidden`
  so the fill does not bleed.
- Fill: position absolute, `inset: 0`, `width: xpPct%`,
  `background: linear-gradient(90deg, #bcc2ff 0%, #d4bbff 55%, #ffb954
  100%)`, `box-shadow: 0 10px 30px -10px rgba(188,194,255,0.6)`. The
  shadow is clipped to the track by the track's `overflow: hidden` — in
  the export, draw a small inner shadow on the fill itself instead.
- Footer row: `marginTop: 10, display: flex, justify-content: space-between,
  font-size: 14, font-weight: 500`.
  - Left: `{xpInto}/{xpPerLevel} XP`, `color: rgba(216,212,235,0.7)`.
  - Right: `{streak}🔥 streak · {journeysCompleted} journeys`, `color:
    rgba(216,212,235,0.55)`. Use the actual fire emoji glyph
    `\u{1F525}` followed by a single space; do **not** substitute an
    SVG.

### 3.8 Quote block

- `position: relative, marginTop: auto, padding: 30px 36px 32px,
  border-radius: 32, border: 1.5px solid rgba(188,194,255,0.20),
  background: linear-gradient(140deg, rgba(188,194,255,0.10) 0%,
  rgba(212,187,255,0.08) 50%, rgba(255,185,84,0.10) 100%),
  overflow: hidden`.
- Decorative quote glyph: 64 × 64 lucide `Quote` icon (`stroke-width:
  1`), `color: rgba(188,194,255,0.5)`, positioned `left: -4, top: -18`.
  This overlaps the top-left corner of the card.
- `quoteText`: `font-family: Newsreader, ui-serif, Georgia, serif,
  font-weight: 500, font-size: 32, line-height: 1.25,
  letter-spacing: -0.01em, color: #f5f1ff`.
- `quoteSubtext`: `margin-top: 16, font-size: 16, font-weight: 400,
  line-height: 1.5, color: rgba(216,212,235,0.7)`.

### 3.9 Next-step row

- `marginTop: 22, display: flex, align-items: center, gap: 18,
  padding: 18px 22px, border-radius: 24, border: 1.5px solid
  rgba(188,194,255,0.16), background: rgba(188,194,255,0.04)`.
- Icon tile: 56 × 56 circle, `background: rgba(188,194,255,0.10)`,
  centered grid. On top of it, a conic ring using the same recipe as the
  rank badge but starting at 200deg: `conic-gradient(from 200deg,
  #bcc2ff 0deg, #d4bbff 160deg, #ffb954 320deg, #bcc2ff 360deg)` with
  the 1.5px padding + mask trick. Inside the ring, draw a 26 × 26
  lucide `Sprout` icon (`stroke-width: default`), `color: #bcc2ff`.
- Text column: `min-width: 0, flex: 1`.
  - Kicker `NEXT STEP`: same kicker style as above (`font-size: 12,
    font-weight: 600, letter-spacing: 0.32em, text-transform: uppercase,
    color: rgba(188,194,255,0.6)`).
  - `nextStepText`: `margin-top: 6, font-size: 18, font-weight: 600,
    line-height: 1.35, color: #f5f1ff`.

## 4. Renderer guidance

Two reasonable implementations:

1. **Sharp + SVG.** Build an SVG string that mirrors the recipe above
   (use `<foreignObject>` only for the brand wordmark and the quote
   text, since they are the only parts that need real font shaping;
   everything else is shapes and gradients). Rasterize with
   `sharp(Buffer.from(svg)).resize(1080, 1080).png().toBuffer()`. The
   result is fully deterministic and headless.
2. **Headless Chromium.** Launch Chromium with
   `@sparticuz/chromium` (works on Render free tier), open a
   `data:text/html;base64,...` document that hosts the recipe, call
   `Page.captureScreenshot` at `clip: { width: 1080, height: 1080 }`,
   and read the PNG bytes. Heavier dependency, but trivial to keep in
   sync with the React source.

Either way:

- Do not hit any external service for fonts. Embed Newsreader and
  Plus Jakarta Sans (or a metric-equivalent fallback) at build time
  and reference them via `@font-face` with the WOFF2 inline base64.
  Newsreader is used for `Mabuh-ai`, `Level N`, the rank number, the
  tier label, and `quoteText`. Plus Jakarta Sans is used for
  everything else.
- Set `font-synthesis: none` so the renderer does not invent bold or
  italic weights that do not exist in the embedded font.
- Disable subpixel antialiasing quirks: `-webkit-font-smoothing:
  antialiased; text-rendering: geometricPrecision;`.
- Resolve the lucide icons (`Quote`, `Sprout`) by inlining the SVG
  paths from `lucide-static` (the same path data the client uses).
- All measurements are in **logical CSS pixels** at the 1080 export
  resolution. If you use Chromium, set the device pixel ratio to 1
  and the viewport to exactly 1080 × 1080 so 1 CSS pixel == 1 output
  pixel.

## 5. Files to add / change

- `src/routes/achievement-card.js` — new router (mirrors
  `src/routes/chat.js`).
- `src/app.js` — mount the new router under `/achievements`.
- `src/errors.js` — add `RendererError` (status 503, code
  `CARD_RENDERER_UNAVAILABLE`) and `ValidationError` is already
  there; reuse it.
- `src/services/achievement-card-renderer.js` — the actual
  Sharp/Chromium call. Keep it pure: takes a validated payload, returns
  a `Buffer`.
- `package.json` — add the chosen renderer dependency
  (`sharp` is the lightest). If you go with Chromium, add
  `@sparticuz/chromium` and `playwright` (or `puppeteer-core`).
- `test/achievement-card.test.js` — node:test cases that:
  - assert 401 without a token,
  - assert 400 on bad payload,
  - assert 200 on a known good payload and that the response decodes
    to a 1080 × 1080 PNG (use `sharp` or `pngjs` to inspect headers).
- `README.md` — add the endpoint to the API table.

## 6. Test fixtures

Use a payload that exercises every branch:

```json
{
  "level": 3,
  "totalXp": 120,
  "streak": 5,
  "journeysCompleted": 7,
  "milestoneLabel": "Steady skies",
  "tierLabel": "Steady companion",
  "nextMilestone": { "label": "City hops", "hint": "2 more flights" },
  "xpPerLevel": 50,
  "maxLevel": 10
}
```

Expected computed values:

- `xpInto = 20`, `xpRemaining = 30`, `xpPct = 40`.
- `quoteText = "Milestone reached: Steady skies"`.
- `nextStepText = "City hops — 2 more flights"`.
- The tier pill renders.
- The "OF 10" line in the rank badge reads `OF 10`.

Add a second fixture without a milestone and without a next milestone
to cover the fallback copy. The PNG bytes do not have to be byte-equal
between fixtures; only the recipe must match.

## 7. Out of scope

- Do not change the client app — that work is already merged. The
  contract above is the source of truth.
- Do not add per-user caching yet. The render is cheap enough at the
  current request rate.
- Do not introduce a new auth provider; reuse `createSupabaseAuth`.
- Do not add image moderation / scanning. The card carries no PII
  beyond the user's own level, streak, and journey counts.
