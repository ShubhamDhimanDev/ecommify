# Payment Gateway API Implementation

## Overview

Complete implementation of payment gateway OAuth management endpoints in Laravel API for the Ecommify platform. Stores can now connect their Stripe, Razorpay, and PayPal accounts through a secure OAuth flow.

## Architecture

```
Store connects gateway
    ↓
Frontend requests /authorize endpoint
    ↓
API generates OAuth URL for provider
    ↓
Store redirected to payment provider (Stripe/Razorpay/PayPal)
    ↓
Store authorizes (grants permissions)
    ↓
Provider redirects to /callback with authorization code
    ↓
API exchanges code for OAuth tokens
    ↓
Tokens encrypted and saved to database
    ↓
Store can now process payments
```

## Files Created/Modified

### 1. **PaymentGatewayController** (`app/Http/Controllers/Api/V1/PaymentGatewayController.php`)
New controller handling all payment gateway operations.

**Endpoints:**
- `GET /api/v1/store/{slug}/payment-gateways` → List all connected gateways
- `GET /api/v1/store/{slug}/payment-gateways/{gateway}` → Get specific gateway
- `POST /api/v1/store/{slug}/payment-gateways/authorize` → Initiate OAuth flow
- `POST /api/v1/store/{slug}/payment-gateways/callback` → Handle OAuth callback
- `DELETE /api/v1/store/{slug}/payment-gateways/{gateway}` → Disconnect gateway
- `POST /api/v1/store/{slug}/payment-gateways/{gateway}/test` → Test connection

### 2. **StoreGatewayConfigManager** (UPDATED)
Implemented all database operations.

**Methods:**
- `getStoreGatewayConfig(storeId)` - Get active gateway for store
- `getStoreGatewayConfigByName(storeId, gatewayName)` - Get specific gateway
- `saveStoreGatewayConfig(config)` - Save/update configuration with encryption
- `deactivateGatewayConfig(storeId, gatewayName)` - Disconnect gateway
- `getStoreAllGatewayConfigs(storeId)` - Get all gateways for store
- `hasValidGatewayConfig(storeId, gatewayName)` - Check if configured
- `mapRowToDTO(row)` - Convert DB row to DTO with decryption

**Features:**
- Automatic encryption/decryption of OAuth tokens
- Clean DTO mapping for data consistency
- Proper database error handling

### 3. **PaymentGatewayOAuthHandler** (COMPLETE IMPLEMENTATION)
Full OAuth implementation for all three gateways.

**Gateways Supported:**

#### **Stripe Connect**
- `generateStripeAuthUrl()` - Returns Stripe authorization URL
- `handleStripeCallback()` - Exchanges code for access token
- Scopes: read_write
- Captures: access_token, stripe_user_id, livemode status

#### **Razorpay**
- `generateRazorpayAuthUrl()` - Returns Razorpay authorization URL
- `handleRazorpayCallback()` - Exchanges code for tokens
- Supports: token refresh via refresh_token
- Captures: access_token, refresh_token, token expiration

#### **PayPal**
- `generatePayPalAuthUrl()` - Returns PayPal authorization URL
- `handlePayPalCallback()` - Exchanges code for tokens using Basic Auth
- Supports: token refresh via refresh_token
- Captures: access_token, refresh_token, token expiration

**Additional Methods:**
- `refreshOAuthToken(storeId, gatewayName)` - Refresh expired tokens (Razorpay & PayPal)
- `disconnectGateway(storeId, gatewayName)` - Deactivate gateway
- `getConnectedGateways(storeId)` - List connected gateways
- `isStoreConnected(storeId, gatewayName)` - Check connection status

### 4. **Routes** (UPDATED)
Added complete payment gateway routing (`routes/api.php`).

```php
Route::prefix('payment-gateways')->name('payment-gateways.')->group(function () {
    Route::get('/', [PaymentGatewayController::class, 'index'])->name('index');
    Route::get('{gateway}', [PaymentGatewayController::class, 'show'])->name('show');
    Route::post('authorize', [PaymentGatewayController::class, 'authorize'])->name('authorize');
    Route::post('callback', [PaymentGatewayController::class, 'callback'])->name('callback');
    Route::delete('{gateway}', [PaymentGatewayController::class, 'disconnect'])->name('disconnect');
    Route::post('{gateway}/test', [PaymentGatewayController::class, 'test'])->name('test');
});
```

