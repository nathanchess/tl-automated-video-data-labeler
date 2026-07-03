# Component catalog — `@twelvelabs-io/react`

Everything below is exported from the package root:
`import { Button, Text, … } from "@twelvelabs-io/react"`.

Conventions shared by most components:

- **`asChild`** — render the component's styles onto your own element (router
  `Link`, `next/link`, etc.) instead of the default tag. `<Button asChild><a …/></Button>`.
- **`className`** — merged via `cn` (tailwind-merge). Use it for layout/position
  tweaks, **not** to restyle the component. Pick a `variant`/`size` prop instead.
- **`*Variants`** exports (e.g. `buttonVariants`) are the raw `cva` recipes — use
  them only when you must apply the styles to something the component can't render.
- **Compound components** are assembled from parts (e.g. `Select` + `SelectTrigger` + `SelectContent` + `SelectItem`). Use the whole set, not a partial reimpl.

---

## Typography & links

| Import                 | Use for                      | Notes                                                                                                                                                                                                                 |
| ---------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Text`, `textVariants` | All text                     | `variant` = one of the TLDS text styles (see below). `as` picks the tag (`p`, `h1`…); `asChild` merges onto a custom element. Color inherits — set with a `text-foreground-*` token (default `text-foreground-body`). |
| `Link`, `linkVariants` | Anchors / navigational links | `asChild` to wrap a router link.                                                                                                                                                                                      |

`Text` variants: `display-large|medium|regular|small`, `title-large|medium|small`
(+ `-bold`), `paragraph-large|large-loose|medium|medium-loose|small|small-bold|mini|micromini`,
`mono-title-large|medium|small`, `mono-paragraph-large|medium|small|mini`,
`link-large|medium|small`, `all-caps|all-caps-small|all-caps-mini`.

## Actions

| Import                                                  | Use for                    | Notes                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Button`, `buttonVariants`                              | Primary actions            | `variant`: `primary` \| `primary-inverted` \| `secondary` \| `outlined-black` \| `outlined-black-inverted` \| `outlined-gray` \| `ghosted` \| `destructive`. `size`: `xl\|lg\|md\|regular\|sm\|mini`. Props: `leftIcon`, `rightIcon`, `loading`, `textAlign`, `asChild`. |
| `IconButton`, `iconButtonVariants`                      | Icon-only button           | Pass an icon as the child.                                                                                                                                                                                                                                               |
| `ToggleButtons`, `ToggleButton`, `toggleButtonVariants` | Segmented / grouped toggle | Compose `ToggleButton`s inside `ToggleButtons`.                                                                                                                                                                                                                          |

## Form controls

| Import                                                                                                                                                            | Use for                        | Notes                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `TextField`                                                                                                                                                       | Single-line text input         |                                                                                                                                 |
| `TextArea`, `TextAreaCounter`                                                                                                                                     | Multi-line input               | `TextAreaCounter` shows a character count.                                                                                      |
| `Checkbox`                                                                                                                                                        | Checkbox                       |                                                                                                                                 |
| `Radio`                                                                                                                                                           | Standalone radio dot           |                                                                                                                                 |
| `RadioGroup`, `RadioGroupItem`                                                                                                                                    | Grouped radios                 | Compose `RadioGroupItem`s in a `RadioGroup`.                                                                                    |
| `Switch`                                                                                                                                                          | On/off toggle                  |                                                                                                                                 |
| `Slider`                                                                                                                                                          | Range slider                   |                                                                                                                                 |
| `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectGroup`, `SelectItem`, `SelectScrollUpButton`, `SelectScrollDownButton`, `selectTriggerVariants` | Dropdown select                | Compound. Build: `<Select><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem/>…</SelectContent></Select>`. |
| `Feedback`, `FeedbackMessage`, `FeedbackRating`, `FeedbackField`, `FeedbackClose`                                                                                 | Thumbs/rating + message widget | Compound.                                                                                                                       |

## Overlays & menus

