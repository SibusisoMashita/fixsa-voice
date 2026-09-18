<?php

namespace App\Services;

use App\Enums\ReportStatus;
use App\Enums\ResolutionOutcome;
use App\Enums\ResolutionState;
use App\Models\AuditEvent;
use App\Models\Report;
use App\Support\SensitiveText;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class VerifyResolution
{
    public function handle(Report $report, ResolutionOutcome $outcome, string $statement, string $method): Report
    {
        return DB::transaction(function () use ($report, $outcome, $statement, $method) {
            /** @var Report $locked */
            $locked = Report::query()->lockForUpdate()->findOrFail($report->id);
            $activeVerification = $locked->resolutionVerifications()->whereNull('superseded_at')->first();

            if ($locked->status !== ReportStatus::Resolved) {
                throw ValidationException::withMessages(['report' => 'Only a resolved report can receive Proof of Fix.']);
            }
            if ($activeVerification && $activeVerification->state->value !== ResolutionState::Pending->value) {
                throw ValidationException::withMessages(['report' => 'This resolution has already been checked by a resident.']);
            }

            $requestId = (string) Str::uuid();
            $before = ['status' => $locked->status->value, 'lock_version' => $locked->lock_version];
            $state = match ($outcome) {
                ResolutionOutcome::Fixed => ResolutionState::Verified,
                ResolutionOutcome::PartiallyFixed => ResolutionState::Partial,
                ResolutionOutcome::NotFixed => ResolutionState::Disputed,
            };
            $nextStatus = $outcome === ResolutionOutcome::Fixed ? ReportStatus::Resolved : ReportStatus::InProgress;
            $publicNote = match ($outcome) {
                ResolutionOutcome::Fixed => 'Resolution independently confirmed by a resident through Proof of Fix.',
                ResolutionOutcome::PartiallyFixed => 'Resident reported a partial fix. The work order was reopened for follow-up.',
                ResolutionOutcome::NotFixed => 'Resident reported that the issue remains. The work order was reopened for follow-up.',
            };

            if ($activeVerification) {
                $activeVerification->update([
                    'outcome' => $outcome,
                    'state' => $state,
                    'statement' => SensitiveText::redact(mb_substr($statement, 0, 500)),
                    'method' => $method,
                    'verified_at' => now(),
                ]);
            } else {
                $locked->resolutionVerifications()->create([
                    'outcome' => $outcome,
                    'state' => $state,
                    'statement' => SensitiveText::redact(mb_substr($statement, 0, 500)),
                    'method' => $method,
                    'verified_at' => now(),
                ]);
            }

            $locked->update([
                'status' => $nextStatus,
                'verified_at' => $outcome === ResolutionOutcome::Fixed ? now() : null,
                'lock_version' => $locked->lock_version + 1,
            ]);
            $locked->notes()->create(['visibility' => 'public', 'body' => $publicNote]);
            $locked->statusEvents()->create([
                'actor_type' => 'resident',
                'from_status' => ReportStatus::Resolved,
                'to_status' => $nextStatus,
                'note' => $publicNote,
                'is_public' => true,
                'request_id' => $requestId,
                'occurred_at' => now(),
            ]);
            AuditEvent::create([
                'actor_type' => 'resident',
                'auditable_type' => Report::class,
                'auditable_id' => $locked->id,
                'event' => 'resolution.verified',
                'before' => $before,
                'after' => ['status' => $nextStatus->value, 'state' => $state->value, 'outcome' => $outcome->value],
                'context' => ['method' => $method, 'audio_retention' => $locked->audio_retention],
                'request_id' => $requestId,
            ]);

            return $locked->fresh(['area', 'statusEvents', 'notes', 'evidence', 'currentResolutionVerification']);
        }, 3);
    }
}
