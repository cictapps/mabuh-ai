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
