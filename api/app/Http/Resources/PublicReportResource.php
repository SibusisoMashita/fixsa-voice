<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $verification = $this->relationLoaded('currentResolutionVerification') ? $this->currentResolutionVerification : null;

        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'source' => $this->source,
            'status' => $this->status->value,
            'priority' => $this->priority,
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
            'fields' => [
                'category' => $this->category,
                'location' => [
                    'address' => $this->public_address,
                    'area' => $this->area?->name,
                    'landmark' => $this->landmark,
                    'latitude' => round((float) $this->latitude, 3),
                    'longitude' => round((float) $this->longitude, 3),
                    'precision' => $this->location_precision,
                ],
                'duration' => $this->reported_duration,
                'severity' => $this->severity,
                'hazards' => $this->hazard_flags ?? [],
                'peopleAffected' => $this->people_affected,
                'details' => $this->description,
            ],
            'statusEvents' => $this->whenLoaded('statusEvents', fn () => $this->statusEvents->where('is_public', true)->map(fn ($event) => [
                'id' => $event->id,
                'status' => $event->to_status->value,
                'at' => $event->occurred_at->toIso8601String(),
                'note' => $event->note,
                'public' => true,
                'actor' => $event->actor_type,
            ])->values()),
            'publicNotes' => $this->whenLoaded('notes', fn () => $this->notes->where('visibility', 'public')->pluck('body')->values()),
            'evidence' => $this->whenLoaded('evidence', fn () => $this->evidence->where('is_public', true)->map(fn ($item) => [
                'id' => $item->id,
                'type' => $item->kind,
                'name' => $item->original_name,
                'addedAt' => ($item->captured_at ?? $item->created_at)->toIso8601String(),
                'public' => true,
            ])->values()),
            'slaDueAt' => $this->sla_due_at?->toIso8601String(),
            'audioRetention' => $this->audio_retention,
            'safetyHold' => $this->safety_hold,
            'resolutionVerification' => $verification ? [
                'state' => $verification->state->value,
                'outcome' => $verification->outcome?->value,
                'statement' => $verification->statement,
                'verifiedAt' => $verification->verified_at?->toIso8601String(),
                'method' => $verification->method,
            ] : null,
            'synthetic' => $this->synthetic,
        ];
    }
}
