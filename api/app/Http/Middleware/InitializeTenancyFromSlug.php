<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolve the current tenant from:
 *  1. Route parameter {tenant_slug}  — used in local development
 *  2. X-Tenant-Slug request header   — used by API clients
 *  3. Request subdomain              — used in production (e.g. nike.platform.com)
 *
 * On success: initializes Stancl Tenancy context and binds the tenant to the container.
 * On failure: aborts with 404.
 */
class InitializeTenancyFromSlug
{
    public function handle(Request $request, Closure $next): Response
    {
        $slug = $this->resolveSlug($request);

        if (! $slug) {
            abort(404, 'Tenant not specified.');
        }

        /** @var Tenant|null $tenant */
        $tenant = Tenant::where('slug', $slug)->first();

        if (! $tenant) {
            abort(404, "Tenant [{$slug}] not found.");
        }

        // Initialize Stancl Tenancy (fires TenancyInitialized event, boots bootstrappers)
        tenancy()->initialize($tenant);

        // Also bind to the container for easy injection
        app()->instance(Tenant::class, $tenant);

        return $next($request);
    }

    private function resolveSlug(Request $request): ?string
    {
        // 1. Route parameter (highest priority – explicit)
        if ($slug = $request->route('tenant_slug')) {
            return $slug;
        }

        // 2. Request header (useful for mobile/app clients)
        if ($slug = $request->header('X-Tenant-Slug')) {
            return $slug;
        }

        // 3. Subdomain (production)
        $host = $request->getHost();
        $centralDomains = config('tenancy.central_domains', []);

        foreach ($centralDomains as $central) {
            if ($host === $central) {
                return null;
            }

            // Extract subdomain: nike.platform.com -> nike
            if (str_ends_with($host, '.'.$central)) {
                return str_replace('.'.$central, '', $host);
            }
        }

        return null;
    }
}
