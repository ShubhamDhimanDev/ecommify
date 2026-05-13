---
name: Signature Framework
colors:
  surface: '#fdf8f8'
  surface-dim: '#ddd9d8'
  surface-bright: '#fdf8f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3f2'
  surface-container: '#f1edec'
  surface-container-high: '#ebe7e6'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#444748'
  inverse-surface: '#313030'
  inverse-on-surface: '#f4f0ef'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#585f6c'
  on-secondary: '#ffffff'
  secondary-container: '#dce2f3'
  on-secondary-container: '#5e6572'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1c1b1a'
  on-tertiary-container: '#868382'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#dce2f3'
  secondary-fixed-dim: '#c0c7d6'
  on-secondary-fixed: '#151c27'
  on-secondary-fixed-variant: '#404754'
  tertiary-fixed: '#e6e2df'
  tertiary-fixed-dim: '#cac6c4'
  on-tertiary-fixed: '#1c1b1a'
  on-tertiary-fixed-variant: '#484645'
  background: '#fdf8f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 64px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.1em
  button:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  section-gap-lg: 120px
  section-gap-sm: 64px
---

## Brand & Style

The design system is engineered for high-end Direct-to-Consumer (DTC) storefronts, emphasizing editorial clarity and quiet luxury. The personality is sophisticated, confident, and intentionally spacious, allowing product photography to serve as the primary visual driver.

The aesthetic follows a **High-End Minimalist** direction. It avoids trendy gimmicks in favor of timeless proportions, razor-sharp alignment, and a "gallery-like" presentation. Every element is designed to feel curated rather than manufactured. The UI recedes to the background, ensuring that the tenant's brand identity and merchandise remain the focal point.

Key characteristics:
- **Generous Negative Space:** Deep breathing room between sections to elevate perceived value.
- **Editorial Typography:** High-contrast pairings that evoke the feel of a luxury lookbook.
- **Micro-Interactions:** Subtle, low-friction transitions (e.g., soft fades and slight scale changes) that provide a tactile, premium feel.

## Colors

The color architecture is built on a foundation of "Functional Neutrals." By utilizing CSS variables for all key slots, the system supports effortless tenant overrides while maintaining a balanced tonal hierarchy.

- **Primary:** Reserved for the most critical actions and brand signatures. It is a deep, near-black that provides maximum contrast.
- **Surface:** A warm, off-white used to define containership without the harshness of a secondary border. It adds a "paper-like" quality to the digital experience.
- **Muted/Secondary:** Used for secondary information and de-emphasized labels, ensuring the visual hierarchy remains clear.
- **Borders:** Extremely light and hairline-thin (1px) to provide structure without cluttering the viewport.

## Typography

This design system employs an editorial typographic scale. The juxtaposition of a high-contrast serif for storytelling and a geometric sans-serif for utility creates a balanced, premium atmosphere.

- **Headlines:** Use Playfair Display for all major headings. For large display titles, use slight negative letter-spacing to tighten the visual impact.
- **Body:** Plus Jakarta Sans provides exceptional legibility at smaller sizes and maintains a modern, friendly character.
- **Labels:** Small caps and increased letter spacing should be used for category tags, overlines, and breadcrumbs to distinguish them from body copy.
- **Scaling:** On mobile devices, display sizes should compress significantly to avoid awkward word breaks while maintaining the serif's elegance.

## Layout & Spacing

The layout philosophy follows a **Fixed-Fluid Hybrid Grid**. Content is constrained to a maximum width of 1440px to ensure optimal line lengths and image presentation on ultra-wide displays, while margins and gutters remain fluid on smaller viewports.

- **Rhythm:** An 8px base unit governs all dimensions.
- **Sectioning:** Vertical rhythm is intentionally exaggerated. Use `section-gap-lg` (120px) between distinct homepage modules to create an "airy" feel that prevents the user from feeling overwhelmed.
- **Grid:** A 12-column grid is used for desktop, 6-column for tablet, and 2-column for mobile. For product listings, a 2-column mobile layout is preferred over 1-column to maintain a "catalog" density.
- **Safe Areas:** Horizontal margins on desktop are generous (64px) to frame the content like a piece of art.

## Elevation & Depth

This design system avoids heavy shadows and traditional skeuomorphism. It communicates depth through **Tonal Layering** and **Subtle Motion**.

- **Surfaces:** Depth is created by placing white cards (`#ffffff`) on the warm surface background (`#f8f7f5`). This creates "implied elevation" without needing a shadow.
- **Shadows:** When shadows are necessary (e.g., dropdowns or floating carts), use a "Whisper Shadow": `0 10px 30px rgba(0,0,0,0.04)`. It should be barely perceptible, serving only to separate the element from the layer below.
- **Hover States:** Instead of deep shadows, use a subtle 4px vertical lift (translateY) and a soft increase in shadow spread to indicate interactivity on product cards and buttons.

## Shapes

The shape language is **Soft-Architectural**. Elements use a very small corner radius to take the "edge" off the design while maintaining a structured, formal appearance.

- **Standard Radius:** 4px (0.25rem) for buttons, inputs, and cards. This is just enough to feel modern without becoming "bubbly."
- **Badges/Tags:** Use a pill-shape (full radius) for status indicators or promotional tags to differentiate them from functional UI components.
- **Media:** Product imagery should maintain sharp (0px) or very soft (2px) corners to preserve the integrity of the professional photography.

## Components

### Buttons
- **Primary:** Solid background (`--color-primary`), white text. No border. Rectangle with 4px radius. High-padding (16px 32px) for a luxurious footprint.
- **Secondary:** Transparent background with a 1px solid border (`--color-primary`).
- **Ghost:** No background or border. Text-only with an underline that appears or expands on hover.

### Input Fields
- Understated style: 1px solid border (`#e5e7eb`) on all sides or a "minimalist" bottom-border only style for specific tenants. 
- Focus state: Border color shifts to `--color-primary` with no "glow" or outer rings.

### Cards
- **Product Cards:** Image-first. No outer border. Typography is left-aligned underneath. On hover, the image should subtly scale (1.05x) within its container (overflow-hidden).
- **Cart Drawers:** Utilize a "Slide-over" pattern from the right. Use a backdrop-blur (10px) on the obscured page content to maintain focus.

### Elegant Badges
- Small, uppercase text. Backgrounds should be highly desaturated (e.g., light sage, soft beige) or simply the `--color-surface` with a thin border.

### Additional Components
- **Announcement Bar:** Thin, high-contrast bar at the very top of the viewport for shipping or promo alerts.
- **Breadcrumbs:** Minimalist text links separated by a thin slash (/) or chevron.