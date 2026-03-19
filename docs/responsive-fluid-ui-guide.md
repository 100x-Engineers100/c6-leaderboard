# Responsive & Fluid UI — Field Guide

**Context:** Discovered and applied during 100xEngineers Leaderboard project (March 2026).
**Purpose:** Reusable reference for making any Next.js / React UI fluid across all screen sizes without touching functionality.

---

## The Core Problem We Kept Hitting

Every time we checked the UI on a different screen — iPhone SE, tablet, short laptop — something was broken. Elements overflowed, things looked too big or too small, or there was a sudden visual jump at a breakpoint. The root cause was always the same:

**Hardcoded `px` values everywhere.**

```ts
// This is the pattern that breaks on every screen that isn't the design target
frameSize={300}
medalSize={180}
fontSize: 14
height: 300
padding: '48px 16px 0'
```

And the only "responsiveness" was a single breakpoint that switched between two static presets:

```ts
// Old pattern — just two static snapshots, nothing in between
if (isMobile) {
  frameSize = 160
} else {
  frameSize = 300
}
```

This breaks on 320px phones, 500px tablets, 900px small laptops — anything that isn't exactly the two sizes you designed for.

---

## The Solution: `clamp()` for Continuous Fluid Scaling

### CSS clamp
```css
/* clamp(minimum, preferred, maximum) */
font-size: clamp(10px, 1vw, 12px);
padding: clamp(24px, 4vw, 48px) clamp(12px, 2vw, 16px) 0;
width: clamp(120px, 28vw, 240px);
```

- **minimum**: never smaller than this (protects mobile)
- **preferred**: scales with viewport (vw = viewport width, vh = viewport height)
- **maximum**: never larger than this (protects desktop)

No breakpoints. No jumps. Smooth scaling at every viewport size.

### JS clamp (for pixel values passed as props)
```ts
const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(val, min), max)

// Compute from both vw AND vh so element always fits
const centerFrame = clamp(Math.min(vw * 0.22, vh * 0.58), 180, 300)
```

Use `Math.min(vw * factor, vh * factor)` so large elements are constrained by whichever dimension is smaller — critical for short-viewport screens like 1280×720 laptops.

---

## What We Changed and Why

### 1. Hero Height — `100vh` vs `100svh`

**Problem:** On mobile browsers, `100vh` = large viewport (browser chrome included). Hero section overflows, content gets clipped.

```tsx
// WRONG
className="min-h-screen"
style={{ maxHeight: '100vh' }}

// CORRECT
className="min-h-[100svh]"
style={{ maxHeight: '100svh' }}
```

`100svh` = small viewport height = visible area only (excludes browser chrome on mobile). Always use `svh` for hero sections.

---

### 2. JS-Controlled Sizes — Derive From Viewport, Not Static Presets

**Problem:** Component sizes were two static presets. Nothing worked in between.

**Solution:** Track `{ vw, vh }` in state, compute sizes with clamp on every resize.

```tsx
// Replace this
const [isMobile, setIsMobile] = useState(false)
useEffect(() => {
  const check = () => setIsMobile(window.innerWidth < 640)
  // ...
}, [])

// With this
const [vp, setVp] = useState({ vw: 1440, vh: 900 })
useEffect(() => {
  const update = () => setVp({ vw: window.innerWidth, vh: window.innerHeight })
  update()
  window.addEventListener('resize', update)
  return () => window.removeEventListener('resize', update)
}, [])

// Then compute sizes fluidly
const isMobile = vp.vw < 640

// Mobile sizes
const avH = vp.vh - 185          // subtract navbar + chrome
const rowH = avH * 0.50
const centerFrame = clamp(Math.min(vp.vw * 0.42, rowH * 0.60), 100, 165)
const sideFrame   = clamp(Math.min(vp.vw * 0.34, rowH * 0.52), 80,  135)

// Desktop sizes
const avH = vp.vh - 160
const centerFrame = clamp(Math.min(vp.vw * 0.22, avH * 0.58), 180, 300)
const sideFrame   = clamp(Math.min(vp.vw * 0.18, avH * 0.47), 150, 260)
```

---

### 3. Sub-Sizes — Derive Proportionally From One Base Value

**Problem:** Every sub-size (medal, font, padding) was hardcoded independently. At intermediate sizes they went out of proportion.

**Solution:** Pick ONE base size and derive everything else as a proportion.

```ts
// One function to rule all sub-sizes
const props = (f: number) => ({
  frameSize:      f,
  medalSize:      Math.round(f * 0.65),
  medalMarginTop: -Math.round(f * 0.06),
  nameSize:       Math.round(f * 0.10),
  pointsSize:     Math.round(f * 0.065),
  moveUpwards:    -Math.round(f * 0.08),
  innerPadding:   Math.round(f * 0.08),
})

// Spread onto component
<PixelTV {...props(centerFrame)} />
<PixelTV {...props(sideFrame)} />
```

This guarantees every element scales in lockstep. Change one number, everything adjusts proportionally.

---

### 4. Hard Thresholds — Replace With Proportional Formulas

**Problem:** Internal component thresholds create hard visual jumps.

```tsx
// WRONG — jump at 200px
gap: frameSize < 200 ? 16 : 32
height: frameSize < 200 ? 60 : 140
```

```tsx
// CORRECT — continuous, no jump
gap: Math.round(frameSize * 0.07)
height: Math.round(frameSize * 0.45)
```

---

### 5. Fixed Padding — Use CSS Clamp

```tsx
// WRONG
padding: '48px 16px 0'

// CORRECT
padding: 'clamp(24px, 4vw, 48px) clamp(12px, 2vw, 16px) 0'
```

