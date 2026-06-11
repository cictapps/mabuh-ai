# Agent Guidance for MabuhAi

## Product Context

- MabuhAi is built primarily for students, with UX decisions optimized for student reflection, academic stress, late-night use, and mobile-first access.
- Keep the tone warm, non-clinical, supportive, and non-judgmental.
- Treat mental health features as supportive wellness tools, not replacements for licensed professional care.

## Support Data Scope

- Current local support-provider data is focused on the Panay region for now.
- Do not present the provider database as complete national coverage.
- More support data will be added in the future, so design support/resource code to allow additional regions and providers without hard-coding assumptions that Panay is the final scope.
- National hotlines may still appear where already included, but local locator/resource language should make clear that local listings are currently limited.

## UX and Content Defaults

- Prefer student-centered examples, labels, and flows.
- Avoid overwhelming users with dense forms; use progressive disclosure for optional details.
- For safety or urgent-help flows, prioritize clarity, fast access, and plain language.
- When adding provider/resource data, keep fields structured and source-verifiable where possible.

## Engineering Notes

- Preserve the existing React + TypeScript + Vite + Tauri structure.
- Keep mobile-first behavior as the default.
- Follow `DESIGN.md` for visual direction unless a feature has a stronger established local pattern.
- Run `npm run build` after meaningful frontend changes when feasible.

## UI Design System (Journey-style)

All major screens (Check-In, Review, Journey, Support hub, Settings header) share the same visual language. Apply these tokens when building or restyling a screen.

### 1. Page wrapper

Every screen root should use:

```
className="screen-enter relative flex w-full flex-col gap-4 px-4 pb-12 pt-5"
style={{
  paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)",
  minHeight: "100%",
}}
```

- `screen-enter` for the soft entry animation.
- `relative` so absolutely-positioned decorative blobs anchor to the page.
- `gap-4` (16px) for the vertical rhythm between sections.
- `px-4 pb-12 pt-5` for outer padding.
- Inline `paddingTop` adds the safe-area inset on top of the visual top padding.

### 2. Background blobs

Add these two decorative blurred radial gradients right after the wrapper opens, before any content cards:

```
<div aria-hidden className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,185,84,0.10),transparent_60%)] blur-3xl" />
<div aria-hidden className="pointer-events-none absolute -left-20 top-40 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(188,194,255,0.10),transparent_60%)] blur-3xl" />
```

- Amber blob anchored top-right, primary blob anchored mid-left.
- These give the page a calm ambient lighting. Don't replace them with the journey's exact sizes — match the local style.

### 3. Cards (the core container)

Major content blocks (page header, sub-panels, sub-screens) are wrapped in a card with this exact recipe:

```
<div className="relative overflow-hidden rounded-[1.75rem] border border-[rgba(188,194,255,0.10)] bg-card p-5 shadow-[0_28px_80px_-40px_rgba(8,10,18,0.85)] backdrop-blur-xl">
  <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,185,84,0.16),transparent_60%)] blur-2xl" />
  <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-12 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,rgba(188,194,255,0.16),transparent_60%)] blur-2xl" />
  <div className="relative">
    {/* content */}
  </div>
</div>
```

- `rounded-[1.75rem]` (28px) is the standard outer corner radius. Never go below 20px.
- `border-[rgba(188,194,255,0.10)]` is the hairline border. Use `rgba(188,194,255,0.22)` for warm/calm filled states, `rgba(255,123,123,0.22)` for danger.
- `bg-card` from the Tailwind theme; do not override with a custom background.
- `shadow-[0_28px_80px_-40px_rgba(8,10,18,0.85)]` is the standard card shadow. Never use a tighter, brighter shadow.
- `backdrop-blur-xl` is required for the glassy depth — never drop it.
- Always include the two inner decorative blobs (amber top-right, primary bottom-left). Smaller cards may use the 36/36 sizes instead of 44/44.
- The actual content lives in an inner `<div className="relative">` so it sits above the blobs.

### 4. Typography

