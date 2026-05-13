# Multi-Tenancy Architecture — Tenant Resolution & Isolation

This document explains **how Ecommify resolves and isolates tenants** across the entire platform. It covers both the Next.js frontends and Laravel backend middleware.

---

## 1. Tenancy Model

**A "Tenant" in Ecommify is a Merchant Store** (e.g., "Nike Store", "Adidas Store").

### Tenant Record

```php
// Database: tenants table (central database, shared schema)
id:        uuid
name:      "Nike Store"
slug:      "nike"              // URL-friendly identifier
status:    "active"            // active | suspended
plan:      "starter"           // Pricing tier
settings:  json                // Customizations
created_at: timestamp

// Relationships:
- Domains (1-to-many)  → "nike.example.com", "nike.myplatform.com"
- Users (1-to-many)    → Merchant staff accounts
- Products (1-to-many) → Store inventory
- Orders (1-to-many)   → Customer orders
```

### Domain Record

```php
// Database: domains table (central database, shared schema)
id:               uuid
tenant_id:        uuid         // Links to tenants table
domain:           "nike.example.com"
is_primary:       true
verified_at:      timestamp    // DNS verified?

// Multiple domains can point to same tenant:
- nike.example.com (primary)
- nike.myplatform.com (fallback)
- custom.nike.com (white-label)
```

---

## 2. Tenant Resolution Strategy

Tenants are resolved using **3 methods** (in priority order):

| Method | Source | Use Case | Example |
|--------|--------|----------|---------|
| **Route Param** | URL parameter `{tenant_slug}` | Development, explicit routing | `/api/v1/store/nike/products` |
| **Header** | `X-Tenant-Slug` header | API clients, mobile apps | Header: `X-Tenant-Slug: nike` |
| **Subdomain** | Request subdomain | Production domain routing | `nike.example.com` |

---

## 3. Store-Front Tenant Resolution

### 3.1 URL-Based Resolution

**Store URL Structure:**
```
http://localhost:3001/nike
        └─────────────┬─────
                      └─ Store slug from URL param [storeSlug]
```

### 3.2 Next.js App Router Setup

```typescript
// store-front/src/app/layout.tsx
export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { storeSlug: string };
}) {
  return (
    <html>
      <body>
        <TenantProvider storeSlug={params.storeSlug}>
          {children}
        </TenantProvider>
      </body>
    </html>
  );
}
```

### 3.3 Store Detection Flow

```typescript
// store-front/src/app/[storeSlug]/layout.tsx
export default async function StoreLayout({
  params,
  children,
}: {
  params: { storeSlug: string };
  children: React.ReactNode;
}) {
  const { storeSlug } = params;

  try {
    // Step 1: Fetch store metadata
    const storeResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/pub/v1/stores/${storeSlug}`,
      { cache: 'revalidate' } // ISR - revalidate every X seconds
    );

    if (!storeResponse.ok) {
      throw new Error('Store not found');
    }

    const { store } = await storeResponse.json();

    // Step 2: Provide store context to all children
    return (
      <StoreContext.Provider value={store}>
        <StoreLayout>{children}</StoreLayout>
      </StoreContext.Provider>
    );
  } catch (error) {
    // Step 3: Handle missing store
    return (
      <div>
        <h1>Store not found: {storeSlug}</h1>
        <p>The store "{storeSlug}" does not exist.</p>
      </div>
    );
  }
}
```

### 3.4 Passing Tenant to API Calls

```typescript
// store-front/src/lib/api/public.ts
import { useContext } from 'react';

const StoreContext = createContext();

export function useStore() {
  return useContext(StoreContext);
}

export async function fetchProducts(storeSlug: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/pub/v1/stores/${storeSlug}/products`,
    {
      headers: {
        'Accept': 'application/json',
        'X-Tenant-Slug': storeSlug, // Additional header for clarity
      },
    }
  );

  return response.json();
}
```

### 3.5 Store-Front Summary

```
Customer URL
  ↓
[storeSlug] extracted from path
  ↓
Passed to layout component
  ↓
Tenant context provider wraps all children
  ↓
All API calls use storeSlug in URL + header
  ↓
No authentication required (public routes)
```

---

## 4. Admin-Front Tenant Resolution

### 4.1 Authentication-Based Resolution

**When merchant logs in:**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "merchant@store.com",
    "tenant_id": "nike-uuid",  ← Tenant binding
    "name": "John Merchant"
  },
  "access_token": "1|abcdefghijk..."
}
```

### 4.2 Auth Hook Stores Tenant Context

```typescript
// admin-front/src/hooks/useAuth.ts
export function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  async function login(email: string, password: string) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );

    const { user, access_token } = await response.json();

    // Step 1: Store token
    localStorage.setItem('auth_token', access_token);
    
    // Step 2: Store user (includes tenant_id)
    localStorage.setItem('user', JSON.stringify(user));
    
    // Step 3: Update state
    setUser(user);
    setToken(access_token);

    return { user, access_token };
  }

  return { user, token, login };
}
```

### 4.3 Authenticated API Calls

```typescript
// admin-front/src/lib/api/authenticated.ts
import { useAuth } from '@/hooks/useAuth';

