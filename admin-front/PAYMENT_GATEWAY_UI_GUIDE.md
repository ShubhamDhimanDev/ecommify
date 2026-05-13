# Payment Gateway Connection UI - Admin Frontend Implementation

## Overview

The admin frontend now includes a complete UI for managing payment gateway connections via OAuth. Stores can easily connect their Stripe, Razorpay, or PayPal accounts to start receiving payments.

## Components Created

### 1. **PaymentGatewayCard** (`components/ui/PaymentGatewayCard.tsx`)
Displays individual payment gateway status and connection controls.

**Props:**
- `gateway` - Gateway name ('stripe', 'razorpay', 'paypal')
- `config` - Current gateway configuration (if connected)
- `isLoading` - Show loading state during operations
- `onConnect` - Callback when connect button is clicked
- `onDisconnect` - Callback when disconnect button is clicked

**Features:**
- Shows connection status (connected/not connected)
- Displays gateway account ID if available
- Shows connection timestamp
- Connect/Disconnect buttons with loading states

### 2. **PaymentGatewayManager** (`components/PaymentGatewayManager.tsx`)
Main container component for managing all payment gateways.

**Features:**
- Displays all available gateways (Stripe, Razorpay, PayPal)
- Shows success/error notifications
- Handles connect/disconnect operations
- Displays helpful information about the workflow

### 3. **PaymentGatewayOAuthCallback** (`components/PaymentGatewayOAuthCallback.tsx`)
Handles OAuth callback after payment provider authorization.

**Features:**
- Extracts OAuth code from URL parameters
- Exchanges code for OAuth tokens on backend
- Shows loading, success, and error states
- Auto-redirects to payments page after success

## Hooks

### **usePaymentGateways** (`hooks/usePaymentGateways.ts`)
Custom React hook for managing payment gateway state and operations.

**Returns:**
```typescript
{
  gateways: StorePaymentGateway[];     // List of connected gateways
  loading: boolean;                     // Loading state
  operatingOn: PaymentGateway | null;   // Current operation gateway
  error: Error | null;                  // Error object
  fetchGateways: () => Promise<void>;   // Fetch gateways list
  getGateway: (gateway) => Promise<...> // Get specific gateway
  initiateConnection: (gateway) => void; // Start OAuth flow
  handleOAuthCallback: (gateway, code) => void; // Handle OAuth callback
  disconnect: (gateway) => void;        // Disconnect gateway
  testConnection: (gateway) => boolean; // Test gateway connection
}
```

**Options:**
```typescript
{
  onError?: (error: Error) => void;   // Called on error
  onSuccess?: (message: string) => void; // Called on success
}
```

## API Integration

### New API Methods (`lib/api.ts`)

```typescript
paymentGatewayApi.list()  // GET /store/payment-gateways
paymentGatewayApi.detail(gateway)  // GET /store/payment-gateways/:gateway
paymentGatewayApi.initiateConnection(gateway)  // POST /store/payment-gateways/authorize
paymentGatewayApi.handleCallback(gateway, code)  // POST /store/payment-gateways/callback
paymentGatewayApi.disconnect(gateway)  // DELETE /store/payment-gateways/:gateway
paymentGatewayApi.test(gateway)  // POST /store/payment-gateways/:gateway/test
```

## Types Added

```typescript
// lib/types.ts

type PaymentGateway = "stripe" | "razorpay" | "paypal";

interface StorePaymentGateway {
  id: number;
  store_id: number;
  gateway: PaymentGateway;
  is_active: boolean;
  gateway_account_id: string | null;
  connected_at: string | null;
  last_refreshed_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface PaymentGatewayConfig {
  gateway: PaymentGateway;
  is_connected: boolean;
  account_id?: string;
  connected_at?: string;
}
```

## Pages Created

### 1. **Store Payments Page** (`app/(dashboard)/[slug]/payments/page.tsx`)
Main payment gateway management interface for each store.

- Displays all available gateways for the store
- Shows connection status per store
- Allows connect/disconnect operations
- Shows notifications

### 2. **Store OAuth Callback Page** (`app/(dashboard)/[slug]/payments/oauth-callback/page.tsx`)
Handles OAuth provider redirects for each store.

- Processes OAuth callback
- Exchanges code for tokens
- Shows loading/success/error states
- Redirects to store payments page

### Route Structure

```
/(dashboard)/
  [slug]/
    payments/           # GET /{store-slug}/payments
      page.tsx
      oauth-callback/
        page.tsx        # GET /{store-slug}/payments/oauth-callback
```

## Usage Example

```typescript
"use client";

import { usePaymentGateways } from "@/hooks/usePaymentGateways";

export function MyComponent() {
  const {
    gateways,
    operatingOn,
    error,
    initiateConnection,
    disconnect,
  } = usePaymentGateways({
    onSuccess: (message) => console.log(message),
    onError: (error) => console.error(error),
  });

  return (
    <div>
      {gateways.map((gateway) => (
        <button
          key={gateway.gateway}
          onClick={() => disconnect(gateway.gateway)}
          disabled={operatingOn === gateway.gateway}
        >
          Disconnect {gateway.gateway}
        </button>
      ))}
    </div>
  );
}
```

