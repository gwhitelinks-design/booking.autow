# Responsive Design Overhaul Plan

## Overview
Apply modern CSS responsive techniques from the viewport-fit-ui approach to make the AUTOW Booking site fully responsive on all devices (mobile, tablet, desktop, ultrawide).

---

## Techniques to Apply

### 1. Responsive Font Sizes with `clamp()`
Use `clamp(min, preferred, max)` with viewport width units for scalable typography.

```css
/* Example: Heading that scales but has limits */
font-size: clamp(1.8rem, calc(7vw + 1rem), 5rem);
```

**Font Scale System:**
| Element | Min | Preferred | Max |
|---------|-----|-----------|-----|
| h1 | 1.8rem | calc(5vw + 1rem) | 3.5rem |
| h2 | 1.5rem | calc(4vw + 0.8rem) | 2.5rem |
| h3 | 1.2rem | calc(3vw + 0.6rem) | 2rem |
| body | 0.875rem | calc(1vw + 0.7rem) | 1.125rem |
| small | 0.75rem | calc(0.8vw + 0.5rem) | 0.875rem |

### 2. Relative Padding with `min()`
Use `min()` to provide desktop-friendly fixed values that scale down on mobile.

```css
/* Example: Padding that works on all screens */
padding: min(2rem, 5%);
```

**Padding Scale:**
| Use Case | Value |
|----------|-------|
| Container | min(40px, 5%) |
| Card | min(20px, 4%) |
| Button | min(18px, 4%) min(24px, 6%) |
| Section | min(30px, 6%) |

### 3. Dynamic Viewport Height (`dvh`)
Replace `vh` with `dvh` for mobile browser compatibility (accounts for address bar).

```css
/* Before */
min-height: 100vh;

/* After - with fallback */
min-height: 100vh;
min-height: 100dvh;
```

### 4. Responsive Buttons
Scale buttons using clamp() for font-size and min() for padding.

```css
.btn {
  font-size: clamp(0.875rem, calc(1vw + 0.6rem), 1.125rem);
  padding: min(16px, 4%) min(24px, 6%);
  border-radius: min(8px, 2vw);
}
```

### 5. Responsive Images
```css
img {
  max-width: 100%;
  height: auto;
  object-fit: cover;
}
```

---

## Implementation Plan

### Phase 1: Global CSS Variables & Base Styles
**File:** `app/globals.css`

1. Add CSS custom properties for the responsive scale
2. Define responsive typography classes
3. Define responsive spacing utilities
4. Define responsive button base styles
5. Add dvh fallbacks for full-height containers

### Phase 2: Fix Disclaimer Share Page Header
**File:** `app/share/disclaimer/[token]/page.tsx`

1. Move logo to left, business info to right
2. Apply responsive font sizes
3. Fix mobile layout with proper scaling

### Phase 3: Update All Share Pages
**Files:**
- `app/share/disclaimer/[token]/page.tsx`
- `app/share/estimate/[token]/page.tsx`
- `app/share/invoice/[token]/page.tsx`
- `app/share/vehicle-report/[token]/page.tsx`
- `app/share/assessment/[token]/page.tsx`

### Phase 4: Update Staff Pages
**Files:**
- `app/autow/page.tsx` (login)
- `app/autow/welcome/page.tsx`
- `app/autow/dashboard/page.tsx`
- `app/autow/booking/page.tsx`
- `app/autow/disclaimers/*.tsx`
- `app/autow/estimates/*.tsx`
- `app/autow/invoices/*.tsx`
- `app/autow/receipts/*.tsx`
- `app/autow/notes/*.tsx`
- `app/autow/jotter/page.tsx`
- `app/autow/vehicle-report/*.tsx`

---

## CSS Variables to Add

```css
:root {
  /* Responsive Font Sizes */
  --font-h1: clamp(1.8rem, calc(5vw + 1rem), 3.5rem);
  --font-h2: clamp(1.5rem, calc(4vw + 0.8rem), 2.5rem);
  --font-h3: clamp(1.2rem, calc(3vw + 0.6rem), 2rem);
  --font-body: clamp(0.875rem, calc(1vw + 0.7rem), 1.125rem);
  --font-small: clamp(0.75rem, calc(0.8vw + 0.5rem), 0.875rem);
  --font-tiny: clamp(0.65rem, calc(0.6vw + 0.4rem), 0.75rem);

  /* Responsive Spacing */
  --space-xs: min(8px, 2%);
  --space-sm: min(12px, 3%);
  --space-md: min(20px, 4%);
  --space-lg: min(30px, 5%);
  --space-xl: min(40px, 6%);

  /* Responsive Button Padding */
  --btn-padding-y: min(14px, 3.5%);
  --btn-padding-x: min(24px, 5%);
  --btn-padding-y-sm: min(10px, 2.5%);
  --btn-padding-x-sm: min(16px, 4%);
  --btn-padding-y-lg: min(18px, 4%);
  --btn-padding-x-lg: min(32px, 6%);

  /* Responsive Border Radius */
  --radius-sm: min(6px, 1.5vw);
  --radius-md: min(8px, 2vw);
  --radius-lg: min(12px, 3vw);
  --radius-xl: min(16px, 4vw);
}
```

---

## Utility Classes to Add

```css
/* Typography */
.text-h1 { font-size: var(--font-h1); }
.text-h2 { font-size: var(--font-h2); }
.text-h3 { font-size: var(--font-h3); }
.text-body { font-size: var(--font-body); }
.text-small { font-size: var(--font-small); }

/* Buttons */
.btn-responsive {
  font-size: clamp(0.875rem, calc(1vw + 0.6rem), 1.125rem);
  padding: var(--btn-padding-y) var(--btn-padding-x);
  border-radius: var(--radius-md);
}

/* Containers */
.container-responsive {
  padding: var(--space-lg);
  min-height: 100vh;
  min-height: 100dvh;
}

/* Cards */
.card-responsive {
  padding: var(--space-md);
  border-radius: var(--radius-lg);
}
```

---

## Testing Checklist

- [ ] iPhone SE (375px)
- [ ] iPhone 14 (390px)
- [ ] iPhone 14 Pro Max (430px)
- [ ] iPad Mini (768px)
- [ ] iPad Pro (1024px)
- [ ] Desktop (1440px)
- [ ] Ultrawide (2560px)

---

## Order of Implementation

1. **globals.css** - Add CSS variables and utility classes
2. **Disclaimer share page** - Fix header layout + apply responsive styles
3. **Test on mobile** - Verify disclaimer page works
4. **Roll out to all share pages** - Apply same patterns
5. **Roll out to staff pages** - Apply same patterns
6. **Final testing** - All breakpoints
7. **Deploy**
