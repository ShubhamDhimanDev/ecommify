# Ecommify — Multi-Tenant E-Commerce SaaS Platform — Progress

**Current Date:** May 12, 2026  
**Project Status:** Phase 1 — Core scaffold with 8 Go microservices + 2 Next.js frontends

---

## 1. PROJECT DETAILED INFO

### Overview
**Ecommify** is a multi-tenant e-commerce SaaS platform that enables merchants to create and manage their own online stores. The platform is built using a microservices architecture with:

- **8 Backend Services** (Go 1.25 + Fiber v3)
- **2 Frontend Applications** (Next.js 16 + React 19 + TypeScript)
- **Shared Infrastructure** (PostgreSQL 18, Redis 8)
- **Multi-tenancy model** with merchant-based isolation

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Backend Services** | Go | 1.25 | Microservices core |
| **Web Framework** | Fiber | v3 | HTTP API framework |
| **Database** | PostgreSQL | 18 | Primary data store |
| **Cache/Queue** | Redis | 8 | Caching & session management |
| **ORM/SQL** | pgx + sqlc | v5 + v1 | Type-safe SQL queries |
| **Migrations** | Goose | v3 | Database versioning |
| **Frontend** | Next.js | 16 | React framework |
| **UI Framework** | React | 19 | Component library |
| **Styling** | Tailwind CSS | v4 | Utility-first CSS |
| **Language** | TypeScript | 5 | Type-safe JavaScript |
| **UI Components** | shadcn/ui | latest | Pre-built component library |

### Project Structure

```
/
├── backend/                    # All Go microservices
│   ├── user-service/          # User authentication & merchant management
│   ├── store-service/         # Store/merchant configuration & discovery
│   ├── product-service/       # Product catalog management
│   ├── order-service/         # Order & cart management
│   ├── customer-service/      # End-customer management
│   ├── payment-service/       # Payment processing
│   ├── inventory-service/     # Stock & inventory management
│   ├── notification-service/  # Email & webhook notifications
│   └── shared/               # Shared Go modules (tokens, uploads)
├── admin-front/              # Merchant admin dashboard (Next.js)
├── store-front/              # Customer storefront (Next.js)
├── infra/                    # Infrastructure configs
│   ├── nginx/               # Reverse proxy configs
│   ├── pm2/                 # Process manager configs
│   ├── postgres/            # Database initialization
│   └── systemd/             # Linux service files
├── scripts/                 # Deployment & build scripts
├── docker-compose.yml       # Local development orchestration
└── Makefile                # Build & run commands
```

### Key Architecture Decisions

1. **Microservices Pattern**: Each service is independently deployable and scalable
2. **Multi-tenancy**: Merchant-based isolation via `merchant_id` in all tenant-aware tables
3. **Shared Database**: Single PostgreSQL instance (schema-per-tenant upgrade path exists)
4. **JWT Authentication**: Token-based auth with 2FA support (user-service)
5. **Merchant Routing**: All requests include `X-Merchant-ID` header for context
6. **Public & Protected Routes**: `/pub/v1` for public storefront, `/api/v1` for authenticated access
7. **Shared Library**: `backend/shared` contains reusable modules (token handling, file uploads)

### Environment Configuration

Database: `postgres://saas:changeme@localhost:5432/saas_platform`  
Redis: `redis://localhost:6379`  
JWT Secret: `dev-jwt-secret-change-in-production-32ch`

Services run on ports:
- User Service: `8001`
- Store Service: `8002`
- Product Service: `8005`
- Order Service: `8003`
- Payment Service: `8007`
- Customer Service: `8008`
- Inventory Service: `8006`
- Notification Service: `8004`
- Admin Dashboard: `3000`
- Store Front: `3001`

---

## 2. MIGRATIONS

All migrations use Goose (v3) with PostgreSQL's `+goose Up/Down` markers.

### 2.1 User Service Migrations

| File | Table/Purpose |
|------|---------------|
| `001_create_users.sql` | **users** — Core user accounts (first_name, last_name, email, phone, password_hash, email_verified, phone_verified, is_active) |
| `002_create_merchants.sql` | **merchants** — Merchant stores (user_id, business_name, slug, description, logo_url, is_active) |
| `003_create_roles.sql` | **roles** — Role definitions (name, description) |
| `004_create_permissions.sql` | **permissions** — Permission definitions (resource, action) |
| `005_create_role_permissions.sql` | **role_permissions** — Role-permission mapping |
| `006_create_merchant_users.sql` | **merchant_users** — Maps users to merchants with role assignment |
| `007_create_oauth_providers.sql` | **oauth_providers** — OAuth provider credentials (merchant_id, provider, app_id, app_secret) |
| `008_create_sessions.sql` | **sessions** — User session tracking (user_id, token, expires_at) |

**Key Tables:**
- `users`: Unique email index, phone index (nullable)
- `merchants`: Unique slug per business
- `merchant_users`: Junction table for multi-store user access

---

### 2.2 Product Service Migrations

