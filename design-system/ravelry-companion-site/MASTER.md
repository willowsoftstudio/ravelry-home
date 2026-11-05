# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** ravelry-companion-site
**Generated:** 2026-11-04 20:01:37
**Category:** Recipe & Cooking App
**Design Dials:** Variance 3/10 (Centered / Minimal) | Motion 3/10 (Subtle) | Density 5/10 (Standard)

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#9A3412` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#C2410C` | `--color-secondary` |
| On Secondary | `#FFFFFF` | `--color-on-secondary` |
| Accent/CTA | `#059669` | `--color-accent` |
| On Accent/CTA | `#000000` | `--color-on-accent` |
| Background | `#FFFBEB` | `--color-background` |
| Foreground | `#0F172A` | `--color-foreground` |
| Card | `#FFFFFF` | `--color-card` |
| Card Foreground | `#0F172A` | `--color-card-foreground` |
| Muted | `#F8F2F0` | `--color-muted` |
| Muted Foreground | `#475569` | `--color-muted-foreground` |
| Border | `#F2E6E2` | `--color-border` |
| Destructive | `#DC2626` | `--color-destructive` |
| On Destructive | `#FFFFFF` | `--color-on-destructive` |
| Ring | `#9A3412` | `--color-ring` |

**Color Notes:** Warm terracotta + fresh green

### Typography

- **Heading Font:** Varela Round
- **Body Font:** Nunito Sans
- **Mood:** soft, rounded, friendly, approachable, warm, gentle
- **Google Fonts:** [Varela Round + Nunito Sans](https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;500;600;700&family=Varela+Round&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;500;600;700&family=Varela+Round&display=swap');
```

### Spacing Variables

*Density: 5/10 — Standard*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #059669;
  color: #000000;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #9A3412;
  border: 2px solid #9A3412;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #FFFBEB;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #9A3412;
  outline: none;
  box-shadow: 0 0 0 3px #9A341220;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Minimalism & Swiss Style

**Keywords:** Clean, simple, spacious, functional, white space, high contrast, geometric, sans-serif, grid-based, essential

**Best For:** Enterprise apps, dashboards, documentation sites, SaaS platforms, professional tools

**Key Effects:** Subtle hover (200-250ms), smooth transitions, sharp shadows if any, clear type hierarchy, fast loading

### Page Pattern

**Pattern Name:** Hero-Centric Design

- **Conversion Strategy:** One primary CTA. Let the hero dominate the initial viewport without hiding the next content cue. Use a static hero and non-pulsing CTA when reduced motion is requested; provide video controls. Pause hero media offscreen/hidden and keep the final hero message and CTA static under reduced motion.
- **CTA Placement:** Hero dominant (center/bottom) + Sticky nav CTA
- **Section Order:** Full-bleed Hero (headline + visual) > Single value prop strip > Key benefit or proof > Primary CTA

---

## Motion

**Stagger List** (Subtle) — Trigger: load or scroll | Duration: 250-350ms | Easing: `power1.out`

```js
gsap.from('.list-item', { opacity: 0, y: 8, duration: 0.3, stagger: 0.03 });
```

**Framework notes:** Select items with a stable class/data-attribute (not array index) so re-renders in React don't break targeting; Use matchMedia('(prefers-reduced-motion: reduce)') to skip non-essential motion and render the final state immediately

- ✅ Keep per-item stagger delay small (0.02-0.04s) for lists longer than 10 items
- ❌ Don't stagger by more than 0.1s per item on long lists; total reveal time becomes sluggish
- ⚡ For virtualized lists, only animate items currently mounted in the DOM

---

## Anti-Patterns (Do NOT Use)

- ❌ Muted colors
- ❌ Low energy

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile

---

## Project Additions (hand-authored, pending principal approval)

> Everything above this line is ui-ux-pro-max output, generated with the commands logged in the ISA Decisions (2026-11-04). This section adds what the generator does not produce. It follows the skill's `color-dark-mode` and `dark-mode-pairing` rules: desaturated, lighter tonal variants, never inverted, with contrast tested per theme. No warm dark palette matched in the database, so these values are derived, not database matches.

### Dark Theme Palette

| Role | Light | Dark | CSS Variable |
|------|-------|------|--------------|
| Primary | `#9A3412` | `#F0A27A` | `--color-primary` |
| On Primary | `#FFFFFF` | `#1C1612` | `--color-on-primary` |
| Secondary | `#C2410C` | `#E58B5F` | `--color-secondary` |
| On Secondary | `#FFFFFF` | `#1C1612` | `--color-on-secondary` |
| Accent/CTA | `#059669` | `#34D399` | `--color-accent` |
| On Accent/CTA | `#000000` | `#052E1F` | `--color-on-accent` |
| Background | `#FFFBEB` | `#1C1612` | `--color-background` |
| Foreground | `#0F172A` | `#F5EDE6` | `--color-foreground` |
| Card | `#FFFFFF` | `#26201B` | `--color-card` |
| Card Foreground | `#0F172A` | `#F5EDE6` | `--color-card-foreground` |
| Muted | `#F8F2F0` | `#2E2621` | `--color-muted` |
| Muted Foreground | `#475569` | `#BFB3A8` | `--color-muted-foreground` |
| Border (decorative) | `#F2E6E2` | `#3D332C` | `--color-border` |
| Input border (3:1) | `#968070` | `#8A7A6E` | `--color-input` |
| Destructive | `#DC2626` | `#F87171` | `--color-destructive` |
| On Destructive | `#FFFFFF` | `#1C1612` | `--color-on-destructive` |
| Ring | `#9A3412` | `#F0A27A` | `--color-ring` |

`--color-border` is for decorative dividers only. Every form field, chip outline and other component boundary uses `--color-input`, which meets WCAG 1.4.11 (3:1). Measured ratios are in `contrast-pairs.json`.

### Photo-forward rules

- Pattern and yarn photos are the main visual element; cards use `--color-card` with a 1px `--color-border` and no heavy shadows, so the photos stay dominant.
- Every photo has non-empty alt text and an owner credit (ISA ISC-24, ISC-25, ISC-44).
- Reserve each photo's aspect ratio before it loads (CLS ≤ 0.1).

### Fonts

- Headings: Varela Round. Body and UI: Nunito Sans. Both load through `next/font` (self-hosted at build time), not the Google Fonts `@import` above, to avoid a render-blocking request.
