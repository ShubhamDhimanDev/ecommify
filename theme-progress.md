# CandleScience-Inspired Theme Launch Plan (Single Theme First)

Status: Active execution tracker
Updated: 2026-05-15
Goal: Launch one high-quality production theme quickly, then evolve the theme system gradually.
Theme code target: `candlescience`

---

## 1) Launch Objective

Ship one polished, conversion-focused storefront theme inspired by CandleScience patterns:
- clean and premium visual style
- strong navigation and merchandising
- trustworthy product discovery and checkout flow
- mobile-first responsiveness

This launch does **not** require full no-code design freedom. It requires one stable and opinionated theme.

---

## 2) Product Strategy (Now vs Later)

### Ship now (must have)
- One theme only.
- Strong default design decisions in code.
- Limited editor controls (safe and non-breaking).
- Reliable preview + publish workflow.

### Defer (later)
- Multi-theme marketplace.
- Deep visual design editor.
- Advanced style tokens everywhere.
- Unlimited section composition and variant builder.

---

## 3) Current Reality Snapshot

What already exists in project:
- Theme schema + store overrides flow.
- Theme selector + theme editor in admin.
- Storefront theme payload loader.
- Preview query support implemented (`preview_theme`, `preview_page`).
- API tests for theme list, activate, public payload, and schema validation.

What is missing for a CandleScience-style launch:
- Dedicated `candlescience` theme artifacts and seed metadata.
- Full CandleScience section inventory for home and merchandising.
- Tight, curated admin controls for only safe merchant-editable fields.
- Final conversion polish and formal QA/performance/accessibility signoff.

---

## 3.1 Implementation Status Summary

Completed:
- Theme engine and store overrides are working.
- Theme selector/editor and activate/save workflows are working.
- Preview wiring is functional across admin iframe, API, and storefront.
- Core commerce pages exist: home, PLP, PDP, cart, checkout, header, footer.

In progress:
- Introduce `candlescience` theme schema and metadata.
- Add missing CandleScience home sections and wire section registry.
- Make `candlescience` the storefront fallback/default theme path.
- Wire page-level settings for cart, checkout summary, and product detail.

Not started:
- CandleScience-specific visual fidelity pass for PLP/PDP/cart/checkout.
- Cross-device QA checklist, Lighthouse pass, and launch runbook.

---

## 4) MVP Theme Scope (Exact)

### 4.1 Pages in v1
- Home
- Product listing (collection/search page)
- Product detail
- Cart
- Checkout
- Header
- Footer

### 4.2 Section Set in v1
Home:
- Announcement bar (optional)
- Hero (image + headline + 1-2 CTAs)
- Featured categories / collections strip
- Featured products grid
- Trust badges / value props
- Content tile row (educational/promotional)

PLP:
- Page hero
- Product grid with sorting/filter basics

PDP:
- Product media gallery
- Product summary (title, price, CTA, short bullets)
- Secondary content tabs/accordion

Global:
- Mega menu header
- Structured footer columns

### 4.3 Settings to expose in admin (minimal)
Expose only what merchants need weekly:
- Announcement text
- Nav links + mega menu groups
- Hero content + image + CTAs
- Featured section titles/subtitles
- Footer contact fields
- Optional color accents (small set)

Do not expose complex layout controls initially.

---

## 5) Phase Plan (Fastest Path)

## Phase 0 - Alignment and Lock (0.5 to 1 day)
Outcome: no ambiguity on what "done" means.

Tasks:
- Freeze reference style guide (colors, spacing, typography scale, card styles).
- Freeze v1 page/section inventory.
- Freeze non-goals (what is intentionally not customizable).
- Define acceptance criteria per page.

Deliverables:
- [x] Theme brief (this document)
- [x] Final v1 section list
- [ ] Approval checklist signed by product/design

---

## Phase 1 - Theme Foundation (1 to 2 days)
Outcome: concrete theme shell with reusable design primitives.

Tasks:
- Add theme code and metadata (`candlescience`).
- Create base style tokens for this theme.
- Implement shared primitives:
  - buttons
  - cards
  - badges
  - section containers
  - typography helpers
- Ensure responsive breakpoints and spacing rhythm.

Deliverables:
- [x] Working `candlescience` base theme skeleton in storefront (schema + section registry + components)
- [ ] Tokenized style layer for `candlescience`
- [ ] No major layout regressions

---

## Phase 2 - Core Sections and Templates (2 to 4 days)
Outcome: homepage + global components look close to target style.

Tasks:
- Build header mega menu variant.
- Build homepage hero and merchandising sections.
- Build footer columns and trust/info row.
- Wire section renderers to theme config.
- Ensure empty/default states are graceful.

Deliverables:
- [ ] Home + header + footer production-ready
- [ ] Section settings visible in admin editor
- [x] Preview parity path between admin iframe and storefront exists