---

### 6. Title/Logo Image Sizing

```tsx
// WRONG — fixed width or maxWidth override
width={240}
style={{ width: 'auto', maxWidth: '85vw' }}

// CORRECT — fluid clamp directly on the image
style={{ width: 'clamp(120px, 28vw, 240px)', height: 'auto' }}
```

---

### 7. Icon/Badge Sizes in Lists

```tsx
// WRONG — fixed
style={{ width: 28, height: 'auto' }}

// CORRECT — equal width + height with objectFit so all images are same rendered size
style={{ width: 'clamp(40px, 5vw, 56px)', height: 'clamp(40px, 5vw, 56px)', objectFit: 'contain' }}
```

Setting equal `width` and `height` + `objectFit: contain` forces all images to render at the same box size regardless of their intrinsic aspect ratio. Critical when you have multiple badge/medal images of different natural dimensions.

---

### 8. Background / Decorative Elements — Responsive Sizes

Fixed-size decorative elements get tiny on mobile or overflow on small screens.

```tsx
// WRONG
width: '300px'
height: '500px'

// CORRECT
width: 'clamp(120px, 18vw, 300px)'
height: 'clamp(180px, 30vw, 500px)'
```

---

## CSS Stacking Context Gotchas (Bonus)

These bit us during the easter egg / popup implementation. Important to know for any floating UI element (tooltips, dropdowns, modals).

### Problem 1: `filter` on a parent traps `position: fixed` children

If any ancestor has `filter: drop-shadow(...)` or any filter, `position: fixed` descendants are positioned relative to THAT element, not the viewport. The popup appeared behind things because the title image wrapper had a filter.

```tsx
// WRONG — filter on wrapper traps fixed children inside it
<div style={{ filter: 'drop-shadow(0 0 30px rgba(249,104,70,0.15))' }}>
  <Image ... />
  <Popup /> {/* position: fixed but trapped! */}
</div>

// CORRECT — put filter on the image itself, keep wrapper clean
<div style={{ position: 'relative' }}>
  <Image style={{ filter: 'drop-shadow(0 0 30px rgba(249,104,70,0.15))' }} />
  <Popup /> {/* position: fixed now escapes correctly */}
</div>
```

Other CSS properties that trap fixed children: `transform`, `perspective`, `will-change`, `clip-path`, `mask`.

### Problem 2: `transform` on a wrapper creates a new containing block

```tsx
// WRONG — transform traps fixed descendants
<div style={{ transform: 'translateY(-50%)' }}>
  <Popup /> {/* position: fixed but positioned relative to this div */}
</div>

// CORRECT — use margin instead of transform for offset
<div style={{ marginTop: -16 }}>
  <Popup /> {/* position: fixed now works normally */}
</div>
```

### Problem 3: `overflow: hidden` + `position: relative` can create a stacking context

When you need a popup/modal to escape a container with `overflow: hidden`, use **React Portal**:

```tsx
import { createPortal } from 'react-dom'
import { useState, useEffect } from 'react'

function MyComponent() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const popup = (
    <div style={{ position: 'fixed', zIndex: 9999, ... }}>
      ...
    </div>
  )

  return (
    <>
      {/* Portal renders directly into document.body — escapes ALL stacking contexts */}
      {mounted && open && createPortal(popup, document.body)}

      {/* Trigger stays in normal component tree */}
      <button onClick={() => setOpen(true)}>Open</button>
    </>
  )
}
```

Portal is the nuclear option — it escapes everything. Use it for any floating UI that needs to appear above complex layered components.

---

## Breakpoints: When To Use Them

`clamp()` handles sizing. Use breakpoints only for **structural layout changes**.

```tsx
// Layout change — breakpoint is correct
className="flex-col sm:flex-row"   // stacked on mobile, side-by-side on desktop
className="hidden sm:block"        // show/hide at breakpoint

// Sizing — use clamp instead
// NOT: className="text-sm sm:text-base lg:text-lg"
// YES: style={{ fontSize: 'clamp(12px, 1.5vw, 16px)' }}
```

---

## Quick Reference — Common Clamp Values

| Use case | Clamp |
|----------|-------|
| Body font | `clamp(13px, 1.2vw, 16px)` |
| Heading | `clamp(20px, 3vw, 36px)` |
| Large hero title | `clamp(32px, 6vw, 72px)` |
| Section padding (vertical) | `clamp(24px, 4vw, 64px)` |
| Section padding (horizontal) | `clamp(16px, 4vw, 48px)` |
| Card padding | `clamp(12px, 2vw, 24px)` |
| Icon/badge size | `clamp(24px, 3vw, 40px)` |
| Logo/image width | `clamp(120px, 20vw, 240px)` |
| Hero height | `100svh` (not `100vh`) |

---

## Checklist Before Shipping Any New UI

- [ ] No hardcoded `px` for anything that should scale (fonts, padding, sizes)
- [ ] Hero sections use `100svh` not `100vh`
- [ ] JS-controlled sizes use `clamp()` with both `vw` and `vh` constraints
- [ ] Sub-sizes derived proportionally from one base value
- [ ] No `<200 ? x : y` threshold patterns — use proportional formula
- [ ] Any popup/modal/tooltip uses portal if it lives inside a complex stacking context
- [ ] No `filter`, `transform`, `will-change` on ancestors of `position: fixed` elements
- [ ] Images with different aspect ratios that need equal rendering size use both `width` + `height` + `objectFit: contain`
- [ ] Test at: 320px, 375px, 414px, 768px, 1024px, 1280px, 1440px
