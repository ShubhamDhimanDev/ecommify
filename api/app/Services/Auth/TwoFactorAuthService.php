<?php

declare(strict_types=1);

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Actions\DisableTwoFactorAuthentication;
use Laravel\Fortify\Actions\EnableTwoFactorAuthentication;
use Laravel\Fortify\Actions\GenerateNewRecoveryCodes;
use Laravel\Fortify\Contracts\TwoFactorAuthenticationProvider;

class TwoFactorAuthService
{
    public function __construct(
        private readonly TwoFactorAuthenticationProvider $provider,
        private readonly EnableTwoFactorAuthentication $enableAction,
        private readonly DisableTwoFactorAuthentication $disableAction,
        private readonly GenerateNewRecoveryCodes $regenerateAction,
    ) {}

    /**
     * Enable 2FA: generate secret + recovery codes, return QR code SVG.
     */
    public function enable(User $user): array
    {
        ($this->enableAction)($user);
        $user->refresh();

        return [
            'qr_code'        => $user->twoFactorQrCodeSvg(),
            'secret'         => decrypt($user->two_factor_secret),
            'recovery_codes' => $user->recoveryCodes(),
        ];
    }

    /**
     * Confirm 2FA by verifying the user-supplied TOTP code.
     */
    public function confirm(User $user, string $code): void
    {
        if (! $this->provider->verify(decrypt($user->two_factor_secret), $code)) {
            throw ValidationException::withMessages([
                'code' => ['The provided two factor authentication code was invalid.'],
            ]);
        }

        $user->forceFill(['two_factor_confirmed_at' => now()])->save();
    }

    /**
     * Disable 2FA entirely.
     */
    public function disable(User $user): void
    {
        ($this->disableAction)($user);
    }

    /**
     * Verify a TOTP code or a recovery code during the 2FA challenge.
     * Returns the user on success.
     */
    public function verifyChallenge(int $userId, string $code): User
    {
        /** @var User $user */
        $user = User::findOrFail($userId);

        // Try TOTP code first
        if ($this->provider->verify(decrypt($user->two_factor_secret), $code)) {
            return $user;
        }

        // Try recovery code
        $recoveryCodes = collect($user->recoveryCodes());
        $matched = $recoveryCodes->first(fn (string $rc) => hash_equals($rc, $code));

        if ($matched) {
            // Invalidate used recovery code
            $user->replaceRecoveryCode($matched);

            return $user;
        }

        throw ValidationException::withMessages([
            'code' => ['The provided two factor authentication code was invalid.'],
        ]);
    }

    /**
     * Regenerate recovery codes.
     */
    public function regenerateRecoveryCodes(User $user): Collection
    {
        ($this->regenerateAction)($user);
        $user->refresh();

        return collect($user->recoveryCodes());
    }
}
