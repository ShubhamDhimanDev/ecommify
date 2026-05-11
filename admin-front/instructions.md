# Admin Front - Store Access Flow Instructions

## 1. API options currently available (audited)

1. Auth APIs in `src/lib/api.ts`:
- `authApi.register`
- `authApi.login`
- `authApi.logout`
- `authApi.me`
- `authApi.updateMe`
- `authApi.changePassword`
- `authApi.forgotPassword`
- `authApi.resetPassword`
- `authApi.resendVerification`
- `authApi.verifyEmail`

2. Two-factor APIs in `src/lib/api.ts`:
- `twoFactorApi.enable`
- `twoFactorApi.confirm`
- `twoFactorApi.disable`
- `twoFactorApi.challenge`
- `twoFactorApi.recoveryCodes`
- `twoFactorApi.regenerateRecoveryCodes`

3. Store APIs in `src/lib/api.ts`:
- Existing before changes:
  - `storeApi.get` (single store)
  - `storeApi.create`
  - `storeApi.update`
- Added now:
  - `storeApi.list` with fallback probing:
    - Tries `GET /merchant/stores`
    - Tries `GET /merchants/mine`
    - Falls back to `GET /merchant/store` and wraps to array

## 2. Store selection persistence and merchant header

1. Added in `src/lib/api.ts`:
- `activeStoreStorage` (`ecommify_active_store_id` in localStorage)
- automatic `X-Merchant-ID` header injection in all requests when active store exists

2. Result:
- Any selected store is persisted across reloads
- Tenant-aware endpoints receive active merchant context automatically

## 3. Global store context

1. Added `src/context/StoreContext.tsx` with:
- `stores`
- `activeStore`
- `isLoading`
- `refreshStores()`
- `selectStore(storeId)`
- `clearSelection()`

2. Behavior:
- On login, fetches available stores via `storeApi.list`
- If 1 store: auto-selects it
- If multiple stores: restores stored selection if valid, otherwise requires user selection
- On logout/unauthenticated: clears store state and local selection

3. Wired provider in `src/app/layout.tsx`:
- `AuthProvider` -> `StoreProvider` -> app children

## 4. Route behavior (0 / 1 / many stores)

Implemented in `src/app/(dashboard)/layout.tsx`:

1. If user has 0 stores:
- redirect to `/dashboard/store/new`
- exemptions allowed: `/dashboard/store/new`, `/dashboard/profile`, `/dashboard/security`

2. If user has exactly 1 store:
- auto-select that store
- if user is on `/dashboard/store/select`, redirect to `/dashboard`

3. If user has multiple stores:
- if no active store selected, redirect to `/dashboard/store/select`
- exemptions allowed without selecting store: `/dashboard/store/select`, `/dashboard/profile`, `/dashboard/security`

4. Requirement coverage:
- Profile and security pages are always accessible as requested

## 5. Store selection screen

1. Added page:
- `src/app/(dashboard)/dashboard/store/select/page.tsx`

2. Features:
- Loads all accessible stores from `StoreContext`
- Click any store to select and open `/dashboard`
- Shows active marker if already selected
- Shows fallback action to create store when none found

## 6. Dashboard and store pages adapted

1. Updated `src/app/(dashboard)/dashboard/page.tsx`:
- Uses `StoreContext` instead of single `storeApi.get`
- Shows selected store dashboard when active store exists
- Shows selection CTA when multiple stores exist but none selected
- Shows create-store CTA when no stores exist

2. Updated `src/app/(dashboard)/dashboard/store/page.tsx`:
- Uses active store from `StoreContext`
- Keeps update form behavior
- Adds "Switch store" link when multiple stores are available

## 7. Navigation and header updates

1. Updated `src/components/layout/Sidebar.tsx`:
- Adds "Switch Store" nav item for multi-store users

2. Updated `src/components/layout/Header.tsx`:
- Displays active store badge
- Shows "No store selected" when user has multiple stores without active selection

## 8. Validation checklist (manual)

1. Login user with no stores:
- should land on `/dashboard/store/new`
- `/dashboard/profile` and `/dashboard/security` must still work

