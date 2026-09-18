<?php

namespace App\Http\Middleware;

use App\Models\IdempotencyKey;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class RequireIdempotencyKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $key = trim((string) $request->header('Idempotency-Key'));
        if ($key === '' || mb_strlen($key) > 120) {
            return response()->json(['message' => 'A valid Idempotency-Key header is required.'], 400);
        }

        $scope = (string) ($request->route()?->getName() ?? $request->path());
        $hash = hash('sha256', (string) $request->getContent());
        $record = IdempotencyKey::query()->where(compact('scope', 'key'))->first();

        if ($record) {
            if (! hash_equals($record->request_hash, $hash)) {
                return response()->json(['message' => 'This idempotency key was already used with a different request.'], 409);
            }
            if ($record->response_code !== null) {
                return response()->json($record->response_body, $record->response_code, ['Idempotent-Replay' => 'true']);
            }

            if ($record->locked_until?->isPast()) {
                $record->delete();
                $record = null;
            }
        }

        if ($record) {
            return response()->json(['message' => 'An identical request is already being processed.'], 409, ['Retry-After' => '2']);
        }

        $record = IdempotencyKey::create([
            'scope' => $scope,
            'key' => $key,
            'request_hash' => $hash,
            'locked_until' => now()->addSeconds(30),
            'expires_at' => now()->addDay(),
        ]);

        try {
            /** @var Response $response */
            $response = $next($request);
        } catch (Throwable $exception) {
            $record->delete();
            throw $exception;
        }
        if ($response instanceof JsonResponse && $response->getStatusCode() < 500) {
            $record->update([
                'response_code' => $response->getStatusCode(),
                'response_body' => $response->getData(true),
                'locked_until' => null,
            ]);
        } elseif ($response->getStatusCode() >= 500) {
            $record->delete();
        }

        return $response;
    }
}
