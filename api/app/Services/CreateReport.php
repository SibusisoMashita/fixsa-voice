<?php

namespace App\Services;

use App\Models\Area;
use App\Models\AuditEvent;
use App\Models\Report;
use App\Support\SensitiveText;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class CreateReport
{
    public function __construct(private readonly ReportReferenceGenerator $references) {}

    public function handle(array $data): Report
    {
        return DB::transaction(function () use ($data) {
            $location = $data['location'];
            $area = Area::firstOrCreate(
                ['slug' => Str::slug($location['area'])],
                ['name' => $location['area'], 'centroid_latitude' => $location['latitude'], 'centroid_longitude' => $location['longitude']],
            );
            $targetMinutes = DB::table('sla_rules')
                ->where('category', $data['category'])
                ->where('priority', $data['priority'])
                ->where('active_from', '<=', now())
                ->where(fn ($query) => $query->whereNull('active_to')->orWhere('active_to', '>', now()))
                ->orderByDesc('active_from')
                ->value('target_minutes')
                ?? ['emergency_hold' => 60, 'urgent' => 240, 'priority' => 1440, 'routine' => 4320][$data['priority']];
            $requestId = (string) Str::uuid();

            $report = Report::create([
                'reference' => $this->references->next(),
                'area_id' => $area->id,
                'source' => $data['source'],
                'category' => $data['category'],
                'status' => 'reported',
                'priority' => $data['priority'],
                'severity' => $data['severity'],
                'description' => SensitiveText::redact($data['details']),
                'address' => SensitiveText::redact($location['address']),
                'public_address' => SensitiveText::publicLocation($location['address'], $location['landmark'] ?? null),
                'landmark' => SensitiveText::redact($location['landmark'] ?? ''),
                'latitude' => $location['latitude'],
                'longitude' => $location['longitude'],
                'location_precision' => $location['precision'],
                'reported_duration' => $data['duration'] ?? null,
                'people_affected' => $data['people_affected'] ?? 0,
                'hazard_flags' => array_map([SensitiveText::class, 'redact'], $data['hazards'] ?? []),
                'audio_retention' => $data['source'] === 'voice' ? 'ephemeral_deleted' : 'not_recorded',
                'safety_hold' => $data['safety_hold'] ?? false,
                'synthetic' => $data['synthetic'] ?? false,
                'sla_due_at' => now()->addMinutes($targetMinutes),
                'metadata' => Arr::only($data, ['language', 'channel']),
            ]);

            foreach ($data['transcript'] ?? [] as $index => $segment) {
                $report->transcriptSegments()->create([
                    'sequence' => $index + 1,
                    'speaker' => $segment['speaker'],
                    'text' => SensitiveText::redact($segment['text']),
                    'spoken_at' => $segment['timestamp'] ?? now(),
                    'is_final' => $segment['final'] ?? true,
                ]);
            }

            $report->statusEvents()->create([
                'actor_type' => 'agent',
                'from_status' => null,
                'to_status' => 'reported',
                'note' => 'Report received by FixSA.',
                'is_public' => true,
                'request_id' => $requestId,
                'occurred_at' => now(),
            ]);

            AuditEvent::create([
                'actor_type' => 'agent',
                'auditable_type' => Report::class,
                'auditable_id' => $report->id,
                'event' => 'report.created',
                'after' => ['reference' => $report->reference, 'status' => 'reported', 'priority' => $report->priority],
                'context' => ['source' => $report->source, 'audio_retention' => $report->audio_retention],
                'request_id' => $requestId,
            ]);

            return $report->load(['area', 'statusEvents', 'notes', 'evidence', 'currentResolutionVerification']);
        }, 3);
    }
}
