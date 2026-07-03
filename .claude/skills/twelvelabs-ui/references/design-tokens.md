# Design tokens — `@twelvelabs-io/react`

`theme.css` registers TLDS tokens as Tailwind v4 theme values, so they're
available as normal utilities. **Use these instead of hardcoded values.**

The golden rules:

- **Color → token utilities only.** Never `#hex`, `rgb()`, raw Tailwind palette
  (`bg-blue-500`, `text-gray-700`, `bg-black`), or `bg-[...]`. Opacity modifiers
  on tokens are fine: `bg-surface-primary/90`, `ring-misc-ring/50`.
- **Radius → TLDS radius utilities.** Use the semantic/`tlds` ones below, not
  bare `rounded-md/lg/xl` (the library deliberately leaves Tailwind's default
  radius scale untouched, so those won't match the design system).
- **Font family → `font-tl-sans` / `font-tl-mono`.** Never `font-sans`/`font-serif`
  or another web font. Prefer the `<Text>` component for actual text.
- **Named sizes → `tl-size-*` / `tl-layout-*` utilities** for known elements
  (inputs, switches, side panel, navbar…). Generic layout spacing can use the
  standard 4px Tailwind scale (`p-2`, `gap-4`) — the TLDS spacing tokens mirror it.

Color utilities work with every color prefix: `bg-`, `text-`, `border-`, `ring-`,
`fill-`, `stroke-`, `from-`/`to-`/`via-`, `outline-`, `divide-`, `ring-offset-`,
`shadow-` (where applicable), etc.

---

## Semantic colors (prefer these)

**Border** — `border-secondary`, `border-primary`, `border-disabled`,
`border-destructive`
→ e.g. `border border-border-secondary`.

**Surface** (backgrounds) — `surface-body`, `surface-white`, `surface-card`,
`surface-primary`, `surface-primary-inverse`, `surface-primary-hover`,
`surface-secondary`, `surface-secondary-hover`, `surface-muted`,
`surface-disabled`, `surface-destructive`, `surface-tooltip`,
`surface-status-success`, `surface-status-warning`, `surface-status-error`,
`surface-embed`, `surface-analyze`, `surface-search`
→ e.g. `bg-surface-card`.

**Foreground** (text/icons) — `foreground-body`, `foreground-primary`,
`foreground-primary-inverse`, `foreground-secondary`, `foreground-muted`,
`foreground-subtle`, `foreground-disabled`, `foreground-destructive`,
`foreground-tooltip`, `foreground-overlay`, `foreground-status-success`,
`foreground-status-warning`, `foreground-status-error`, `foreground-status-info`,
`foreground-embed`, `foreground-analyze`, `foreground-search`,
`foreground-accent-purple`
→ **Default text color is `text-foreground-body`** (dark text for the light
`surface-body`). Reach for it whenever you just need normal text; use
`foreground-muted` / `foreground-subtle` for de-emphasized text. Note
`foreground-primary` is **not** the default — despite the name it's the
light/near-white foreground for _dark_ surfaces (e.g. text on `surface-primary`).
Use it only on a dark background, otherwise you'll get near-invisible text on a
light page.

**Misc** — `misc-overlay`, `misc-border-light`, `misc-border-medium`,
`misc-ring`, `misc-status-success`, `misc-status-warning`, `misc-status-error`,
`misc-status-info`
→ e.g. `ring-misc-ring/50` for focus rings, `bg-misc-overlay` for scrims.

## Primitive colors (use only when no semantic token fits)

- Neutrals: `tl-black`, `tl-white`, `tl-gray-50`, `-100`, `-200`, `-300`,
  `-400`, `-500`, `-600`, `-700`.
- `tl-search-*`: `lightest-purple`, `light-purple`, `purple`, `dark-purple`,
  `lightest-lavender`, `light-lavender`, `lavender`, `dark-lavender`.
- `tl-embed-*`: `lightest-green`, `light-green`, `green`, `dark-green`,
  `lightest-blue`, `light-blue`, `blue`, `dark-blue`.
- `tl-analyze-*`: `lightest-orange`, `light-orange`, `orange`, `dark-orange`,
  `lightest-peach`, `light-peach`, `peach`, `dark-peach`.
- `tl-system-color-*`: `…-red`, `…-green`, `…-blue`, `…-orange`,
  `…-emeraldgreen`, `…-indigo` families, each with `lightest-/light-/(base)/dark-`.
- `tl-master-brand-*`: `green`, `orange`, `peach`, `pink` families with
  `lightest-/light-/(base)/dark-`.

→ e.g. `text-tl-gray-700`, `bg-tl-search-light-lavender`.

## Radius (`rounded-*`)

- Scale: `rounded-tlds-1`, `-2`, `-3`, `-4`, `-5`, `-6`, `-32`, `-40`, `-48`,
  `-1-half`, `-2-half`.
- Semantic / component: `rounded-dialog`, `rounded-menu`, `rounded-tooltip`,
  `rounded-textarea`, `rounded-spinner`, `rounded-nav-item`, `rounded-new-button`,
  `rounded-pagination-item`, `rounded-usage-bar`, `rounded-dropzone(-hover)`,
  `rounded-video-thumbnail(-hover)`,
  `rounded-button-{mini,small,regular,medium,large,x-large}(-hover)`,
  `rounded-input-{sm,md,lg}`, `rounded-select-{sm,md,lg}`,
  `rounded-chip-button`, `rounded-chip-container`, `rounded-chip-root`,
  `rounded-switch-track`, `rounded-switch-track-on-md`,
  `rounded-switch-thumb-{sm,md}`, `rounded-menu-item-{sm,md,lg}`,
  `rounded-slider-thumb(-hover)`.

## Fonts

- `font-tl-sans` — Milling (primary UI font).
- `font-tl-mono` — IBM Plex Mono.

(For text, prefer `<Text variant="…">`, which sets family + size + leading +
weight together. See the component catalog for the variant list.)

## Spacing (`p-`, `m-`, `gap-`, `space-`, etc. with `tl-*`)

`tl-0`, `tl-1`, `tl-2`, `tl-3`, `tl-4`, `tl-5`, `tl-6`, `tl-8`, `tl-10`,
`tl-12`, `tl-16`, `tl-px`, `tl-half`, `tl-1-half`, `tl-2-half`, `tl-3-half`,
`tl-4-half`
→ e.g. `gap-tl-2`, `p-tl-4`. (These mirror the standard 4px scale.)

**Layout** (`h-`, `w-`, `min-/max-`): `tl-layout-navbar-height`,
`tl-layout-side-panel-width`, `tl-layout-play-top`, `tl-layout-play-bottom`,
`tl-layout-generate-top-mobile`
→ e.g. `w-tl-layout-side-panel-width`.

## Sizes (`h-`, `w-`, `size-` with `tl-size-*`)

`tl-size-pagination-item`, `tl-size-input-{sm,md,lg}`,
`tl-size-menu-item-{md,lg}`, `tl-size-select-{sm,md,lg}`,
`tl-size-switch-{sm-w,sm-h,md-w,md-h,thumb-sm,thumb-md}`,
`tl-size-checkbox-{sm,md}`, `tl-size-radio-{outer,inner}`,
`tl-size-chip-{sm,md}-max-h`
→ e.g. `h-tl-size-input-md`.

---

## Quick examples

```tsx
// Card surface with token color, radius, and border
<div className="bg-surface-card border border-border-secondary rounded-tlds-3 p-tl-4">
  <Text variant="title-medium" className="text-foreground-body">Title</Text>
  <Text variant="paragraph-small" className="text-foreground-muted">Subtitle</Text>
</div>

// Status pill
<span className="bg-surface-status-success text-foreground-status-success rounded-tlds-1 px-2 py-tl-half">
  Ready
</span>

// Icon colored + sized via tokens
<AnalyzeIcon className="size-4 text-foreground-analyze" />
```

If a token utility doesn't resolve to anything, the app is likely missing the
`@import "@twelvelabs-io/react/theme.css"` (after `@import "tailwindcss"`).
