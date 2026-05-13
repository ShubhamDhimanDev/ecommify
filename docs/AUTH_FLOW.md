# Authentication Flow — Login, Sessions & Token Management

This document explains **how users authenticate** across the Ecommify platform and how sessions/tokens are managed.

---

## 1. Authentication Overview

### 1.1 Authentication Methods

| Method | Used By | Tech | Stateless |
|--------|---------|------|-----------|
| **API Tokens** | Both frontends | Laravel Sanctum | Yes |
| **2FA (TOTP)** | admin-front | Fortify | Yes |
| **Sessions** | Optional | Laravel Session | No |
| **OAuth** | Future | - | Yes |

### 1.2 Key Components

```
┌─────────────────┐
│  Frontend       │
│ (admin/store)   │
└────────┬────────┘
         │ Login credentials
         ↓
┌─────────────────────────────────────────────┐
│  Laravel Backend (/api)                     │
│  ┌─────────────────────────────────────────┐│
│  │ AuthService (business logic)            ││
│  │ - Validate email/password               ││
│  │ - Generate JWT token                    ││
│  │ - Check 2FA requirement                 ││
│  └─────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────┐│
│  │ Sanctum (token storage & validation)    ││
│  │ - personal_access_tokens table          ││
│  │ - Token encryption                      ││
│  └─────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────┐│
│  │ Fortify (2FA management)                ││
│  │ - TOTP generator/validator              ││
│  │ - Recovery codes                        ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
         ↑
         │ Token returned
         │
┌────────┴────────┐
│  Frontend       │
│ (stores token)  │
└─────────────────┘
```

---

## 2. Registration Flow

### 2.1 User Registration Request

```javascript
// admin-front or store-front
async function register() {
  const response = await fetch(
    `${NEXT_PUBLIC_API_URL}/auth/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Merchant',
        email: 'john@store.com',
        password: 'SecurePassword123!',
        password_confirmation: 'SecurePassword123!',
        phone: '+1234567890'
      })
    }
  );

  return await response.json();
}
```

### 2.2 Backend Registration Flow

```php
// api/app/Http/Controllers/Api/V1/Auth/RegisterController.php

public function __invoke(RegisterRequest $request): JsonResponse
{
    // Step 1: Validate input
    $validated = $request->validated();

    // Step 2: Create user (not yet tied to tenant)
    $user = User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'password' => Hash::make($validated['password']),
        'phone' => $validated['phone'],
        'status' => 'active'
    ]);

    // Step 3: Generate Sanctum token
    $token = $user->createToken('auth_token', ['*']);

    // Step 4: Send email verification
    $user->sendEmailVerificationNotification();

    // Step 5: Return response
    return response()->json([
        'user' => new UserResource($user),
        'access_token' => $token->plainTextToken,
        'token_type' => 'Bearer',
        'message' => 'Registration successful. Please verify your email.'
    ], 201);
}
```

### 2.3 Token Created in Database

```sql
-- personal_access_tokens table (Sanctum)
INSERT INTO personal_access_tokens (
  tokenable_type, tokenable_id, name, token, abilities, created_at
) VALUES (
  'App\Models\User',
  'user-uuid',
  'auth_token',
  'hashed-token-hash',  -- Encrypted for security
  '["*"]',
  NOW()
);
```

### 2.4 Frontend Stores Token

```javascript
// admin-front/src/hooks/useAuth.ts
const { user, access_token } = await register();

// Option 1: LocalStorage (risky - XSS vulnerable)
localStorage.setItem('auth_token', access_token);

// Option 2: Memory (lost on refresh)
authContextRef.current.token = access_token;

// Option 3: HttpOnly Cookie (secure, server-set)
// Set by backend in Set-Cookie header
// Frontend never directly accesses it
```

### 2.5 Email Verification

After registration, user receives email:

```
Subject: Verify your email address

Click here to verify: https://example.com/verify/signed-url

