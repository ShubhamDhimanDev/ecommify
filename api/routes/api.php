<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Admin\TenantController;
use App\Http\Controllers\Api\V1\CartController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\InventoryController;
use App\Http\Controllers\Api\V1\Auth\EmailVerificationController;
use App\Http\Controllers\Api\V1\Auth\LoginController;
use App\Http\Controllers\Api\V1\Auth\LogoutController;
use App\Http\Controllers\Api\V1\Auth\MeController;
use App\Http\Controllers\Api\V1\Auth\PasswordController;
use App\Http\Controllers\Api\V1\Auth\RegisterController;
use App\Http\Controllers\Api\V1\Auth\TwoFactorController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\PaymentGatewayController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\PublicController;
use App\Http\Controllers\Api\V1\Merchant\StoreController;
use App\Http\Middleware\EnsureTenantIsActive;
use App\Http\Middleware\EnsureUserBelongsToTenant;
use App\Http\Middleware\InitializeTenancyFromSlug;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes  —  /api/v1/...
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // -----------------------------------------------------------------------
    // Auth  (public)
    // -----------------------------------------------------------------------
    Route::prefix('auth')->name('auth.')->group(function () {

        Route::post('register', RegisterController::class)->name('register');
        Route::post('login', LoginController::class)->name('login');
        Route::post('forgot-password', [PasswordController::class, 'forgotPassword'])->name('password.forgot');
        Route::post('reset-password', [PasswordController::class, 'resetPassword'])->name('password.reset');

        // 2FA challenge (called after login when two_factor_required is returned)
        Route::post('2fa/challenge', [TwoFactorController::class, 'challenge'])
            ->name('2fa.challenge')
            ->middleware('throttle:10,1');

        // ---------------------------------------------------------------
        // Auth  (requires Sanctum token)
        // ---------------------------------------------------------------
        Route::middleware(['auth:sanctum'])->group(function () {

            Route::post('logout', LogoutController::class)->name('logout');

            // Profile
            Route::get('me', [MeController::class, 'show'])->name('me.show');
            Route::put('me', [MeController::class, 'update'])->name('me.update');
            Route::post('change-password', [MeController::class, 'changePassword'])->name('password.change');

            // Email verification
            Route::get('email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
                ->middleware('signed')
                ->name('verification.verify');
            Route::post('email/resend', [EmailVerificationController::class, 'resend'])
                ->middleware('throttle:6,1')
                ->name('verification.resend');

            // 2FA management
            Route::prefix('2fa')->name('2fa.')->group(function () {
                Route::post('enable', [TwoFactorController::class, 'enable'])->name('enable');
                Route::post('confirm', [TwoFactorController::class, 'confirm'])->name('confirm');
                Route::delete('disable', [TwoFactorController::class, 'disable'])->name('disable');
                Route::get('recovery-codes', [TwoFactorController::class, 'recoveryCodes'])->name('recovery-codes.index');
                Route::post('recovery-codes', [TwoFactorController::class, 'regenerateRecoveryCodes'])->name('recovery-codes.regenerate');
            });
        });
    });

    // -----------------------------------------------------------------------
    // Merchant  (authenticated merchant, manages their own store)
    // -----------------------------------------------------------------------
    Route::prefix('merchant')
        ->name('merchant.')
        ->middleware(['auth:sanctum'])
        ->group(function () {
            Route::get('stores', [StoreController::class, 'index'])->name('stores.index');
            Route::get('store', [StoreController::class, 'show'])->name('store.show');
            Route::post('store', [StoreController::class, 'create'])->name('store.create');
            Route::put('store', [StoreController::class, 'update'])->name('store.update');
        });

    // -----------------------------------------------------------------------
    // Admin  (super_admin only)
    // -----------------------------------------------------------------------
    Route::prefix('admin')
        ->name('admin.')
        ->middleware(['auth:sanctum', 'role:super_admin'])
        ->group(function () {

            // Tenant management
            Route::apiResource('tenants', TenantController::class);
            Route::patch('tenants/{tenant}/status', [TenantController::class, 'updateStatus'])
                ->name('tenants.status');
        });

    // -----------------------------------------------------------------------
    // Store  (tenant-scoped routes)
    // -----------------------------------------------------------------------
    Route::prefix('store/{tenant_slug}')
        ->name('store.')
        ->middleware([
            'auth:sanctum',
            InitializeTenancyFromSlug::class,
            EnsureTenantIsActive::class,
            EnsureUserBelongsToTenant::class,
        ])
        ->group(function () {

            // Example placeholder — expand as you build store features
            Route::get('/', fn () => response()->json([
                'message' => 'Store routes are working. Add product, order, customer routes here.',
                'tenant'  => tenant()?->only(['id', 'name', 'slug']),
            ]))->name('index');

            // Categories
            Route::get('categories', [CategoryController::class, 'index'])->name('categories.index');
            Route::post('categories', [CategoryController::class, 'store'])->name('categories.store');
            Route::get('categories/{id}', [CategoryController::class, 'show'])->name('categories.show')->whereUuid('id');
            Route::put('categories/{id}', [CategoryController::class, 'update'])->name('categories.update')->whereUuid('id');
            Route::delete('categories/{id}', [CategoryController::class, 'destroy'])->name('categories.destroy')->whereUuid('id');

            // Products
            Route::get('products', [ProductController::class, 'index'])->name('products.index');
            Route::post('products', [ProductController::class, 'store'])->name('products.store');
            Route::get('products/{id}', [ProductController::class, 'show'])->name('products.show')->whereUuid('id');
            Route::post('products/{id}/variants', [ProductController::class, 'createVariant'])->name('products.variants.store')->whereUuid('id');
            Route::put('products/{id}', [ProductController::class, 'update'])->name('products.update')->whereUuid('id');
            Route::delete('products/{id}', [ProductController::class, 'destroy'])->name('products.destroy')->whereUuid('id');

            // Carts and checkout
            Route::post('carts', [CartController::class, 'store'])->name('carts.store');
            Route::get('carts/{id}', [CartController::class, 'show'])->name('carts.show')->whereUuid('id');
            Route::post('carts/{id}/items', [CartController::class, 'addItem'])->name('carts.items.add')->whereUuid('id');
            Route::delete('carts/{id}/items/{itemId}', [CartController::class, 'removeItem'])->name('carts.items.remove')->whereUuid('id')->whereUuid('itemId');
            Route::post('carts/{id}/checkout', [CartController::class, 'checkout'])->name('carts.checkout')->whereUuid('id');

            // Orders
            Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
            Route::get('orders/{id}', [OrderController::class, 'show'])->name('orders.show')->whereUuid('id');
            Route::patch('orders/{id}/status', [OrderController::class, 'updateStatus'])->name('orders.status')->whereUuid('id');

            // Customers
            Route::get('customers', [CustomerController::class, 'index'])->name('customers.index');
            Route::post('customers', [CustomerController::class, 'store'])->name('customers.store');
            Route::get('customers/{id}', [CustomerController::class, 'show'])->name('customers.show')->whereUuid('id');
            Route::put('customers/{id}', [CustomerController::class, 'update'])->name('customers.update')->whereUuid('id');
            Route::delete('customers/{id}', [CustomerController::class, 'destroy'])->name('customers.destroy')->whereUuid('id');

            // Inventory
            Route::get('inventory/stocks', [InventoryController::class, 'stocks'])->name('inventory.stocks');
            Route::get('inventory/stocks/{itemId}', [InventoryController::class, 'stockByItem'])->name('inventory.stock.item');
            Route::get('inventory/operations', [InventoryController::class, 'operations'])->name('inventory.operations');
            Route::post('inventory/operations', [InventoryController::class, 'createOperation'])->name('inventory.operations.store');
            Route::get('inventory/compositions', [InventoryController::class, 'compositions'])->name('inventory.compositions');
            Route::post('inventory/compositions', [InventoryController::class, 'createComposition'])->name('inventory.compositions.store');

            // Payments (stub)
            Route::post('payments', [PaymentController::class, 'store'])->name('payments.store');
            Route::get('payments/{id}', [PaymentController::class, 'show'])->name('payments.show')->whereUuid('id');
            Route::post('payments/{id}/refund', [PaymentController::class, 'refund'])->name('payments.refund')->whereUuid('id');

            // Payment Gateways (OAuth connections)
            Route::prefix('payment-gateways')->name('payment-gateways.')->group(function () {
                Route::get('/', [PaymentGatewayController::class, 'index'])->name('index');
                Route::get('{gateway}', [PaymentGatewayController::class, 'show'])->name('show');
                Route::post('authorize', [PaymentGatewayController::class, 'authorize'])->name('authorize');
                Route::post('callback', [PaymentGatewayController::class, 'callback'])->name('callback');
                Route::delete('{gateway}', [PaymentGatewayController::class, 'disconnect'])->name('disconnect');
                Route::post('{gateway}/test', [PaymentGatewayController::class, 'test'])->name('test');
            });

            // Notifications (stub)
            Route::post('notifications/send', [NotificationController::class, 'send'])->name('notifications.send');
            Route::get('notifications/logs', [NotificationController::class, 'logs'])->name('notifications.logs');
            Route::post('webhooks/register', [NotificationController::class, 'registerWebhook'])->name('webhooks.register');
            Route::get('webhooks', [NotificationController::class, 'webhooks'])->name('webhooks.index');
        });
});

Route::prefix('pub/v1')->group(function () {
    Route::get('stores/{slug}', [PublicController::class, 'storeBySlug']);
    Route::get('stores/{slug}/categories', [PublicController::class, 'listCategories']);
    Route::get('stores/{slug}/products', [PublicController::class, 'listProducts']);
    Route::get('stores/{slug}/products/{id}', [PublicController::class, 'productDetail'])->whereUuid('id');

    Route::post('customers/auth/login', [CustomerController::class, 'login']);
    Route::post('customers/auth/register', [CustomerController::class, 'register']);
});
