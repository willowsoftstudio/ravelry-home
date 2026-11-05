# Workspace Page Overrides

> **PROJECT:** ravelry-companion-site
> **Generated:** 2026-11-04 20:01:37
> **Page Type:** General

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout Overrides

- **Max Width:** 1200px
- **Layout:** Responsive grid

### Spacing Overrides

*Dense tier, taken from the generator's density 8 output (2026-11-04). The generator ignores `--density` for `--page` files, and treats density 4–7 as one "Standard" tier, so the density 7 asked for here would have matched Master exactly. See the ISA Learning entry.*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `2px` / `0.125rem` | Tight gaps |
| `--space-sm` | `4px` / `0.25rem` | Icon gaps, inline spacing |
| `--space-md` | `8px` / `0.5rem` | Standard padding |
| `--space-lg` | `12px` / `0.75rem` | Section padding |
| `--space-xl` | `16px` / `1rem` | Large gaps |
| `--space-2xl` | `24px` / `1.5rem` | Section margins |
| `--space-3xl` | `32px` / `2rem` | Hero padding |

- Scope: /me and its tabs (Projects, Queue, Stash, Favorites, Library) and /me/projects/[id].
- Dense spacing never shrinks touch targets: every control keeps a 44×44px hit area (ISA ISC-13), and adjacent targets keep at least 8px between them.

### Typography Overrides

- No overrides — use Master typography

### Color Overrides

- No overrides — use Master colors

### Component Overrides

- No overrides — use Master component specs

---

## Page-Specific Components

- No unique components for this page

---

## Recommendations

- Refer to MASTER.md for all design rules
- Add specific overrides as needed for this page