export function useAuthenticatedFetch() {
  const { user, token } = useAuth();

  return async function fetchWithAuth(
    endpoint: string,
    options = {}
  ) {
    if (!user || !token) {
      throw new Error('Not authenticated');
    }

    // Step 1: Extract tenant from user context
    const tenantSlug = user.tenant_id;

    // Step 2: Call API with tenant context
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/store/${tenantSlug}${endpoint}`,
      {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'X-Tenant-Slug': tenantSlug,
          'Accept': 'application/json',
        },
      }
    );

    return response.json();
  };
}
```

### 4.4 Admin-Front Summary

```
Merchant Login
  ↓
API returns token + user (with tenant_id)
  ↓
Token stored in localStorage
  ↓
User context stored globally (includes tenant_id)
  ↓
All subsequent API calls:
  - Inject token in Authorization header
  - Inject tenant_id in X-Tenant-Slug header
  - Use tenant_id in URL path: /api/v1/store/{tenant_id}/*
```

---

## 5. Laravel Backend Tenancy Initialization

### 5.1 Middleware Stack

```php
// api/app/Http/Middleware/InitializeTenancyFromSlug.php

class InitializeTenancyFromSlug
{
    public function handle(Request $request, Closure $next): Response
    {
        // Step 1: Resolve tenant slug from 3 sources
        $slug = $this->resolveSlug($request);

        if (!$slug) {
            abort(404, 'Tenant not specified.');
        }

        // Step 2: Query central database for tenant
        $tenant = Tenant::where('slug', $slug)->first();

        if (!$tenant) {
            abort(404, "Tenant [{$slug}] not found.");
        }

        // Step 3: Initialize Stancl Tenancy context
        // This fires TenancyInitialized event + boots bootstrappers
        tenancy()->initialize($tenant);

        // Step 4: Bind tenant to container for dependency injection
        app()->instance(Tenant::class, $tenant);

        return $next($request);
    }

    private function resolveSlug(Request $request): ?string
    {
        // Priority 1: Route parameter (explicit)
        if ($slug = $request->route('tenant_slug')) {
            return $slug;
        }

        // Priority 2: X-Tenant-Slug header (API clients)
        if ($slug = $request->header('X-Tenant-Slug')) {
            return $slug;
        }

        // Priority 3: Subdomain (production)
        $host = $request->getHost();
        // Extract subdomain from host (e.g., "nike" from "nike.example.com")
        $subdomain = explode('.', $host)[0];
        
        // Avoid matching "www" or central domains
        if ($subdomain !== 'www' && !in_array($subdomain, ['localhost', '127.0.0.1'])) {
            return $subdomain;
        }

        return null;
    }
}
```

### 5.2 Tenant Scoping in Models

```php
// api/app/Models/Product.php
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    // Step 1: Global scope automatically filters by current tenant
    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
    }
}

// Usage:
$products = Product::all(); // Returns ONLY current tenant's products
$allProducts = Product::withoutGlobalScopes()->all(); // Admin bypass
```

### 5.3 Global Scope Implementation

```php
// api/app/Models/Scopes/TenantScope.php
use Illuminate\Database\Eloquent\Scope;

class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        // Automatically add WHERE clause for current tenant
        if (tenancy()->initialized) {
            $builder->where('tenant_id', tenant('id'));
        }
    }
}
```

### 5.4 Route Protection

```php
// api/routes/api.php

// Public routes (no tenant initialization)
Route::prefix('pub/v1')->group(function () {
    Route::get('stores/{slug}', [PublicController::class, 'storeBySlug']);
    Route::get('stores/{slug}/products', [PublicController::class, 'listProducts']);
    // ...
});

// Tenant-scoped routes (middleware stack)
Route::prefix('store/{tenant_slug}')->middleware([
    'auth:sanctum',                      // Require Sanctum token
    InitializeTenancyFromSlug::class,    // Initialize tenancy
    EnsureTenantIsActive::class,         // Check tenant.status == 'active'
    EnsureUserBelongsToTenant::class,    // Check user.tenant_id == tenant.id
])->group(function () {
    Route::get('products', [ProductController::class, 'index']);
    Route::post('products', [ProductController::class, 'store']);
    // All product queries automatically scoped to current tenant
});
```

---

## 6. Bootstrapper Configuration

When tenancy is initialized, **bootstrappers** make Laravel features tenant-aware:

```php
// config/tenancy.php
'bootstrappers' => [
    CacheTenancyBootstrapper::class,       // Cache scoped per tenant
    FilesystemTenancyBootstrapper::class,  // File storage scoped
    QueueTenancyBootstrapper::class,       // Jobs remember tenant
],
```

### Cache Scoping

```php
// Every cache operation is automatically prefixed with tenant ID
Cache::put('products', $data);
// Actually stores key: "tenant_{tenant_id}:products"

Cache::get('products');
// Retrieves "tenant_{tenant_id}:products" (from current tenant only)
```

### Queue Scoping

```php
// When job is dispatched in tenant context:
dispatch(new ProcessOrder($order));
// Job remembers which tenant it was dispatched in

// When job executes:
public function handle(): void
{
    $tenant = tenant(); // Automatically restored
    // Access current tenant without passing it explicitly
}
```

---

## 7. Data Isolation Guarantees

### 7.1 Tenant Verification at Query Time

```php
// ✅ Safe: Product always scoped to tenant
$product = Product::find($id);
// Queries: SELECT * FROM products WHERE tenant_id = ? AND id = ?

// ✅ Safe: Relationship automatically scoped
$user = User::first();
$products = $user->products()->get();
// All relationships scoped to user's tenant

// ⚠️ Unsafe: Bypassing scope (use with caution)
$product = Product::withoutGlobalScopes()->find($id);
// Admin-only operations with explicit tenant checks
```

### 7.2 Middleware-Level Authorization

```php
// EnsureUserBelongsToTenant middleware
class EnsureUserBelongsToTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();
        $tenant = tenant();

        // Step 1: Verify user belongs to this tenant
        if ($user->tenant_id !== $tenant->id) {
            abort(403, 'User does not belong to this tenant.');
        }

        // Step 2: Additional check - user role/permission
        if (!$user->hasPermissionTo('view_store', 'sanctum')) {
            abort(403, 'User does not have permission.');
        }

        return $next($request);
    }
}
```

---

## 8. Practical Scenarios

### Scenario 1: Customer Browsing Nike Store

```
1. Browser: GET /nike
2. store-front [storeSlug] layout extracts "nike"
3. API call: GET /api/pub/v1/stores/nike
   Headers: X-Tenant-Slug: nike
4. Backend InitializeTenancyFromSlug:
   - Resolves "nike" from header
   - Finds Tenant where slug="nike"
   - Initializes tenancy (boots bootstrappers)
5. PublicController returns store metadata
6. store-front renders products for "nike"
```

### Scenario 2: Merchant Managing Adidas Store

```
1. Merchant logs in to admin-front
2. API call: POST /api/v1/auth/login
3. Backend returns token + user {tenant_id: "adidas-uuid"}
4. admin-front stores user + token
5. Merchant clicks "Edit Store"
6. API call: PUT /api/v1/store/adidas-uuid/settings
   Headers: Authorization: Bearer {token}
           X-Tenant-Slug: adidas-uuid
7. Backend middleware:
   - Sanitum authenticates token → finds Merchant user
   - InitializeTenancyFromSlug initializes adidas tenant
   - EnsureUserBelongsToTenant checks:
     * user.tenant_id == request tenant ✓
8. StoreController.update() executes
   - All queries automatically scoped to Adidas
9. Settings updated, response returned
```

### Scenario 3: Attempting Cross-Tenant Access

```
1. Nike Merchant token: {user_id: "1", tenant_id: "nike-uuid"}
2. Tries: PUT /api/v1/store/adidas-uuid/settings
   Headers: Authorization: Bearer {nike-token}
           X-Tenant-Slug: adidas-uuid
3. Middleware:
   - Sanctum authenticates: finds Nike merchant ✓
   - InitializeTenancyFromSlug: initializes Adidas tenant
   - EnsureUserBelongsToTenant checks:
     * user.tenant_id (nike-uuid) != request tenant (adidas-uuid) ✗
4. abort(403, 'User does not belong to this tenant.')
5. Request denied → 403 Forbidden
```

---

## 9. Domain-Based Routing (Production)

### 9.1 DNS Configuration

```
*.example.com  → 93.184.216.34 (API server)

nike.example.com    → Same IP
adidas.example.com  → Same IP
puma.example.com    → Same IP
```

### 9.2 Request Flow with Domains

```
1. Customer visits https://nike.example.com
2. Browser DNS lookup → 93.184.216.34
3. HTTPS connects to same IP
4. Request reaches reverse proxy (Nginx)
   Host: nike.example.com
5. Reverse proxy routes to store-front (Next.js)
6. Next.js middleware extracts subdomain "nike"
7. Passes to app router as [storeSlug]="nike"
8. Rest of flow identical to URL-based resolution
```

### 9.3 Wildcard SSL Certificate

```
Subject: *.example.com
Issuer: Let's Encrypt

Allows HTTPS for:
- nike.example.com
- adidas.example.com
- Any subdomain of example.com
```

---

## 10. Environment Configuration

### Development

```env
# .env
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3001
DB_CONNECTION=pgsql
DB_HOST=localhost
DB_DATABASE=saas_platform
```

### Production

```env
# .env.production
APP_URL=https://example.com
FRONTEND_URL=https://example.com
DB_CONNECTION=pgsql
DB_HOST=db-prod.example.com
DB_DATABASE=saas_platform_prod
SANCTUM_STATEFUL_DOMAINS=example.com,*.example.com
```

---

## 11. Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design overview
- [AUTH_FLOW.md](./AUTH_FLOW.md) — Authentication flow details
- [API_CONTRACT.md](./API_CONTRACT.md) — API endpoint specifications
- `/api/config/tenancy.php` — Tenancy configuration
- `/api/AGENTS.md` — Laravel implementation guidelines

---

**Last Updated:** May 13, 2026  
**Version:** 1.0
