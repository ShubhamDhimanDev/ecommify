# Environment Configuration Template

Copy this to your `.env` file and fill in your actual credentials.

## Payment Service Configuration

```env
# ============================================================================
# PAYMENT SERVICE CONFIGURATION
# ============================================================================

# Default Payment Gateway
# Options: stripe, paypal, razorpay, square (or any custom registered gateway)
PAYMENT_GATEWAY=stripe

# Default Currency for Transactions
PAYMENT_CURRENCY=USD

# ============================================================================
# STRIPE PAYMENT GATEWAY
# ============================================================================

# Enable/Disable Stripe
STRIPE_ENABLED=true

# Stripe API Keys (Get from https://dashboard.stripe.com/apikeys)
STRIPE_PUBLIC_KEY=pk_test_51HbPQ...
STRIPE_SECRET_KEY=sk_test_4eC39HqLyjWDarht...

# Stripe Webhook Secret (Get from https://dashboard.stripe.com/webhooks)
STRIPE_WEBHOOK_SECRET=whsec_test_...

# ============================================================================
# PAYPAL PAYMENT GATEWAY
# ============================================================================

# Enable/Disable PayPal
PAYPAL_ENABLED=false

# PayPal Mode: sandbox or live
PAYPAL_MODE=sandbox

# PayPal API Credentials (Get from https://www.sandbox.paypal.com or https://www.paypal.com)
PAYPAL_CLIENT_ID=AQkk...
PAYPAL_CLIENT_SECRET=EDwS...

# ============================================================================
# RAZORPAY PAYMENT GATEWAY
# ============================================================================

# Enable/Disable Razorpay
RAZORPAY_ENABLED=false

# Razorpay Mode: test or live
RAZORPAY_MODE=test

# Razorpay API Credentials (Get from https://dashboard.razorpay.com/app/keys)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# Razorpay Webhook Secret (Get from https://dashboard.razorpay.com/app/webhooks)
RAZORPAY_WEBHOOK_SECRET=...

# ============================================================================
# SQUARE PAYMENT GATEWAY (Future)
# ============================================================================

# Enable/Disable Square
SQUARE_ENABLED=false

# Square API Credentials (Get from https://developer.squareup.com)
SQUARE_ACCESS_TOKEN=sq0atp_...
SQUARE_LOCATION_ID=L...

# ============================================================================
# NOTES
# ============================================================================

# 1. Get Stripe test credentials:
#    - Go to https://dashboard.stripe.com/apikeys
#    - Use the "Publishable key" for STRIPE_PUBLIC_KEY
#    - Use the "Secret key" for STRIPE_SECRET_KEY
#    - Create a webhook endpoint for your app and copy the signing secret
#
# 2. Get PayPal test credentials:
#    - Go to https://www.sandbox.paypal.com (for testing)
#    - Navigate to Account Settings > API Signature or API Certificate
#    - Use REST API credentials
#
# 3. Get Razorpay test credentials:
#    - Go to https://dashboard.razorpay.com (for testing use test mode)
#    - Navigate to Settings > API Keys
#    - Copy Key ID and Key Secret
#    - Setup webhooks in Settings > Webhooks
#
# 4. In development, use test/sandbox credentials
# 5. In production, use live credentials only
# 6. Never commit actual credentials to version control
# 7. Use a secrets manager (e.g., AWS Secrets Manager, HashiCorp Vault) for production
```
