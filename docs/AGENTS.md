# Ecommify AI Agent Rules — Cross-Service Coordination

This document defines **global AI rules** for understanding and modifying the entire Ecommify platform. It ensures AI changes respect service boundaries and maintains architectural integrity.

---

## 1. System Overview

**Ecommify** is a multi-tenant e-commerce SaaS platform with three core services:

| Service | Role | Framework | Port |
|---------|------|-----------|------|
| **`/api`** | Merchant backend + API | Laravel 13 + Sanctum | 8000 |
| **`/admin-front`** | Merchant admin panel | Next.js 16 + React 19 | 3000 |
| **`/store-front`** | Customer storefront | Next.js 16 + React 19 | 3001 |

**Database**: PostgreSQL 18 (shared, multi-tenant via `Stancl\Tenancy`)  
**Auth**: Laravel Sanctum (token-based) + 2FA support  
**Multi-Tenancy**: Slug-based + domain-based tenant resolution

---

## 2. Service Boundaries — Where to Make Changes

### 2.1 `/api` (Laravel Backend)

**Owns:**
- User authentication (registration, login, password reset, 2FA)
- Tenant lifecycle (creation, suspension, activation)
- Merchant store management
- Product catalog & variants
- Orders, carts, checkout
- Inventory management
- Payment processing
- Permissions & roles (Spatie Permission)

**AI Decision Logic:**
- If the task involves **data models, business logic, or API endpoints** → modify `/api`
- If it involves **authentication flows** (login, token generation, 2FA) → modify `/api`
- If it involves **multi-tenant data isolation** → modify `/api`
- See: [API_CONTRACT.md](./API_CONTRACT.md) for request/response formats
- See: [AUTH_FLOW.md](./AUTH_FLOW.md) for auth integration

**Entry Points:**
- `POST /api/v1/auth/register` — User registration
- `POST /api/v1/auth/login` — Authentication
- `GET /api/v1/store/{tenant_slug}/*` — Store operations (tenant-scoped)
- `GET /api/pub/v1/stores/{slug}` — Public store discovery

**File Structure:**
- `/api/app/Models` — Eloquent models (User, Tenant, Product, etc.)
- `/api/app/Http/Controllers/Api/V1` — API endpoints
- `/api/app/Http/Middleware` — Request middleware (tenancy initialization, auth)
- `/api/routes/api.php` — Route definitions

---

### 2.2 `/admin-front` (Merchant Admin Dashboard)

**Owns:**
- Merchant login & session management
- Store configuration & settings
- Product management UI
- Order management & fulfillment
- Customer insights & analytics
- Permission-based UI rendering

**AI Decision Logic:**
- If the task involves **merchant-facing UI components** → modify `/admin-front`
- If it involves **form validation or user interactions** on admin panels → modify `/admin-front`
- If it involves **displaying data fetched from `/api`** → modify `/admin-front`
- If the component is **NOT reusable** across `store-front` → keep it in `/admin-front`
- See: [FRONTEND_BOUNDARY.md](./FRONTEND_BOUNDARY.md) for UI ownership

**Never:**
- Store secrets or API keys in frontend code
- Make direct database queries
- Implement business logic (move to `/api`)

**File Structure:**
- `/admin-front/src/app` — Next.js pages & layouts
- `/admin-front/src/components` — React components (admin-specific)
- `/admin-front/src/lib/api` — API client calls to `/api`
- `/admin-front/src/hooks` — React hooks (auth, data fetching)

---

### 2.3 `/store-front` (Customer Storefront)

**Owns:**
- Product catalog display
- Shopping cart & checkout UI
- Customer account pages
- Order history
- Public store presentation

**AI Decision Logic:**
- If the task involves **customer-facing UI** → modify `/store-front`
- If it involves **product browsing, cart, or checkout flows** → modify `/store-front`
- If the component is **reusable** across both frontends → extract to shared library
- If it's **merchant-only** → move to `/admin-front`

**Never:**
- Implement complex payment logic (belongs in `/api`)
- Store authentication tokens in localStorage without sanitization
- Make assumptions about store structure (always fetch from `/api/pub/v1/stores/{slug}`)

**File Structure:**
- `/store-front/src/app/[storeSlug]` — Dynamic store routes
- `/store-front/src/components` — React components (customer-facing)
- `/store-front/src/lib/api` — Public API client calls
- `/store-front/src/lib/theme` — Theming & styling utilities

---

## 3. When to Modify Each Service

### Scenario: "Add a new product field"

1. **Add to `/api` first:**
   - Create database migration
   - Update Product model
   - Create API endpoint or modify existing one
   - Update Laravel validation rules

2. **Then update `/admin-front`:**
   - Add form field to product creation/edit form
   - Update API client call
   - Add form validation

3. **Finally update `/store-front`:**
   - Display the new field in product detail page (if customer-facing)

### Scenario: "Fix a bug in merchant login"

1. **Identify where bug occurs:**
   - If credentials aren't validated → fix in `/api` AuthService
   - If token isn't saved → fix in `/admin-front` auth hook
   - If login page doesn't redirect → fix `/admin-front` component

