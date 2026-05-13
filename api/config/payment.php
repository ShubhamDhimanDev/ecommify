<?php

/**
 * Payment Configuration
 *
 * This configuration file contains settings for all payment gateways
 * supported by the application. Each gateway can be independently
 * configured and activated.
 */

return [
    /*
    |--------------------------------------------------------------------------
    | Default Payment Gateway
    |--------------------------------------------------------------------------
    |
    | This option controls the default payment gateway that will be used
    | when processing payments. You can change this per transaction if needed.
    |
    | Supported: "stripe", "paypal", "razorpay"
    |
    */
    'default_gateway' => env('PAYMENT_GATEWAY', 'stripe'),

    /*
    |--------------------------------------------------------------------------
    | Payment Gateways Configuration
    |--------------------------------------------------------------------------
    |
    | Below you will find the configuration for each supported payment gateway.
    | Add your gateway credentials here.
    |
    */
    'gateways' => [
        'stripe' => [
            'enabled' => env('STRIPE_ENABLED', true),
            'public_key' => env('STRIPE_PUBLIC_KEY'),
            'secret_key' => env('STRIPE_SECRET_KEY'),
            'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
            // OAuth for Store Connections
            'oauth_client_id' => env('STRIPE_OAUTH_CLIENT_ID'),
            'oauth_secret' => env('STRIPE_OAUTH_SECRET'),
        ],

        'paypal' => [
            'enabled' => env('PAYPAL_ENABLED', false),
            'mode' => env('PAYPAL_MODE', 'sandbox'), // sandbox or live
            'client_id' => env('PAYPAL_CLIENT_ID'),
            'client_secret' => env('PAYPAL_CLIENT_SECRET'),
            // OAuth for Store Connections
            'oauth_client_id' => env('PAYPAL_OAUTH_CLIENT_ID'),
            'oauth_secret' => env('PAYPAL_OAUTH_SECRET'),
        ],

        'razorpay' => [
            'enabled' => env('RAZORPAY_ENABLED', false),
            'mode' => env('RAZORPAY_MODE', 'test'), // test or live
            'key_id' => env('RAZORPAY_KEY_ID'),
            'key_secret' => env('RAZORPAY_KEY_SECRET'),
            'webhook_secret' => env('RAZORPAY_WEBHOOK_SECRET'),
            // OAuth for Store Connections
            'oauth_client_id' => env('RAZORPAY_OAUTH_CLIENT_ID'),
            'oauth_secret' => env('RAZORPAY_OAUTH_SECRET'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Payment Metadata
    |--------------------------------------------------------------------------
    |
    | Additional metadata to include with payment transactions
    |
    */
    'metadata' => [
        'application_name' => env('APP_NAME', 'Ecommify'),
        'application_version' => env('APP_VERSION', '1.0.0'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Currency Settings
    |--------------------------------------------------------------------------
    |
    | Default currency for transactions
    |
    */
    'currency' => env('PAYMENT_CURRENCY', 'USD'),

    /*
    |--------------------------------------------------------------------------
    | Webhook Settings
    |--------------------------------------------------------------------------
    |
    | Configuration for payment gateway webhooks
    |
    */
    'webhooks' => [
        'enabled' => true,
        'verify_signature' => true,
        'timeout' => 30,
    ],
];
