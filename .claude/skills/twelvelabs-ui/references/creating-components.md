# Creating a new component (TLDS-conformant)

Use this **only after** confirming with the user that no `@twelvelabs-io/react`
component covers the need (see the `twelvelabs-ui` skill, Rule 3). A new
component should look like it belongs in the design system.

## Principles

1. **Compose atomic library components.** Build from `@twelvelabs-io/react`
   primitives (`Button`, `Text`, `Separator`, `Avatar`, `Chip`, icons, …)
   rather than re-implementing them. A `ConfirmDialog` composes `Button` +
   `Text`; a `StatCard` composes `Text` + `Separator` + a token surface. Reach
   for raw HTML elements only for the structural glue between atoms.
2. **Style only with design tokens.** Colors, radius, fonts, and named sizes use
   token utilities — see [design-tokens.md](design-tokens.md). No hex/rgb, no raw
   Tailwind palette, no bare `rounded-md`/`font-sans`.
3. **Match the library's authoring pattern** (below): `cva` for variants, `cn`
   for class merging, a `data-slot` attribute, and `asChild` when the consumer
   may want to swap the element.
4. **Add `"use client"` when needed** (mandatory for Next.js App Router
   consumers). Put it on line 1 if the file uses any React hook, Context, or a
   Radix primitive that uses context (accordion, dialog, dropdown, popover,
   select, tabs, tooltip, …) or `vaul`. Pure presentational components
   (only `cva`/`cn`/`Slot`, no hooks/context) don't need it.
5. **Cursor: `default` by default** (follows Radix Themes). Give interactive
   controls `cursor-default` — a hand/pointer cursor is _not_ used just because
   something is clickable (matches native OS behavior). Reserve `cursor-pointer`
   for real navigation links (an `<a>` / `Link`). Use `cursor-not-allowed` for
   disabled states and `cursor-text` for text inputs. Don't slap `cursor-pointer`
   on buttons, menu items, checkboxes, switches, etc.
6. **Place it in your app**, e.g. `src/components/ui/<name>.tsx`. If it's broadly
   reusable, suggest contributing it upstream to `@twelvelabs-io/react` instead.

## Template

```tsx
"use client" // include only if this file uses hooks / context / a Radix primitive

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import * as Slot from "@radix-ui/react-slot" // optional — only if you support asChild
import { cn } from "@twelvelabs-io/react"

const statCardVariants = cva(
  // Base classes — all visual values are tokens.
  "flex flex-col gap-tl-1 border bg-surface-card border-border-secondary rounded-tlds-3 p-tl-4 font-tl-sans",
  {
    variants: {
      tone: {
        default: "text-foreground-body",
        muted: "text-foreground-muted",
      },
      size: {
        sm: "p-tl-3 gap-tl-half",
        md: "p-tl-4 gap-tl-1",
      },
    },
    defaultVariants: { tone: "default", size: "md" },
  },
)

function StatCard({
  className,
  tone,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof statCardVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div"
  return (
    <Comp
      data-slot="stat-card"
      data-tone={tone}
      className={cn(statCardVariants({ tone, size }), className)}
      {...props}
    />
  )
}

export { StatCard, statCardVariants }
```

## Composition example (atoms, not reinvention)

```tsx
import { Button, Text } from "@twelvelabs-io/react"

function ConfirmBar({ onCancel, onConfirm }: { onCancel(): void; onConfirm(): void }) {
  return (
    <div className="flex items-center justify-end gap-tl-2 border-t border-border-secondary pt-tl-3">
      <Button variant="ghosted" onClick={onCancel}>
        Cancel
      </Button>
      <Button variant="destructive" onClick={onConfirm}>
        Delete
      </Button>
    </div>
  )
}
```

Note: `Button` and `Text` are used directly — no re-styled `<button>`, no
hardcoded colors. Tokens handle the divider and spacing.

## Checklist before finishing

- [ ] Reuses library components/icons for every part that has one.
- [ ] Zero hardcoded colors / raw palette / hex / `rgb()`.
- [ ] Radius via `rounded-tlds-*` or a semantic radius token (no bare `rounded-md`).
- [ ] Text via `<Text>` or `font-tl-sans`/`font-tl-mono`.
- [ ] `cn` for class merge; `className` prop forwarded last so callers can extend.
- [ ] `data-slot="<name>"` present; `asChild` supported if swapping the element makes sense.
- [ ] `"use client"` on line 1 iff the file uses hooks/context/Radix.
- [ ] Typechecks (`tsc`) and lints clean.
