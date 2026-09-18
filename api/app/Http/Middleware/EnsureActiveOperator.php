<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveOperator
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        abort_unless($user?->is_active && in_array($user->role, ['operator', 'supervisor'], true), 403, 'An active operator account is required.');

        return $next($request);
    }
}
