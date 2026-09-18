<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;

class VoiceTokenController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $apiKey = config('services.assemblyai.key');
        if (! $apiKey) {
            return response()->json(['error' => 'Real AssemblyAI mode is not configured. Continue in deterministic demo mode.'], 503, ['Cache-Control' => 'no-store']);
        }

        try {
            $response = Http::acceptJson()
                ->withToken($apiKey)
                ->connectTimeout(3)
                ->timeout(10)
                ->get('https://agents.assemblyai.com/v1/token', ['expires_in_seconds' => 120, 'max_session_duration_seconds' => 900]);

            if ($response->failed()) {
                return response()->json(['error' => 'AssemblyAI token service rejected the request.', 'code' => $response->json('code', 'upstream_error')], $response->status(), ['Cache-Control' => 'no-store']);
            }

            return response()->json(['token' => $response->json('token'), 'expiresInSeconds' => $response->json('expires_in_seconds', 120)], headers: ['Cache-Control' => 'no-store']);
        } catch (ConnectionException) {
            return response()->json(['error' => 'AssemblyAI token service is temporarily unavailable.'], 503, ['Cache-Control' => 'no-store']);
        }
    }
}