2. Login user with one store:
- should auto-open dashboard for that store
- `/dashboard/store/select` should bounce back to `/dashboard`

3. Login user with multiple stores:
- should go to `/dashboard/store/select` until a store is selected
- selecting a store opens `/dashboard`
- selected store persists after page refresh
- profile and security stay accessible without selection

4. Verify API requests include `X-Merchant-ID` after selection.

## 9. Multi-store UX improvements (latest)

1. Added explicit "Add New Store" actions:
- Sidebar shortcut in `src/components/layout/Sidebar.tsx`
- Top action button in `src/app/(dashboard)/dashboard/store/select/page.tsx`

2. Expanded sidebar module options for selected store work:
- `Categories` -> `/dashboard/categories`
- `Products` -> `/dashboard/products`
- `Orders` -> `/dashboard/orders`
- `Customers` -> `/dashboard/customers`
- `Payments` -> `/dashboard/payments`
- `Tags` -> `/dashboard/tags`
- `Settings` -> `/dashboard/settings`

3. Multi-store expectations now met:
- Merchant can always create another store
- Merchant can switch store via `/dashboard/store/select`
- Merchant sees operational sidebar modules after selecting store

## 10. Phase 2 - Catalog module completed (API + Admin)

1. Backend API implemented for catalog:
- `api/app/Http/Controllers/Api/V1/CategoryController.php`
  - `GET /api/v1/store/{tenant_slug}/categories`
  - `POST /api/v1/store/{tenant_slug}/categories`
  - `GET /api/v1/store/{tenant_slug}/categories/{id}`
  - `PUT /api/v1/store/{tenant_slug}/categories/{id}`
  - `DELETE /api/v1/store/{tenant_slug}/categories/{id}`
- `api/app/Http/Controllers/Api/V1/ProductController.php`
  - `GET /api/v1/store/{tenant_slug}/products`
  - `POST /api/v1/store/{tenant_slug}/products`
  - `GET /api/v1/store/{tenant_slug}/products/{id}`
  - `PUT /api/v1/store/{tenant_slug}/products/{id}`
  - `DELETE /api/v1/store/{tenant_slug}/products/{id}`

2. Multi-store support strengthened in API:
- Added `GET /api/v1/merchant/stores` in `api/routes/api.php`
- Implemented in `api/app/Http/Controllers/Api/V1/Merchant/StoreController.php`
- Updated tenant access middleware `api/app/Http/Middleware/EnsureUserBelongsToTenant.php` to allow store access through `merchant_users` mapping

3. Public catalog endpoints implemented:
- `api/app/Http/Controllers/Api/V1/PublicController.php`
  - store lookup by slug
  - list products by store slug
  - product detail by store slug and id

4. Admin-front API client expanded:
- `src/lib/api.ts`
  - Added `categoryApi` with list/create/update/delete
  - Added `productApi` with list/create/update/delete

5. Admin-front pages completed for catalog:
- `src/app/(dashboard)/dashboard/categories/page.tsx`
  - Working category CRUD UI
- `src/app/(dashboard)/dashboard/products/page.tsx`
  - Working product CRUD UI

6. Type support added:
- `src/lib/types.ts`
  - Added `Category` and `Product` interfaces

## 11. Phase 2 - Orders and customers continuation (API + Admin)

1. Backend API implemented for customers:
- `api/app/Http/Controllers/Api/V1/CustomerController.php`
  - `GET /api/v1/store/{tenant_slug}/customers`
  - `POST /api/v1/store/{tenant_slug}/customers`
  - `GET /api/v1/store/{tenant_slug}/customers/{id}`
  - `PUT /api/v1/store/{tenant_slug}/customers/{id}`
  - `DELETE /api/v1/store/{tenant_slug}/customers/{id}`
  - `POST /api/v1/public/customers/register`
  - `POST /api/v1/public/customers/login`

2. Backend API implemented for orders:
- `api/app/Http/Controllers/Api/V1/OrderController.php`
  - `GET /api/v1/store/{tenant_slug}/orders`
  - `GET /api/v1/store/{tenant_slug}/orders/{id}`
  - `PATCH /api/v1/store/{tenant_slug}/orders/{id}/status`

