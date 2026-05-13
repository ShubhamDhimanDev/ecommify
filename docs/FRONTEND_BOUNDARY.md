# Frontend Boundaries — Ownership & Service Division

This document defines **which frontend owns which features** and provides guidelines for deciding where new functionality belongs.

---

## 1. Service Ownership Summary

```
┌─────────────────────────────────┬─────────────────────────────────┐
│       /admin-front              │       /store-front              │
│    (Merchant Dashboard)          │    (Customer Storefront)        │
├─────────────────────────────────┼─────────────────────────────────┤
│ • Store Management              │ • Product Browsing              │
│ • Product Management            │ • Shopping Cart                 │
│ • Order Fulfillment             │ • Checkout                      │
│ • Staff Management              │ • Customer Accounts             │
│ • Merchant Analytics            │ • Order History                 │
│ • Payment Settings              │ • Reviews & Ratings             │
│ • Store Customization           │ • Search & Filtering            │
│ • Inventory Management          │ • Wishlist                      │
│ • Merchant Reports              │ • Customer Support              │
└─────────────────────────────────┴─────────────────────────────────┘
```

---

## 2. Admin-Front Ownership

### 2.1 What Belongs in Admin-Front

**Store Configuration**
- ✅ Store name, description, logo
- ✅ Payment gateway settings
- ✅ Shipping configuration
- ✅ Store policies (returns, privacy, etc.)
- ✅ Email templates & notifications

**Product Management**
- ✅ Create/edit/delete products
- ✅ Manage product variants (size, color, etc.)
- ✅ Upload product images
- ✅ Category management
- ✅ Inventory tracking
- ✅ Product visibility (draft/published/archived)

**Order Management**
- ✅ View orders
- ✅ Update order status
- ✅ Issue refunds
- ✅ Print shipping labels
- ✅ Order fulfillment workflow

**Staff Management**
- ✅ Add/remove staff members
- ✅ Assign roles & permissions
- ✅ Staff activity logs

**Analytics & Reporting**
- ✅ Sales reports
- ✅ Revenue insights
- ✅ Top products
- ✅ Customer lifetime value
- ✅ Traffic analytics

**Merchant Account**
- ✅ Profile settings
- ✅ Password management
- ✅ Two-factor authentication
- ✅ API key management
- ✅ Billing & subscription

### 2.2 Admin-Front Structure

```
admin-front/
├── src/
│   ├── app/
│   │   ├── dashboard/          ← Main dashboard layout
│   │   ├── products/           ← Product CRUD pages
│   │   ├── orders/             ← Order management
│   │   ├── customers/          ← Customer view
│   │   ├── staff/              ← Staff management
│   │   ├── settings/           ← Store settings
│   │   ├── analytics/          ← Reports & analytics
│   │   └── layout.tsx          ← Root layout
│   ├── components/
│   │   ├── ProductForm.tsx     ← Merchant-only form
│   │   ├── OrderList.tsx       ← Merchant order list
│   │   ├── AnalyticsChart.tsx  ← Merchant analytics
│   │   └── [...other]
│   ├── lib/
│   │   ├── api/
│   │   │   └── authenticated.ts ← Calls /api/v1/merchant/* and /api/v1/store/{slug}/*
│   │   └── utils/
│   ├── hooks/
│   │   ├── useAuth.ts          ← Merchant authentication
│   │   ├── useMerchantStore.ts ← Merchant store data
│   │   └── [...other]
│   └── context/
│       ├── AuthContext.tsx     ← Merchant auth state
│       └── StoreContext.tsx    ← Merchant store state
```

### 2.3 Admin-Front API Calls