| File | Table/Purpose |
|------|---------------|
| `001_create_categories.sql` | **categories** — Hierarchical product categories with materialized path (merchant_id, parent_id, name, slug, path for subtree queries) |
| `002_create_products.sql` | **products** — Product listings (merchant_id, category_id, name, sku, price, stock, description, images) |
| `003_create_product_images.sql` | **product_images** — Product image gallery (product_id, image_url, alt_text, sort_order) |
| `004_create_product_variants.sql` | **product_variants** — SKU variants (product_id, name, sku, price override, stock) |
| `005_create_product_tags.sql` | **product_tags** — Tagging system (product_id, tag_name) |
| `006_add_hs_code_to_products.sql` | HS code for export/customs (column added to products) |
| `007_add_media_columns_to_product_images.sql` | Media metadata (file_size, mime_type, etc.) |

**Key Features:**
- Categories use materialized path (`path = 'root-uuid/child-uuid/this-uuid'`) for efficient subtree queries
- Depth tracking for nested categories
- Product variants for SKU management
- Image gallery with sort order

---

### 2.3 Order Service Migrations

| File | Table/Purpose |
|------|---------------|
| `001_create_order_tables.sql` | **carts**, **cart_items**, **orders**, **order_items**, **order_status_events** |

**Tables:**

1. **carts** (id, merchant_id, customer_id, session_id, status, currency, metadata, created_at, updated_at)
   - Status: `active`, `checked_out`, `abandoned`
   - Supports anonymous (session_id) and authenticated (customer_id) carts

2. **cart_items** (id, cart_id, product_id, product_name, product_sku, quantity, unit_price, created_at, updated_at)
   - Unique constraint on (cart_id, product_id)
   - Quantity > 0, unit_price >= 0

3. **orders** (id, merchant_id, cart_id, customer_id, status, currency, subtotal, tax_amount, total_amount, notes, metadata, created_at, updated_at)
   - Status: `pending`, `confirmed`, `paid`, `shipped`, `delivered`, `cancelled`
   - Immutable snapshot with financial totals

4. **order_items** (id, order_id, product_id, product_name, product_sku, quantity, unit_price, line_total, product_snapshot)
   - `product_snapshot` (JSONB) stores product state at purchase time
   - line_total = quantity × unit_price (denormalized for fast reporting)

5. **order_status_events** (id, order_id, merchant_id, from_status, to_status, note, created_at)
   - Audit trail of status changes

**Indexes:**
- `idx_carts_merchant_status`: Fast merchant cart filtering by status
- `idx_orders_merchant_created`: Recent orders per merchant
- `idx_orders_merchant_customer`: Customer order history

---

### 2.4 Customer Service Migrations

| File | Table/Purpose |
|------|---------------|
| `001_create_customers.sql` | **customers** — End-customer records (merchant_id, first_name, last_name, email, phone, notes, metadata) |
| `002_add_customer_auth.sql` | Auth fields (password_hash, email_verified, phone_verified) |
| `003_add_customer_verification_timestamps.sql` | Verification tracking (email_verified_at, phone_verified_at) |

**Key Features:**
- Email & phone unique per merchant (NULL-safe uniqueness)
- JSONB metadata for custom fields (addresses, preferences, tags)
- Denormalized customer data in orders for performance

---

### 2.5 Inventory Service Migrations

| File | Table/Purpose |
|------|---------------|
| `001_create_inventory_tables.sql` | **inventory_stocks**, **inventory_compositions**, **inventory_operations**, **inventory_operation_lines** |

**Tables:**

1. **inventory_stocks** (id, store_id, item_id, quantity, allow_negative, created_at, updated_at)
   - Unique (store_id, item_id)
   - `allow_negative` flag for backorder logic

2. **inventory_compositions** (id, store_id, item_id, component_item_id, quantity_per_unit, purpose)
   - Tracks components for bundle/production scenarios
   - Purpose: `production`, `bundle`, `both`

3. **inventory_operations** (id, store_id, operation_type, reference, reason, created_by, created_at)
   - operation_type: `sale`, `production`, `bundle_sale`, `adjustment`
   - reference & reason for audit trail

4. **inventory_operation_lines** (id, operation_id, store_id, item_id, delta, before_qty, after_qty, created_at)
   - Immutable line items per operation
   - before_qty / after_qty capture the state before and after

**Indexes:**
- `idx_inventory_stocks_store_item`: Fast stock lookup
- `idx_inventory_operations_store_created`: Recent operations per store
- `idx_inventory_op_lines_operation`: Line items per operation

---

### 2.6 Payment Service

- Currently no migrations (stub service)
- Planned: payment_transactions, payment_methods, payment_logs

---

### 2.7 Notification Service

- Currently no migrations (stub service)
- Planned: notification_templates, notification_logs, webhook_endpoints

---

## 3. WHAT EACH SERVICE DOES

### 3.1 User Service (Port 8001)

**Purpose:** Authentication, user management, merchant creation, and multi-factor authentication.

