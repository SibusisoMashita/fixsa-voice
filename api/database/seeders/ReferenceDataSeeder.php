<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReferenceDataSeeder extends Seeder
{
    public function run(): void
    {
        $targets = ['emergency_hold' => 60, 'urgent' => 240, 'priority' => 1440, 'routine' => 4320];
        $categories = ['water_leak', 'pothole', 'electricity_fault', 'sewer_overflow', 'broken_streetlight', 'illegal_dumping', 'damaged_public_asset'];

        foreach ($categories as $category) {
            foreach ($targets as $priority => $targetMinutes) {
                DB::table('sla_rules')->insertOrIgnore([
                    'id' => (string) Str::ulid(), 'category' => $category, 'priority' => $priority,
                    'target_minutes' => $targetMinutes, 'active_from' => '2026-01-01 00:00:00', 'active_to' => null,
                    'created_at' => now(), 'updated_at' => now(),
                ]);
            }
        }
    }
}
