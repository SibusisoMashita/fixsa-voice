<?php

namespace Database\Factories;

use App\Models\Area;
use App\Models\Report;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Report>
 */
class ReportFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'reference' => sprintf('FSA-2026-%04d', fake()->unique()->numberBetween(2000, 9999)),
            'area_id' => Area::factory(),
            'source' => 'text',
            'category' => 'water_leak',
            'status' => 'reported',
            'priority' => 'routine',
            'severity' => 'moderate',
            'description' => fake()->sentence(10),
            'address' => fake()->streetAddress(),
            'public_address' => 'Approximate location',
            'landmark' => fake()->streetName(),
            'latitude' => fake()->latitude(-26.3, -25.7),
            'longitude' => fake()->longitude(27.8, 28.4),
            'location_precision' => 'approximate',
            'people_affected' => fake()->numberBetween(1, 200),
            'hazard_flags' => [],
            'audio_retention' => 'not_recorded',
            'synthetic' => true,
            'sla_due_at' => now()->addHours(72),
        ];
    }

    public function resolved(): static
    {
        return $this->state(fn (): array => [
            'status' => 'resolved',
            'resolved_at' => now(),
            'lock_version' => 2,
        ]);
    }
}