Three roles, used consistently:

- **Kicker** (above titles): `fontSize: 11`, `fontWeight: 600`, `letterSpacing: "0.22em"`, `textTransform: "uppercase"`, `color: "#d8d4eb"`. The `tracking-[0.22em]` is the journey signature.
- **Title** (page h1/h2): `className="font-serif"`, `fontSize: 30` (or `clamp(...)`), `fontWeight: 500`, `lineHeight: 1.15`, `color: "#eef1f6"`, `letterSpacing: "-0.03em"`. Always serif, always the same weight.
- **Body** (descriptions, helper text): `fontSize: 13`, `color: "rgba(216,212,235,0.7)"` for muted, `color: "rgba(216,212,235,0.55)"` for ultra-muted, `lineHeight: 1.55`.

Avoid `rgba(220,224,255,...)` — it is the legacy palette. Use `rgba(216,212,235,...)` and `#d8d4eb` instead.

### 5. Inner containers (tabs, segmented controls, grouped chips)

Use the journey pill style:

```
<div className="flex items-stretch gap-1 rounded-2xl border border-[rgba(188,194,255,0.10)] bg-[rgba(188,194,255,0.03)] p-1">
  {items.map((item) => {
    const isActive = item.id === activeId;
    return (
      <button
        className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 transition-all duration-200 active:scale-[0.97]"
        style={{
          background: isActive
            ? "linear-gradient(to right, var(--primary), var(--secondary), var(--primary))"
            : "transparent",
          color: isActive ? "var(--primary-foreground)" : "rgba(216,212,235,0.6)",
          boxShadow: isActive
            ? "0 14px 32px -18px rgba(188,194,255,0.85)"
            : "none",
        }}
      >
        {/* icon + label */}
      </button>
    );
  })}
</div>
```

Active state always uses the primary→secondary→primary gradient with a soft glow. Inactive state is a single translucent text color, no background.

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

For warm/tertiary variants, swap the `rgba(188,194,255,...)` for `rgba(255,185,84,...)` and the text color to `text-tertiary` / `text-[#ffd99a]`. For danger (crisis), use `rgba(255,123,123,...)` and `rgba(255,170,170,0.95)`.

### 7. Tones (palette cheat sheet)

| Token | Use | Colors |
| --- | --- | --- |
| `primary` | default UI accent | `rgba(188,194,255,...)` (lilac), `var(--primary)` |
| `secondary` | gradient companion | `rgba(212,187,255,...)` (fuchsia) |
| `tertiary` / warm | encouragement, XP, streaks | `rgba(255,185,84,...)` (amber) |
| `success` | positive feedback | `rgba(109,186,132,...)` (sage) |
| `destructive` | crisis, danger | `rgba(255,123,123,...)` (rose) |
| muted text | secondary copy | `#d8d4eb`, `rgba(216,212,235,...)` |
| surface | cards | `bg-card` (theme), `rgba(188,194,255,0.04)` (low) |

### 8. Top-bar settings & back buttons

Major screens get a `<TopBarSettingsButton onClick={onOpenSettings} />` (positioned by its own absolute styles). Settings screen gets a `<TopBarBackButton onClick={onBack} />` flowing in a flex header with the title. Bottom nav is hidden on the settings screen.

### 9. Animations

- Use `screen-enter` on every page root.
- Honor `prefers-reduced-motion` for any GSAP / CSS keyframe (the existing `[style*="onb-glow"]` etc. selectors in `index.css` show the pattern).
- Decorative blobs and cards should never block clicks: `pointer-events-none aria-hidden`.

### 10. What NOT to do

- Don't put large, themable content (mood arc, primary call-to-action) inside a card wrapper — let it breathe in the open air with its own background glow.
- Don't use the legacy `rgba(220,224,255,...)` palette or 1.3px letter-spacing kickers.
- Don't hardcode corner radii smaller than 20px; the system is 28px on cards, 16px on inner chips, 12px on small icon tiles.
- Don't add gradients to inactive buttons/tabs.
