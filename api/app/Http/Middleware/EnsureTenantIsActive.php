<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Tenant|null $tenant */
        $tenant = app(Tenant::class);

        if (! $tenant || ! $tenant->isActive()) {
            abort(403, 'This store is currently suspended or inactive.');
        }

        return $next($request);
    }
}
