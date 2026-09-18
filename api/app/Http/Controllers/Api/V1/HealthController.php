<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        DB::select('select 1');

        return response()->json([
            'status' => 'ok',
            'service' => 'fixsa-api',
            'version' => config('app.version', 'development'),
            'database' => DB::connection()->getDriverName(),
            'time' => now()->toIso8601String(),
        ], headers: ['Cache-Control' => 'no-store']);
    }
}
