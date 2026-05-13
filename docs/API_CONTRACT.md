# API Contract — Frontend-Backend Communication

This document defines the **request/response contracts** for how both frontends (`store-front` and `admin-front`) communicate with the Laravel API backend.

---

## 1. General Conventions

### Base URL

```javascript
// Development
const API_BASE = 'http://localhost:8000/api';

// Production
const API_BASE = 'https://api.example.com/api';

// Via environment
const API_BASE = process.env.NEXT_PUBLIC_API_URL;
```

### API Versioning

```
All endpoints use v1 prefix:
/api/v1/...          → Authenticated endpoints (merchant/admin)
/api/pub/v1/...      → Public endpoints (no auth required)
/api/admin/v1/...    → Super-admin only
```

### Response Envelope

All responses follow this structure:

```json
{
  "data": { /* payload */ },
  "message": "Success message (optional)",
  "meta": { /* pagination/metadata (optional) */ }
}
```

### Error Responses

```json
{
  "message": "Error description",
  "errors": {
    "email": ["Email is required"]
  }
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| `200` | OK |
| `201` | Created |
| `204` | No Content |
| `400` | Bad Request (validation error) |
| `401` | Unauthorized (missing/invalid token) |
| `403` | Forbidden (not allowed) |
| `404` | Not Found |
| `422` | Unprocessable Entity (validation failed) |
| `500` | Server Error |

---

## 2. Authentication Endpoints

### 2.1 User Registration

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Merchant",
  "email": "john@store.com",
  "password": "SecurePassword123!",
  "password_confirmation": "SecurePassword123!",
  "phone": "+1234567890"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Merchant",
    "email": "john@store.com",
    "phone": "+1234567890",
    "tenant_id": null,
    "email_verified_at": null,
    "status": "active"
  },
  "access_token": "1|abcdefghijklmnopqrstuvwxyz",
  "token_type": "Bearer",
  "message": "Registration successful. Please verify your email."
}
```

**Errors:**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email has already been taken."],
    "password": ["The password must be at least 8 characters."]
  }
}
```

---

### 2.2 User Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@store.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Merchant",
    "email": "john@store.com",
    "tenant_id": "nike-uuid",
    "email_verified_at": "2026-05-13T10:00:00Z",
    "status": "active"
  },
  "access_token": "2|xyz789abcdefghijklmno",
  "token_type": "Bearer",
  "expires_at": "2026-05-14T12:00:00Z"
}
```

**2FA Required (202 Accepted):**
```json
{
  "two_factor_required": true,
  "two_factor_token": "temp-token-xyz",
  "message": "Please complete two-factor authentication."
}
```

---

### 2.3 Two-Factor Challenge

```http
POST /api/v1/auth/2fa/challenge
Content-Type: application/json

{
  "code": "123456",
  "two_factor_token": "temp-token-xyz"
}
```

**Response (200 OK):**
```json
{
  "user": { /* user object */ },
  "access_token": "3|abcdefghijklmnopqrstuvwxyz",
  "token_type": "Bearer",
  "expires_at": "2026-05-14T12:00:00Z"
}
```

---

### 2.4 Logout

```http
POST /api/v1/auth/logout
Authorization: Bearer {token}
```

**Response (204 No Content):**
Empty body

---

### 2.5 Current User Profile

```http
GET /api/v1/auth/me
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Merchant",
    "email": "john@store.com",
    "phone": "+1234567890",
    "avatar": "https://cdn.example.com/avatars/john.jpg",
    "tenant_id": "nike-uuid",
    "email_verified_at": "2026-05-13T10:00:00Z",
    "status": "active",
    "last_login_at": "2026-05-13T12:00:00Z"
  }
}
```

---

## 3. Public Endpoints (Store-Front)

### 3.1 Get Store Info

```http
GET /api/pub/v1/stores/{slug}
```

