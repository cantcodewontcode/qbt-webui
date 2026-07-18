# DESIGN_SYSTEM.md

Reference for qbt-webui's visual language — a "Liquid Glass" (Apple iOS/macOS 26 style) interface built with vanilla CSS custom properties, no framework, no build step. This document exists so new work stays consistent with what's already here. **When adding or changing UI, reach for a token/pattern below before inventing a new value.**

All values here are extracted directly from `app.css` §1 (`:root`) — they are the ground truth, not aspirational. If this doc and `app.css` ever disagree, `app.css` wins; fix this doc.

---

## 0. Design direction

- **Liquid Glass, cool-neutral.** Frosted/translucent materials (`backdrop-filter: blur()`) for the navigation layer only — toolbar, sidebar, menus, sheets, the Inspector panel. Never applied to content (rows, forms, modal bodies).
- **Cool-neutral palette**, not warm. All neutrals are blue-gray (`--raw-neutral-*`), not the warm/copper-amber palette an earlier pass used — confirmed zero warm hex codes remain anywhere in the stylesheet.
- **Apple HIG grounding**, applied concretely rather than as decoration:
  - The sidebar reads as a floating inset card (per Apple's own Split View diagram); the canvas and Inspector are flush peers, not floating panels themselves.
  - The Inspector's tab bar is a segmented control (à la Numbers/Keynote's Table/Cell/Text/Arrange picker), not a browser-style underline tab bar.
  - Status is conveyed with plain colored text where possible, not filled chips — a saturated pill competes for attention with actual content.
- **"A calibrated instrument," not a dashboard.** (From `IDEAS.md`.) Numeric readouts use tabular figures and a dedicated data font role; density and restraint over decoration.

---

## 1. Color

### 1.1 Raw palette (reference only — never use directly in components)

| Token | Value |
|---|---|
| `--raw-neutral-000` | `#FFFFFF` |
| `--raw-neutral-100` | `#F7F7F9` |
| `--raw-neutral-200` | `#EEEEF1` |
| `--raw-neutral-300` | `#E3E3E8` |
| `--raw-neutral-400` | `#C9C9D1` |
| `--raw-neutral-500` | `#AEAEB6` |
| `--raw-neutral-600` | `#6E6E76` |
| `--raw-neutral-700` | `#3A3A3F` |
| `--raw-neutral-800` | `#1C1C1E` |
| `--raw-blue-050` | `#E9F0FC` |
| `--raw-blue-300` | `#6398EA` |
| `--raw-blue-400` | `#3D7CE0` |
| `--raw-blue-500` | `#2C5FB8` |
| `--raw-pine-050` / `--raw-pine-400` | `#E3F0E8` / `#15803D` (success) |
| `--raw-ember-050` / `--raw-ember-400` | `#F6EBE0` / `#B45A00` (warning) |
| `--raw-fault-050` / `--raw-fault-400` | `#F8E6E7` / `#C6303A` (critical) |
| `--raw-signal-050` / `--raw-signal-400` | `#E2EEF2` / `#0D6E96` (info) |

### 1.2 Semantic tokens (use these)

**Surface**
| Token | Value | Use |
|---|---|---|
| `--color-bg-app` | `#EEEEF1` | App background |
| `--color-bg-surface` | `#F7F7F9` | Raised content surfaces |
| `--color-bg-overlay` | `#FFFFFF` | Modals, context menus, popovers, toasts — anything opaque above content |
| `--color-bg-inset` | `#E3E3E8` | Recessed/track backgrounds (was used for the segmented-control track; now superseded there by a translucent tint, see §2.2) |
| `--color-bg-row-alt` | `#F1F1F4` | Alternating row backgrounds |

