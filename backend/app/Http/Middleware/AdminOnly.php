<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminOnly
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user('sanctum');

        if (!$user instanceof User || !$user->is_admin) {
            return response()->json([
                'message' => 'Admins only.'
            ], 403);
        }

        return $next($request);
    }
}