### 5. **Configuration** (`config/payment.php` - UPDATED)
Added OAuth credentials configuration for each gateway.

```php
'stripe' => [
    'oauth_client_id' => env('STRIPE_OAUTH_CLIENT_ID'),
    'oauth_secret' => env('STRIPE_OAUTH_SECRET'),
],
'razorpay' => [
    'oauth_client_id' => env('RAZORPAY_OAUTH_CLIENT_ID'),
    'oauth_secret' => env('RAZORPAY_OAUTH_SECRET'),
],
'paypal' => [
    'oauth_client_id' => env('PAYPAL_OAUTH_CLIENT_ID'),
    'oauth_secret' => env('PAYPAL_OAUTH_SECRET'),
],
```

### 6. **Environment Variables** (`.env.example` - UPDATED)
Added OAuth credentials template.

```env
# Stripe Connect OAuth
STRIPE_OAUTH_CLIENT_ID=ca_
STRIPE_OAUTH_SECRET=sk_

# PayPal OAuth
PAYPAL_OAUTH_CLIENT_ID=
PAYPAL_OAUTH_SECRET=

# Razorpay OAuth
RAZORPAY_OAUTH_CLIENT_ID=
RAZORPAY_OAUTH_SECRET=
```

## API Response Examples

### 1. List Payment Gateways
```http
GET /api/v1/store/my-store/payment-gateways
Authorization: Bearer <token>
X-Merchant-ID: 1

Response 200:
{
  "data": [
    {
      "id": 1,
      "store_id": 1,
      "gateway": "stripe",
      "is_active": true,
      "gateway_account_id": "acct_1234567890",
      "connected_at": "2026-05-13T10:30:00Z",
      "last_refreshed_at": null,
      "metadata": {
        "livemode": false
      }
    }
  ]
}
```

### 2. Initiate OAuth Connection
```http
POST /api/v1/store/my-store/payment-gateways/authorize
Content-Type: application/json
Authorization: Bearer <token>
X-Merchant-ID: 1

Request:
{
  "gateway": "stripe"
}

Response 200:
{
  "authorization_url": "https://connect.stripe.com/oauth/authorize?client_id=ca_...&state=encrypted...&redirect_uri=..."
}
```

### 3. Handle OAuth Callback
```http
POST /api/v1/store/my-store/payment-gateways/callback
Content-Type: application/json
Authorization: Bearer <token>
X-Merchant-ID: 1

Request:
{
  "gateway": "stripe",
  "code": "ac_1234567890"
}

Response 200:
{
  "message": "Payment gateway connected successfully",
  "gateway": {
    "id": 1,
    "store_id": 1,
    "gateway": "stripe",
    "is_active": true,
    "gateway_account_id": "acct_1234567890",
    "connected_at": "2026-05-13T10:35:00Z"
  }
}
```

### 4. Disconnect Gateway
```http
DELETE /api/v1/store/my-store/payment-gateways/stripe
Authorization: Bearer <token>
X-Merchant-ID: 1

Response 200:
{
  "message": "Payment gateway stripe disconnected successfully"
}
```

### 5. Test Connection
```http
POST /api/v1/store/my-store/payment-gateways/stripe/test
Authorization: Bearer <token>
X-Merchant-ID: 1

Response 200:
{
  "success": true,
  "message": "Connection to stripe is valid"
}
```

## Security Features

### 1. OAuth Token Encryption
- All OAuth tokens encrypted at rest using Laravel's `Crypt` facade
- Automatic encryption on save via `Crypt::encryptString()`
- Automatic decryption on retrieval via `Crypt::decryptString()`
- Uses Laravel's APP_KEY for encryption

### 2. State Parameter
- State parameter encrypted with store context
- Prevents CSRF attacks in OAuth flow
- Verified on callback (implementation ready)

### 3. Authentication & Authorization
- All endpoints require `auth:sanctum` middleware
- Store isolation via `X-Merchant-ID` header
- Tenant-scoped routes with automatic isolation
- User must belong to tenant

### 4. HTTPS Enforcement
- All OAuth provider URLs use HTTPS
- Frontend enforces HTTPS in production
- Redirect URIs must match provider configuration

## Database Schema

Table: `store_payment_gateways`

