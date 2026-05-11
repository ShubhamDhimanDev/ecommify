<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * After auth, verify that the authenticated user actually belongs to
 * the currently resolved tenant (prevents users from accessing other stores).
 */
class EnsureUserBelongsToTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $user   = $request->user();
        $tenant = app(Tenant::class);

        if (! $user || ! $tenant) {
            abort(403);
        }

        // Super admins bypass tenant ownership check
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        if ($user->tenant_id !== $tenant->id) {
            $hasMembership = DB::table('merchant_users')
                ->where('tenant_id', $tenant->id)
                ->where('user_id', $user->id)
                ->exists();

            if (! $hasMembership) {
                abort(403, 'You do not have access to this store.');
            }
        }

        return $next($request);
    }
}
