<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ReportStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateReportStatusRequest;
use App\Http\Resources\OperatorReportResource;
use App\Models\Report;
use App\Services\UpdateReportStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OperatorReportController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $reports = Report::query()
            ->with(['area', 'statusEvents', 'notes', 'evidence', 'transcriptSegments', 'currentResolutionVerification'])
            ->when($request->string('status')->isNotEmpty(), fn ($query) => $query->where('status', $request->string('status')))
            ->orderByRaw("CASE priority WHEN 'emergency_hold' THEN 1 WHEN 'urgent' THEN 2 WHEN 'priority' THEN 3 ELSE 4 END")
            ->orderBy('sla_due_at')
            ->orderBy('id')
            ->cursorPaginate(min((int) $request->integer('per_page', 25), 100));

        return OperatorReportResource::collection($reports);
    }

    public function show(Report $report): OperatorReportResource
    {
        return new OperatorReportResource($report->load(['area', 'statusEvents', 'notes', 'evidence', 'transcriptSegments', 'currentResolutionVerification']));
    }

    public function status(UpdateReportStatusRequest $request, Report $report, UpdateReportStatus $update): OperatorReportResource
    {
        $updated = $update->handle(
            $report,
            ReportStatus::from($request->validated('status')),
            $request->validated('note'),
            $request->boolean('public'),
            $request->integer('lock_version'),
            $request->user(),
        );

        return new OperatorReportResource($updated);
    }
}