```typescript
// All calls to authenticated endpoints
// Headers: Authorization: Bearer {token}, X-Tenant-Slug: {tenant_id}

// Authentication
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/2fa/enable
POST   /api/v1/auth/2fa/confirm
GET    /api/v1/auth/me

// Merchant endpoints (implicit tenant from user.tenant_id)
GET    /api/v1/merchant/store
PUT    /api/v1/merchant/store

// Store-scoped endpoints (explicit {tenant_slug} in path)
GET    /api/v1/store/{tenant_slug}/products
POST   /api/v1/store/{tenant_slug}/products
PUT    /api/v1/store/{tenant_slug}/products/{id}
DELETE /api/v1/store/{tenant_slug}/products/{id}

GET    /api/v1/store/{tenant_slug}/orders
GET    /api/v1/store/{tenant_slug}/orders/{id}
PUT    /api/v1/store/{tenant_slug}/orders/{id}/status

GET    /api/v1/store/{tenant_slug}/categories
POST   /api/v1/store/{tenant_slug}/categories
```

### 2.4 Admin-Front: Decision Checklist

When deciding if a feature belongs here, ask:

- [ ] Is it **merchant-facing** (not customer-facing)?
- [ ] Does it **require authentication** (Sanctum token)?
- [ ] Does it involve **store operations** (not product browsing)?
- [ ] Should it **only be visible to staff/merchants**?
- [ ] Does it involve **editing/managing data** (not just viewing)?

If **YES** to any → belongs in admin-front

**Examples:**
- ✅ "Edit product description" → Merchant operation → admin-front
- ❌ "View product description" → Customer viewing → store-front
- ✅ "Refund order" → Merchant operation → admin-front
- ❌ "View order status" → Could be both (show in both)

---

## 3. Store-Front Ownership

### 3.1 What Belongs in Store-Front

**Product Browsing**
- ✅ Product listing (with search & filters)
- ✅ Product detail page
- ✅ Product images & galleries
- ✅ Product reviews & ratings
- ✅ Related products
- ✅ Category browsing

**Shopping & Cart**
- ✅ Shopping cart (create/add/remove items)
- ✅ Cart summary
- ✅ Wishlist
- ✅ Cart abandonment recovery

**Checkout**
- ✅ Shipping address entry
- ✅ Billing address entry
- ✅ Shipping method selection
- ✅ Payment method selection
- ✅ Order review & confirmation
- ✅ Order success page

**Customer Account** (Optional)
- ✅ Customer login/register
- ✅ Account dashboard
- ✅ Order history
- ✅ Profile settings
- ✅ Wishlist management

**Store Presentation**
- ✅ Homepage
- ✅ Store branding & theming
- ✅ Store policies (FAQ, about, contact)
- ✅ Search functionality
- ✅ Filtering (by price, category, etc.)

**Customer Engagement**
- ✅ Reviews & ratings
- ✅ Product recommendations
- ✅ Newsletter signup
- ✅ Live chat/support
- ✅ Social proof (recently viewed, trending)

### 3.2 Store-Front Structure

```
store-front/
├── src/
│   ├── app/
│   │   ├── [storeSlug]/        ← Store-specific routes
│   │   │   ├── page.tsx        ← Homepage
│   │   │   ├── layout.tsx      ← Store layout (with nav, footer)
│   │   │   ├── products/       ← Product listing
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/       ← Product detail
│   │   │   ├── cart/           ← Shopping cart
│   │   │   ├── checkout/       ← Checkout flow
│   │   │   ├── account/        ← Customer account
│   │   │   └── search/         ← Search results
│   │   └── [...404 handling]
│   ├── components/
│   │   ├── ProductCard.tsx     ← Customer-facing card
│   │   ├── ProductGallery.tsx  ← Image gallery
│   │   ├── CartSummary.tsx     ← Cart UI
│   │   ├── CheckoutForm.tsx    ← Checkout UI
│   │   └── [...other]
│   ├── lib/
│   │   ├── api/
│   │   │   └── public.ts       ← Calls /api/pub/v1/stores/*
│   │   ├── theme/
│   │   │   ├── types.ts        ← Store theme types
│   │   │   └── utils.ts        ← Theme utilities
│   │   └── utils/
│   ├── hooks/
│   │   ├── useStore.ts         ← Current store context
│   │   ├── useCart.ts          ← Shopping cart state
│   │   ├── useCustomer.ts      ← Customer auth (optional)
│   │   └── [...other]
│   └── context/
│       ├── StoreContext.tsx    ← Store metadata
│       ├── CartContext.tsx     ← Shopping cart state
│       └── CustomerContext.tsx ← Customer auth (optional)
```

