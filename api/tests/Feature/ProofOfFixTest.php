<?php

namespace Tests\Feature;

use App\Models\Report;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class ProofOfFixTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_a_disputed_fix_reopens_the_report_in_one_audited_transaction(): void
    {
        $report = Report::factory()->resolved()->create([
            'reference' => 'FSA-2026-1811', 'source' => 'voice', 'category' => 'broken_streetlight',
            'status' => 'resolved', 'priority' => 'routine', 'severity' => 'moderate', 'description' => 'Two lights remain off.',
            'address' => 'Makhado Avenue', 'latitude' => -25.9984, 'longitude' => 28.2252, 'location_precision' => 'confirmed',
            'people_affected' => 35, 'hazard_flags' => ['Poor visibility'], 'audio_retention' => 'ephemeral_deleted',
        ]);
        $report->resolutionVerifications()->create(['state' => 'pending', 'statement' => '', 'method' => 'text']);

        $response = $this->withHeader('Idempotency-Key', 'proof-001')->postJson('/api/v1/reports/FSA-2026-1811/verify-resolution', [
            'outcome' => 'not_fixed', 'statement' => 'The lights are still off. Contact me at resident@example.com.', 'method' => 'voice',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'in_progress')
            ->assertJsonPath('data.resolutionVerification.state', 'disputed')
            ->assertJsonPath('data.resolutionVerification.statement', 'The lights are still off. Contact me at [EMAIL REDACTED].');
        $this->assertDatabaseHas('reports', ['id' => $report->id, 'status' => 'in_progress', 'lock_version' => 3]);
        $this->assertDatabaseHas('status_events', ['report_id' => $report->id, 'from_status' => 'resolved', 'to_status' => 'in_progress']);
        $this->assertDatabaseHas('audit_events', ['auditable_id' => $report->id, 'event' => 'resolution.verified']);
    }

    public function test_non_resolved_report_cannot_be_verified(): void
    {
        Report::factory()->create([
            'reference' => 'FSA-2026-1900', 'source' => 'text', 'category' => 'water_leak',
            'status' => 'in_progress', 'priority' => 'urgent', 'severity' => 'high', 'description' => 'Leak in roadway.',
            'address' => 'Tamboti Road', 'latitude' => -25.9979, 'longitude' => 28.1907, 'people_affected' => 10,
        ]);

        $this->withHeader('Idempotency-Key', 'proof-002')->postJson('/api/v1/reports/FSA-2026-1900/verify-resolution', [
            'outcome' => 'fixed', 'statement' => 'It is fixed.', 'method' => 'text',
        ])->assertUnprocessable();
        $this->assertDatabaseCount('resolution_verifications', 0);
        $this->assertDatabaseCount('audit_events', 0);
    }

    public function test_a_confirmed_fix_stays_resolved_and_is_marked_verified(): void
    {
        $report = Report::factory()->resolved()->create(['reference' => 'FSA-2026-1911']);
        $report->resolutionVerifications()->create(['state' => 'pending', 'statement' => '', 'method' => 'text']);

        $this->withHeader('Idempotency-Key', 'proof-fixed-001')->postJson('/api/v1/reports/FSA-2026-1911/verify-resolution', [
            'outcome' => 'fixed', 'statement' => 'The repair is working tonight.', 'method' => 'text',
        ])->assertOk()->assertJsonPath('data.status', 'resolved')->assertJsonPath('data.resolutionVerification.state', 'verified');

        $this->assertDatabaseHas('reports', ['id' => $report->id, 'status' => 'resolved', 'lock_version' => 3]);
        $this->assertDatabaseHas('audit_events', ['auditable_id' => $report->id, 'event' => 'resolution.verified']);
    }
}