## Workflow

### 1. Initial Page Load
- User navigates to `/{store-slug}/payments`
- Component mounts → `usePaymentGateways` hook fetches gateways
- API call to `GET /store/payment-gateways`
- Display list of gateways with current status for this store

### 2. User Clicks "Connect"
```
User clicks "Connect" button on /{store-slug}/payments
  ↓
PaymentGatewayManager calls initiateConnection(gateway)
  ↓
Hook calls paymentGatewayApi.initiateConnection(gateway)
  ↓
Backend generates OAuth URL with redirect_uri: /{store-slug}/payments/oauth-callback
  ↓
Frontend redirects to: https://provider.com/oauth/authorize?redirect_uri=...
```

### 3. Payment Provider Authorization
```
User authorizes on provider's site
  ↓
Provider redirects to: /{store-slug}/payments/oauth-callback?code=...&state=...
```

### 4. OAuth Callback Processing
```
PaymentGatewayOAuthCallback component mounts
  ↓
Extracts code and slug from URL
  ↓
Calls handleOAuthCallback(gateway, code)
  ↓
Hook calls paymentGatewayApi.handleCallback(gateway, code)
  ↓
Backend exchanges code for OAuth tokens (store-specific)
  ↓
Tokens saved to database for this store
  ↓
Frontend updates gateway list
  ↓
Shows success message
  ↓
Redirects to /{store-slug}/payments
```

### 5. User Clicks "Disconnect"
```
User confirms disconnect
  ↓
Call disconnect(gateway)
  ↓
API call to DELETE /store/payment-gateways/:gateway
  ↓
Backend removes OAuth configuration for this store
  ↓
Frontend updates gateway list
  ↓
Show success message
```

## Styling

All components use Tailwind CSS and follow the existing design system:
- Color scheme: Blue for primary actions, Red for destructive
- Rounded corners: `rounded-lg`
- Spacing: Tailwind standard utilities
- Icons: From `lucide-react`

## Error Handling

The implementation includes comprehensive error handling:
- Network errors
- OAuth errors
- Validation errors
- Shows user-friendly error messages
- Provides retry options

## Security Considerations

- OAuth tokens are handled server-side
- Frontend never sees sensitive tokens
- All API calls include authentication headers
- CSRF protection via standard HTTP methods
- Store isolation via merchant ID header

## Features

✅ **Multi-Gateway Support** - Stripe, Razorpay, PayPal
✅ **OAuth Flow** - Secure authorization
✅ **Connection Status** - Visual indicators
✅ **Error Handling** - User-friendly messages
✅ **Loading States** - Clear feedback during operations
✅ **Responsive Design** - Works on all screen sizes
✅ **Notifications** - Success/error messages
✅ **Confirmation Dialogs** - For destructive actions

## Backend Requirements

The frontend expects the following backend endpoints:

```
GET    /api/v1/store/payment-gateways
GET    /api/v1/store/payment-gateways/:gateway
POST   /api/v1/store/payment-gateways/authorize
POST   /api/v1/store/payment-gateways/callback
DELETE /api/v1/store/payment-gateways/:gateway
POST   /api/v1/store/payment-gateways/:gateway/test
```

Each endpoint should:
- Require authentication
- Include X-Merchant-ID header for store context
- Return proper error responses
- Handle OAuth operations securely

### OAuth Callback URL Configuration

Configure this URL in each payment provider's OAuth settings for each store:

```
https://yourdomain.com/{store-slug}/payments/oauth-callback
```

The backend should generate the OAuth authorization URL with the `redirect_uri` parameter set to include the store's slug. The backend can get the store slug by querying the Store model using the `store_id` from the `X-Merchant-ID` header.

## Testing Checklist

- [ ] Payment gateways list loads at `/{store-slug}/payments`
- [ ] Click "Connect" redirects to OAuth provider
- [ ] OAuth callback processes at `/{store-slug}/payments/oauth-callback`
- [ ] Connected gateways show correct status per store
- [ ] Click "Disconnect" removes gateway for that store
- [ ] Error handling works (network errors, etc.)
- [ ] Loading states display properly
- [ ] Notifications appear correctly
- [ ] Mobile responsive layout works
- [ ] Back button works on OAuth callback
- [ ] Store slug is correctly used in all redirects

## Future Enhancements

- [ ] Test connection button for each gateway
- [ ] Gateway-specific settings/configuration
- [ ] Transaction history
- [ ] Webhook configuration UI
- [ ] Settlement/payout management
- [ ] Fee/commission details
- [ ] Bank account management
- [ ] Multi-currency support
