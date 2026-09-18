<?php

namespace App\Services;

use App\Enums\ReportStatus;
use App\Models\AuditEvent;
use App\Models\Report;
use App\Models\User;
use App\Support\SensitiveText;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class UpdateReportStatus
{
    private const ALLOWED = [
        'reported' => ['triaged'],
        'triaged' => ['assigned'],
        'assigned' => ['in_progress'],
        'in_progress' => ['resolved'],
        'resolved' => ['in_progress', 'closed'],
        'closed' => [],
    ];

    public function handle(Report $report, ReportStatus $next, string $note, bool $public, int $expectedVersion, User $actor): Report
    {
        return DB::transaction(function () use ($report, $next, $note, $public, $expectedVersion, $actor) {
            /** @var Report $locked */
            $locked = Report::query()->lockForUpdate()->findOrFail($report->id);
            $current = $locked->status;

            if ($locked->lock_version !== $expectedVersion) {
                throw ValidationException::withMessages(['lock_version' => 'This report changed after it was opened. Refresh before updating.']);
            }
            if (! in_array($next->value, self::ALLOWED[$current->value], true)) {
                throw ValidationException::withMessages(['status' => "The {$current->value} to {$next->value} transition is not allowed."]);
            }

            $requestId = (string) Str::uuid();
            $cleanNote = SensitiveText::redact($note);
            $locked->update([
                'status' => $next,
                'resolved_at' => $next === ReportStatus::Resolved ? now() : $locked->resolved_at,
                'lock_version' => $locked->lock_version + 1,
            ]);
            $locked->statusEvents()->create([
                'actor_user_id' => $actor->id,
                'actor_type' => 'operator',
                'from_status' => $current,
                'to_status' => $next,
                'note' => $cleanNote,
                'is_public' => $public,
                'request_id' => $requestId,
                'occurred_at' => now(),
            ]);
            $locked->notes()->create(['author_user_id' => $actor->id, 'visibility' => $public ? 'public' : 'internal', 'body' => $cleanNote]);

            if ($next === ReportStatus::Resolved) {
                $locked->resolutionVerifications()->whereNull('superseded_at')->update(['superseded_at' => now()]);
                $locked->resolutionVerifications()->create(['state' => 'pending', 'statement' => '', 'method' => 'text']);
            }

            AuditEvent::create([
                'actor_user_id' => $actor->id,
                'actor_type' => 'operator',
                'auditable_type' => Report::class,
                'auditable_id' => $locked->id,
                'event' => 'report.status_changed',
                'before' => ['status' => $current->value, 'lock_version' => $expectedVersion],
                'after' => ['status' => $next->value, 'lock_version' => $expectedVersion + 1],
                'context' => ['public' => $public],
                'request_id' => $requestId,
            ]);

            return $locked->fresh(['area', 'statusEvents', 'notes', 'evidence', 'transcriptSegments', 'currentResolutionVerification']);
        }, 3);
    }
}