Signed URL includes:
- user_id
- email hash
- Digital signature (prevents tampering)
```

When user clicks link:

```http
GET /api/v1/auth/email/verify/{id}/{hash}?signature=xyz&expires=123
```

```php
// Backend verifies signature and marks email as verified
$user->markEmailAsVerified();
```

---

## 3. Login Flow

### 3.1 Merchant Login (Admin-Front)

**Step 1: User enters credentials**
```javascript
// admin-front/src/pages/login.tsx
async function handleLogin(email: string, password: string) {
  const response = await fetch(
    `${NEXT_PUBLIC_API_URL}/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }
  );

  const data = await response.json();

  if (data.two_factor_required) {
    // Two-factor required
    showTwoFactorPrompt(data.two_factor_token);
    return;
  }

  // Login success
  saveAuthToken(data.access_token);
  saveUser(data.user);
  redirectToDashboard();
}
```

**Step 2: Backend Authentication**
```php
// api/app/Http/Controllers/Api/V1/Auth/LoginController.php

public function __invoke(LoginRequest $request): JsonResponse
{
    // Step 1: Validate input
    $credentials = $request->validated();

    // Step 2: Find user by email
    $user = User::where('email', $credentials['email'])->first();

    if (!$user || !Hash::check($credentials['password'], $user->password)) {
        // Fail gracefully (don't reveal if email exists)
        return response()->json([
            'message' => 'Invalid email or password.'
        ], 401);
    }

    // Step 3: Check if user is active
    if ($user->status !== 'active') {
        return response()->json([
            'message' => 'User account is disabled.'
        ], 403);
    }

    // Step 4: Check if 2FA is enabled
    if ($user->two_factor_confirmed_at) {
        // Generate temporary 2FA token
        $twoFactorToken = encrypt([
            'user_id' => $user->id,
            'expires_at' => now()->addMinutes(5)
        ]);

        return response()->json([
            'two_factor_required' => true,
            'two_factor_token' => $twoFactorToken,
            'message' => 'Please complete two-factor authentication.'
        ], 202);
    }

    // Step 5: Generate Sanctum token (no 2FA needed)
    $token = $user->createToken('auth_token', ['*']);

    // Step 6: Update last login
    $user->update(['last_login_at' => now()]);

    return response()->json([
        'user' => new UserResource($user),
        'access_token' => $token->plainTextToken,
        'token_type' => 'Bearer',
        'expires_at' => $token->accessToken->expires_at?->toIso8601String()
    ]);
}
```

**Step 3: Token Generation**
```php
// Laravel Sanctum creates token
$token = $user->createToken('auth_token', ['*']);

// Returns:
// - plainTextToken: "1|abcdefghijklmnopqrstuvwxyz"
// - accessToken: PersonalAccessToken model
```

**Step 4: Frontend Stores Token**
```javascript
// admin-front/src/context/AuthContext.tsx
localStorage.setItem('auth_token', response.access_token);
localStorage.setItem('user', JSON.stringify({
  id: response.user.id,
  name: response.user.name,
  email: response.user.email,
  tenant_id: response.user.tenant_id  // Key for tenant resolution
}));

// Set auth context
authContext.setUser(response.user);
authContext.setToken(response.access_token);
```

---

## 4. Two-Factor Authentication (2FA)

### 4.1 2FA Setup

When merchant opts into 2FA:

```http
POST /api/v1/auth/2fa/enable
Authorization: Bearer {token}
```

**Backend Response:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qr_code": "data:image/png;base64,iVBORw0K...",
  "recovery_codes": [
    "4f7e-8k2j",
    "9l0p-2m4n",
    ...
  ]
}
```

Frontend shows QR code for user to scan with authenticator app.

### 4.2 2FA Confirmation

```http
POST /api/v1/auth/2fa/confirm
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "123456"
}
```

```php
// Backend verifies TOTP code
if (TOTP::verify($code, $user->two_factor_secret)) {
    $user->update(['two_factor_confirmed_at' => now()]);
    return response()->json(['message' => 'Two-factor enabled']);
}
```

### 4.3 Login with 2FA Challenge

**Customer already sees:**
```json
{
  "two_factor_required": true,
  "two_factor_token": "encrypted-temp-token"
}
```

**Frontend prompts for 2FA code:**
```javascript
// admin-front/src/pages/2fa-challenge.tsx
async function submitCode(code: string) {
  const response = await fetch(
    `${NEXT_PUBLIC_API_URL}/auth/2fa/challenge`,
    {
      method: 'POST',
      body: JSON.stringify({
        code: code,
        two_factor_token: tempToken
      })
    }
  );

  if (response.ok) {
    const { access_token } = await response.json();
    saveAuthToken(access_token);
    redirectToDashboard();
  }
}
```

**Backend validates 2FA code:**
```php
// api/app/Http/Controllers/Api/V1/Auth/TwoFactorController.php

