---
name: Predictive Sports Intelligence
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#46566c'
  on-tertiary: '#ffffff'
  tertiary-container: '#5e6e85'
  on-tertiary-container: '#e9f0ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  stat-display:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.03em
  stat-display-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.02em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  data-mono:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter-xs: 0.25rem
  gutter-sm: 0.5rem
  gutter-md: 1rem
  gutter-lg: 1.5rem
  gutter-xl: 2rem
  margin-mobile: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  max-width-content: 1600px
---

## Brand & Style

This design system embodies a modern, data-dense, analytical sports intelligence environment. Built for quantitative bettors, sports traders, and data analysts, the aesthetic is surgical, authoritative, and fast. The design movement marries Modern Corporate Precision with High-Performance FinTech: pure white elevated surface planes over cool neutral backdrops, ultra-crisp hairline borders, high-contrast typography, and calculated bursts of functional color.

The emotional signature is absolute analytical confidence. Interfaces avoid gimmicky stadium skeuomorphism or aggressive dark neon styling, opting instead for a luminous, daylight Bloomberg-terminal feel that transforms complex probabilistic models, simulated outcomes, and market movements into clear, actionable intelligence.

## Colors

The palette leverages high contrast against an immaculate light plane to ensure maximum readability across intense data tables and dynamic probability charts.

- **Primary (`#2563eb`):** Royal Blue represents analytical authority, system focus states, active sports market toggles, and primary predictive signals.
- **Secondary (`#10b981`):** Vibrant Emerald Green serves strictly as a performance indicator: positive model edges, winning probability deltas, EV+ opportunities, and upward odds movement.
- **Tertiary (`#64748b`):** Muted Slate handles peripheral metrics, table column titles, timestamps, and secondary contextual metadata.
- **Neutral (`#0f172a`):** Deep Charcoal anchors primary titles, active stat values, probability percentages, and high-priority reads.
- **Surfaces & Canvas:** The root canvas rests on cool slate-tinted off-white (`#f8fafc`), while active operational cards, analytical drawers, and flyouts sit on pure white (`#ffffff`).
- **Borders & Dividers:** Hairline structural dividers utilize slate tier 200 (`#e2e8f0`) for internal splits and slate tier 300 (`#cbd5e1`) for distinct container perimeters.

## Typography

Typography relies uniformly on **Inter** across all UI planes, prioritizing legibility, tabular figure alignment, and structural neutrality. 

All numerical data, betting lines, spreads, win rates, and implied probabilities must enforce tabular numbers via `font-feature-settings: "tnum" on, "cv05" on` to prevent layout shift during live odds and simulation updates. Small uppercase metadata tags (`label-sm`) use increased tracking (`0.04em`) to establish crisp section separators without adding visual weight.

## Layout & Spacing

The design system uses an 8-point base spatial rhythm tailored for complex sports datasets, side-by-side simulation matrices, and multi-game live boards.

- **Grid System:** 12-column responsive fluid grid anchored by a maximum desktop container width of `1600px`. Columns automatically collapse to 8 columns on tablet viewports and 4 columns on mobile viewports.
- **Density Controls:** Interface density scales dynamically. High-volume tabular odds boards compress to an internal cell padding of `8px 12px`, whereas dashboard overview widgets and insight cards expand to standard `16px` and `24px` internal padding for breathing room.
- **Responsiveness:**
  - **Desktop (≥ 1280px):** Persistent left-hand predictive filter rail, multi-market comparison matrices, full data tables.
  - **Tablet (768px – 1279px):** Filter rail collapses into an off-canvas drawer; stats grids convert into horizontally scrolling modular cards.
  - **Mobile (< 768px):** Single-column stacked cards, fixed bottom floating trade slip/actions, sticky table header labels with horizontal data panning.

## Elevation & Depth

Depth is established via tonal layering paired with razor-thin structural borders and soft, diffused slate-tinted ambient shadows. Pure white surfaces lift off the `#f8fafc` background cleanly without heavy contrast drop-shadows.

- **Level 0 (Canvas):** `#f8fafc` flat background, no shadow, no border.
- **Level 1 (Card & Module Surface):** `#ffffff` fill, 1px border (`#e2e8f0`), shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)`.
- **Level 2 (Hover States & Active Cards):** `#ffffff` fill, 1px border (`#cbd5e1`), shadow: `0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Flyouts, Context Popovers, Odds Slips):** `#ffffff` fill, 1px border (`#cbd5e1`), shadow: `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03)`.
- **Level 4 (Modals & Deep Analysis Overlays):** `#ffffff` fill, shadow: `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`.

## Shapes

The geometric architecture is balanced and contemporary, utilizing an 8px to 12px radius standard (`roundedness: 2`). This removes harsh brutalist corners without drifting into overly casual pill shapes.

- Standard inputs, buttons, metrics cards, and badges leverage an 8px radius (`rounded-md`).
- Primary content containers, intelligence panels, and full match forecast cards leverage a 12px radius (`rounded-lg`).
- Internal nested elements (e.g., probability bars, individual odds chips inside a card) maintain 6px to 8px radii to preserve nested corner symmetry.
- Circular treatment is reserved exclusively for team badges, player headshot avatars, and discrete icon buttons.

## Components

### Buttons
- **Primary:** Filled `#2563eb` with `#ffffff` text, 8px border-radius, font size 14px weight 600. On hover: `#1d4ed8`. On active: `#1e40af`.
- **Secondary / Outline:** Pure white background, 1px solid `#cbd5e1`, text `#0f172a`. On hover: `#f8fafc` background with border `#94a3b8`.
- **Edge Accent (Action):** Subtle `#ecfdf5` background, 1px solid `#a7f3d0`, text `#065f46` for auto-executing high-edge recommendations.

### Chips & Badges
- **Positive Model Edge (EV+):** Crisp `#ecfdf5` surface, 1px `#a7f3d0` border, `#047857` text, font size 11px uppercase tracking `0.04em`.
- **Market Status (Live/Upcoming):** Cool slate `#f1f5f9` surface, `#475569` text. Active live state pairs with a pulse dot in `#2563eb`.

### Lists & Odds Data Tables
- Row heights pegged to 40px (compact) or 52px (standard). Alternating rows remain white with hairline borders (`#e2e8f0`).
- Selected rows gain an instantaneous left accent border: 3px solid `#2563eb` with a soft `#eff6ff` fill.

### Checkboxes & Selection Controls
- Checkbox dimensions: 18px × 18px with a 4px radius. 1.5px border in `#cbd5e1`. Checked state transitions immediately to `#2563eb` with a crisp white checkmark.

### Input Fields & Search Bars
- Background `#ffffff`, border 1px solid `#cbd5e1`, 8px corner radius. Focused state presents an outline ring: 2px `#2563eb` at 20% opacity with a primary border transition to `#2563eb`.

### Cards & Model Modules
- Outer bounds use 12px corner radius, `#ffffff` surface, 1px border (`#e2e8f0`). Header, metric breakdown body, and footer historical trends are partitioned with 1px border dividers to maintain strict information architecture.

### Specialized Predictive Intelligence Components
- **Win Probability Bar:** Dual-split track (6px height, 3px radius), team-specific hue vs. opponent hue with animated center separator.
- **Edge Delta Pill:** Embedded statistical indicator showing line difference (e.g., `+3.4% Edge`), colored with `#10b981` typography and `#f0fdf4` backdrop.