**Response (200 OK):**
```json
{
  "store": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Nike Store",
    "slug": "nike",
    "status": "active",
    "plan": "professional",
    "settings": {
      "logo_url": "https://cdn.example.com/stores/nike/logo.png",
      "banner_url": "https://cdn.example.com/stores/nike/banner.jpg",
      "description": "Official Nike online store",
      "theme_color": "#FF6B35"
    }
  }
}
```

**Errors:**
```json
{
  "message": "Store not found."
}
```

---

### 3.2 List Store Categories

```http
GET /api/pub/v1/stores/{slug}/categories
Query Parameters:
  - per_page: integer (default: 20, max: 100)
  - page: integer (default: 1)
```

**Response (200 OK):**
```json
{
  "categories": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Running Shoes",
      "slug": "running-shoes",
      "description": "All running shoe models",
      "parent_id": null,
      "depth": 0,
      "children_count": 3
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Women's Running",
      "slug": "womens-running",
      "parent_id": "550e8400-e29b-41d4-a716-446655440000",
      "depth": 1,
      "children_count": 0
    }
  ]
}
```

---

### 3.3 List Store Products

```http
GET /api/pub/v1/stores/{slug}/products
Query Parameters:
  - page: integer (default: 1)
  - per_page: integer (default: 20, max: 100)
  - q: string (search by name/sku)
  - category_id: uuid (filter by category)
  - price_min: decimal
  - price_max: decimal
  - in_stock: boolean
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Nike Air Max 90",
      "slug": "nike-air-max-90",
      "sku": "AIR-MAX-90-001",
      "description": "Classic running shoe",
      "price": 129.99,
      "stock": 45,
      "images": [
        {
          "id": "image-1",
          "url": "https://cdn.example.com/products/nike-air-max-90/1.jpg",
          "alt_text": "Nike Air Max 90 - Side View"
        }
      ],
      "variants": [
        {
          "id": "variant-1",
          "name": "Size 10",
          "sku": "AIR-MAX-90-001-10",
          "price": 129.99,
          "stock": 10
        }
      ]
    }
  ],
  "meta": {
    "total": 156,
    "per_page": 20,
    "current_page": 1,
    "last_page": 8,
    "next_page_url": "/api/pub/v1/stores/nike/products?page=2",
    "prev_page_url": null
  }
}
```

---

### 3.4 Get Product Details

```http
GET /api/pub/v1/stores/{slug}/products/{id}
```

**Response (200 OK):**
```json
{
  "product": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Nike Air Max 90",
    "slug": "nike-air-max-90",
    "sku": "AIR-MAX-90-001",
    "description": "Classic 1990 running shoe with cushioning",
    "price": 129.99,
    "stock": 45,
    "meta_title": "Nike Air Max 90 | Official Store",
    "meta_description": "Buy Nike Air Max 90...",
    "images": [
      {
        "id": "img-1",
        "url": "https://cdn.example.com/products/air-max-90/1.jpg",
        "alt_text": "Front view",
        "sort_order": 1
      }
    ],
    "variants": [
      {
        "id": "var-1",
        "name": "Size 8",
        "sku": "AIR-MAX-90-001-8",
        "price": 129.99,
        "stock": 5
      },
      {
        "id": "var-2",
        "name": "Size 10",
        "sku": "AIR-MAX-90-001-10",
        "price": 129.99,
        "stock": 10
      }
    ],
    "tags": [
      { "id": "tag-1", "name": "Running" },
      { "id": "tag-2", "name": "Casual" }
    ],
    "category": {
      "id": "cat-1",
      "name": "Running Shoes",
      "slug": "running-shoes"
    }
  }
}
```

---

## 4. Merchant Endpoints (Admin-Front)

### 4.1 Get Merchant's Store