public function challenge(Request $request): JsonResponse
{
    // Step 1: Decrypt temporary token
    $twoFactorData = decrypt($request->input('two_factor_token'));

    if (now()->isAfter($twoFactorData['expires_at'])) {
        return response()->json([
            'message' => 'Two-factor token expired.'
        ], 401);
    }

    // Step 2: Find user
    $user = User::find($twoFactorData['user_id']);

    // Step 3: Verify TOTP code
    if (!TOTP::verify($request->input('code'), $user->two_factor_secret)) {
        return response()->json([
            'message' => 'Invalid two-factor code.'
        ], 401);
    }

    // Step 4: Generate real token
    $token = $user->createToken('auth_token', ['*']);

    return response()->json([
        'user' => new UserResource($user),
        'access_token' => $token->plainTextToken,
        'token_type' => 'Bearer'
    ]);
}
```

---

## 5. Protected API Requests

### 5.1 Sending Authenticated Requests

```javascript
// admin-front/src/lib/api/authenticated.ts

export async function fetchWithAuth(
  endpoint: string,
  options = {}
) {
  const token = localStorage.getItem('auth_token');

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${NEXT_PUBLIC_API_URL}${endpoint}`,
    {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  );

  // Handle 401 Unauthorized
  if (response.status === 401) {
    // Token invalid or expired
    clearAuthToken();
    redirectToLogin();
  }

  return response.json();
}
```

### 5.2 Backend Sanctum Validation

```php
// api/app/Http/Middleware (Applied to protected routes)

// Step 1: Extract token from Authorization header
// Authorization: Bearer 1|abcdefghijklmnopqrstuvwxyz

// Step 2: Look up token in personal_access_tokens table
$token = PersonalAccessToken::findToken($plainTextToken);

if (!$token) {
    return response()->json(['message' => 'Unauthenticated.'], 401);
}

// Step 3: Load associated user
$user = $token->tokenable; // User who created token

// Step 4: Set auth context
auth()->setUser($user);

// Step 5: Attach token to request
request()->setUserResolver(fn () => $user);
```

### 5.3 Using Authenticated User in Controllers

```php
// api/app/Http/Controllers/Api/V1/MerchantController.php

public function show(): JsonResponse
{
    // auth()->user() is available (authenticated via Sanctum)
    $user = auth()->user();
    $tenant = $user->tenant;

    return response()->json([
        'store' => $tenant
    ]);
}
```

---

## 6. Logout Flow

### 6.1 Frontend Logout

```javascript
// admin-front/src/hooks/useAuth.ts

async function logout() {
  // Step 1: Notify backend
  await fetch(`${NEXT_PUBLIC_API_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  // Step 2: Clear local storage
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');

  // Step 3: Clear auth context
  setUser(null);
  setToken(null);

  // Step 4: Redirect
  window.location.href = '/login';
}
```

### 6.2 Backend Logout

```php
// api/app/Http/Controllers/Api/V1/Auth/LogoutController.php

public function __invoke(): Response
{
    // Step 1: Get current user
    $user = auth()->user();

    // Step 2: Revoke current token
    $user->currentAccessToken()->delete();
    // Or: $user->tokens()->delete(); (logout from all devices)

    // Step 3: Return 204 No Content
    return response()->noContent();
}
```

### 6.3 Database Cleanup

```sql
-- After logout, token is deleted from database
DELETE FROM personal_access_tokens
WHERE id = (SELECT id FROM personal_access_tokens WHERE token = '...');

-- Future requests with this token will be rejected:
-- "Unauthenticated"
```

---

## 7. Token Refresh Strategy

### 7.1 Current Implementation (Sanctum)

Sanctum tokens **do not auto-refresh**. Instead:
- Tokens have long expiration (days/weeks)
- Frontend stores token persistently
- Token remains valid until explicitly revoked

### 7.2 If Token Expires

```javascript
// frontend/src/lib/api.ts

async function fetchWithAuth(endpoint, options) {
  const response = await fetch(endpoint, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (response.status === 401) {
    // Token expired or revoked
    const refreshed = await refreshToken();
    
    if (refreshed) {
      // Retry request with new token
      return fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${newToken}` }
      });
    } else {
      // Refresh failed - redirect to login
      redirectToLogin();
    }
  }

  return response;
}
```

### 7.3 Refresh Token Endpoint (Future)

```http
POST /api/v1/auth/refresh
Authorization: Bearer {expired_token}
```

```json
{
  "access_token": "new-token",
  "expires_at": "2026-05-15T12:00:00Z"
}
```

---

## 8. Session Handling

### 8.1 Memory vs Persistent Storage

| Storage | Pros | Cons | Use Case |
|---------|------|------|----------|
| **Memory** | Secure (no XSS) | Lost on refresh | Short sessions |
| **LocalStorage** | Persistent | XSS vulnerable | Web apps |
| **HttpOnly Cookie** | Secure + persistent | CSRF risk (mitigated with SameSite) | Production |

### 8.2 Current Implementation

```javascript
// admin-front/src/hooks/useAuth.ts

function useAuth() {
  // Memory store (lost on refresh)
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('auth_token');
    if (saved) {
      setToken(saved);
      setUser(JSON.parse(localStorage.getItem('user')));
    }
  }, []);

  // Hybrid approach:
  // - Store in localStorage for persistence
  // - Use in-memory state for app
  // - Clear both on logout
}
```

### 8.3 Production Best Practice

```php
// api/config/sanctum.php
'guard' => ['web'],  // Use session-based guard
'stateful' => [      // Domains where session auth is stateful
    'localhost',
    'localhost:3000',
    'example.com',
    '*.example.com',
],
```

With this config:
- Frontends on `example.com` use session cookies (HttpOnly)
- Frontends on other domains use tokens (bearer auth)

---

## 9. Cross-Domain Authentication

### 9.1 Same-Domain (Same Origin)

```
Admin: admin.example.com:3000
Store: store.example.com:3001
API: api.example.com:8000

All same domain → Cookies shared via Set-Cookie header
```

### 9.2 Different Domains

```
Admin: admin.example.com
Store: store.example.com
API: api.example.com

CORS headers required in backend:
Access-Control-Allow-Origin: https://admin.example.com
Access-Control-Allow-Credentials: true
```

### 9.3 CORS Configuration

```php
// api/config/cors.php
'allowed_origins' => ['*'],  // Or specific domains
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
'exposed_headers' => [],
'max_age' => 0,
'supports_credentials' => true,
```

---

## 10. Security Best Practices

| Practice | Implementation |
|----------|-----------------|
| **HTTPS Only** | All tokens sent over TLS |
| **Token Hashing** | Tokens hashed in DB, plain text sent to client |
| **XSS Protection** | Content-Security-Policy headers |
| **CSRF Protection** | Sanctum provides CSRF tokens for forms |
| **Rate Limiting** | Failed logins throttled (Fortify) |
| **2FA** | TOTP + recovery codes |
| **Password Hashing** | Bcrypt with Laravel's Hash facade |
| **Token Revocation** | Logout deletes token from DB |

---

## 11. Related Documentation

- [TENANCY.md](./TENANCY.md) — Tenant resolution after login
- [API_CONTRACT.md](./API_CONTRACT.md) — API authentication headers
- [ARCHITECTURE.md](./ARCHITECTURE.md) — System overview
- `/api/AGENTS.md` — Laravel authentication specifics
- `/api/config/sanctum.php` — Sanctum configuration

---

**Last Updated:** May 13, 2026  
**Version:** 1.0
