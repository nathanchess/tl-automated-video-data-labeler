---
name: twelvelabs-ui
description: >-
  Use when building or editing ANY UI in an app that depends on
  @twelvelabs-io/react (the TwelveLabs React component library) — pages, forms,
  dialogs, menus, layouts, or Tailwind styling. Enforces three rules: (1) reach
  for a library component before hand-rolling markup, (2) style only with the
  design tokens (colors, radius, typography, sizing) — never hardcoded hex/rgb,
  raw Tailwind color palette, or bare rounded-*/font-* utilities, and (3) when
  no library component fits, STOP and ask the user before creating one. Trigger
  on JSX/TSX work, "build a screen/form/card/modal", styling questions, or any
  import from @twelvelabs-io/react.
---

# Building UI with @twelvelabs-io/react

This app consumes **`@twelvelabs-io/react`**, the TwelveLabs design system (TLDS).
Your job when touching UI is to make it look and behave like the design system —
by **using its components and its tokens**, not by re-creating them.

## The decision flow — follow it every time

```
Need a UI element?
│
├─ 1. Does a library component cover it?  → references/components.md
│      YES → import it from "@twelvelabs-io/react" and use it.
│            Compose, don't fork: use `asChild`, compound parts, and props.
│      NO  → go to 3.
│
├─ 2. Styling it?  → ONLY design tokens (references/design-tokens.md)
│      Colors, radius, typography, named sizes = token utilities. Never
│      hardcode hex/rgb, raw Tailwind palette (bg-blue-500), or bare
│      rounded-md / font-sans.
│
└─ 3. No component fits?  → STOP. Ask the user.
       Do NOT silently hand-roll a styled <div> that re-implements a
       component. Ask whether to create a new local component. If they say
       yes, follow the `twelvelabs-ui-new-component` skill (compose atoms +
       tokens). If a TLDS component for it exists in the repo but isn't
       exported yet (see references/components.md), say so too.
```

## Rule 1 — Use library components first

Before writing markup, check **[references/components.md](references/components.md)**
for a component that matches. The library exports ~30 components plus 180+ icons.

- Import from the package root: `import { Button, Text, Tooltip } from "@twelvelabs-io/react"`.
- **Compose, don't reinvent.** Need a button that's a router link? `<Button asChild><Link to="/x">…</Link></Button>` — most components accept `asChild` and merge onto your element. Compound widgets (Select, Menu, Popover, Tooltip, Accordion, Banner, Pagination, Feedback) ship as a set of parts you assemble.
- **Use props/variants, not overrides.** Pick `variant`/`size` props (e.g. `<Button variant="destructive" size="lg">`) instead of fighting the styles with `className`. `className` is for layout/spacing tweaks, not for restyling the component.
- **Don't hand-roll an equivalent.** No raw `<button className="…">`, custom checkbox, ad-hoc dropdown, or DIY tooltip when the library has one.
- Some components need a provider/wrapper (e.g. `TooltipProvider` near the app root). See the catalog notes.
- **Verify the export exists.** Some components live in the repo but aren't part of the public API yet (e.g. `Dialog`, `Drawer`, `Tabs`, `Table`). If an import isn't exported, treat it as "no component available" (step 3). Check `node_modules/@twelvelabs-io/react/dist/index.d.mts` when unsure.

## Rule 2 — Style only with design tokens

Every color, corner radius, font, and named size must come from a TLDS token
utility. Full lists in **[references/design-tokens.md](references/design-tokens.md)**.

| Concern     | ✅ Do                                                                                                       | ❌ Don't                                                               |
| ----------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Color       | `bg-surface-body`, `text-foreground-muted`, `border-border-secondary`, `text-tl-gray-700`, `ring-misc-ring` | `bg-[#1d1c1b]`, `text-gray-700`, `bg-blue-500`, `bg-black`, `rgb(...)` |
| Radius      | `rounded-dialog`, `rounded-menu`, `rounded-button-medium`, `rounded-tlds-2`                                 | `rounded-md`, `rounded-lg`, `rounded-[12px]`                           |
| Typography  | `<Text variant="title-medium">`, or `font-tl-sans` / `font-tl-mono`                                         | `font-sans`, `font-bold` alone, a different web font                   |
| Named sizes | `h-tl-size-input-md`, `w-tl-layout-side-panel-width`                                                        | `h-[40px]`, magic pixel heights for known elements                     |

- **Opacity modifiers on tokens are fine and encouraged:** `bg-surface-primary/90`, `ring-misc-ring/50`.
- **Generic layout spacing** uses the standard Tailwind scale (`p-2`, `gap-1`, `flex`, `grid`) — the TLDS spacing tokens mirror the same 4px scale, so that's consistent. Use the `tl-spacing-*` / `tl-size-*` utilities when a design references a _named_ token or a specific component size.
- **Prefer `<Text>` for all text** so you inherit the correct family/size/leading/weight. Color is left to inherit — set it with a `text-foreground-*` token on the element or an ancestor. The default text color is `text-foreground-body` (not `text-foreground-primary`, which is light text for dark surfaces).
- **Cursor: `default` by default** (follows Radix Themes). Library components already set the right cursor — interactive controls keep `cursor-default` (a hand/pointer cursor is _not_ used just because something is clickable) and only links use `cursor-pointer`. Don't override this with `className="cursor-pointer"` on a `Button`, menu item, checkbox, etc.; reserve `cursor-pointer` for real navigation links.

## Rule 3 — No component? Ask before creating one

If nothing in the catalog fits, **do not improvise a styled component**. Stop and
ask the user, e.g.:

> "There's no `@twelvelabs-io/react` component for an X. Want me to create a new
> local component for it (composing the library's atoms + tokens), or handle it
> another way?"

Only after they confirm, build it using the **`twelvelabs-ui-new-component`**
skill: compose existing atomic components, use design tokens, and follow the
library's `cva` + `cn` + `data-slot` pattern. If the element is broadly reusable,
suggest contributing it upstream to the library.

## Setup sanity check (if styles look wrong)

The consuming app must import Tailwind v4 **first**, then the package CSS, in its
global stylesheet:

```css
@import "tailwindcss";
@import "@twelvelabs-io/react/tokens.css";
@import "@twelvelabs-io/react/theme.css";
```

If token utilities (`bg-surface-body`, `rounded-dialog`) don't resolve, this
import (or its order) is usually the cause.

## References

- **[references/components.md](references/components.md)** — full catalog: what to import, what each is for, composition notes, and what's not public yet.
- **[references/design-tokens.md](references/design-tokens.md)** — every token utility (color / radius / spacing / size / font) and the do/don't rules.
- **[references/creating-components.md](references/creating-components.md)** — the authoring recipe (also used by the `twelvelabs-ui-new-component` skill).