### 3.3 Store-Front API Calls

```typescript
// All calls to PUBLIC endpoints (no auth required)
// No Authorization header needed

// Store discovery
GET    /api/pub/v1/stores/{slug}              ← Load store info

// Product browsing (no auth)
GET    /api/pub/v1/stores/{slug}/categories
GET    /api/pub/v1/stores/{slug}/products
GET    /api/pub/v1/stores/{slug}/products/{id}

// Cart operations (no auth, but may need session ID)
POST   /api/v1/store/{tenant_slug}/carts
POST   /api/v1/store/{tenant_slug}/carts/{id}/items
DELETE /api/v1/store/{tenant_slug}/carts/{id}/items/{itemId}
POST   /api/v1/store/{tenant_slug}/carts/{id}/checkout

// Optional: Customer login
POST   /api/v1/auth/login       (customer account)
GET    /api/v1/auth/me
```

### 3.4 Store-Front: Decision Checklist

When deciding if a feature belongs here, ask:

- [ ] Is it **customer-facing** (visible to store visitors)?
- [ ] Does it **NOT require merchant authentication**?
- [ ] Can it be **shared across different stores** (data comes from public API)?
- [ ] Is it related to **shopping, browsing, or checkout**?

If **YES** to most → belongs in store-front

**Examples:**
- ✅ "Display product list" → Customer facing → store-front
- ❌ "Edit product inventory" → Merchant only → admin-front
- ✅ "Show customer reviews" → Customer facing → store-front
- ❌ "Moderate reviews" → Merchant task → admin-front

---

## 4. Shared Functionality

### 4.1 What Gets Built in Both

Some features need implementations in BOTH frontends:

| Feature | Admin-Front | Store-Front | Notes |
|---------|------------|-----------|-------|
| **View Orders** | Merchant sees all orders | Customer sees own orders | Different endpoints |
| **User Account** | Merchant settings | Customer settings | Different models |
| **Authentication** | Merchant login | Optional customer login | Same flow, different contexts |
| **Search** | Product search (manage) | Product search (browse) | Different UX |

### 4.2 Shared Components Library (Future)

For truly shared UI components:

```
// Option 1: Extract shared package
/packages/ui-components/
  └── Button.tsx, Modal.tsx, etc.

// Option 2: Share via monorepo
pnpm workspaces

// Option 3: Extract to separate repo
@ecommify/ui
```

**Current State:** No shared library (duplicate components OK for now)

---

## 5. Cross-Cutting Concerns

### 5.1 Error Handling

Both frontends handle errors from the same API, but differently:

**Admin-Front:**
```typescript
// Show detailed error to merchant
if (error.status === 422) {
  displayValidationErrors(error.data.errors);
}
```

**Store-Front:**
```typescript
// Show friendly error to customer
if (error.status === 422) {
  displayGenericError('There was a problem. Please try again.');
}
```

### 5.2 Loading States

Both handle loading states independently:

**Admin-Front:**
```typescript
// Show loading spinner while fetching
const [isLoading, setIsLoading] = useState(false);
```

**Store-Front:**
```typescript
// Show loading skeleton
<ProductSkeleton />
```

### 5.3 Notifications

Both implement notifications differently:

**Admin-Front:**
```typescript
// Merchant sees detailed notifications
toast.success('Product updated successfully');
```

**Store-Front:**
```typescript
// Customer sees friendly notifications
toast.info('Item added to cart');
```

---

## 6. Data Flow Between Services

### 6.1 Admin-Front → API → Store-Front