**Key Responsibilities:**
- User registration & email verification
- Login with 2FA support
- JWT token generation & validation
- Recovery code generation for 2FA backup
- Merchant creation (store provisioning)
- Role-based access control (RBAC)
- OAuth provider integration support

**Key Endpoints:**
- `POST /api/v1/auth/register` — Register new user
- `POST /api/v1/auth/verify-email` — Verify email OTP
- `POST /api/v1/auth/login` — Login (returns JWT + 2FA challenge if needed)
- `POST /api/v1/auth/2fa/verify` — Verify 2FA code
- `POST /api/v1/auth/2fa/enable` — Enable 2FA for user
- `POST /api/v1/merchants` — Create new merchant store
- `GET /api/v1/merchants/mine` — List user's stores
- `GET /api/v1/auth/me` — Get current user profile
- `PATCH /api/v1/auth/me` — Update user profile

**Database:** users, merchants, merchant_users, roles, permissions, role_permissions, oauth_providers, sessions

**Auth Model:**
- Requires JWT for all merchant operations
- All merchant endpoints require `X-Merchant-ID` header
- 2FA is opt-in per user

---

### 3.2 Store Service (Port 8002)

**Purpose:** Merchant store management, configuration, and public storefront discovery.

**Key Responsibilities:**
- Store/merchant configuration management
- Store slug-based discovery (for storefronts)
- Public store information retrieval (name, logo, description)
- Basic product & category delegation to other services
- Store settings management (business hours, shipping, taxes)

**Key Endpoints:**
- `POST /api/v1/merchants` — Create new store (JWT required)
- `GET /api/v1/merchants/mine` — List user's stores (JWT required)
- `GET /api/v1/merchants/me` — Get current store details (JWT + X-Merchant-ID)
- `PATCH /api/v1/merchants/me` — Update store details (JWT + X-Merchant-ID)
- `GET /pub/v1/stores/:slug` — **Public** — Get store info by slug (no auth)

**Database:** merchants (from user-service schema)

**Routing Notes:**
- Acts as a lightweight store catalog service
- Public `/pub/v1` endpoints for storefront lookups
- Delegates product/category work to product-service

---

### 3.3 Product Service (Port 8005)

**Purpose:** Product catalog, category management, image handling, and variants.

**Key Responsibilities:**
- Product CRUD operations
- Hierarchical category management with materialized paths
- Product images & gallery management
- Product variants (SKUs)
- Product tagging system
- File upload handling for images
- Static file serving for uploaded images

**Key Endpoints:**
- `GET /api/v1/categories` — List categories (JWT + X-Merchant-ID)
- `POST /api/v1/categories` — Create category (JWT + X-Merchant-ID)
- `GET /api/v1/products` — List products (JWT + X-Merchant-ID)
- `GET /api/v1/products/:id` — Get product details (JWT + X-Merchant-ID)
- `POST /api/v1/products` — Create product with images (JWT + X-Merchant-ID)
- `PUT /api/v1/products/:id` — Update product (JWT + X-Merchant-ID)
- `GET /storage/*` — **Public** — Serve uploaded product images

**Database:** categories, products, product_images, product_variants, product_tags

**Features:**
- Efficient category subtree queries via materialized path
- Image upload & storage on disk
- Product snapshot for order history

---

### 3.4 Order Service (Port 8003)

**Purpose:** Shopping cart, checkout, and order lifecycle management.

**Key Responsibilities:**
- Shopping cart management (create, update, abandon)
- Cart item manipulation (add, remove, update quantity)
- Order creation from cart
- Order status transitions & audit trail
- Order & order item retrieval
- Abandoned cart tracking for recovery

**Key Endpoints:**
- `POST /api/v1/carts` — Create cart (JWT + X-Merchant-ID)
- `GET /api/v1/carts/:id` — Get cart details (JWT + X-Merchant-ID)
- `POST /api/v1/carts/:id/items` — Add item to cart (JWT + X-Merchant-ID)
- `DELETE /api/v1/carts/:id/items/:itemId` — Remove item from cart (JWT + X-Merchant-ID)
- `POST /api/v1/carts/:id/checkout` — Create order from cart (JWT + X-Merchant-ID)
- `GET /api/v1/orders` — List orders (JWT + X-Merchant-ID)
- `GET /api/v1/orders/:id` — Get order details (JWT + X-Merchant-ID)
- `PATCH /api/v1/orders/:id/status` — Update order status (JWT + X-Merchant-ID)

**Database:** carts, cart_items, orders, order_items, order_status_events

**Features:**
- Support for both authenticated (customer_id) and anonymous (session_id) carts
- Order status workflow with audit events
- Product snapshot preservation in order_items (historical accuracy)

---

### 3.5 Customer Service (Port 8008)

**Purpose:** End-customer management for merchants.

**Key Responsibilities:**
- Customer CRUD (create, list, update, delete)
- Customer authentication (email/password for storefront login)
- Email & phone verification
- Custom metadata storage (addresses, preferences, tags)
- Customer segment/tag management

