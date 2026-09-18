<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class ReportCreationTest extends TestCase
{
    use LazilyRefreshDatabase;

    private function payload(): array
    {
        return [
            'source' => 'voice',
            'category' => 'water_leak',
            'priority' => 'urgent',
            'severity' => 'high',
            'details' => 'Large water leak reported by jane@example.com near the clinic.',
            'duration' => 'Since yesterday',
            'hazards' => ['Road flooding'],
            'people_affected' => 80,
            'location' => [
                'address' => '12 Tamboti Road',
                'area' => 'Ivory Park',
                'landmark' => 'Local clinic',
                'latitude' => -25.9979,
                'longitude' => 28.1907,
                'precision' => 'confirmed',
            ],
            'transcript' => [['speaker' => 'resident', 'text' => 'Call me on 082 123 4567 about the flooding.', 'final' => true]],
        ];
    }

    public function test_report_creation_is_atomic_redacted_and_idempotent(): void
    {
        $first = $this->withHeader('Idempotency-Key', 'report-create-001')->postJson('/api/v1/reports', $this->payload());

        $first->assertCreated()
            ->assertJsonPath('data.reference', 'FSA-2026-1000')
            ->assertJsonPath('data.fields.location.address', 'Local clinic')
            ->assertJsonPath('data.fields.location.latitude', -25.998)
            ->assertJsonPath('data.fields.details', 'Large water leak reported by [EMAIL REDACTED] near the clinic.');
        $this->assertDatabaseCount('reports', 1);
        $this->assertDatabaseHas('reports', ['address' => '12 Tamboti Road', 'public_address' => 'Local clinic']);
        $this->assertDatabaseHas('transcript_segments', ['text' => 'Call me on [PHONE REDACTED] about the flooding.']);
        $this->assertDatabaseHas('audit_events', ['event' => 'report.created']);
        $this->assertDatabaseHas('status_events', ['to_status' => 'reported', 'is_public' => true]);

        $replay = $this->withHeader('Idempotency-Key', 'report-create-001')->postJson('/api/v1/reports', $this->payload());
        $replay->assertCreated()->assertHeader('Idempotent-Replay', 'true')->assertJsonPath('data.reference', 'FSA-2026-1000');
        $this->assertDatabaseCount('reports', 1);
    }

    public function test_reusing_a_key_with_different_input_is_rejected(): void
    {
        $this->withHeader('Idempotency-Key', 'report-create-002')->postJson('/api/v1/reports', $this->payload())->assertCreated();
        $changed = array_replace($this->payload(), ['details' => 'A different valid report description.']);

        $this->withHeader('Idempotency-Key', 'report-create-002')->postJson('/api/v1/reports', $changed)->assertConflict();
    }

    public function test_returns_400_when_idempotency_key_is_missing(): void
    {
        $this->postJson('/api/v1/reports', $this->payload())
            ->assertBadRequest()
            ->assertJsonPath('message', 'A valid Idempotency-Key header is required.');

        $this->assertDatabaseCount('reports', 0);
    }

    public function test_returns_422_when_required_report_fields_are_missing(): void
    {
        $this->withHeader('Idempotency-Key', 'report-create-invalid')->postJson('/api/v1/reports', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['source', 'category', 'priority', 'severity', 'details', 'location']);

        $this->assertDatabaseCount('reports', 0);
    }
}
