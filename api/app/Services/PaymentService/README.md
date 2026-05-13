# Payment Service Documentation

## Overview

The **PaymentService** is a gateway-agnostic payment processing system designed for Ecommify. It provides a unified interface for handling payments across multiple payment gateways while maintaining scalability and ease of integration.

## Architecture

```
PaymentService (Facade)
    ├── PaymentGatewayFactory (Factory Pattern)
    ├── PaymentGatewayInterface (Contract)
    │   ├── StripePaymentGateway
    │   ├── PayPalPaymentGateway
    │   └── RazorpayPaymentGateway
    └── DTOs
        ├── PaymentRequestDTO
        ├── PaymentResponseDTO
        ├── RefundRequestDTO
        └── RefundResponseDTO
```

## Key Features

✅ **Gateway-Agnostic**: Works seamlessly with any payment provider  
✅ **Easily Scalable**: Add new gateways without modifying existing code  
✅ **Type-Safe DTOs**: Structured data transfer objects for all operations  
✅ **Runtime Gateway Switching**: Change payment gateway on-the-fly  
✅ **Comprehensive Error Handling**: Detailed error codes and messages  
✅ **Metadata Support**: Track custom data with every transaction  
✅ **Response Normalization**: Consistent responses across all gateways  

## Installation & Setup

### 1. Environment Configuration

Add these variables to your `.env` file:

```env
# Default Payment Gateway
PAYMENT_GATEWAY=stripe
PAYMENT_CURRENCY=USD

# Stripe Configuration
STRIPE_ENABLED=true
STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# PayPal Configuration (Optional)
PAYPAL_ENABLED=false
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx

# Razorpay Configuration (Optional)
RAZORPAY_ENABLED=false
RAZORPAY_MODE=test
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxx
```

### 2. Configuration File

The configuration is located at `config/payment.php`. It contains all payment gateway credentials and settings.

## Usage

### Basic Payment Processing

```php
use App\Services\PaymentService\PaymentService;
use App\Services\PaymentService\DTOs\PaymentRequestDTO;

// Create payment request
$paymentRequest = PaymentRequestDTO::create([
    'transaction_id' => 'TXN-12345',
    'amount' => 99.99,
    'currency' => 'USD',
    'description' => 'Product Purchase',
    'customer_email' => 'customer@example.com',
    'customer_name' => 'John Doe',
]);

// Process payment
$service = new PaymentService();
$response = $service->processPayment($paymentRequest);

if ($response->success) {
    // Handle successful payment
    $transactionId = $response->gatewayTransactionId;
} else {
    // Handle failed payment
    $errorMessage = $response->message;
}
```

### Using Specific Gateway

```php
// Use PayPal gateway
$service = new PaymentService('paypal');
$response = $service->processPayment($paymentRequest);

// Or switch gateways at runtime
$service = new PaymentService('stripe');
$service->switchGateway('paypal');
```

### Processing Refunds

```php
use App\Services\PaymentService\DTOs\RefundRequestDTO;

$refundRequest = RefundRequestDTO::create([
    'refund_id' => 'REFUND-12345',
    'original_transaction_id' => $originalTransactionId,
    'amount' => 99.99,
    'reason' => 'Customer refund request',
]);

$refundResponse = $service->refundPayment($refundRequest);
```

### Verifying Payments

```php
$verification = $service->verifyPayment($transactionId);
echo "Payment Status: " . $verification->status; // completed, pending, failed
```

## API Reference

### PaymentService Class

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `__construct(?string $gateway)` | Initialize service with gateway | void |
| `processPayment(PaymentRequestDTO)` | Process a payment | PaymentResponseDTO |
| `refundPayment(RefundRequestDTO)` | Process a refund | RefundResponseDTO |
| `verifyPayment(string)` | Verify payment status | PaymentResponseDTO |
| `switchGateway(string)` | Switch to different gateway | void |
| `getActiveGateway()` | Get current gateway instance | PaymentGatewayInterface |
| `isGatewayConfigured()` | Check if gateway is configured | bool |
| `getGatewayName()` | Get current gateway name | string |
| `getAvailableGateways()` | Get all available gateways | array |

### PaymentRequestDTO

**Constructor Parameters:**

```php
public function __construct(
    public readonly string $transactionId,        // Unique transaction identifier
    public readonly float $amount,                // Payment amount
    public readonly string $currency,             // ISO 4217 currency code (USD, EUR, etc.)
    public readonly string $description,          // Payment description
    public readonly string $customerEmail,        // Customer email address
    public readonly string $customerName,         // Customer name
    public readonly ?string $paymentMethodToken,  // Optional payment method token
    public readonly ?array $metadata,             // Custom metadata
    public readonly ?string $successUrl,          // Redirect URL on success
    public readonly ?string $failureUrl,          // Redirect URL on failure
)
```

### PaymentResponseDTO

**Properties:**

```php
public readonly bool $success;                    // Transaction success status
public readonly string $transactionId;            // Original transaction ID
public readonly ?string $gatewayTransactionId;    // Gateway's transaction ID
public readonly string $status;                   // pending|completed|failed
public readonly float $amount;                    // Transaction amount
public readonly string $currency;                 // Currency code
public readonly ?string $message;                 // Success/error message
public readonly ?string $errorCode;               // Error code if failed
public readonly ?Carbon $processedAt;             // Processing timestamp
public readonly ?array $metadata;                 // Associated metadata
```

**Helper Methods:**

```php
// Create successful response
PaymentResponseDTO::success($transactionId, $gatewayId, $amount, $currency);

// Create failed response
PaymentResponseDTO::failed($transactionId, $message, $errorCode);

// Create pending response
PaymentResponseDTO::pending($transactionId, $gatewayId, $amount, $currency);

// Convert to array
$array = $response->toArray();
```

