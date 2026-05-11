<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class TwoFactorChallengeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Either a 6-digit TOTP code or a recovery code
            'code'              => ['required', 'string'],
            'two_factor_token'  => ['required', 'string'],
        ];
    }
}
