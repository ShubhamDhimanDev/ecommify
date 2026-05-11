<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\TwoFactorChallengeRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\Auth\TwoFactorAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

class TwoFactorController extends Controller
{
    public function __construct(private readonly TwoFactorAuthService $twoFactorService) {}

    /**
     * Enable 2FA: generate secret and QR code.
     * The user must still call /confirm before 2FA is active.
     */
    public function enable(Request $request): JsonResponse
    {
        $data = $this->twoFactorService->enable($request->user());

        return response()->json($data);
    }

    /**
     * Confirm 2FA by verifying the first TOTP code from the authenticator app.
     */
    public function confirm(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string'],
        ]);

        $this->twoFactorService->confirm($request->user(), $request->input('code'));

        return response()->json(['message' => 'Two-factor authentication enabled.']);
    }

    /**
     * Disable 2FA.
     */
    public function disable(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'string', 'current_password'],
        ]);

        $this->twoFactorService->disable($request->user());

        return response()->json(['message' => 'Two-factor authentication disabled.']);
    }

    /**
     * Complete the 2FA challenge after login.
     * The session must contain the pending user ID set during the login flow.
     */
    public function challenge(TwoFactorChallengeRequest $request): JsonResponse
    {
        $cacheKey = '2fa.pending.' . $request->validated('two_factor_token');
        $userId   = Cache::pull($cacheKey);

        if (! $userId) {
            throw ValidationException::withMessages([
                'code' => ['No pending two-factor challenge or it has expired. Please log in again.'],
            ]);
        }

        $user = $this->twoFactorService->verifyChallenge($userId, $request->validated('code'));

        $user->update(['last_login_at' => now()]);

        $token = $user->createToken('auth_token', ['*'], now()->addDays(30));

        return response()->json([
            'user'         => new UserResource($user),
            'access_token' => $token->plainTextToken,
            'token_type'   => 'Bearer',
            'expires_at'   => $token->accessToken->expires_at?->toISOString(),
        ]);
    }

    /**
     * List current recovery codes.
     */
    public function recoveryCodes(Request $request): JsonResponse
    {
        return response()->json([
            'recovery_codes' => $request->user()->recoveryCodes(),
        ]);
    }

    /**
     * Regenerate recovery codes. Invalidates existing ones.
     */
    public function regenerateRecoveryCodes(Request $request): JsonResponse
    {
        $codes = $this->twoFactorService->regenerateRecoveryCodes($request->user());

        return response()->json(['recovery_codes' => $codes]);
    }
}
