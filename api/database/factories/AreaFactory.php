<?php

namespace Database\Factories;

use App\Models\Area;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Area>
 */
class AreaFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $name = fake()->unique()->city();

        return [
            'slug' => Str::slug($name),
            'name' => $name,
            'municipality' => 'Synthetic Metropolitan Municipality',
            'province' => 'Gauteng',
            'centroid_latitude' => fake()->latitude(-26.3, -25.7),
            'centroid_longitude' => fake()->longitude(27.8, 28.4),
        ];
    }
}