---

## Phase 3 - Commerce Flows Styling (2 to 3 days)
Outcome: product browsing and purchase flow visually aligned and usable.

Tasks:
- PLP visual pass (grid, filters, sorting controls).
- PDP visual pass (gallery, pricing, CTA hierarchy).
- Cart and checkout visual consistency.
- Conversion UX checks (button visibility, sticky summary, trust cues).

Deliverables:
- [ ] End-to-end shopping path themed to CandleScience target
- [ ] Mobile checkout usability verified
- [ ] Basic accessibility pass

---

## Phase 4 - Admin Controls Hardening (1 to 2 days)
Outcome: merchants can edit key content safely.

Tasks:
- Tighten `schema.json` for `candlescience`.
- Add labels, hints, and defaults for all editable fields.
- Remove dangerous/unused editor fields.
- Add validation for required fields.

Deliverables:
- [ ] Clean editor experience for `candlescience`
- [ ] Minimal but useful controls
- [x] Lower risk of broken layouts via schema key validation

---

## Phase 5 - QA, Performance, Launch (1 to 2 days)
Outcome: production confidence.

Tasks:
- Cross-device QA (mobile/tablet/desktop).
- Browser smoke tests.
- Lighthouse/performance pass on key pages.
- SEO basics (title/meta/structured data checks).
- Fix final visual defects.
- Launch checklist and rollback notes.

Deliverables:
- [ ] Release candidate theme
- [ ] Signed-off QA checklist
- [ ] Production launch

---

## 6) Execution Checklist (Launch Critical)

### Theme and data
- [x] Theme record exists in DB (`candlescience`).
- [x] Theme schema file exists and validates.
- [ ] Default config is complete and sane.
- [x] Store-level overrides tested.

### Admin
- [x] Theme appears in selector for `candlescience` (public seeded theme).
- [x] Activate flow works.
- [x] Preview flow works with `preview_theme` and `preview_page`.
- [x] Save config updates expected fields only (schema-subset validation).

### Storefront
- [ ] Home renders all required CandleScience sections.
- [x] PLP renders themed hero + grid controls.
- [ ] PDP hierarchy is conversion-friendly.
- [ ] Header/footer match final CandleScience design target.
- [ ] Cart/checkout are responsive and readable (formal QA pending).

### Quality
- [ ] No critical runtime errors.
- [x] No blocking API errors in theme endpoints (theme feature tests pass).
- [ ] Performance acceptable on mobile.
- [ ] Basic accessibility checks pass.

---

## 6.1 Implementation Started (2026-05-15)

Started in this execution cycle:
- [x] Add new theme schema and metadata for `candlescience`.
- [x] Add missing homepage section components:
  - announcement bar
  - featured categories strip
  - trust badges / value props
  - content tile row
- [x] Wire these sections in storefront section registry.
- [x] Seed `candlescience` in DB and validate presence.

Next immediate tasks:
- [x] Add `candlescience` to DB seed data.
- [x] Validate theme list + activate still works with multiple public themes.
- [x] Switch storefront fallback/default theme to `candlescience`.
- [x] Wire page-level settings for PDP/cart/checkout from theme payload.
- [ ] Style pass for PLP/PDP/cart/checkout toward CandleScience visual target.
- [ ] Add improved preview route support for product-detail page targeting a real product URL.

---

## 7) Risks and Mitigation

Risk: Over-customizing editor in v1 causes delays.
Mitigation: keep schema minimal and opinionated.

Risk: Preview mismatch vs production view.
Mitigation: include explicit preview QA for home/products/checkout/header/footer.

Risk: Scope creep from "just one more section".
Mitigation: freeze section list in Phase 0 and defer extras to post-launch.

Risk: Visual polish takes longer than expected.
Mitigation: prioritize conversion-critical pages first (home, PLP, PDP, checkout).

---

## 8) Recommended Fast Timeline

- Day 1: Phase 0 + start Phase 1
- Day 2: Finish Phase 1
- Day 3-4: Phase 2
- Day 5-6: Phase 3
- Day 7: Phase 4
- Day 8: Phase 5 and launch

Aggressive but realistic for a focused single-theme release.

---

## 9) Post-Launch Phase 2 (After Release)

After launch stabilization, next upgrades:
- richer theme settings (global tokens + component variants)
- additional section library
- better editor affordances
- second theme based on proven patterns

---

## 10) Definition of Done for v1 Launch

Theme launch is complete when:
- one theme can be activated per store
- key pages match approved CandleScience-inspired visual direction
- merchants can update essential content without breaking layout
- preview and publish are reliable
- shopping flow is stable on desktop and mobile

---

## 11) Team Working Notes

- Keep design decisions in theme component code first.
- Keep merchant controls limited and safe.
- Avoid platform-level abstraction until this first theme is in production and validated.
- Measure conversion and usability before expanding scope.
