<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Report;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class FixsaDemoSeeder extends Seeder
{
    public function run(): void
    {
        $operatorEmail = env('FIXSA_DEMO_OPERATOR_EMAIL');
        $operatorPassword = env('FIXSA_DEMO_OPERATOR_PASSWORD');
        if ($operatorEmail && $operatorPassword) {
            User::updateOrCreate(['email' => $operatorEmail], [
                'name' => 'FixSA Demo Operator', 'password' => Hash::make($operatorPassword), 'role' => 'operator', 'is_active' => true,
            ]);
        }

        $rows = [
            ['reference' => 'FSA-2026-1842', 'area' => 'Ivory Park', 'category' => 'water_leak', 'status' => 'in_progress', 'priority' => 'urgent', 'severity' => 'high', 'description' => 'Large clean-water leak crossing the road and flooding the lane nearest the clinic.', 'address' => 'Tamboti Road, near Ivory Park Clinic', 'landmark' => 'Ivory Park Clinic', 'lat' => -25.9979, 'lng' => 28.1907, 'people' => 80, 'hazards' => ['Road flooding', 'Slippery surface'], 'note' => 'A demo field team is assessing the affected lane.'],
            ['reference' => 'FSA-2026-1837', 'area' => 'Randburg', 'category' => 'pothole', 'status' => 'triaged', 'priority' => 'priority', 'severity' => 'high', 'description' => 'Deep pothole in the left lane near the taxi rank entrance; vehicles are swerving into oncoming traffic.', 'address' => 'Republic Road at Market Street', 'landmark' => 'Taxi rank entrance', 'lat' => -26.0991, 'lng' => 28.0067, 'people' => 120, 'hazards' => ['Vehicles swerving', 'Cyclist risk'], 'note' => 'Report has been reviewed in the synthetic triage queue.'],
            ['reference' => 'FSA-2026-1811', 'area' => 'Tembisa', 'category' => 'broken_streetlight', 'status' => 'resolved', 'priority' => 'routine', 'severity' => 'moderate', 'description' => 'Two streetlights outside the community hall were not switching on after dark.', 'address' => 'Makhado Avenue', 'landmark' => 'Community hall', 'lat' => -25.9984, 'lng' => 28.2252, 'people' => 35, 'hazards' => ['Poor visibility'], 'note' => 'Demo repair completed; awaiting resident confirmation.'],
            ['reference' => 'FSA-2026-1803', 'area' => 'Alexandra', 'category' => 'sewer_overflow', 'status' => 'assigned', 'priority' => 'urgent', 'severity' => 'critical', 'description' => 'Wastewater overflowing from a manhole near the primary school gate and running into the pedestrian path.', 'address' => 'Madalane Street', 'landmark' => 'Primary school gate', 'lat' => -26.1054, 'lng' => 28.0996, 'people' => 210, 'hazards' => ['Public health risk', 'Children nearby'], 'note' => 'Demo sanitation team assigned.'],
        ];

        foreach ($rows as $row) {
            $area = Area::firstOrCreate(['slug' => (string) str($row['area'])->slug()], ['name' => $row['area'], 'centroid_latitude' => $row['lat'], 'centroid_longitude' => $row['lng']]);
            $report = Report::updateOrCreate(['reference' => $row['reference']], [
                'area_id' => $area->id, 'source' => 'voice', 'category' => $row['category'], 'status' => $row['status'],
                'priority' => $row['priority'], 'severity' => $row['severity'], 'description' => $row['description'],
                'address' => $row['address'], 'public_address' => $row['address'], 'landmark' => $row['landmark'], 'latitude' => $row['lat'], 'longitude' => $row['lng'],
                'location_precision' => 'confirmed', 'people_affected' => $row['people'], 'hazard_flags' => $row['hazards'],
                'audio_retention' => 'ephemeral_deleted', 'synthetic' => true, 'sla_due_at' => now()->addHours($row['priority'] === 'urgent' ? 4 : ($row['priority'] === 'priority' ? 24 : 72)),
                'resolved_at' => $row['status'] === 'resolved' ? now() : null,
            ]);
            $report->notes()->firstOrCreate(['visibility' => 'public', 'body' => $row['note']]);
            $report->notes()->firstOrCreate(['visibility' => 'internal', 'body' => 'Synthetic hackathon record; not dispatched to a municipality.']);
            $report->statusEvents()->firstOrCreate(['to_status' => $row['status']], ['actor_type' => 'system', 'note' => $row['note'], 'is_public' => true, 'occurred_at' => now()]);
            if ($row['status'] === 'resolved') {
                $report->resolutionVerifications()->firstOrCreate(['state' => 'pending'], ['statement' => '', 'method' => 'judge_demo']);
            }
        }
    }
}