**Text**
| Token | Value | Use |
|---|---|---|
| `--color-text-primary` | `#1C1C1E` | Primary content text |
| `--color-text-secondary` | `#6E6E76` | Labels, secondary text |
| `--color-text-header` | `#6E6E76` | Column/section headers |
| `--color-text-disabled` | `#AEAEB6` | Disabled/placeholder text |
| `--color-text-inverse` | `#FFFFFF` | Text on filled/accent backgrounds |

**Border**
| Token | Value | Use |
|---|---|---|
| `--color-border` | `#C9C9D1` | Default borders |
| `--color-border-strong` | `#AEAEB6` | Emphasis borders, neutral focus rings |
| `--color-border-subtle` | `#E3E3E8` | Faint dividers |

**Accent** — reserved for primary actions, links, and focus only. Selection/navigation highlight state uses the Glass tokens (§1.3), not accent.
| Token | Value |
|---|---|
| `--color-accent` | `#3D7CE0` |
| `--color-accent-hover` | `#6398EA` |
| `--color-accent-pressed` | `#2C5FB8` |
| `--color-accent-subtle` | `#E9F0FC` |

**State** (each has a subtle background pair for chip-style contexts)
| State | Color | Subtle bg |
|---|---|---|
| Success (seeding) | `--color-success` `#15803D` | `--color-success-subtle` `#E3F0E8` |
| Warning (stalled/queued) | `--color-warning` `#B45A00` | `--color-warning-subtle` `#F6EBE0` |
| Critical (error) | `--color-critical` `#C6303A` | `--color-critical-subtle` `#F8E6E7` |
| Info (verifying/metadata) | `--color-info` `#0D6E96` | `--color-info-subtle` `#E2EEF2` |

Prefer plain colored **text** in dense inspector-style lists (see `.state-text--*` in §6); reserve the `-subtle` background pairs for genuine chip/badge UI elsewhere.

### 1.3 Glass material tiers

This is the part most likely to be gotten wrong by reaching for the nearest-sounding token instead of the right one. Five opacity tiers, all white, differentiated **only** by how much of the content behind should show through:

| Token | Opacity | Used by | When to use it |
|---|---|---|---|
| `--glass-bg` | 0.38 (lightest/most transparent) | `#sidebar`, `#col-headers`, `.toast` | Ambient chrome that should feel like it's barely there |
| `--glass-bg-strong` | 0.55 | `.search-input`, `.toolbar-group`, `.context-menu`, `.speed-popover`, modals' glass chrome | The default/standard interactive glass surface — use this unless you have a specific reason not to |
| `--glass-bg-subtle` | 0.78 (most opaque) | `#right-panel` (Inspector) | A quiet, refined material for a panel meant to be read for a while, not glanced at — matches how Apple's own inspectors (Numbers, Keynote) read: barely-there blur, mostly opaque |
| `--glass-bg-selected` | 0.48 | `.nav-indicator` (sliding selection pill), `.settings-nav__item--active` | Selected/active state highlight |
| `--glass-bg-hover` | 0.75 | Hover states on glass buttons/rows | Hover feedback on an already-glass surface |

