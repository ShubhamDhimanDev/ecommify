# Ecommify

Multi-tenant ecommerce SaaS platform inspired by Shopify.

This monorepo currently contains:

- `api`: Laravel 13 backend (tenant-aware API, auth, catalog, carts/orders)
- `admin-front`: Next.js 16 merchant dashboard
- `store-front`: Next.js 16 customer storefront
- `docs`: architecture, tenancy, auth, API contract, scaling notes
- `docker-compose.yml`: local orchestration (Postgres, Redis, API, both frontends)

## Vision

Build a SaaS platform where many merchants can run independent stores on shared infrastructure, with strict tenant isolation, merchant operations tooling, and customer storefront experiences.

## Current Architecture (As Implemented)

- Backend is a Laravel monolith with versioned APIs and tenant-scoped routes.
- Tenant context is initialized from route slug/header/subdomain middleware.
- Auth uses Sanctum + Fortify-based flows (register/login/reset/2FA endpoints).
- Frontend split is clear:
	- `admin-front` for merchant operations.
	- `store-front` for customer browsing and checkout flow.
- Data infrastructure in local dev: PostgreSQL + Redis.

Note: some docs discuss an eventual Go microservices direction, but the current running backend in this repo is Laravel.

## What Is Completed

### Platform Foundation

- Multi-app monorepo with Dockerized local stack.
- Central docs set for architecture, tenancy, auth, contracts, and scaling direction.
- Route/versioning structure for private (`/api/v1`) and public (`/api/pub/v1`) endpoints.

### API (Implemented)

- Auth flows:
	- Register, login, logout, me/profile update, password reset, 2FA challenge/management.
- Merchant store management:
	- Create/show/update/list merchant stores.
- Tenant-scoped commerce modules:
	- Categories CRUD.
	- Products CRUD + variants + tags + media metadata support.
	- Cart creation/items/checkout.
	- Orders listing/detail/status transitions + status event history.
	- Customers CRUD + storefront customer login/register.
- Public storefront APIs:
	- Store by slug.
	- Public categories/products/product detail by store slug.
- Payment gateway connection framework:
	- OAuth-style connect/callback/disconnect/list/test endpoints and admin UI wiring.

### Admin Front (Implemented)

- Auth screens (login/register/forgot/reset/2FA challenge) and protected dashboard.
- Store selection and active-store persistence with merchant context header.
- Merchant operations screens with API integration:
	- Categories management.
	- Products management (including variants/media workflows).
	- Customers management.
	- Orders management with status updates.
	- Payments connection UI (gateway manager + callback flow).
- Profile/security pages and tenant-aware navigation.

### Store Front (Implemented)

- Dynamic tenant routing via `[storeSlug]`.
- Public store loading and storefront shell.
- Product listing/detail pages connected to public APIs.
- Customer auth pages (login/register).
- Client-side cart context and checkout UI flow.
- Account page shell and order confirmation page.

## What Is Incomplete / Partially Implemented

### Backend Gaps

- Inventory, payment, and notification endpoints are implemented, but still need production hardening (idempotency, retries, richer validation, and dedicated test coverage).
- Payment gateway integrations now perform real external API calls; live readiness still depends on correct gateway credentials, webhook signatures, and environment setup.

### Storefront Gaps

- Customer checkout/account/order-confirmation/order-detail are now connected through persisted local order history for functional UX.
- Full server-persisted customer order history and customer-authenticated order APIs are still pending.
- Cart/order state is still primarily local-storage driven rather than fully server-synced for guest/customer sessions.

### Admin Gaps

- Previously placeholder pages (onboarding/settings/tags) now render functional screens.
- Additional UX depth is still possible (advanced settings forms, tag management operations beyond catalog-derived insights).

### Quality / Delivery Gaps

- Automated tests are mostly starter/auth-oriented; there is limited coverage for tenant-scoped commerce modules.
- Some documentation and progress notes are ahead of implementation or inconsistent with current runtime architecture.

## Improvements Recommended (Priority Order)

### 1) Complete Revenue-Critical Flows First

- Implement real payment transaction processing end-to-end.
- Replace gateway placeholder implementations with official SDK integrations and webhook verification.
- Connect checkout to real order + payment orchestration and failure handling.

### 2) Finish Tenant Commerce Core

- Implement inventory endpoints and connect stock reservation/deduction to checkout and order status.
- Add idempotency keys for checkout/payment endpoints.
- Add robust tax/shipping calculation modules per tenant settings.

### 3) Harden Multi-Tenancy and Security

- Standardize tenant context headers and naming across apps.
- Audit all scoped queries and enforce policy checks for cross-tenant safety.
- Move sensitive token/session storage toward secure cookie strategies where appropriate.

### 4) Improve Storefront Production Readiness

- Replace mock account/order/confirmation data with real API-backed views.
- Implement server-synced cart lifecycle for guest and authenticated customers.
- Add search, filtering, pagination UX polish, and empty/error states everywhere.

### 5) Increase Test Coverage and Reliability

- Add feature tests for category/product/cart/order/customer/public storefront APIs.
- Add tenancy isolation tests (cross-tenant access denial cases).
- Add frontend integration tests for critical merchant/customer journeys.

### 6) Align Docs With Runtime Truth

- Keep `README`, `progress.md`, and `docs` synchronized with current implementation.
- Clearly separate "implemented now" from "planned roadmap" sections to avoid drift.

## Local Development

Run full stack:

```bash
docker compose up --build
```

Default local URLs:

- Admin dashboard: `http://localhost:3000`
- Storefront: `http://localhost:3001`
- API: `http://localhost:8000`

## Suggested Next Milestone

"Commerce Completion Sprint": ship real checkout + payment + inventory integration with full tenant-safe tests.

That milestone unlocks the most important Shopify-like capability: reliable money flow and fulfillment per tenant store.
