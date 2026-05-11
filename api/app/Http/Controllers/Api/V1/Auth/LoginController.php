<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\DTOs\Auth\LoginDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Services\Auth\AuthService;
use Illuminate\Http\JsonResponse;

class LoginController extends Controller
{
    public function __construct(private readonly AuthService $authService) {}

    public function __invoke(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login(
            LoginDTO::fromArray($request->validated())
        );

        // 2FA challenge required
        if (isset($result['two_factor'])) {
            return response()->json([
                'two_factor_required' => true,
                'two_factor_token'    => $result['two_factor_token'],
                'message'             => 'Please complete two-factor authentication.',
            ]);
        }

        $token = $result['token'];
        $user  = $request->user() ?? \App\Models\User::where('email', $request->email)->first();

        return response()->json([
            'user'         => new UserResource($token->accessToken->tokenable),
            'access_token' => $token->plainTextToken,
            'token_type'   => 'Bearer',
            'expires_at'   => $token->accessToken->expires_at?->toISOString(),
        ]);
    }
}