Supporting tokens: `--glass-border` (`rgba(255,255,255,0.6)`), `--glass-blur` (20px, primary), `--glass-blur-sm` (8px, secondary/nested), `--glass-saturate` (180%), `--glass-highlight` (`inset 0 1px 0 rgba(255,255,255,0.55)` — the top-edge glass sheen, add to any glass surface's `box-shadow`), `--glass-shadow` / `--glass-shadow-sm` (ambient drop shadows for floating glass elements).

**Compounding opacity on nested glass**: if a glass element sits *inside* another glass element, its own opacity value compounds visually with the parent's. `.toolbar-group .btn-ghost:hover` deliberately does not use `--glass-bg-hover` (0.75) for exactly this reason — the button already sits on the toolbar-group's own 0.55 fill, so 0.75 there would read more opaque than the same value used standalone. When nesting glass, eyeball the *combined* result against a flat reference (e.g. Add Torrent's button), not the token's nominal value in isolation.

---

## 2. Shape

### 2.1 Radius scale

| Token | Value | Use |
|---|---|---|
| `--radius-none` | 0px | |
| `--radius-sm` | 2px | Legacy/rarely used — most UI should use the glass radii below instead |
| `--radius-md` | 3px | |
| `--radius-lg` | 4px | |
| `--radius-glass-sm` | 10px | Small glass surfaces — buttons, edit-icon buttons, nav-indicator pills |
| `--radius-glass-md` | 14px | Large glass surfaces — sidebar, list area, panels |
| `--radius-pill` | 9999px | Fully rounded — search input, segmented control track/indicator, tag/status pills |

Concentric radius principle: an inner element's corner radius should be smaller than its container's by roughly the padding between them, so corners feel nested rather than competing. This is why glass surfaces mostly step between `-sm` and `-md`, not jump straight to `-pill` unless the shape is meant to be a true pill (search fields, segmented controls).

### 2.2 Borders and other shape tokens

| Token | Value |
|---|---|
| `--border-width-default` | 1px |
| `--border-width-strong` | 2px |
| `--border-width-accent` | 3px (selected row left edge) |

---

## 3. Typography

| Token | Value | Use |
|---|---|---|
| `--font-ui` / `--font-data` | `'Instrument Sans', ui-sans-serif, system-ui, -apple-system, sans-serif` | Currently identical; kept as separate roles in case data ever wants a monospace/tabular-only face |
| `--weight-regular` | 400 |
| `--weight-medium` | 500 | Default for labels |
| `--weight-semibold` | 600 | Headings, section titles, emphasis |
| `--type-display` | 24px | |
| `--type-heading-1` | 18px | Prominent headings — e.g. the Inspector's name heading |
| `--type-heading-2` | 14px | |
| `--type-heading-3` | 12px | |
| `--type-body-lg` | 14px | |
| `--type-body` | 13px | Default body text |
| `--type-body-sm` | 12px | Secondary/dense body text — most info-row values |
| `--type-label` | 11px | |
| `--type-caption` | 11px | |
| `--type-data` | 12px | |
| `--type-data-lg` | 13px | |
| `--type-data-sm` | 11px | |
| `--type-code` | 11px | Monospace-styled values (paths, hashes) via `.info-value--mono` |

Numeric/data values that need column alignment should get `font-variant-numeric: tabular-nums` (see `.log-entry__time`, row speed/size cells) — this is a pattern, not a token, apply it directly.

---

## 4. Spacing

| Token | Value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-12` | 48px |
| `--space-16` | 64px |

Common idiom: a panel's own padding (e.g. `.inspector-panel { padding: var(--space-4) }`) already insets its children — a child element (like `.info-row`) should **not** add its own matching horizontal padding on top, or it double-counts into an unintended larger inset and misaligns against unpadded siblings (this exact bug happened once with `.info-row` vs the Inspector's name heading — watch for it).

---

## 5. Shadows

| Token | Value | Use |
|---|---|---|
| `--shadow-none` | `none` | |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,.10), 0 1px 1px rgba(0,0,0,.07)` | Subtle lift |
| `--shadow-md` | `0 4px 16px rgba(0,0,0,.14), 0 2px 4px rgba(0,0,0,.08)` | Popovers, dropdowns |
| `--shadow-lg` | `0 16px 48px rgba(0,0,0,.20), 0 4px 12px rgba(0,0,0,.10)` | Modals, sheets |

For glass surfaces, prefer `--glass-shadow` / `--glass-shadow-sm` (§1.3) plus `--glass-highlight` over these — the flat shadows are for opaque (non-glass) elevated surfaces.

---

## 6. Motion

| Token | Value | Use |
|---|---|---|
| `--duration-instant` | 0ms | |
| `--duration-fast` | 80ms | Micro-interactions — hover color changes, focus states |
| `--duration-default` | 150ms | Standard transitions |
| `--duration-slow` | 220ms | Panel slides, larger movements (e.g. the Inspector's open/close transform) |
| `--duration-deliberate` | 350ms | |
| `--ease-default` | `cubic-bezier(0.25, 0.10, 0.25, 1.00)` | General-purpose |
| `--ease-enter` | `cubic-bezier(0.00, 0.00, 0.20, 1.00)` | Things entering/appearing (panel open, indicator sliding in) |
| `--ease-exit` | `cubic-bezier(0.40, 0.00, 1.00, 1.00)` | Things leaving |
| `--ease-snap` | `cubic-bezier(0.34, 1.56, 0.64, 1.00)` | Overshoot/bounce, used sparingly |

All motion respects `prefers-reduced-motion` (§24 in `app.css`) — new animated properties must be added to that block's override too.

**Animating a sliding panel**: only transition `transform`, never `width`. A stray `width`/`transition: width` rule once silently won the cascade over the real transform-based open/close rule (same selector, later in file, equal specificity) and broke the slide animation entirely — the `transitionend` listener that hides content after close waits specifically for `propertyName === 'transform'`, so anything that changes the visual state via `width` will never fire it correctly.

---

## 7. Icons

Three helper functions in `js/icons.js`, pick based on source:

| Helper | ViewBox | Fill/stroke | When |
|---|---|---|---|
| `icon(paths, size, cls)` | `0 0 24 24` | `stroke="currentColor"`, `fill="none"` | Simple line-icon glyphs (lines, circles, polylines) |
| `iconP(pathData, size, cls, extra)` | `0 0 256 256` | `fill="currentColor"` | Single-path filled icons (Phosphor-style exports) |
| `appleIcon(paths, vbW, vbH, size, cls)` | Custom (per source) | `fill="currentColor"` | Pasted real SF Symbols SVG exports — preserves the source's own aspect ratio, sized by height. **Strip any literal `fill="black"` from pasted SF Symbol markup and let this wrapper apply `currentColor`**, or the glyph won't tint with the rest of the UI. |

Size tokens: `--icon-sm` 14px, `--icon-md` 16px, `--icon-lg` 20px — these are guidance for typical contexts, not hard rules; icons embedded in a specific small control (e.g. a 24px edit button) may need a size below these.

A genuine SF Symbol export like `xmark.circle.fill` is a single filled path where the "hole" (e.g. the X) is cut via the path's own winding — this renders correctly against *any* background at *any* size. A hand-rolled two-layer approximation (colored circle background + separately-stroked glyph on top) is a worse fallback: the stroke reads as an invisible hairline once shrunk into a small badge. Prefer the real SF Symbol path when one exists for the glyph you need.

---

## 8. Structural dimensions

| Token | Value |
|---|---|
| `--height-toolbar` | 48px |
| `--height-row` | 72px (content is ~59px tall; the extra ~13px is deliberate breathing room, not a mistake) |
| `--height-colheader` | 32px |
| `--width-inspector` | 360px |
| `--width-sidebar` | 200px |

## 9. Z-index stack

| Token | Value | Layer |
|---|---|---|
| `--z-base` | 0 | |
| `--z-raised` | 10 | |
| `--z-sticky` | 100 | Toolbar, column headers |
| `--z-overlay` | 200 | Inspector panel |
| `--z-modal` | 300 | Modals, context menus, popovers |
| `--z-toast` | 400 | Toasts (always on top) |

---

## 10. Component patterns

Reusable idioms established across the app — follow these rather than inventing a new approach for a similar problem.

**Sliding nav-indicator pill.** A single shared `.nav-indicator` element (positioned via `positionNavIndicator()` in `js/sidebar.js`) animates to the active tab/chip's position instead of each item toggling its own background — used by sidebar filter tabs, category nav, mobile filter chips, log severity chips, sort-sheet options, and the Inspector's segmented tab bar (`.nav-indicator--h` variant for horizontal layouts). Reach for this rather than writing bespoke per-item active-state CSS whenever adding a new set of exclusive-choice tabs/chips.

**Segmented control (Inspector tab bar).** A rounded pill track (`background: color-mix(in srgb, var(--raw-neutral-700) 8%, transparent)`, translucent tint, not the flat `--color-bg-inset`) containing a solid `--color-accent`-filled sliding indicator (`#inspector-tab-indicator`, height matched exactly to the tab buttons — a mismatch reads as the pill floating inside its row instead of filling it) and tab buttons whose divider borders only render *between two unselected neighbors* (`:not(:last-child):not(.inspector-tab--active):not(:has(+ .inspector-tab--active))` — a single positive selector, not a base-rule-plus-override, to avoid a specificity fight where the override silently loses). Model this pattern for any future exclusive-choice control that should read as a native macOS/iOS segmented control rather than a web tab bar.

**Info-row / section grouping (Inspector General tab).** Data is grouped into `.inspector-section` blocks, each with an optional `.inspector-section-title` (only titled sections get a `border-top` divider — the untitled first section doesn't, and a divider means "new section," never "new row"). Group by what the data *is* (static facts vs. live transfer numbers vs. network/swarm facts), not by superficial similarity — a category vague enough to include unrelated fields (an earlier "Location & Activity" grouping bundled a static filesystem path with historical timestamps) is a sign the grouping needs to be redrawn, not relabeled.

**Persistent vs. hover-revealed affordances.** Prefer persistent (always-visible) small icon buttons for actions users will look for immediately (e.g. the Inspector's rename/set-location edit buttons) over hover-only reveal — hover-only affordances are easy to miss and don't work on touch. When used, edit-style icon buttons are right-aligned and vertically centered with the field they act on, no background circle on hover (just the glyph darkening to `--color-text-primary`), and do reset `:focus-visible { outline: none }` (see below).

**Status as text, not chips.** For a single status word in a dense list (e.g. `State: Seeding`), prefer plain colored text (`.state-text--*` classes, color only, no background) over a filled badge/chip — a saturated pill is the loudest element on the screen and competes with actual content for attention. Reserve filled chips for contexts where the "badge-ness" itself is meaningful (e.g. a genuine notification count).

**Button focus rings.** Every custom button-like element needs an explicit `:focus-visible` treatment — clicking any `<button>` gives it native focus, and Safari's default focus ring will trace it, which reads as an unwanted border around whatever was just clicked (this has bitten this app twice: once on toolbar icon buttons, once on the Inspector's segmented-control tabs). Either reset to `outline: none` outright (simple icon glyphs where the color/state change is feedback enough) or replace with a neutral ring (`box-shadow: 0 0 0 2px var(--color-border-strong)`, see `.icon-btn:focus-visible`) — never leave the browser default blue ring in place.

**Backdrop-filter + border-radius + box-shadow don't compose safely in Safari.** An element with all three (a pill-shaped glass surface with an outer focus-ring box-shadow) can render visible seams/gaps in the shadow right at the curved corners — a real WebKit compositing bug, not a CSS mistake. Fix: put the box-shadow ring on a plain, non-blurred *wrapper* around the glass element (e.g. `.search-wrap:focus-within` holds the ring; `.search-input` itself keeps only its `border-color` change on focus), never on the backdrop-filtered element directly.

---

## 11. Extending this system

Before adding a new value:
1. **Reuse an existing token if one is close enough.** A new one-off hex/px value that's 90% the same as an existing token is a consistency bug waiting to happen.
2. **If a new token is genuinely needed**, add it to `:root` in the right themed group (§1 in `app.css`), not inline in a component rule — and add it to this document in the matching section above.
3. **New component patterns** (a genuinely new reusable idiom, not a one-off) belong in §10 above, with a one-line rationale — future you (or another agent) needs the *why*, not just the *what*, especially for anything non-obvious like the nested-glass-opacity compounding rule or the Safari backdrop-filter bug.