| Import                                                                                                                                                                 | Use for                 | Notes                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`                                                                                                       | Tooltips                | Wrap the app (or a subtree) in **`TooltipProvider`** once. Then `<Tooltip><TooltipTrigger asChild>…</TooltipTrigger><TooltipContent>…</TooltipContent></Tooltip>`. |
| `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverArrow`, `PopoverClose`, `PopoverAnchor`, `PopoverHeader`, `PopoverTitle`, `PopoverDescription`, `PopoverFooter` | Popovers / rich poppers | Compound, with header/footer/title/description parts.                                                                                                              |
| `Menu`, `MenuTrigger`, `MenuContent`, `MenuGroup`, `MenuItem`, `MenuSeparator`, `MenuPortal`, `menuItemVariants`, `menuContentVariants`, `menuSurfaceClassName`        | Dropdown menu / actions | Compound. `menuSurfaceClassName` reuses the menu surface styles elsewhere.                                                                                         |

## Disclosure

| Import                                                               | Use for                  | Notes     |
| -------------------------------------------------------------------- | ------------------------ | --------- |
| `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` | Expand/collapse sections | Compound. |

## Data display & status

| Import                                                                                                                                                                              | Use for                     | Notes                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------- |
| `Avatar`, `AvatarBadge`, `avatarVariants`                                                                                                                                           | User/entity avatar          | `AvatarBadge` overlays a status dot.                                       |
| `Banner`, `BannerIcon`, `BannerContent`, `BannerActions`, `BannerAction`, `BannerClose`, `bannerVariants`                                                                           | Inline status / info banner | Compound.                                                                  |
| `Chip`, `chipVariants`                                                                                                                                                              | Tag / pill                  |                                                                            |
| `EntityChip`, `entityChipVariants`                                                                                                                                                  | `@mention` / entity pill    | Lavender pill; `size` can `inherit` the surrounding text size.             |
| `ImageChip`, `imageChipVariants`                                                                                                                                                    | Chip with a thumbnail       |                                                                            |
| `Spinner`, `spinnerVariants`                                                                                                                                                        | Loading spinner             | (Buttons have a built-in `loading` prop — prefer that for button loading.) |
| `Pagination`, `PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationPrevious`, `PaginationNext`, `PaginationEllipsis`, `PaginationMenuItem`, `paginationItemVariants` | Pagination controls         | Compound.                                                                  |
| `ScrollArea`, `ScrollBar`                                                                                                                                                           | Custom-styled scroll region |                                                                            |
| `Separator`                                                                                                                                                                         | Divider line                |                                                                            |
| `Logo` set: `TwelveLabsLogo`, `TwelveLabsLogoMark`, `MastercardLogo`, `AwsLogo`, `GoogleCloudLogo`, `GoogleLogo`                                                                    | Brand marks                 |                                                                            |

## Icons (180+)

Exported from the package root, PascalCase + `Icon` suffix, many with a filled
variant (`*FilledIcon`): `AnalyzeIcon` / `AnalyzeFilledIcon`, `AddVideoIcon`,
`ArrowLeftIcon`, `ArrowRightIcon`, `SpinnerIcon`, etc.

- Each renders an `<svg>` with `fill="currentColor"` — **color it with a
  `text-*` token** (`text-foreground-muted`) and **size it** with `size-*`
  (`size-4`). Default size is 16px.
- To find an icon name, grep the package types:
  `grep -i "icon" node_modules/@twelvelabs-io/react/dist/index.d.mts`.

## Utilities

| Import        | Use for                                                                   |
| ------------- | ------------------------------------------------------------------------- |
| `cn`          | Merge class names (clsx + tailwind-merge). Use it in your own components. |
| `useIsMobile` | Boolean hook for responsive logic.                                        |

## Not part of the public API yet

These exist in the library repo (and may appear in its Storybook or README
examples) but are **not exported** from the package, so you cannot import them:
`Alert`, `AlertDialog`, `AspectRatio`, `Breadcrumb`, `Carousel`, `Collapsible`,
`Dialog`, `Drawer`, `Progress`, `Skeleton`, `Sonner` (toast), `Table`, `Tabs`.

If you need one of these, treat it as "no component available": tell the user it
isn't exported yet (they may want to ask the maintainers to promote it), and
either build a local component (with confirmation) or use a different approach.
