# Ecommify Architecture — System Design & Request Lifecycle

This document explains the **complete system design** of the Ecommify platform, how services interact, and how a request flows through the system.

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet (Customers)                     │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
          ┌─────────▼─────────┐   ┌──────────▼──────────┐
          │ Store-Front       │   │ Admin-Front         │
          │ (Customer UX)     │   │ (Merchant UX)       │
          │ localhost:3001    │   │ localhost:3000      │
          │ Next.js           │   │ Next.js             │
          └─────────┬─────────┘   └──────────┬──────────┘
                    │                        │
                    │ HTTPS/HTTP/XHR         │
                    │ API Calls              │ API Calls
                    │                        │
          ┌─────────▼────────────────────────▼─────────┐
          │      Laravel Backend API                   │
          │      localhost:8000                        │
          │  ┌────────────────────────────────────┐    │
          │  │  /api/v1              (Tenant Scoped)   │
          │  │  ├─ auth/*            (Login, Register) │
          │  │  ├─ merchant/*        (Store Management)│
          │  │  └─ store/{slug}/*    (Tenant Data)     │
          │  │                                         │
          │  │  /api/pub/v1          (Public)          │
          │  │  └─ stores/{slug}/*   (Product Listing)│
          │  │                                         │
          │  │  /admin/v1            (Super Admin)     │
          │  │  └─ tenants/*         (Platform Admin)  │
          │  └────────────────────────────────────┘    │
          │                                            │
          │  ┌────────────────────────────────────┐    │
          │  │  Middleware Stack                   │    │
          │  │  ├─ TenancyBootstrapper            │    │
          │  │  ├─ InitializeTenancyFromSlug      │    │
          │  │  ├─ EnsureTenantIsActive           │    │
          │  │  ├─ EnsureUserBelongsToTenant      │    │
          │  │  └─ Sanctum Auth                   │    │
          │  └────────────────────────────────────┘    │
          │                                            │
          │  ┌────────────────────────────────────┐    │
          │  │  Models & Services                  │    │
          │  │  ├─ Tenant (Multi-tenant root)     │    │
          │  │  ├─ User (Authentication)          │    │
          │  │  ├─ Product (Catalog)              │    │
          │  │  ├─ Order (Commerce)               │    │
          │  │  ├─ Cart (Shopping)                │    │
          │  │  ├─ Merchant (Store management)    │    │
          │  │  └─ [Other models...]              │    │
          │  └────────────────────────────────────┘    │
          └─────────────────┬──────────────────────────┘
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
    ┌─────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │ PostgreSQL │   │    Redis    │   │  File Store │
    │ (Data)     │   │  (Cache/Q)  │   │  (Images)   │
    │ localhost: │   │  localhost: │   │  (Minio)    │
    │    5432    │   │    6379     │   │             │
    └────────────┘   └─────────────┘   └─────────────┘
```

---

## 2. Component Roles

### 2.1 Store-Front (Customer Storefront)

**Purpose:** Public-facing customer storefront where shoppers browse and purchase

**Endpoints Used:**
- `GET /api/pub/v1/stores/{slug}` — Load store info
- `GET /api/pub/v1/stores/{slug}/categories` — Browse categories
- `GET /api/pub/v1/stores/{slug}/products` — Search products
- `GET /api/pub/v1/stores/{slug}/products/{id}` — Product details
- `POST /api/v1/carts` — Create cart
- `POST /api/v1/auth/login` — Customer login (optional)

**Key Files:**
- `src/app/[storeSlug]/layout.tsx` — Store detection
- `src/app/[storeSlug]/page.tsx` — Homepage
- `src/lib/api/public.ts` — Public API client
- `src/components/ProductCard.tsx` — Product display

**Authentication:** Optional (guest checkout or registered customer)

**Tenant Resolution:** From URL slug `[storeSlug]` → passed to API as `X-Tenant-Slug` header

### 2.2 Admin-Front (Merchant Dashboard)

**Purpose:** Merchant-facing admin panel for store management

**Endpoints Used:**
- `POST /api/v1/auth/login` — Merchant authentication
- `GET /api/v1/merchant/store` — Load merchant's store
- `PUT /api/v1/merchant/store` — Update store settings
- `GET /api/v1/store/{tenant_slug}/products` — List products
- `POST /api/v1/store/{tenant_slug}/products` — Create product
- `GET /api/v1/store/{tenant_slug}/orders` — View orders

**Key Files:**
- `src/app/dashboard/layout.tsx` — Admin layout
- `src/lib/api/authenticated.ts` — Authenticated API client
- `src/hooks/useAuth.ts` — Auth state management
- `src/components/ProductForm.tsx` — Forms for management

**Authentication:** Required (Sanctum token)

**Tenant Resolution:** From authenticated user's `tenant_id` → passed as `{tenant_slug}` in route

### 2.3 Laravel API Backend

**Purpose:** Single source of truth for all business logic and data

**Key Responsibilities:**
1. **Authentication** — User registration, login, password reset, 2FA
2. **Tenant Management** — Multi-tenant isolation, activation/suspension
3. **Business Logic** — Orders, inventory, payments
4. **Data Validation** — All business rules enforced server-side
5. **Permissions** — Role-based access control (Spatie Permission)

**Route Namespacing:**

| Route | Purpose | Auth | Tenant Scope |
|-------|---------|------|-------------|
| `/api/v1/auth/*` | Login/register | Optional | Public (register/login)<br>Required (profile, logout) |
| `/api/v1/merchant/*` | Merchant store ops | Required (Sanctum) | Implicit (from user) |
| `/api/v1/store/{slug}/*` | Tenant-scoped ops | Optional (some routes) | Explicit (slug parameter) |
| `/api/pub/v1/*` | Public store data | None | Public |
| `/api/v1/admin/*` | Platform admin | Required + super_admin role | Central |

---

## 3. Request Lifecycle — Customer Browsing Store

### Step 1: Customer navigates to `https://store.example.com`

```javascript
// store-front Next.js middleware resolves store slug from URL
// Slug: "nike"
```

### Step 2: Store-Front Layout Initializes

```javascript
// src/app/[storeSlug]/layout.tsx
const { storeSlug } = params;

// Fetch store info
const response = await fetch(
  `${NEXT_PUBLIC_API_URL}/pub/v1/stores/${storeSlug}`
);
const { store } = await response.json();

// Context provides store data to all child components
```

### Step 3: API Request Reaches Laravel

```
Request: GET /api/pub/v1/stores/nike
Headers: Accept: application/json

Middleware Stack (no auth required):
  1. Cors middleware
  2. API versioning
  (No tenant initialization yet — public route)
```

### Step 4: PublicController Handles Request

```php
// api/app/Http/Controllers/Api/V1/PublicController.php
public function storeBySlug(string $slug): JsonResponse
{
    $store = Tenant::query()
        ->where('slug', $slug)
        ->where('status', 'active')
        ->first();

    if (!$store) {
        abort(404, 'Store not found');
    }

    return response()->json(['store' => $store]);
}
```

### Step 5: Response Returns to Frontend

```json
{
  "store": {
    "id": "uuid-1",
    "name": "Nike Store",
    "slug": "nike",
    "status": "active",
    "settings": { ... }
  }
}
```

### Step 6: Store-Front Displays Products

```javascript
// Once store is loaded, fetch products
const products = await fetch(
  `${NEXT_PUBLIC_API_URL}/pub/v1/stores/nike/products?per_page=20`
);
```

---

## 4. Request Lifecycle — Merchant Login & Store Update

### Step 1: Merchant Enters Credentials

```javascript
// admin-front login page
const response = await fetch('/api/v1/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
```

### Step 2: API Authentication

```php
// api/routes/api.php
Route::post('auth/login', LoginController::class)->name('login');

// api/app/Http/Controllers/Api/V1/Auth/LoginController.php
// Validate credentials via AuthService
// Generate Sanctum token
// Check for 2FA requirement
```

### Step 3: Token Returned

```json
{
  "user": { "id": "...", "email": "merchant@store.com", "tenant_id": "nike-uuid" },
  "access_token": "1|abcdefghijk...",
  "token_type": "Bearer",
  "expires_at": "2026-05-14T12:00:00Z"
}
```

### Step 4: Admin-Front Stores Token

```javascript
// src/hooks/useAuth.ts
localStorage.setItem('token', response.access_token);
localStorage.setItem('user', JSON.stringify(response.user));

// Set auth context for entire app
setUser(response.user);
```

### Step 5: Merchant Updates Store Name

```javascript
// admin-front form submission
const response = await fetch(
  `/api/v1/store/${user.tenant_id}/settings`,
  {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-Slug': user.tenant_id
    },
    body: JSON.stringify({ name: 'Nike Air' })
  }
);
```

### Step 6: API Initializes Tenancy

```php
// api/app/Http/Middleware/InitializeTenancyFromSlug.php
$slug = $request->header('X-Tenant-Slug'); // "nike-uuid"
$tenant = Tenant::where('slug', $slug)->first();

// Initialize Stancl Tenancy context
tenancy()->initialize($tenant);
// All subsequent queries are tenant-scoped
```

### Step 7: Authentication & Authorization Check

```php
// Middleware stack:
// - auth:sanctum → Validates token
// - EnsureUserBelongsToTenant → Ensures user.tenant_id matches slug
// - EnsureTenantIsActive → Ensures tenant.status == 'active'

// Sanctum automatically adds user() context
$user = auth()->user(); // Merchant who made request
```

### Step 8: Controller Updates Data

```php
// api/app/Http/Controllers/Api/V1/StoreController.php
public function update(UpdateStoreRequest $request): JsonResponse
{
    $tenant = tenant(); // Scoped to current tenant
    $tenant->update($request->validated());
    
    return response()->json(['store' => $tenant]);
}
```

### Step 9: Response to Admin-Front

```json
{
  "store": {
    "id": "nike-uuid",
    "name": "Nike Air",
    "slug": "nike",
    "status": "active"
  }
}
```

---

## 5. Multi-Tenancy in Action

### Data Isolation

```php
// Every model uses tenant_id for isolation
// Tenant is initialized via middleware

// When querying:
$products = Product::all();
// Returns ONLY products where product.tenant_id == current tenant

// Without proper tenant initialization:
$products = Product::withoutGlobalScopes()->all();
// Returns all products (only in special admin contexts)
```

### Tenant Bootstrappers

```php
// config/tenancy.php
'bootstrappers' => [
    CacheTenancyBootstrapper::class,    // Cache keys scoped by tenant
    FilesystemTenancyBootstrapper::class, // File storage scoped
    QueueTenancyBootstrapper::class,    // Jobs scoped to tenant
],
```

### Cache & Queue Scoping

```php
// Each cache key automatically includes tenant ID
Cache::put('products', $data);
// Actually stores: "tenant_{tenant_id}:products"

// Each queued job remembers which tenant it belongs to
dispatch(new ProcessOrder($order));
// Job executes with tenancy context preserved
```

---

## 6. Error Handling Flow

### Customer Requests Non-Existent Store

```
Request: GET /api/pub/v1/stores/invalid-slug/products

PublicController:
  $store = Tenant::where('slug', 'invalid-slug')->first(); // null
  return response()->json(['message' => 'Store not found'], 404);

store-front:
  Catches 404 → Displays "Store not found" page
```

### Merchant Tries to Access Another Merchant's Store

```
Request: GET /api/v1/store/other-tenant/products
Headers: Authorization: Bearer {merchant1_token}

InitializeTenancyFromSlug:
  Initializes tenancy for "other-tenant"
  
EnsureUserBelongsToTenant:
  Compares user.tenant_id (merchant1)
  vs request tenant (other-tenant)
  
  Mismatch → abort(403, 'Unauthorized')
```

### Invalid Authentication Token

```
Request: GET /api/v1/store/nike/products
Headers: Authorization: Bearer invalid-token

Sanctum Middleware:
  Token not found in tokens table
  Returns 401 Unauthorized
```

---

## 7. Scaling Considerations

### Current Architecture (Single Process)
- Single Laravel process handles all requests
- Redis for cache + queue
- PostgreSQL for persistence
- Works well for < 1000 concurrent merchants

### Future Microservices (See: [SCALING_PLAN.md](./SCALING_PLAN.md))

```
Goal: Extract services into independent microservices

Current → Future:
├─ User Service         (Auth, profiles)
├─ Store Service        (Tenant management)
├─ Product Service      (Catalog)
├─ Order Service        (Commerce)
├─ Payment Service      (Payments)
├─ Inventory Service    (Stock)
└─ Notification Service (Email/webhooks)
```

---

## 8. Technology Stack Reference

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Backend | Laravel | 13 | Framework |
| Auth | Laravel Sanctum | - | API authentication |
| Tenancy | Stancl Tenancy | v3 | Multi-tenancy |
| Permissions | Spatie Permission | - | Role-based access |
| Frontend (Admin) | Next.js | 16 | React framework |
| Frontend (Store) | Next.js | 16 | React framework |
| UI Framework | React | 19 | Component library |
| Styling | Tailwind CSS | 4 | Utility CSS |
| Language (Backend) | PHP | 8.4 | Backend language |
| Language (Frontend) | TypeScript | 5 | Type-safe JS |
| Database | PostgreSQL | 18 | Persistent storage |
| Cache/Queue | Redis | 8 | In-memory store |

---

## 9. Related Documentation

- [TENANCY.md](./TENANCY.md) — Deep dive into tenant resolution
- [AUTH_FLOW.md](./AUTH_FLOW.md) — Authentication & session handling
- [API_CONTRACT.md](./API_CONTRACT.md) — All endpoint specifications
- [FRONTEND_BOUNDARY.md](./FRONTEND_BOUNDARY.md) — Service boundaries
- [AGENTS.md](./AGENTS.md) — AI decision rules
- `/api/AGENTS.md` — Laravel-specific guidelines

---

**Last Updated:** May 13, 2026  
**Version:** 1.0