```sql
id                      BIGINT PRIMARY KEY
store_id               BIGINT FOREIGN KEY (stores.id)
gateway                VARCHAR(50) -- stripe, razorpay, paypal
oauth_token            TEXT ENCRYPTED
oauth_refresh_token    TEXT ENCRYPTED
gateway_account_id     VARCHAR(255)
is_active             BOOLEAN DEFAULT true
connected_at          DATETIME
last_refreshed_at     DATETIME
metadata              JSON
created_at            DATETIME
updated_at            DATETIME

UNIQUE (store_id, gateway)
INDEX (is_active)
```

## Integration Steps

### 1. Run Migration
```bash
php artisan migrate
```

### 2. Configure OAuth Credentials
Update `.env` with provider credentials:
```env
STRIPE_OAUTH_CLIENT_ID=ca_xxxxxxxx
STRIPE_OAUTH_SECRET=sk_test_xxxxxxxx

RAZORPAY_OAUTH_CLIENT_ID=xxxxxxxx
RAZORPAY_OAUTH_SECRET=xxxxxxxx

PAYPAL_OAUTH_CLIENT_ID=xxxxxxxx
PAYPAL_OAUTH_SECRET=xxxxxxxx
```

### 3. Configure Redirect URIs
Add to each payment provider's OAuth app settings:
```
https://yourdomain.com/{store-slug}/payments/oauth-callback
```

### 4. Test Connection
```bash
curl -X POST http://localhost:8000/api/v1/store/my-store/payment-gateways/authorize \
  -H "Authorization: Bearer <token>" \
  -H "X-Merchant-ID: 1" \
  -H "Content-Type: application/json" \
  -d '{"gateway": "stripe"}'
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK` - Success
- `400 Bad Request` - Validation error or missing parameters
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Gateway not configured
- `500 Internal Server Error` - Server error

Example error response:
```json
{
  "message": "Failed to exchange authorization code"
}
```

## Logging

All OAuth operations are logged in `storage/logs/laravel.log`:

- OAuth URL generation attempts
- Token exchange requests/responses
- Callback processing
- Token refresh operations
- Errors and exceptions with context

## Production Checklist

- [ ] Run migration on production database
- [ ] Update `.env` with real OAuth credentials
- [ ] Configure redirect URIs with production domain
- [ ] Set `APP_DEBUG=false` in production
- [ ] Verify `APP_KEY` is set for encryption
- [ ] Test complete OAuth flow end-to-end
- [ ] Monitor logs for OAuth errors
- [ ] Implement webhook handlers for each gateway
- [ ] Add rate limiting to OAuth endpoints
- [ ] Set up token refresh cron job (if needed)

## Future Enhancements

1. **Webhook Handlers** - Handle provider webhooks (payment events, refunds)
2. **Token Refresh Queue** - Auto-refresh tokens before expiry
3. **Multi-account Support** - Allow stores to have multiple accounts per gateway
4. **Transaction Sync** - Sync transactions from provider APIs
5. **Settlement Management** - Track payouts and settlements
6. **Compliance Reporting** - PCI-DSS and compliance documents

## Testing

### Manual Testing

```bash
# Test as merchant
TOKEN=<your_auth_token>
STORE_ID=1

# List gateways
curl http://localhost:8000/api/v1/store/my-store/payment-gateways \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Merchant-ID: $STORE_ID"

# Test connection
curl -X POST http://localhost:8000/api/v1/store/my-store/payment-gateways/stripe/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Merchant-ID: $STORE_ID"
```

### Unit Tests (Ready to implement)

Create `tests/Feature/PaymentGatewayTest.php`:
- Test OAuth URL generation
- Test token exchange
- Test gateway listing
- Test disconnect
- Test unauthorized access
- Test validation errors

## Troubleshooting

### OAuth URL Not Generating
- Verify environment variables are set
- Check OAuth credentials format
- Ensure redirect URL is correct

### Token Exchange Fails
- Verify provider OAuth credentials
- Check authorization code validity (usually expires quickly)
- Ensure redirect URI matches provider settings
- Check logs for detailed error

### Tokens Not Being Encrypted
- Verify `APP_KEY` is set in `.env`
- Check Laravel encryption is working
- Verify `Crypt` facade is available

### Store Not Found
- Ensure `X-Merchant-ID` header is provided
- Verify store exists in database
- Check user has access to store

## Support

For issues or questions:
1. Check logs in `storage/logs/laravel.log`
2. Review provider documentation for OAuth
3. Verify all environment variables are set
4. Test with cURL or Postman
