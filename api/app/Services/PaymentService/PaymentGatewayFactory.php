<?php

declare(strict_types=1);

namespace App\Services\PaymentService;

use App\Services\PaymentService\Contracts\PaymentGatewayInterface;
use App\Services\PaymentService\Gateways\StripePaymentGateway;
use App\Services\PaymentService\Gateways\PayPalPaymentGateway;
use App\Services\PaymentService\Gateways\RazorpayPaymentGateway;
use InvalidArgumentException;

/**
 * Factory for creating payment gateway instances.
 * Supports multiple payment gateways and easy extension.
 */
class PaymentGatewayFactory
{
    /**
     * Map of available gateway implementations.
     */
    private const GATEWAYS = [
        'stripe' => StripePaymentGateway::class,
        'paypal' => PayPalPaymentGateway::class,
        'razorpay' => RazorpayPaymentGateway::class,
    ];

    /**
     * Create a payment gateway instance.
     *
     * @param string $gateway Gateway name (stripe, paypal, etc.)
     * @return PaymentGatewayInterface
     * @throws InvalidArgumentException If gateway is not supported
     */
    public static function create(string $gateway): PaymentGatewayInterface
    {
        $gateway = strtolower($gateway);

        if (!isset(self::GATEWAYS[$gateway])) {
            throw new InvalidArgumentException(
                "Payment gateway '{$gateway}' is not supported. Available: " .
                implode(', ', array_keys(self::GATEWAYS))
            );
        }

        $gatewayClass = self::GATEWAYS[$gateway];
        return new $gatewayClass();
    }

    /**
     * Register a new payment gateway implementation.
     * Allows for dynamic gateway registration.
     *
     * @param string $name Gateway name
     * @param string $class Fully qualified class name implementing PaymentGatewayInterface
     */
    public static function register(string $name, string $class): void
    {
        if (!is_subclass_of($class, PaymentGatewayInterface::class)) {
            throw new InvalidArgumentException(
                "Class '{$class}' must implement PaymentGatewayInterface"
            );
        }

        self::GATEWAYS[strtolower($name)] = $class;
    }

    /**
     * Get all available gateway names.
     */
    public static function getAvailableGateways(): array
    {
        return array_keys(self::GATEWAYS);
    }
}
