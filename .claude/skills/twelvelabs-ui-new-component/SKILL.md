---
name: twelvelabs-ui-new-component
description: >-
  Use when creating a NEW UI component in an app that uses @twelvelabs-io/react
  (the TwelveLabs design system) — i.e. when no existing library component fits
  and the user has confirmed they want a new one. Ensures the new component
  composes the library's atomic components (Button, Text, icons, …), styles only
  with design tokens (no hex/rgb, raw Tailwind palette, or bare rounded-*/font-*),
  and follows the library's cva + cn + data-slot pattern, including "use client"
  for Next.js. Trigger on "create/make a new component", "build a reusable X
  component", or building UI that has no matching library component.
---

# Creating a new TLDS-conformant component

## First, gate it (don't skip)

A new component is the **last resort**, not the first move:

1. **Confirm no library component fits.** Check the catalog —
   [`../twelvelabs-ui/references/components.md`](../twelvelabs-ui/references/components.md).
   If something covers it (even via `asChild`/compound parts), use that instead.
2. **Confirm the user wants a new component.** If they haven't explicitly asked
   for one, ask before building. Don't silently hand-roll a styled `<div>` that
   re-implements an existing component.
3. If a component exists in the library repo but isn't exported yet (e.g.
   `Dialog`, `Drawer`, `Tabs`, `Table` — see the catalog's "not public yet"
   list), tell the user; they may prefer to ask the maintainers to promote it.

## Then build it to design-system standards

Four non-negotiables:

1. **Compose atomic library components.** Build from `@twelvelabs-io/react`
   primitives (`Button`, `Text`, `Separator`, `Avatar`, `Chip`, icons, …).
   Use raw HTML only as structural glue. Never re-implement a button, input,
   tooltip, etc. that the library already provides.
2. **Style only with design tokens.** Colors, radius, fonts, named sizes →
   token utilities. No `#hex`, `rgb()`, raw palette (`bg-blue-500`,
   `text-gray-700`), or bare `rounded-md`/`font-sans`. Full list:
   [`../twelvelabs-ui/references/design-tokens.md`](../twelvelabs-ui/references/design-tokens.md).
   Use `<Text>` for text. Opacity modifiers on tokens (`bg-surface-primary/90`)
   are fine.
3. **Follow the library's authoring pattern**: `cva` for variants, `cn` (exported
   from `@twelvelabs-io/react`) to merge classes, a `data-slot="<name>"`
   attribute, `className` forwarded last, and `asChild` (via
   `@radix-ui/react-slot`) when swapping the element makes sense.
4. **Add `"use client"` on line 1** if the file uses any React hook, Context, or
   a context-based Radix primitive (Next.js App Router consumers throw without
   it). Pure presentational components don't need it.

Place it in the app (e.g. `src/components/ui/<name>.tsx`). If it's broadly
reusable, suggest contributing it upstream to the library.

## Full recipe, template, and checklist

See **[`../twelvelabs-ui/references/creating-components.md`](../twelvelabs-ui/references/creating-components.md)**
for the copy-paste `cva` + `cn` + `data-slot` template, a composition example,
and the pre-finish checklist.

> These two skills ship together — keep the `twelvelabs-ui/` folder alongside
> this one so the shared references resolve.