**Key Endpoints:**
- `GET /api/v1/customers` — List customers (JWT + X-Merchant-ID)
- `GET /api/v1/customers/:id` — Get customer details (JWT + X-Merchant-ID)
- `POST /api/v1/customers` — Create customer (JWT + X-Merchant-ID)
- `PUT /api/v1/customers/:id` — Update customer (JWT + X-Merchant-ID)
- `DELETE /api/v1/customers/:id` — Delete customer (JWT + X-Merchant-ID)
- `POST /api/v1/customers/auth/login` — Customer login (public, returns JWT)
- `POST /api/v1/customers/auth/register` — Customer self-signup (public)

**Database:** customers

**Features:**
- Isolated per merchant (merchant_id scoping)
- Custom metadata JSONB field for extensibility
- Email & phone verification tracking

---

### 3.6 Inventory Service (Port 8006)

**Purpose:** Stock management, composition tracking, and inventory operations.

**Key Responsibilities:**
- Stock level management per item per store
- Inventory adjustment operations (sale, production, adjustment)
- Bundle/composition tracking (e.g., kit items)
- Allow-negative flag for backorder scenarios
- Inventory operation audit trail with before/after snapshots
- Stock-level queries & reports

**Key Endpoints:**
- `GET /api/v1/inventory/stocks` — Get stock levels (JWT + X-Merchant-ID)
- `GET /api/v1/inventory/stocks/:itemId` — Get stock for item (JWT + X-Merchant-ID)
- `POST /api/v1/inventory/operations` — Record inventory operation (JWT + X-Merchant-ID)
- `GET /api/v1/inventory/operations` — List operations (JWT + X-Merchant-ID)
- `POST /api/v1/inventory/compositions` — Define bundle/kit composition (JWT + X-Merchant-ID)
- `GET /api/v1/inventory/compositions` — List compositions (JWT + X-Merchant-ID)

**Database:** inventory_stocks, inventory_compositions, inventory_operations, inventory_operation_lines

**Features:**
- Immutable operation lines for audit trail
- before_qty / after_qty for state tracking
- Composition types: `production`, `bundle`, `both`
- Allow-negative for backorder handling

---

### 3.7 Payment Service (Port 8007)

**Purpose:** Payment processing & transaction management (stub).

**Current Status:** Skeleton only (no routes, no migrations)

**Planned Responsibilities:**
- Payment gateway integration (Razorpay, Stripe)
- Payment method management (cards, UPI, net banking)
- Transaction recording & reconciliation
- Webhook handling for payment callbacks
- Refund processing
- PCI compliance & security

**Planned Endpoints:**
- `POST /api/v1/payments` — Initiate payment
- `GET /api/v1/payments/:id` — Get payment status
- `POST /api/v1/payments/:id/refund` — Refund payment
- `POST /webhooks/payment-callback` — Handle provider callbacks

---

### 3.8 Notification Service (Port 8004)

**Purpose:** Email & webhook notifications (stub).

**Current Status:** Skeleton only (no routes, no migrations)

**Planned Responsibilities:**
- Email template management
- Email sending (via Resend, SendGrid, etc.)
- Webhook event delivery to third-party services
- Notification logging & retry logic
- SMS notifications (future)
- Push notifications (future)

**Planned Endpoints:**
- `POST /api/v1/notifications/send` — Send notification
- `GET /api/v1/notifications/logs` — Get notification history
- `POST /api/v1/webhooks/register` — Register webhook endpoint
- `GET /api/v1/webhooks` — List registered webhooks

**Trigger Events:**
- User registration → send verification email
- Order placed → send confirmation email
- Order shipped → send tracking email
- Payment received → send receipt email

---

### 3.9 Shared Library (`backend/shared`)

**Purpose:** Reusable Go modules for all backend services.