## Adding New Payment Gateways

### Step 1: Create Gateway Implementation

```php
<?php

namespace App\Services\PaymentService\Gateways;

use App\Services\PaymentService\Contracts\PaymentGatewayInterface;
// ... other imports

class SquarePaymentGateway implements PaymentGatewayInterface
{
    public function charge(PaymentRequestDTO $paymentRequest): PaymentResponseDTO
    {
        // Implement charge logic
    }

    public function refund(RefundRequestDTO $refundRequest): RefundResponseDTO
    {
        // Implement refund logic
    }

    public function verify(string $transactionId): PaymentResponseDTO
    {
        // Implement verification logic
    }

    public function isConfigured(): bool
    {
        // Check if credentials are set
    }

    public function getGatewayName(): string
    {
        return 'square';
    }
}
```

### Step 2: Register Gateway

**Option A: Static Registration** (in config/payment.php or service provider)

```php
use App\Services\PaymentService\PaymentGatewayFactory;
use App\Services\PaymentService\Gateways\SquarePaymentGateway;

PaymentGatewayFactory::register('square', SquarePaymentGateway::class);
```

**Option B: Update Factory** (Modify PaymentGatewayFactory.php)

```php
private const GATEWAYS = [
    'stripe' => StripePaymentGateway::class,
    'paypal' => PayPalPaymentGateway::class,
    'square' => SquarePaymentGateway::class,  // Add this
];
```

### Step 3: Add Configuration

Update `config/payment.php`:

```php
'gateways' => [
    // ... existing gateways
    'square' => [
        'enabled' => env('SQUARE_ENABLED', false),
        'access_token' => env('SQUARE_ACCESS_TOKEN'),
        'location_id' => env('SQUARE_LOCATION_ID'),
    ],
],
```

## Error Handling

### Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `GATEWAY_NOT_CONFIGURED` | Gateway credentials missing | Configure gateway in .env |
| `STRIPE_ERROR` | Stripe API error | Check Stripe logs and credentials |
| `PAYPAL_ERROR` | PayPal API error | Check PayPal logs and credentials |
| `RAZORPAY_ERROR` | Razorpay API error | Check Razorpay logs and credentials |
| `STRIPE_NOT_CONFIGURED` | Stripe not configured | Set Stripe credentials |
| `PAYPAL_NOT_CONFIGURED` | PayPal not configured | Set PayPal credentials |
| `RAZORPAY_NOT_CONFIGURED` | Razorpay not configured | Set Razorpay credentials |

### Error Handling Example

```php
$response = $service->processPayment($paymentRequest);

if (!$response->success) {
    // Log the error
    Log::error('Payment failed', [
        'transaction_id' => $response->transactionId,
        'error_code' => $response->errorCode,
        'message' => $response->message,
    ]);

    // Handle based on error code
    match ($response->errorCode) {
        'GATEWAY_NOT_CONFIGURED' => 'Payment gateway is not configured',
        'STRIPE_ERROR' => 'Stripe payment error',
        'PAYPAL_ERROR' => 'PayPal payment error',
        'RAZORPAY_ERROR' => 'Razorpay payment error',
        default => 'Unknown payment error',
    };
}
```

## Testing

### Unit Test Example

```php
use Tests\TestCase;
use App\Services\PaymentService\PaymentService;
use App\Services\PaymentService\DTOs\PaymentRequestDTO;

class PaymentServiceTest extends TestCase
{
    public function test_process_payment_with_stripe()
    {
        $service = new PaymentService('stripe');
        
        $paymentRequest = PaymentRequestDTO::create([
            'transaction_id' => 'TEST-123',
            'amount' => 99.99,
            'currency' => 'USD',
            'description' => 'Test Payment',
            'customer_email' => 'test@example.com',
            'customer_name' => 'Test User',
        ]);

        $response = $service->processPayment($paymentRequest);

        $this->assertTrue($response->success);
        $this->assertEquals('completed', $response->status);
    }
}
```

## Best Practices

1. **Always validate payment amounts** before processing
2. **Store transaction data** in your database with gateway transaction ID
3. **Implement webhooks** for real-time payment status updates
4. **Log all transactions** for audit and debugging purposes
5. **Use metadata** to track order/user context with payments
6. **Handle refunds asynchronously** for better performance
7. **Implement retry logic** for failed transactions
8. **Keep credentials secure** - use environment variables
9. **Test with sandbox credentials** before going live
10. **Monitor payment gateway status** in your monitoring service

## Webhooks

Each payment gateway has its own webhook format. Implement webhook handlers:

```php
// routes/api.php
Route::post('/webhooks/stripe', [StripeWebhookController::class, 'handle']);
Route::post('/webhooks/paypal', [PayPalWebhookController::class, 'handle']);
```

## Future Enhancements

- [ ] Payment reconciliation system
- [ ] Webhook management interface
- [ ] Payment analytics dashboard
- [ ] Support for cryptocurrency payments
- [ ] Automated retry mechanism
- [ ] Multi-currency support with conversion
- [ ] PCI compliance helpers
- [ ] 3D Secure / 2FA support

## Support & Troubleshooting

### Common Issues

**Issue**: "Payment gateway is not configured"  
**Solution**: Verify your `.env` file has the required credentials for your selected gateway.

**Issue**: Payment always fails with same error code  
**Solution**: Check your gateway credentials and API access level in the gateway's dashboard.

**Issue**: Refunds are not processing  
**Solution**: Ensure the original transaction ID is correct and the original payment is in a refundable state.

For more examples, see [USAGE_EXAMPLES.php](./USAGE_EXAMPLES.php)