2. **Never duplicate logic:**
   - Write validation in `/api` (source of truth)
   - Frontend does UI validation only

### Scenario: "Add a new feature to checkout"

1. **Backend first** (`/api`):
   - Add cart/order fields
   - Implement checkout logic
   - Add payment processing

2. **Frontend** (`/store-front`):
   - Build checkout UI
   - Call the new endpoints
   - Handle responses

3. **Avoid** duplicating business logic in frontend

---

## 4. Critical Files by Service

### `/api` Critical Files
- `config/auth.php` — Authentication guards
- `config/tenancy.php` — Tenant resolution strategy
- `app/Http/Middleware/InitializeTenancyFromSlug.php` — Tenant initialization
- `app/Models/Tenant.php` — Tenant model
- `routes/api.php` — All API routes

See: [TENANCY.md](./TENANCY.md) for deep dive

### `/admin-front` Critical Files
- `src/lib/api` — All API calls to `/api`
- `src/hooks/useAuth.ts` (if exists) — Authentication management
- `src/app` — Merchant-scoped pages

### `/store-front` Critical Files
- `src/app/[storeSlug]` — Store-specific routes
- `src/lib/api` — Public API calls
- `src/app/layout.tsx` — Store detection & tenant setup

---

## 5. Authentication & Token Flow

**Important:**
- All authenticated endpoints in `/api` require `Authorization: Bearer {token}` header
- Tokens are generated by `/api/v1/auth/login` (Laravel Sanctum)
- Frontends store tokens in **memory + cookies** (not localStorage alone)
- 2FA tokens are separate and time-limited
- Tenant context is resolved from:
  1. Route parameter `{tenant_slug}` (explicit)
  2. `X-Tenant-Slug` header (for API clients)
  3. Subdomain (production)

See: [AUTH_FLOW.md](./AUTH_FLOW.md) for complete flow

---

## 6. Data Flow Rules

### Customer Browsing Store

```
store-front → GET /api/pub/v1/stores/{slug}
           → GET /api/pub/v1/stores/{slug}/categories
           → GET /api/pub/v1/stores/{slug}/products
           → GET /api/pub/v1/stores/{slug}/products/{id}
```

**No tenant middleware required** (public routes)

### Merchant Managing Store

```
admin-front → POST /api/v1/auth/login
           → (receives token)
           → PUT /api/v1/merchant/store (updates settings)
           → POST /api/v1/store/{tenant_slug}/products (create product)
           → GET /api/v1/store/{tenant_slug}/products (list)
```

**Tenant middleware required** (tenant-scoped routes)

See: [API_CONTRACT.md](./API_CONTRACT.md) for all endpoints

---

## 7. Code Review Checklist

When modifying any service, verify:

- **API Changes:**
  - [ ] Does it respect tenant isolation (tenant_id checked)?
  - [ ] Is authentication middleware applied correctly?
  - [ ] Are validation rules defined in Request class?
  - [ ] Is the route registered in `routes/api.php`?
  - [ ] Does it return JSON (not HTML)?

- **Admin Frontend Changes:**
  - [ ] Does it call the correct `/api/v1` endpoint?
  - [ ] Is the merchant authenticated before rendering sensitive content?
  - [ ] Are form inputs validated?
  - [ ] Does it handle error responses gracefully?

- **Store Frontend Changes:**
  - [ ] Does it use public endpoints (`/api/pub/v1/*`)?
  - [ ] Does it resolve store slug correctly?
  - [ ] Does it handle missing stores (404)?
  - [ ] Are images/assets CDN-friendly?

---

## 8. Common Mistakes to Avoid

| Mistake | Why It's Wrong | Fix |
|---------|---|---|
| Calling `/api/v1` endpoints from `store-front` | Requires authentication; exposes merchant data | Use `/api/pub/v1` public endpoints |
| Storing passwords in Next.js | Frontend is insecure | Hash in `/api` only |
| Using `localhost:8000` in frontend | Breaks in production/Docker | Use `process.env.NEXT_PUBLIC_API_URL` |
| Hardcoding tenant slug | Fails for dynamic stores | Pass from URL/header |
| Duplicating validation logic | Frontend + backend validation mismatch | Validate in `/api` (source of truth) |
| Modifying tenant data without tenant check | Data leakage across merchants | Always check `tenant_id` in queries |

---

## 9. When to Reference `/api` Documentation

For deep dives, reference:
- `/api/AGENTS.md` — Laravel-specific guidelines
- `/api/PAYMENT_GATEWAY_API_GUIDE.md` — Payment integration details
- Test files in `/api/tests/` — Usage examples for endpoints

**But DO NOT duplicate content** — this file links to them instead.

---

## 10. Contact & Escalation

When unsure:
1. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system overview
2. Check [API_CONTRACT.md](./API_CONTRACT.md) for endpoint signatures
3. Check [TENANCY.md](./TENANCY.md) for tenant handling
4. Read the source code (Laravel conventions are self-documenting)
5. Run tests: `php artisan test` (API), `npm run test` (frontends)

---

**Last Updated:** May 13, 2026  
**Version:** 1.0