**Contains:**
- **token/** — JWT generation & validation helpers
- **upload/** — File upload service for image handling (used by product-service)

**Usage:** Each service imports from shared for common patterns

---

## 4. FRONTEND APPLICATIONS

### 4.1 Admin Dashboard (`admin-front/`, Port 3000)

**Purpose:** Merchant admin interface to manage stores, products, orders, and customers.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui

**Key Pages:**
- `/login` — Merchant login (user-service JWT)
- `/register` — Merchant registration
- `/dashboard` — Sales metrics, recent orders, quick actions
- `/products` — Product listing, creation, editing
- `/categories` — Category hierarchy management
- `/orders` — Order management, status updates
- `/customers` — Customer list, details, messaging
- `/payments` — Payment history, refunds
- `/settings` — Store settings, integrations, shipping/tax config
- `/tags` — Product tag management
- `/onboarding` — First-time setup wizard

**Features:**
- Multi-store support (X-Merchant-ID header in API calls)
- Real-time status updates (websocket ready, not yet implemented)
- Bulk operations (upload products via CSV)
- Customer segmentation
- Order exports
- Store logo & branding customization

---

### 4.2 Customer Storefront (`store-front/`, Port 3001)

**Purpose:** Public-facing e-commerce storefront for end customers.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui

**Key Pages:**
- `/` — Homepage with featured products
- `/[storeSlug]` — Store-specific homepage (multi-store routing)
- `/[storeSlug]/products` — Product listing with filters
- `/[storeSlug]/products/:id` — Product detail page
- `/[storeSlug]/cart` — Shopping cart
- `/[storeSlug]/checkout` — Checkout flow
- `/[storeSlug]/orders/:id` — Order tracking
- `/[storeSlug]/account` — Customer account (addresses, orders, wishlist)
- `/[storeSlug]/login` — Customer login (customer-service JWT)
- `/[storeSlug]/register` — Customer registration

**Features:**
- Multi-store support via URL slug (store-service lookup)
- Product filtering by category & tags
- Search functionality
- Cart persistence (localStorage + backend sync)
- Order tracking
- Customer account management
- Responsive design (mobile-first)

---

## SUMMARY TABLE: SERVICES & PORTS

| Service | Port | Language | Purpose | Database |
|---------|------|----------|---------|----------|
| User Service | 8001 | Go/Fiber | Auth & merchant management | users, merchants, roles, permissions |
| Store Service | 8002 | Go/Fiber | Store config & discovery | merchants |
| Order Service | 8003 | Go/Fiber | Carts & orders | carts, orders, order_items |
| Notification Service | 8004 | Go/Fiber | Email & webhooks | (future) |
| Product Service | 8005 | Go/Fiber | Products, categories, images | products, categories, variants |
| Inventory Service | 8006 | Go/Fiber | Stock management | inventory_stocks, operations |
| Payment Service | 8007 | Go/Fiber | Payments (stub) | (future) |
| Customer Service | 8008 | Go/Fiber | End-customer management | customers |
| Admin Dashboard | 3000 | Next.js/React | Merchant admin interface | (API clients) |
| Customer Storefront | 3001 | Next.js/React | Public e-commerce UI | (API clients) |

---

---

## MIGRATION TO LARAVEL + NEXT.JS

### NEW PROJECT STRUCTURE

After migration, the project will be restructured as:

```
/
├── api/                      # Laravel APIs (replaces all backend/ Go services)
│   ├── app/
│   │   ├── Models/          # Eloquent models (User, Merchant, Product, Order, etc.)
│   │   ├── Http/
│   │   │   ├── Controllers/ # API controllers (grouped by resource)
│   │   │   └── Middleware/  # Auth, tenant, CORS middleware
│   │   ├── Services/        # Business logic (UserService, OrderService, etc.)
│   │   ├── Repositories/    # Data access layer
│   │   └── Jobs/            # Queued jobs (notifications, exports)
│   ├── routes/
│   │   ├── api.php          # /api/v1/* routes
│   │   └── web.php          # Admin/dashboard routes
│   ├── database/
│   │   ├── migrations/      # Laravel migrations (replaces Goose)
│   │   └── seeders/         # Data seeders
│   ├── config/              # Laravel config files
│   ├── .env.example
│   ├── docker-compose.yml   # Or single compose at root
│   └── Dockerfile
│
├── store-front/            # SAME AS CURRENT (Next.js 16, React 19)
│   └── (unchanged)
│
├── admin-front/            # SAME AS CURRENT (Next.js 16, React 19)
│   └── (unchanged)
│
├── docker-compose.yml      # Orchestrates API (Laravel) + both frontends
└── README.md
```

### KEY ADAPTATIONS FOR LARAVEL

1. **Single API Monolith**: Instead of 8 Go microservices, use 1 Laravel application with multiple controllers
2. **Eloquent Models**: Replace sqlc + PostgreSQL queries with Eloquent ORM
3. **Service Layer**: Create `app/Services/` with same business logic (UserService, OrderService, InventoryService, etc.)
4. **Migrations**: Convert Goose SQL files to Laravel migration files with Eloquent up/down methods
5. **Middleware**: Use Laravel middleware for auth, CORS, tenant handling (X-Merchant-ID)
6. **Routing**: Organize routes by feature (AuthController, ProductController, OrderController, etc.)
7. **Queue System**: Use Laravel jobs for async tasks (email notifications, exports)
8. **Testing**: Laravel's testing framework instead of Go tests
9. **Authentication**: Laravel Passport or Sanctum for JWT tokens
10. **Environment**: Single `.env` file for entire project (api + frontend configs)

### VERSIONS FOR LARAVEL MIGRATION

| Technology | Version | Purpose |
|-----------|---------|---------|
| Laravel | 11 | Web framework & API |
| PHP | 8.3 | Runtime |
| PostgreSQL | 18 | Database (same) |
| Redis | 8 | Cache & sessions (same) |
| Next.js | 16 | Admin & storefront (same) |
| React | 19 | Frontend (same) |
| TypeScript | 5 | Frontend (same) |
| Tailwind CSS | v4 | Styling (same) |
| shadcn/ui | latest | UI components (same) |

### MIGRATION PROMPT FOR SCAFFOLDING NEW PROJECT

---

# SCAFFOLD PROMPT: Ecommify Laravel + Next.js SaaS Platform (Phase 1)

## GOAL

Scaffold a minimal, working Laravel + Next.js e-commerce SaaS platform with:
- **1 Laravel API** (replaces 8 Go microservices) with all endpoints functional
- **2 Next.js frontends** (admin & storefront) with placeholder pages
- **PostgreSQL database** with complete schema
- **Docker Compose** for local development

**Phase 1 only.** No business logic. Just the right files with proper structure so the project compiles, runs, and passes basic health checks.

---

## VERSIONS (exact — do not substitute)

| Technology | Version |
|-----------|---------|
| Laravel | 11 |
| PHP | 8.3 |
| PostgreSQL | 18 |
| Redis | 8 |
| Next.js | 16 |
| React | 19 |
| TypeScript | 5 |
| Tailwind CSS | v4 |
| shadcn/ui | latest |
| Laravel Sanctum | latest |
| Eloquent ORM | built-in |

---

## MONOREPO LAYOUT

```
/
├── README.md
├── .env.example
├── .gitignore
├── docker-compose.yml
│
├── api/                          # Laravel 11 monolithic API (replaces 8 Go services)
│   ├── app/
│   │   ├── Models/
│   │   │   ├── User.php         # Platform admin user
│   │   │   ├── Merchant.php     # Merchant/store
│   │   │   ├── MerchantUser.php # User-store relationship + roles
│   │   │   ├── Product.php
│   │   │   ├── Category.php
│   │   │   ├── ProductImage.php
│   │   │   ├── ProductVariant.php
│   │   │   ├── ProductTag.php
│   │   │   ├── Order.php
│   │   │   ├── OrderItem.php
│   │   │   ├── OrderStatusEvent.php
│   │   │   ├── Cart.php
│   │   │   ├── CartItem.php
│   │   │   ├── Customer.php
│   │   │   ├── InventoryStock.php
│   │   │   ├── InventoryComposition.php
│   │   │   ├── InventoryOperation.php
│   │   │   ├── InventoryOperationLine.php
│   │   │   ├── Role.php
│   │   │   ├── Permission.php
│   │   │   └── OAuthProvider.php
│   │   │
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── Auth/
│   │   │   │   │   ├── AuthController.php       # register, login, 2fa, me
│   │   │   │   │   └── MerchantController.php   # create store, list, get, update
│   │   │   │   ├── ProductController.php        # CRUD products
│   │   │   │   ├── CategoryController.php       # CRUD categories
│   │   │   │   ├── OrderController.php          # CRUD orders, status updates
│   │   │   │   ├── CartController.php           # CRUD carts, items, checkout
│   │   │   │   ├── CustomerController.php       # CRUD customers
│   │   │   │   ├── InventoryController.php      # Stock, operations, compositions
│   │   │   │   ├── PaymentController.php        # Payment stubs
│   │   │   │   ├── NotificationController.php   # Notification stubs
│   │   │   │   └── PublicController.php         # /pub routes (no auth)
│   │   │   │
│   │   │   ├── Middleware/
│   │   │   │   ├── Auth.php                 # Validates Sanctum token
│   │   │   │   ├── Merchant.php             # Reads X-Merchant-ID header, validates
│   │   │   │   ├── Cors.php                 # CORS headers
│   │   │   │   └── TwoFA.php                # 2FA middleware (optional)
│   │   │   │
│   │   │   └── Requests/
│   │   │       ├── RegisterRequest.php
│   │   │       ├── LoginRequest.php
│   │   │       ├── CreateProductRequest.php
│   │   │       ├── CreateOrderRequest.php
│   │   │       └── ... (other form requests)
│   │   │
│   │   ├── Services/
│   │   │   ├── AuthService.php              # User registration, login, 2FA logic
│   │   │   ├── MerchantService.php          # Store provisioning & management
│   │   │   ├── ProductService.php           # Product logic, validation
│   │   │   ├── CategoryService.php          # Category hierarchy management
│   │   │   ├── OrderService.php             # Order creation, status transitions
│   │   │   ├── CartService.php              # Cart logic
│   │   │   ├── CustomerService.php          # Customer CRUD
│   │   │   ├── InventoryService.php         # Stock management, operations
│   │   │   ├── PaymentService.php           # Payment logic (stub)
│   │   │   └── NotificationService.php      # Email & webhook logic (stub)
│   │   │
│   │   ├── Repositories/
│   │   │   ├── UserRepository.php
│   │   │   ├── ProductRepository.php
│   │   │   ├── OrderRepository.php
│   │   │   └── ... (other repos)
│   │   │
│   │   ├── Jobs/
│   │   │   ├── SendVerificationEmail.php
│   │   │   ├── SendOrderConfirmation.php
│   │   │   └── SendNotification.php
│   │   │
│   │   └── Traits/
│   │       ├── HasMerchantScope.php         # Auto-scopes queries to merchant_id
│   │       └── UUIDPrimary.php              # UUID primary keys
│   │
│   ├── routes/
│   │   ├── api.php                          # /api/v1/* routes
│   │   ├── web.php                          # Health checks, admin routes (if needed)
│   │   └── channels.php                     # Broadcasting (future)
│   │
│   ├── database/
│   │   ├── migrations/
│   │   │   ├── 0001_create_users.php
│   │   │   ├── 0002_create_merchants.php
│   │   │   ├── 0003_create_roles.php
│   │   │   ├── 0004_create_permissions.php
│   │   │   ├── 0005_create_role_permissions.php
│   │   │   ├── 0006_create_merchant_users.php
│   │   │   ├── 0007_create_oauth_providers.php
│   │   │   ├── 0008_create_sessions.php
│   │   │   ├── 0010_create_categories.php
│   │   │   ├── 0011_create_products.php
│   │   │   ├── 0012_create_product_images.php
│   │   │   ├── 0013_create_product_variants.php
│   │   │   ├── 0014_create_product_tags.php
│   │   │   ├── 0015_add_hs_code_to_products.php
│   │   │   ├── 0016_add_media_columns_to_product_images.php
│   │   │   ├── 0020_create_carts.php
│   │   │   ├── 0021_create_cart_items.php
│   │   │   ├── 0022_create_orders.php
│   │   │   ├── 0023_create_order_items.php
│   │   │   ├── 0024_create_order_status_events.php
│   │   │   ├── 0030_create_customers.php
│   │   │   ├── 0031_add_customer_auth.php
│   │   │   ├── 0032_add_customer_verification_timestamps.php
│   │   │   ├── 0040_create_inventory_tables.php
│   │   │   └── ... (other migrations)
│   │   │
│   │   └── seeders/
│   │       ├── DatabaseSeeder.php
│   │       ├── UserSeeder.php
│   │       ├── MerchantSeeder.php
│   │       └── ProductSeeder.php
│   │
│   ├── config/
│   │   ├── database.php          # PostgreSQL config
│   │   ├── cache.php             # Redis config
│   │   ├── sanctum.php           # JWT/Sanctum config
│   │   └── filesystems.php       # Upload storage config
│   │
│   ├── storage/
│   │   └── app/
│   │       └── public/
│   │           └── products/     # Product images directory
│   │
│   ├── .env.example
│   ├── artisan
│   ├── composer.json             # Dependencies: laravel/sanctum, laravel/tinker
│   ├── docker-compose.yml        # Local dev (or use root compose)
│   ├── Dockerfile
│   ├── .dockerignore
│   └── bootstrap/
│       └── cache/ + app.php
│
├── admin-front/                  # NEXT.JS 16 + REACT 19 (SAME STRUCTURE)
│   ├── package.json              # next@16, react@19, typescript, tailwindcss@4
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── .env.example
│   ├── Dockerfile
│   │
│   ├── app/
│   │   ├── layout.tsx            # Root layout with globals.css
│   │   ├── page.tsx              # Redirect to /dashboard
│   │   ├── globals.css           # Tailwind directives
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx      # Merchant login form
│   │   │   └── register/
│   │   │       └── page.tsx      # Merchant registration form
│   │   │
│   │   └── (dashboard)/
│   │       ├── layout.tsx        # Sidebar + topbar shell
│   │       ├── dashboard/
│   │       │   └── page.tsx      # Sales metrics, recent orders (placeholders)
│   │       ├── products/
│   │       │   └── page.tsx      # Products list placeholder
│   │       ├── categories/
│   │       │   └── page.tsx      # Categories list placeholder
│   │       ├── orders/
│   │       │   └── page.tsx      # Orders list placeholder
│   │       ├── customers/
│   │       │   └── page.tsx      # Customers list placeholder
│   │       ├── payments/
│   │       │   └── page.tsx      # Payments list placeholder
│   │       ├── tags/
│   │       │   └── page.tsx      # Tags management placeholder
│   │       ├── settings/
│   │       │   └── page.tsx      # Settings placeholder
│   │       └── onboarding/
│   │           └── page.tsx      # Setup wizard placeholder
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx       # Navigation links
│   │   │   └── Topbar.tsx        # Top bar with user menu
│   │   │
│   │   └── ui/                   # shadcn/ui components
│   │
│   ├── lib/
│   │   ├── types/
│   │   │   ├── user.ts
│   │   │   ├── merchant.ts
│   │   │   ├── product.ts
│   │   │   ├── order.ts
│   │   │   └── customer.ts
│   │   │
│   │   ├── api/
│   │   │   └── client.ts         # Fetch wrapper with X-Merchant-ID header
│   │   │
│   │   └── utils/
│   │       └── cn.ts             # clsx + twMerge helper
│   │
│   └── .gitignore, next-env.d.ts, etc.
│
├── store-front/                  # NEXT.JS 16 + REACT 19 (SAME STRUCTURE)
│   ├── package.json              # next@16, react@19, typescript, tailwindcss@4
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── .env.example
│   ├── Dockerfile
│   │
│   ├── app/
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Homepage with featured products (placeholder)
│   │   ├── globals.css           # Tailwind directives
│   │   │
│   │   ├── [storeSlug]/
│   │   │   ├── page.tsx          # Store homepage
│   │   │   ├── products/
│   │   │   │   ├── page.tsx      # Product listing with filters
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Product detail page
│   │   │   ├── cart/
│   │   │   │   └── page.tsx      # Shopping cart
│   │   │   ├── checkout/
│   │   │   │   └── page.tsx      # Checkout flow (placeholder)
│   │   │   ├── orders/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Order detail & tracking
│   │   │   ├── account/
│   │   │   │   └── page.tsx      # Customer account (placeholder)
│   │   │   ├── login/
│   │   │   │   └── page.tsx      # Customer login form
│   │   │   └── register/
│   │   │       └── page.tsx      # Customer registration form
│   │   │
│   │   └── api/
│   │       └── store/
│   │           └── [slug]/
│   │               └── route.ts  # Fetch store info by slug
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   └── Header.tsx        # Navigation & search
│   │   │
│   │   ├── product/
│   │   │   ├── ProductCard.tsx
│   │   │   └── ProductGrid.tsx
│   │   │
│   │   ├── sections/
│   │   │   ├── FeaturedProducts.tsx
│   │   │   └── CategoryNav.tsx
│   │   │
│   │   └── ui/                   # shadcn/ui components
│   │
│   ├── lib/
│   │   ├── types/
│   │   │   ├── store.ts
│   │   │   ├── product.ts
│   │   │   ├── order.ts
│   │   │   └── customer.ts
│   │   │
│   │   ├── api/
│   │   │   └── client.ts         # Fetch wrapper
│   │   │
│   │   └── utils/
│   │       └── cn.ts             # clsx + twMerge helper
│   │
│   └── .gitignore, next-env.d.ts, etc.
│
└── docker-compose.yml            # Orchestrates api (Laravel), postgres, redis, admin-front, store-front
```

---

## EXECUTION ORDER

1. **Root files** — `README.md`, `.env.example`, `.gitignore`, `docker-compose.yml`
2. **Laravel API** (`api/`) — `composer.json`, `artisan`, config files, migrations, models, controllers, services
3. **Admin Dashboard** (`admin-front/`) — `package.json`, `next.config.ts`, routes, components, lib
4. **Store Front** (`store-front/`) — Same as admin-front structure
5. **Docker setup** — Verify docker-compose runs all 3 services + postgres + redis

---

## PLACEHOLDER RULES

### Laravel Files

- **Models**: Eloquent model with `$fillable`, `$casts` for UUID, timestamps. Relationships defined (e.g., `Merchant belongsTo User`)
- **Controllers**: Return `response()->json(['status' => 'not_implemented'], 501)` for all endpoints
- **Services**: Empty class with `public function methodName() {}` returning null or empty array
- **Migrations**: Use `$table->uuid('id')->primary()`, `$table->uuid('merchant_id')->nullable()`, `$table->timestamps()`
- **Middleware**: Return 400/401 for missing headers, otherwise `return $next($request)`
- **Routes**: All endpoints registered but return 501 until implemented

### Next.js Files

- **Pages**: Default export React component with `'use client'` if using hooks
- **Components**: Simple JSX, placeholder text like `Coming in Phase 2`
- **Layouts**: Export default layout component with children

### Dockerfiles

**Laravel:**
```dockerfile
FROM php:8.3-fpm
WORKDIR /app
RUN apt-get update && apt-get install -y postgresql-client
COPY . .
RUN composer install
RUN php artisan migrate
EXPOSE 9000
CMD ["php-fpm"]
```

**Next.js:**
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
services:
  postgres:
    image: postgres:18
    environment:
      POSTGRES_USER: saas
      POSTGRES_PASSWORD: changeme
      POSTGRES_DB: saas_platform
    ports: ["5432:5432"]
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:8-alpine
    ports: ["6379:6379"]

  api:
    build: ./api
    ports: ["8000:9000"]
    environment:
      DB_HOST: postgres
      DB_USER: saas
      DB_PASSWORD: changeme
      DB_DATABASE: saas_platform
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev-jwt-secret-32ch-minimum
    depends_on: [postgres, redis]

  admin-front:
    build: ./admin-front
    ports: ["3000:3000"]
    environment:
      NEXT_PUBLIC_API_URL: http://api:8000

  store-front:
    build: ./store-front
    ports: ["3001:3000"]
    environment:
      NEXT_PUBLIC_API_URL: http://api:8000

volumes:
  postgres_data:
```

---

## STOP HERE

Stop after **docker-compose up --build** successfully runs all 5 services (postgres, redis, api, admin-front, store-front).

Do **not** implement:
- Business logic in services
- Full CRUD operations
- Payment/notification integrations
- Authentication flow (other than route stubs)
- Admin features (other than placeholders)

Phase 1 is complete when:
- ✅ All services boot without errors
- ✅ All routes are registered (even if 501)
- ✅ Database schema exists
- ✅ Both frontends render placeholder pages

Next phases will add business logic, integrations, and full CRUD.

---