```http
GET /api/v1/merchant/store
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "store": {
    "id": "nike-uuid",
    "name": "Nike Store",
    "slug": "nike",
    "status": "active",
    "plan": "professional",
    "settings": {
      "logo_url": "https://...",
      "description": "Official Nike store",
      "theme_color": "#FF6B35"
    },
    "domains": [
      {
        "id": "domain-1",
        "domain": "nike.example.com",
        "is_primary": true,
        "verified_at": "2026-05-10T00:00:00Z"
      }
    ],
    "users_count": 3,
    "products_count": 245,
    "orders_count": 1523
  }
}
```

---

### 4.2 Update Store Settings

```http
PUT /api/v1/merchant/store
Authorization: Bearer {token}
Content-Type: application/json
X-Tenant-Slug: {tenant_id}

{
  "name": "Nike Air Collection",
  "description": "New description",
  "settings": {
    "logo_url": "https://cdn.example.com/new-logo.png",
    "theme_color": "#0066FF"
  }
}
```

**Response (200 OK):**
```json
{
  "store": { /* updated store */ },
  "message": "Store updated successfully."
}
```

---

### 4.3 List Store Products (Admin)

```http
GET /api/v1/store/{tenant_slug}/products
Authorization: Bearer {token}
X-Tenant-Slug: {tenant_slug}
Query Parameters:
  - page: integer
  - per_page: integer
  - q: string (search)
  - status: "active" | "draft" | "archived"
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "product-uuid",
      "name": "Nike Air Max 90",
      "sku": "AIR-MAX-90-001",
      "price": 129.99,
      "status": "active",
      "stock": 45,
      "images_count": 3,
      "variants_count": 5,
      "created_at": "2026-05-01T10:00:00Z",
      "updated_at": "2026-05-13T12:00:00Z"
    }
  ],
  "meta": {
    "total": 156,
    "per_page": 20,
    "current_page": 1
  }
}
```

---

### 4.4 Create Product

```http
POST /api/v1/store/{tenant_slug}/products
Authorization: Bearer {token}
X-Tenant-Slug: {tenant_slug}
Content-Type: application/json

{
  "name": "New Running Shoe",
  "sku": "NEW-SHOE-001",
  "description": "Premium running shoe",
  "price": 149.99,
  "stock": 100,
  "status": "draft",
  "category_id": "cat-uuid",
  "meta_title": "New Running Shoe",
  "meta_description": "Premium running shoe for athletes",
  "images": [
    {
      "image_url": "https://cdn.example.com/image.jpg",
      "alt_text": "Product image",
      "sort_order": 1
    }
  ],
  "variants": [
    {
      "name": "Size 8",
      "sku": "NEW-SHOE-001-8",
      "price": 149.99,
      "stock": 20
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "product": { /* created product */ },
  "message": "Product created successfully."
}
```

---

### 4.5 Get Product Detail (Admin)

```http
GET /api/v1/store/{tenant_slug}/products/{id}
Authorization: Bearer {token}
X-Tenant-Slug: {tenant_slug}
```

**Response (200 OK):**
```json
{
  "product": {
    "id": "product-uuid",
    "name": "Nike Air Max 90",
    "sku": "AIR-MAX-90-001",
    "description": "...",
    "price": 129.99,
    "stock": 45,
    "status": "active",
    "category_id": "cat-uuid",
    "images": [ /* ... */ ],
    "variants": [ /* ... */ ],
    "created_at": "2026-05-01T10:00:00Z",
    "updated_at": "2026-05-13T12:00:00Z"
  }
}
```

---

### 4.6 Update Product

```http
PUT /api/v1/store/{tenant_slug}/products/{id}
Authorization: Bearer {token}
X-Tenant-Slug: {tenant_slug}
Content-Type: application/json

{
  "name": "Updated Name",
  "price": 139.99,
  "stock": 50,
  "status": "active"
}
```

**Response (200 OK):**
```json
{
  "product": { /* updated product */ },
  "message": "Product updated successfully."
}
```

---

### 4.7 Delete Product

