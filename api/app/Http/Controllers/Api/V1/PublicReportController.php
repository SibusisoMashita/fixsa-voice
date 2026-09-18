<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReportRequest;
use App\Http\Resources\PublicReportResource;
use App\Models\Report;
use App\Services\CreateReport;
use Illuminate\Http\JsonResponse;

class PublicReportController extends Controller
{
    public function store(StoreReportRequest $request, CreateReport $create): JsonResponse
    {
        $report = $create->handle($request->validated());

        return (new PublicReportResource($report))->response()->setStatusCode(201);
    }

    public function show(string $reference): PublicReportResource
    {
        $report = Report::query()
            ->where('reference', strtoupper($reference))
            ->with(['area', 'statusEvents', 'notes', 'evidence', 'currentResolutionVerification'])
            ->firstOrFail();

        return new PublicReportResource($report);
    }
}
