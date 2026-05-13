<?php

/**
 * Payment Service Usage Examples
 *
 * This file demonstrates various ways to use the PaymentService
 * in different scenarios.
 */

// ============================================================================
// Example 1: Basic Payment Processing
// ============================================================================

use App\Services\PaymentService\PaymentService;
use App\Services\PaymentService\DTOs\PaymentRequestDTO;

// Create a payment request
$paymentRequest = PaymentRequestDTO::create([
    'transaction_id' => 'TXN-' . uniqid(),
    'amount' => 99.99,
    'currency' => 'USD',
    'description' => 'Purchase of Premium Product',
    'customer_email' => 'customer@example.com',
    'customer_name' => 'John Doe',
    'metadata' => [
        'order_id' => '12345',
        'product_id' => 'PROD-001',
    ],
]);

// Process payment using default gateway (from config)
$paymentService = new PaymentService();
$response = $paymentService->processPayment($paymentRequest);

if ($response->success) {
    echo "Payment successful! Transaction ID: " . $response->gatewayTransactionId;
} else {
    echo "Payment failed: " . $response->message;
}

// ============================================================================
// Example 2: Using a Specific Gateway
// ============================================================================

// Use PayPal instead of default gateway
$paymentService = new PaymentService('paypal');
$response = $paymentService->processPayment($paymentRequest);

// Use Razorpay instead of default gateway
$paymentService = new PaymentService('razorpay');
$response = $paymentService->processPayment($paymentRequest);

// ============================================================================
// Example 3: Dynamic Gateway Switching
// ============================================================================

$paymentService = new PaymentService('stripe');
$response1 = $paymentService->processPayment($paymentRequest);

// Switch to PayPal for a different transaction
$paymentService->switchGateway('paypal');
$response2 = $paymentService->processPayment($paymentRequest);

// ============================================================================
// Example 4: Refund Processing
// ============================================================================

use App\Services\PaymentService\DTOs\RefundRequestDTO;

$refundRequest = RefundRequestDTO::create([
    'refund_id' => 'REFUND-' . uniqid(),
    'original_transaction_id' => $response->gatewayTransactionId,
    'amount' => 99.99,
    'reason' => 'Customer requested cancellation',
    'metadata' => [
        'order_id' => '12345',
    ],
]);

$refundResponse = $paymentService->refundPayment($refundRequest);

if ($refundResponse->success) {
    echo "Refund successful! Refund ID: " . $refundResponse->gatewayRefundId;
} else {
    echo "Refund failed: " . $refundResponse->message;
}

// ============================================================================
// Example 5: Payment Verification
// ============================================================================

$verificationResponse = $paymentService->verifyPayment($response->gatewayTransactionId);

if ($verificationResponse->success) {
    echo "Payment status: " . $verificationResponse->status;
} else {
    echo "Verification failed: " . $verificationResponse->message;
}

// ============================================================================
// Example 6: Checking Gateway Configuration
// ============================================================================

$paymentService = new PaymentService('stripe');

if ($paymentService->isGatewayConfigured()) {
    echo "Stripe gateway is configured and ready to use";
} else {
    echo "Stripe gateway is not properly configured";
}

// ============================================================================
// Example 7: Get All Available Gateways
// ============================================================================

$availableGateways = PaymentService::getAvailableGateways();
// Result: ['stripe', 'paypal']

// ============================================================================
// Example 8: Register a Custom Gateway (Runtime)
// ============================================================================

use App\Services\PaymentService\PaymentGatewayFactory;
use App\Services\PaymentService\Gateways\CustomPaymentGateway;

// Register a custom gateway at runtime
PaymentGatewayFactory::register('custom_gateway', CustomPaymentGateway::class);

// Now you can use it
$paymentService = new PaymentService('custom_gateway');

// ============================================================================
// Example 9: Response Data Handling
// ============================================================================

$response = $paymentService->processPayment($paymentRequest);

// Convert to array for API response
$responseArray = $response->toArray();
// Returns: [
//     'success' => true,
//     'transaction_id' => 'TXN-123456',
//     'gateway_transaction_id' => 'ch_stripe_abc123',
//     'status' => 'completed',
//     'amount' => 99.99,
//     'currency' => 'USD',
//     'message' => 'Payment processed successfully',
//     'error_code' => null,
//     'processed_at' => '2026-05-13T10:30:00Z',
//     'metadata' => [...],
// ]

// ============================================================================
// Example 10: In a Controller (Typical Usage)
// ============================================================================

namespace App\Http\Controllers;

class OrderController extends Controller
{
    public function processPayment(OrderPaymentRequest $request)
    {
        $paymentRequest = PaymentRequestDTO::create([
            'transaction_id' => 'ORD-' . $request->order_id,
            'amount' => $request->total_amount,
            'currency' => 'USD',
            'description' => "Order #{$request->order_id}",
            'customer_email' => $request->customer_email,
            'customer_name' => $request->customer_name,
            'metadata' => [
                'order_id' => $request->order_id,
                'user_id' => auth()->id(),
            ],
        ]);

        $paymentService = new PaymentService();
        $response = $paymentService->processPayment($paymentRequest);

        if ($response->success) {
            // Save transaction to database
            Transaction::create([
                'order_id' => $request->order_id,
                'gateway_transaction_id' => $response->gatewayTransactionId,
                'amount' => $response->amount,
                'status' => $response->status,
                'gateway' => $paymentService->getGatewayName(),
            ]);

            return response()->json([
                'message' => 'Payment processed successfully',
                'data' => $response->toArray(),
            ]);
        }

        return response()->json([
            'message' => 'Payment failed',
            'error' => $response->message,
            'error_code' => $response->errorCode,
        ], 400);
    }
}
