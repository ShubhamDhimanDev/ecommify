<?php

declare(strict_types=1);

namespace App\Services\Auth;

use App\DTOs\Auth\LoginDTO;
use App\DTOs\Auth\RegisterDTO;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\NewAccessToken;

class AuthService
{
    /**
     * Register a new merchant owner and issue a Sanctum token.
     */
    public function register(RegisterDTO $dto): array
    {
        $user = User::create([
            'name'      => $dto->name,
            'email'     => $dto->email,
            'password'  => Hash::make($dto->password),
            'tenant_id' => null, // No tenant at registration; assigned when a store is created
        ]);

        $user->assignRole(UserRole::MerchantOwner->value);

        event(new Registered($user));

        $token = $user->createToken('auth_token', ['*'], now()->addDays(30));

        return [$user, $token];
    }

    /**
     * Attempt login, handle 2FA state.
     *
     * Returns:
     *  - ['token' => NewAccessToken]   when login is fully complete
     *  - ['two_factor' => true]        when 2FA challenge is required
     */
    public function login(LoginDTO $dto): array
    {
        if (! Auth::attempt(['email' => $dto->email, 'password' => $dto->password])) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        /** @var User $user */
        $user = Auth::user();

        if (! $user->isActive()) {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => ['Your account has been suspended.'],
            ]);
        }

        if ($user->isTwoFactorEnabled()) {
            // Generate a short-lived token to identify the pending 2FA user.
            // Sessions are not available on stateless API routes, so we use Cache.
            $twoFactorToken = Str::random(64);
            Cache::put('2fa.pending.' . $twoFactorToken, $user->id, now()->addMinutes(10));
            Auth::logout();

            return ['two_factor' => true, 'two_factor_token' => $twoFactorToken];
        }

        $user->update(['last_login_at' => now()]);

        $token = $user->createToken('auth_token', ['*'], now()->addDays(30));

        return ['token' => $token];
    }

    /**
     * Revoke the current access token (logout).
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }
}