```
Merchant creates product
  ↓
POST /api/v1/store/{slug}/products
  ↓
Product saved to database
  ↓
Store-Front calls GET /api/pub/v1/stores/{slug}/products
  ↓
Product appears on storefront
```

### 6.2 Store-Front → API → Admin-Front

```
Customer places order
  ↓
POST /api/v1/store/{slug}/carts/{id}/checkout
  ↓
Order created in database
  ↓
Admin-Front calls GET /api/v1/store/{slug}/orders
  ↓
Order appears in merchant dashboard
```

---

## 7. Never Duplicate Data

### 7.1 Source of Truth

| Data | Owner | Where to Read | Notes |
|------|-------|---------------|-------|
| **Products** | API Database | `/api/pub/v1/stores/{slug}/products` | Store-Front reads |
| **Orders** | API Database | `/api/v1/store/{slug}/orders` | Admin-Front reads + writes |
| **Customers** | API Database | `/api/v1/store/{slug}/customers` | Admin-Front reads |
| **Store Config** | API Database | `/api/pub/v1/stores/{slug}` | Both read (different endpoints) |

### 7.2 Do NOT Store Server Data in Frontend

❌ **Bad:**
```typescript
// Never store API response in React state permanently
const [products] = useState([
  // Hardcoded data (stale!)
]);
```

✅ **Good:**
```typescript
// Fetch from API and update when needed
const [products, setProducts] = useState([]);

useEffect(() => {
  fetch('/api/pub/v1/stores/{slug}/products')
    .then(r => r.json())
    .then(({ data }) => setProducts(data));
}, []);
```

---

## 8. URL/Routing Structure

### 8.1 Admin-Front Routes

```
/login                          ← Merchant login
/dashboard                      ← Main dashboard
/dashboard/products             ← Product listing
/dashboard/products/new         ← Create product
/dashboard/products/{id}/edit   ← Edit product
/dashboard/orders               ← Order listing
/dashboard/orders/{id}          ← Order detail
/dashboard/customers            ← Customer list
/dashboard/settings             ← Store settings
/dashboard/staff                ← Staff management
```

### 8.2 Store-Front Routes

```
/{storeSlug}                    ← Store homepage
/{storeSlug}/products           ← Product listing
/{storeSlug}/products/{id}      ← Product detail
/{storeSlug}/search             ← Search results
/{storeSlug}/cart               ← Shopping cart
/{storeSlug}/checkout           ← Checkout flow
/{storeSlug}/account            ← Customer account (optional)
/{storeSlug}/account/orders     ← Order history
```

### 8.3 No Route Conflicts

- Admin-Front runs on port 3000
- Store-Front runs on port 3001 (or different domain)
- No URL conflicts between them

---

## 9. Environment-Specific Behavior

### 9.1 Admin-Front Environment

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Features enabled:
# - Merchant authentication
# - Product management UI
# - Order management UI
# - Analytics dashboard
```

### 9.2 Store-Front Environment

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Features enabled:
# - Product browsing
# - Shopping cart
# - Checkout flow
# - Optional customer account
```

### 9.3 No Conditional Feature Toggling Needed

Each frontend is purpose-built. No need for `if (IS_MERCHANT)` to toggle features.

---

## 10. Styling & Theming

### 10.1 Design System

Both frontends use:
- Tailwind CSS v4
- React 19 (same version)
- TypeScript (same version)

### 10.2 No Shared Theme

Currently:
- Admin-Front has its own styling (dashboard aesthetic)
- Store-Front has its own styling (storefront aesthetic)

Future option: Extract shared component library

### 10.3 Tailwind Configuration

```
admin-front/tailwind.config.mjs
store-front/tailwind.config.mjs

Can be different per app (no conflicts)
```

---

## 11. Related Documentation

- [AGENTS.md](./AGENTS.md) — AI decision rules
- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design
- [API_CONTRACT.md](./API_CONTRACT.md) — API endpoints
- [TENANCY.md](./TENANCY.md) — Multi-tenant context

---

**Last Updated:** May 13, 2026  
**Version:** 1.0
