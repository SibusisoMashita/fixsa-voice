<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::query()->where('email', $request->validated('email'))->first();
        if (! $user || ! $user->is_active || ! Hash::check($request->validated('password'), $user->password)) {
            throw ValidationException::withMessages(['email' => 'The supplied credentials are invalid.']);
        }

        $token = $user->createToken($request->validated('device_name', 'operator-console'), ['reports:read', 'reports:write'])->plainTextToken;

        return response()->json(['token' => $token, 'user' => ['name' => $user->name, 'email' => $user->email, 'role' => $user->role]]);
    }

    public function logout(): JsonResponse
    {
        request()->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Signed out.']);
    }
}
