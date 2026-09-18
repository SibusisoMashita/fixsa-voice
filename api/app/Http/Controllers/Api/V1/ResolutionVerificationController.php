<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ResolutionOutcome;
use App\Http\Controllers\Controller;
use App\Http\Requests\VerifyResolutionRequest;
use App\Http\Resources\PublicReportResource;
use App\Models\Report;
use App\Services\VerifyResolution;

class ResolutionVerificationController extends Controller
{
    public function __invoke(VerifyResolutionRequest $request, string $reference, VerifyResolution $verify): PublicReportResource
    {
        $report = Report::query()->where('reference', strtoupper($reference))->firstOrFail();
        $updated = $verify->handle(
            $report,
            ResolutionOutcome::from($request->validated('outcome')),
            $request->validated('statement'),
            $request->validated('method'),
        );

        return new PublicReportResource($updated);
    }
}
