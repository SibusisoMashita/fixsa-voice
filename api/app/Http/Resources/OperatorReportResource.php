<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class OperatorReportResource extends PublicReportResource
{
    public function toArray(Request $request): array
    {
        $public = parent::toArray($request);

        return array_merge($public, [
            'fields' => array_merge($public['fields'], [
                'location' => array_merge($public['fields']['location'], [
                    'address' => $this->address,
                    'latitude' => (float) $this->latitude,
                    'longitude' => (float) $this->longitude,
                ]),
            ]),
            'lockVersion' => $this->lock_version,
            'internalNotes' => $this->whenLoaded('notes', fn () => $this->notes->where('visibility', 'internal')->pluck('body')->values()),
            'transcript' => $this->whenLoaded('transcriptSegments', fn () => $this->transcriptSegments->map(fn ($segment) => [
                'id' => $segment->id,
                'speaker' => $segment->speaker,
                'text' => $segment->text,
                'timestamp' => $segment->spoken_at?->toIso8601String(),
                'final' => $segment->is_final,
            ])),
            'evidence' => $this->whenLoaded('evidence', fn () => $this->evidence->map(fn ($item) => [
                'id' => $item->id,
                'type' => $item->kind,
                'name' => $item->original_name,
                'addedAt' => ($item->captured_at ?? $item->created_at)->toIso8601String(),
                'public' => $item->is_public,
                'checksumSha256' => $item->checksum_sha256,
            ])),
            'audit' => ['retained' => true, 'audioStored' => false],
        ]);
    }
}
