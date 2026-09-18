<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\OperatorReportController;
use App\Http\Controllers\Api\V1\PublicReportController;
use App\Http\Controllers\Api\V1\ResolutionVerificationController;
use App\Http\Controllers\Api\V1\VoiceTokenController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', HealthController::class)->name('health');
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login')->name('auth.login');
    Route::get('/voice/token', VoiceTokenController::class)->middleware('throttle:voice-token')->name('voice.token');

    Route::post('/reports', [PublicReportController::class, 'store'])->middleware(['throttle:public-write', 'idempotent'])->name('reports.store');
    Route::get('/reports/{reference}', [PublicReportController::class, 'show'])->where('reference', 'FSA-[0-9]{4}-[0-9]{4,}')->name('reports.show');
    Route::post('/reports/{reference}/verify-resolution', ResolutionVerificationController::class)
        ->where('reference', 'FSA-[0-9]{4}-[0-9]{4,}')
        ->middleware(['throttle:public-write', 'idempotent'])
        ->name('reports.verify-resolution');

    Route::middleware(['auth:sanctum', 'active.operator'])->prefix('operator')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout'])->name('operator.logout');
        Route::get('/reports', [OperatorReportController::class, 'index'])->middleware('abilities:reports:read')->name('operator.reports.index');
        Route::get('/reports/{report}', [OperatorReportController::class, 'show'])->middleware('abilities:reports:read')->name('operator.reports.show');
        Route::post('/reports/{report}/status', [OperatorReportController::class, 'status'])
            ->middleware(['abilities:reports:write', 'idempotent'])
            ->name('operator.reports.status');
    });
});