```http
DELETE /api/v1/store/{tenant_slug}/products/{id}
Authorization: Bearer {token}
X-Tenant-Slug: {tenant_slug}
```

**Response (204 No Content):**
Empty body

---

## 5. Cart & Order Endpoints

### 5.1 Create Cart

```http
POST /api/v1/store/{tenant_slug}/carts
Content-Type: application/json

{
  "customer_email": "customer@example.com"
}
```

**Response (201 Created):**
```json
{
  "cart": {
    "id": "cart-uuid",
    "tenant_id": "nike-uuid",
    "customer_email": "customer@example.com",
    "items": [],
    "subtotal": 0,
    "tax": 0,
    "total": 0
  }
}
```

---

### 5.2 Add Item to Cart

```http
POST /api/v1/store/{tenant_slug}/carts/{cart_id}/items
Content-Type: application/json

{
  "product_id": "product-uuid",
  "variant_id": "variant-uuid",
  "quantity": 2
}
```

**Response (201 Created):**
```json
{
  "item": {
    "id": "item-uuid",
    "product_id": "product-uuid",
    "variant_id": "variant-uuid",
    "quantity": 2,
    "unit_price": 129.99,
    "line_total": 259.98
  },
  "cart_total": 259.98
}
```

---

### 5.3 Checkout

```http
POST /api/v1/store/{tenant_slug}/carts/{cart_id}/checkout
Authorization: Bearer {token} (optional)
Content-Type: application/json

{
  "shipping_address": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "address_line_1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "US"
  },
  "payment_method": "credit_card",
  "payment_token": "stripe-payment-token"
}
```

**Response (201 Created):**
```json
{
  "order": {
    "id": "order-uuid",
    "order_number": "ORD-2026-0001",
    "status": "pending_payment",
    "items": [ /* ... */ ],
    "subtotal": 259.98,
    "tax": 20.80,
    "shipping": 10.00,
    "total": 290.78,
    "payment_status": "pending"
  },
  "message": "Order created. Awaiting payment confirmation."
}
```

---

## 6. Required Headers

### All Authenticated Endpoints

```http
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/json
```

### Tenant-Scoped Endpoints

```http
X-Tenant-Slug: {tenant_slug_or_id}
```

### CORS Headers (from backend)

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Tenant-Slug
```

---

## 7. Error Handling Examples

### Validation Error (422)

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "name": ["The name must be between 2 and 255 characters."]
  }
}
```

### Authentication Error (401)

```json
{
  "message": "Unauthenticated.",
  "errors": {}
}
```

### Authorization Error (403)

```json
{
  "message": "User does not have the required permissions.",
  "errors": {}
}
```

### Not Found Error (404)

```json
{
  "message": "Store not found.",
  "errors": {}
}
```

---

## 8. Rate Limiting

```http
Response Headers:
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1620000000
```

If rate limit exceeded:

```json
{
  "message": "Too many requests. Please try again later.",
  "retry_after": 60
}
```

---

## 9. Pagination

All list endpoints support pagination:

```http
GET /api/v1/store/{slug}/products?page=2&per_page=50
```

**Response includes `meta`:**
```json
{
  "data": [ /* items */ ],
  "meta": {
    "total": 156,
    "from": 21,
    "to": 40,
    "per_page": 20,
    "current_page": 2,
    "last_page": 8,
    "path": "/api/v1/store/nike/products",
    "first_page_url": "...",
    "last_page_url": "...",
    "next_page_url": "...",
    "prev_page_url": "..."
  }
}
```

---

## 10. Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design
- [AUTH_FLOW.md](./AUTH_FLOW.md) — Authentication details
- [TENANCY.md](./TENANCY.md) — Tenant resolution
- `/api/routes/api.php` — Route definitions
- `/api/PAYMENT_GATEWAY_API_GUIDE.md` — Payment integration

---

**Last Updated:** May 13, 2026  
**Version:** 1.0
