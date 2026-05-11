<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureEmailVerification();
    }

    /**
     * Override the email verification URL so the link in the email goes to
     * the SPA frontend, which then calls the API with the signed params.
     *
     * The signed URL is still generated against the API (APP_URL), ensuring
     * the `signed` middleware can verify it.  The email link simply substitutes
     * the host/path for the frontend equivalent, passing id, hash, expires and
     * signature as query parameters.
     */
    protected function configureEmailVerification(): void
    {
        VerifyEmail::createUrlUsing(function (object $notifiable): string {
            // Generate a proper signed URL against OUR API endpoint (auth.verification.verify).
            // Fortify also registers a 'verification.verify' route — using the full name
            // 'auth.verification.verify' ensures we sign the correct API URL so that
            // $request->hasValidSignature() passes when the frontend calls our endpoint.
            $apiUrl = URL::temporarySignedRoute(
                'auth.verification.verify',
                now()->addMinutes((int) config('auth.verification.expire', 60)),
                [
                    'id'   => $notifiable->getKey(),
                    'hash' => sha1($notifiable->getEmailForVerification()),
                ]
            );

            // Parse the signed API URL to extract the signature params
            $parsed = parse_url($apiUrl);
            parse_str($parsed['query'] ?? '', $params);

            // Build the frontend URL: SPA page + id/hash path + signature params
            return rtrim(config('app.frontend_url'), '/') . '/email/verify/'
                . $notifiable->getKey() . '/'
                . sha1($notifiable->getEmailForVerification())
                . '?' . http_build_query([
                    'expires'   => $params['expires'],
                    'signature' => $params['signature'],
                ]);
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