3. Backend API implemented for cart/checkout:
- `api/app/Http/Controllers/Api/V1/CartController.php`
  - `POST /api/v1/store/{tenant_slug}/carts`
  - `GET /api/v1/store/{tenant_slug}/carts/{id}`
  - `POST /api/v1/store/{tenant_slug}/carts/{id}/items`
  - `DELETE /api/v1/store/{tenant_slug}/carts/{id}/items/{item_id}`
  - `POST /api/v1/store/{tenant_slug}/carts/{id}/checkout`

4. Admin-front API client expanded:
- `src/lib/api.ts`
  - Added `customerApi` with list/create/update/delete
  - Added `orderApi` with list/detail/status update

5. Admin-front pages completed for this continuation:
- `src/app/(dashboard)/dashboard/customers/page.tsx`
  - Working customer management UI (list, search, create, edit, delete)
- `src/app/(dashboard)/dashboard/orders/page.tsx`
  - Working order list with status filter
  - Order detail panel with item timeline
  - Order status update flow with note

## 12. Product media uploads + drag-drop sort + detailed variants

1. Product media storage support added in API:
- New migration: `api/database/migrations/2026_05_12_120100_add_media_columns_to_product_images_table.php`
  - Added `media_type` (`image` or `video`)
  - Added `storage_path` (stored file path on disk)
- Updated model: `api/app/Models/ProductImage.php`
  - Added new fillable fields for media metadata

2. Product CRUD now supports media files directly in create/update:
- Updated `api/app/Http/Controllers/Api/V1/ProductController.php`
  - Accepts multipart uploads in `media_uploads[]`
  - Stores files to: `/storage/{store_slug}/products/{uuid}.{ext}` using `public` disk
  - Supports images and videos in one queue
  - Supports ordered media persistence via `sort_order`
  - Supports media removal by replacing persisted media list on update
  - Cleans up removed previously-stored media files from disk

3. Public storefront product payload expanded:
- Updated `api/app/Http/Controllers/Api/V1/PublicController.php`
  - Includes product media, variants, and tags in public list/detail responses
  - Media is returned in configured sort order

4. Admin-front API helper updated for file uploads:
- Updated `admin-front/src/lib/api.ts`
  - Core request helper now supports `FormData`
  - Product create/update accepts multipart payloads for media files

5. Admin-front product page rebuilt for non-technical usage:
- Updated `admin-front/src/app/(dashboard)/dashboard/products/page.tsx`
  - Media upload input with multiple images/videos
  - Media preview queue with remove action
  - Drag-and-drop sorting for media order using dnd-kit
  - Alt text editing per media item
  - Detailed variant builder UI (row-based fields: name, sku, price, stock)
  - Add/remove variant rows without technical text syntax

6. Dependencies added for drag-and-drop:
- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`

7. Validation status:
- Migration applied successfully
- Product store routes remain registered
- Changed API and admin-front product files pass diagnostics/lint checks

## 13. Scalable media uploader abstraction + root /storage local disk

1. Introduced a dedicated media uploader service:
- `api/app/Services/MediaUploader.php`
  - `uploadProductMedia()` handles image/video uploads
  - `deleteByPath()` handles media cleanup for removed files
  - Upload path format remains `{store_slug}/products/{uuid.ext}`

2. Made media storage disk configurable for scale:
- New config: `api/config/media.php`
  - `MEDIA_DISK` controls active media storage backend
  - Works with local disk, `s3`, or any configured filesystem disk

3. Added root-level local media disk (outside `/api`):
- Updated `api/config/filesystems.php`
  - Added `media_local` disk
  - Default root points to workspace root `/storage` (outside `/api`)
  - Media URL comes from `MEDIA_BASE_URL`

4. Added env controls for deployment portability:
- Updated `api/.env.example`
  - `MEDIA_DISK=media_local`
  - `MEDIA_LOCAL_ROOT=../storage`
  - `MEDIA_BASE_URL=http://localhost/storage`

5. Product media flow now uses uploader abstraction:
- Updated `api/app/Http/Controllers/Api/V1/ProductController.php`
  - File uploads route through `MediaUploader`
  - File deletion uses disk-agnostic deletion path
  - No hardcoded `public` disk dependency
