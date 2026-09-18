<?php

namespace Tests\Feature;

use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PrivacyAndAuthTest extends TestCase
{
    use LazilyRefreshDatabase;

    private function report(): Report
    {
        $report = Report::factory()->create([
            'reference' => 'FSA-2026-1837', 'source' => 'text', 'category' => 'pothole',
            'status' => 'triaged', 'priority' => 'priority', 'severity' => 'high', 'description' => 'Deep pothole.',
            'address' => 'Republic Road', 'latitude' => -26.0991, 'longitude' => 28.0067, 'people_affected' => 120,
        ]);
        $report->notes()->create(['visibility' => 'public', 'body' => 'Reviewed in triage.']);
        $report->notes()->create(['visibility' => 'internal', 'body' => 'Private operator note.']);
        $report->transcriptSegments()->create(['sequence' => 1, 'speaker' => 'resident', 'text' => 'Private transcript text.']);

        return $report;
    }

    public function test_public_resource_excludes_internal_notes_and_transcripts(): void
    {
        $this->report();
        $response = $this->getJson('/api/v1/reports/FSA-2026-1837')->assertOk()->assertJsonMissing(['Private operator note.'])->assertJsonMissing(['Private transcript text.']);
        $this->assertArrayNotHasKey('internalNotes', $response->json('data'));
        $this->assertArrayNotHasKey('transcript', $response->json('data'));
    }

    public function test_operator_resource_requires_authentication_and_uses_optimistic_locking(): void
    {
        $report = $this->report();
        $this->get("/api/v1/operator/reports/{$report->id}")->assertUnauthorized();
        $this->getJson("/api/v1/operator/reports/{$report->id}")->assertUnauthorized();

        $user = User::factory()->create(['role' => 'operator', 'is_active' => true]);
        Sanctum::actingAs($user, ['reports:read', 'reports:write']);
        $this->getJson("/api/v1/operator/reports/{$report->id}")
            ->assertOk()->assertJsonPath('data.internalNotes.0', 'Private operator note.')->assertJsonPath('data.transcript.0.text', 'Private transcript text.');

        $this->withHeader('Idempotency-Key', 'status-001')->postJson("/api/v1/operator/reports/{$report->id}/status", [
            'status' => 'assigned', 'note' => 'Assigned to Roads Team 1.', 'public' => true, 'lock_version' => 99,
        ])->assertUnprocessable();
        $this->assertDatabaseHas('reports', ['id' => $report->id, 'status' => 'triaged']);
    }

    public function test_returns_403_for_an_inactive_operator(): void
    {
        $report = $this->report();
        $user = User::factory()->create(['role' => 'operator', 'is_active' => false]);
        Sanctum::actingAs($user, ['reports:read']);

        $this->getJson("/api/v1/operator/reports/{$report->id}")
            ->assertForbidden()
            ->assertJsonPath('message', 'An active operator account is required.');
    }

    public function test_valid_operator_transition_updates_status_and_audit_history(): void
    {
        $report = $this->report();
        $user = User::factory()->create(['role' => 'operator', 'is_active' => true]);
        Sanctum::actingAs($user, ['reports:read', 'reports:write']);

        $this->withHeader('Idempotency-Key', 'status-valid-001')->postJson("/api/v1/operator/reports/{$report->id}/status", [
            'status' => 'assigned', 'note' => 'Assigned to Roads Team 1.', 'public' => true, 'lock_version' => 1,
        ])->assertOk()->assertJsonPath('data.status', 'assigned')->assertJsonPath('data.lockVersion', 2);

        $this->assertDatabaseHas('reports', ['id' => $report->id, 'status' => 'assigned', 'lock_version' => 2]);
        $this->assertDatabaseHas('status_events', ['report_id' => $report->id, 'from_status' => 'triaged', 'to_status' => 'assigned']);
        $this->assertDatabaseHas('audit_events', ['auditable_id' => $report->id, 'event' => 'report.status_changed']);
    }
}
