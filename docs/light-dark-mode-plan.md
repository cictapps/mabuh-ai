# Light And Dark Mode Plan

## Summary

Add a v1 light/dark mode system for MabuhAi that defaults to the user's device
preference while allowing an explicit in-app override. The Settings control should
offer three choices: `System`, `Light`, and `Dark`.

Dark mode remains the canonical MabuhAi identity: the current Twilight / Celestial
Cocoon visual language should stay intact. Light mode should be a softer daytime
variant for students using the app in bright environments, not a stark white
redesign.

## Key Changes

- Add an app-wide appearance preference with three values: `system`, `light`, and
  `dark`.
- Persist the preference locally only. Do not sync it to Supabase because it is a
  per-device comfort setting.
- Resolve `system` with `prefers-color-scheme`.
- Apply the resolved mode before React paints so splash, auth pages, and protected
  routes do not flash the wrong theme.
- Update `index.html` from dark-only metadata to dual theme support:
  `color-scheme` should support light and dark, and `theme-color` should match the
  resolved mode.
- Split app color tokens in `src/index.css` so `:root` owns the light palette and
  `.dark` owns the existing dark Twilight palette.
- Keep Journey cosmetics such as `dusk`, `dawn`, and `meadow` separate from
  app-wide appearance mode.

## Implementation Plan

- Add a small theme module, for example `src/lib/theme.ts`, that owns:
  - `ThemePreference = "system" | "light" | "dark"`
  - a localStorage key, for example `mabuh-theme-preference`
  - safe preference read/write helpers
  - system preference resolution
  - DOM application via `document.documentElement.classList`
  - `meta[name="theme-color"]` updates
- Add a tiny inline startup script in `index.html` that reads the saved preference,
  resolves the active mode, applies `.dark` when needed, and sets the first
  `theme-color` before the app bundle loads.
- Add a React hook, for example `useThemePreference`, that:
  - exposes the saved preference and resolved mode
  - updates localStorage when the user changes preference
  - listens for system preference changes while preference is `system`
  - reapplies the DOM class and theme color when needed
- Add an `Appearance` section to `SettingsScreen` using the existing Journey-style
  segmented-control treatment.
- Use labels and copy that stay warm and non-clinical:
  - `System`: "Match this device"
  - `Light`: "Soft daytime"
  - `Dark`: "Twilight"
- Do not change Tauri capabilities or CSP because this feature adds no external
  hosts, filesystem paths, or native APIs.

## Design Guidance

- Preserve the current dark tokens as closely as possible.
- Light mode should use warm off-white and soft lilac surfaces, muted plum text,
  and the existing amber/lilac accent relationship.
- Avoid pure white, pure black, harsh borders, inactive gradients, and bright
  clinical contrast.
- Prefer shared tokens over screen-specific color overrides.
- Audit hard-coded dark colors incrementally, prioritizing shared components and
  major screens first.
- Keep mobile-first behavior, safe-area padding, max-width app shell, reduced
  motion support, and existing card radii unchanged.

## Test Plan

- Unit-test theme preference resolution for `system`, `light`, and `dark`.
- Unit-test localStorage fallback behavior when storage is unavailable.
- Verify system preference changes update the app only when preference is
  `system`.
- Manually verify first paint on `/`, `/login`, `/signup`, `/help`, and `/chatbot`
  has no visible theme flash.
- Manually verify Settings can switch among `System`, `Light`, and `Dark`.
- Run the CI-equivalent checks:
  - `npm run format:check`
  - `npm run lint`
  - `npm run typecheck`
  - `npm test`
  - `npm run build`

## Assumptions

- `System` is the default preference for new installs.
- Appearance preference is local-only and can differ across devices.
- Dark mode remains the primary brand expression.
- Light mode is a comfort/accessibility option for daytime use.
- Journey reward themes are not renamed or merged with app appearance mode.
