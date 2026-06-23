````markdown
# Design System Specification: Editorial Nurture

## 1. Overview & Creative North Star

The Creative North Star for this design system is **"The Celestial Cocoon."**

This system moves beyond functional utility to create a digital sanctuary that feels deeply grounded, protective, and human. We are rejecting the clinical "app-like" feel of standard Material or Human Interface guidelines in favor of a high-end editorial experience. By utilizing expansive negative space, intentional asymmetry, and deep tonal layering, we create an environment that feels like a "held" space.

The visual signature is defined by the tension between structured, elegant serif typography and organic, hand-drawn elements. It is modern yet ancient, sophisticated yet approachable—a quiet space for student reflection amidst the noise of academic life.

---

## 2. Colors: The Twilight Palette

Our color strategy is rooted in "Twilight Glow"—moving from deep, grounding indigos to ethereal violets and warm, comforting amber accents.

### Tonal Tectonic Strategy

- **Primary (`#bcc2ff`) & Secondary (`#d4bbff`):** These are our "Atmospheric" tones. Use them sparingly for key actions to maintain a sense of calm.
- **Tertiary (`#ffb954`):** The "Warm Amber." This represents a candle in the dark. It is reserved for high-impact moments of success, active states, or comforting callouts.
- **Background (`#121416`) & Surface Tiers:** Our canvas is dark, reducing cognitive load and eye strain for late-night student use.

### The "No-Line" Rule

**Strict Mandate:** 1px solid borders for sectioning are prohibited.
Visual separation must be achieved exclusively through background color shifts. For example, a `surface-container-low` component should sit on a `surface` background. This creates a soft, seamless transition that feels like natural terrain rather than a rigid grid.

### Glass & Gradient Implementation

To move beyond "flat" design, use Glassmorphism for floating UI elements (like navigation bars or modals).

- **Backdrop Blur:** Use a 20px–40px blur with a semi-transparent `surface-container` color.
- **Signature Gradients:** For primary CTAs, use a subtle radial gradient transitioning from `primary` to `primary_container`. This adds a "soulful" glow that feels three-dimensional and premium.

---

## 3. Typography: The Editorial Voice

We use a high-contrast pairing to balance authority with accessibility.

- **Display & Headline (Newsreader):** A sophisticated, comforting serif. Headlines should use loose tracking and generous leading to feel "airy." They serve as the poetic voice of the app.
- **Body & Title (Plus Jakarta Sans):** A highly legible, modern sans-serif. This is the "functional" voice—clear, honest, and easy to process during moments of stress.

### The Scale

- **Display-LG (3.5rem):** Reserved for hero moments or "Check-in" prompts.
- **Headline-MD (1.75rem):** For section headings, conveying a gentle authority.
- **Body-LG (1rem):** The standard for journaling or long-form reading, optimized for a comfort-first reading experience.

---

## 4. Elevation & Depth: Tonal Layering

In this design system, depth is felt, not just seen. We replace traditional "shadow-heavy" UI with a system of **Tonal Layering.**

### The Layering Principle

Stack surfaces to define hierarchy:

1. **Base Layer:** `surface`
2. **Section Layer:** `surface-container-low`
3. **Interactive/Card Layer:** `surface-container-highest`

### Ambient Shadows

When an element must float (e.g., a modal), use an "Ambient Shadow":

- **Blur:** 40px–60px.
- **Opacity:** 4%–8%.
- **Color:** Use a tinted version of `on-surface` rather than pure black to ensure the shadow feels like a soft atmospheric glow.

### The "Ghost Border" Fallback

If an element requires a boundary for accessibility (e.g., an input field), use a **Ghost Border**: the `outline-variant` token at **15% opacity**. Never use a 100% opaque border.

---

## 5. Components: Organic & Approachable

All components utilize the **Roundedness Scale** (Default: `1rem`) to ensure no sharp edges exist within the sanctuary.

### Buttons & Interaction

- **Primary Button:** Large, pill-shaped (`full` roundedness), using the Primary-to-Primary-Container gradient.
- **Secondary/Tertiary:** Minimalist. Use `on-surface` text with a `surface-container-high` background.
- **Organic Shapes:** Background decorative elements should use "blob" shapes or hand-drawn flourishes to break the rigidity of the digital screen.

### Cards & Lists

- **The Divider Ban:** Never use lines to separate list items. Use vertical white space (Spacing `4` or `6`) or subtle background shifts.
- **Surface Nesting:** A card should be a slightly higher tier than its parent container (e.g., a `surface-container-highest` card on a `surface-container-low` background).

### Input Fields

- Soft, organic containers with `md` (1.5rem) corner radius.
- **Active State:** Instead of a heavy border, use a subtle `tertiary` (Amber) outer glow to signify "warm focus."

### Custom Sanctuary Components

- **Breathing Guide:** A large, organic, pulsating shape using a `secondary` to `secondary-container` gradient.
- **Mood Pebbles:** Hand-drawn style icons for mood tracking that feel tactile and non-judgmental.

---

## 6. Do’s and Don'ts

### Do:

- **Use Asymmetry:** Place text or images off-center to create a bespoke, editorial feel.
- **Embrace the Amber:** Use the `tertiary` amber as a "reward" color—it should feel like a small spark of light.
- **Prioritize Breathing Room:** Use the Spacing Scale generously. If a layout feels "busy," double the spacing tokens between elements.

### Don't:

- **Don't use hard black (#000000):** Use the `surface` palette to maintain the "Twilight" atmosphere.
- **Don't use standard icons:** Avoid generic Material icons. Every icon should have a slightly "hand-rendered" or "organic" quality to feel approachable for students.
- **Don't use high-contrast borders:** They create a sense of confinement. Our goal is "held," not "trapped." Use tonal shifts instead.

---

_Director's Note: This design system is a living document. Its success depends on your ability to resist the "default" and lean into the "intentional." When in doubt, ask: "Does this feel like a sanctuary?"_```
````
