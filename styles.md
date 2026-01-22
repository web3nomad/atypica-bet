# Styles

This document summarizes the styling system in this project, based on the current codebase.

## Sources of styles

- Tailwind config: `tailwind.config.mjs`
- Global CSS: `app/globals.css`
- Extra animations: `styles/animation.css` (not imported anywhere)
- Remotion theme: `remotion/theme.ts`
- Remotion inline styles: `remotion/components/*`, `remotion/scenes/*`
- App and component inline styles: `app/*`, `components/*`, `hooks/*`

## Brand assets

- Product name: `ioiio.bet`
- Logo file: `public/images/logoicon.jpg`
- Logo usage: `components/Header.tsx` renders it in a 32x32 container with rounded corners.

## Color system

### Core tokens

- Primary: `#18FF19` (Tailwind `primary`, Remotion `colors.primary`)
- Muted: `#666` (Tailwind `muted`)
- Base backgrounds: `bg-black` (UI) and `#050505` (Remotion `colors.bg`)
- Neutrals: `#fff`, `#000`

### Surfaces and borders

- Remotion panel: `rgba(255,255,255,0.06)`
- Remotion panel border: `rgba(255,255,255,0.14)`
- Brush background: `rgba(40, 42, 54, 0.8)` / `rgba(40, 42, 54, 0.95)` (base `#282a36`)
- Glass borders: `rgba(255,255,255,0.2)` to `rgba(255,255,255,0.35)`
- Glass shadows: `rgba(0,0,0,0.1)` to `rgba(0,0,0,0.2)`

### Accent and glow colors

- Orange glow: `rgba(255,165,0,0.2)` to `rgba(255,165,0,0.8)`
- Success glow: `rgba(72,199,142,0.6)` to `rgba(72,199,142,0.8)`
- Aurora green: `rgba(0,255,136,0.04)` to `rgba(0,255,136,0.15)` (commented as `#00FF88`)
- Light card glow: `rgba(255,179,71,0.1)` default; `rgba(255,179,71,0.4)` in `PredictionCard`

### Status colors (Tailwind defaults)

- Warning / deadline: `text-amber-400`, `border-amber-500/30`, `bg-amber-500/5`
- Positive: `text-emerald-400`, `#34d399` (charts)
- Negative: `text-red-400`, `#f87171` (charts)
- Purple accent: `text-purple-400` (Twitter post actions)

### Chart palettes

- Revenue chart gradient: `#8b5cf6` -> `#a78bfa`
- Revenue chart area: `rgba(139, 92, 246, 0.3)` -> `rgba(139, 92, 246, 0.05)`
- Axis labels: `#94a3b8`, axis lines `rgba(255,255,255,0.1)` and `rgba(255,255,255,0.05)`
- Tooltip text: `#fff`, positive `#34d399`, negative `#f87171`
- Multi-series palette (HomeClient): `#FF4444`, `#82ca9d`, `#ffc658`, `#8884d8`, `#ff7c43`, `#a28dff`
- Daily total line: `#4CAF50`
- Confetti palette: `#ff6b6b`, `#ffd93d`, `#6bcf7f`, `#4ecdc4`, `#45b7d1`, `#96ceb4`, `#ffeaa7`, `#fab1a0`, `#6b9fff`, `#a29bfe`, `#74b9ff`, `#55efc4`, `#00b894`, `#81ecec`, `#0984e3`, `#6c5ce7`

### Remotion neon background

- Background gradient: `#070707` -> `#020202`
- Neon grid lines: `rgba(24,255,25,0.12)`
- Additional neon glows: `rgba(24,255,25,0.06)` to `rgba(24,255,25,0.35)`

## Typography

- Base font: Tailwind `font-sans` applied to `<body>` (`app/layout.tsx`)
- Custom family: `font-gothic` -> `["Central Gothic", "sans-serif"]`
- Remotion fonts:
  - `display`: `"Central Gothic", "Segoe UI", Arial, sans-serif`
  - `mono`: `"IBM Plex Mono", "Consolas", "Menlo", monospace`
- Typographic style: heavy weights (`font-black`, `font-bold`), small caps and uppercase with `tracking-widest` or `tracking-[0.2em]`, frequent micro sizes (`text-[9px]` to `text-[11px]`).
- Note: no `@font-face` or external font import found, so custom fonts rely on system availability.

## Global effects and utilities (`app/globals.css`)

- Recharts brush customization: `.recharts-brush*`
- Glassmorphism: `.glass-effect` and `.glass-panel:hover`
- Cursor spotlight: `.cursor-follow`
- Glow text/icon: `.glow-text`, `.glow-icon`, `@keyframes pulse-glow`
- Success border: `.success-glow`, `@keyframes rotate-border`
- Depth layers: `.card-layered`, `.card-layer-1`..`.card-layer-4`
- Mouse-follow background: `.mouse-follow-bg`
- Stat hover effects: `.stat-orange-glow`, `.stat-blue-ring`, `.stat-blue-ring-cursor`
- Confetti effect: `.ribbon-container`, `.confetti-piece`, `@keyframes confetti-fall`
- Reduced motion handling: `@media (prefers-reduced-motion: reduce)`

## Extra animation sheet (`styles/animation.css`)

- Overlaps with global effects: `.glass-effect`, `.cursor-follow`, `.success-glow`, `.card-layer-*`, `.mouse-follow-bg`
- Additional classes: `.deadline-glow`
- Additional keyframes: `rotate`, `pulse`, `rotate-bg`
- Not imported anywhere in the app currently.

## Hooks and inline style effects

- `hooks/useLightCard.ts`: mouse-follow glow overlay (size, blur, color configurable)
- `components/AccuracyMeter.tsx`: SVG ring meter with white and primary green strokes
- `components/RevenueChart.tsx` and `app/history/HistoryClient.tsx`: ECharts styling for tooltips, axes, gradients
- `app/HomeClient.tsx`: ECharts config, chart palettes, and tooltip styling

## Remotion styling

- Theme tokens in `remotion/theme.ts` are used across scenes and components
- `remotion/components/NeonBackground.tsx` creates neon gradients, grids, and glow overlays
- Scenes (`IntroScene`, `SignalScene`, `FeaturesScene`, `CTAScene`) use translucent panels and neon green glows

## Custom class hooks with no CSS definition found

These classes appear in markup but have no selector in the repo:

- `btn-outline`
- `spotlight-card`
- `text-header`
- `letter-spacing-tight`
