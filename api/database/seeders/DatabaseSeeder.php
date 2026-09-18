<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call(ReferenceDataSeeder::class);

        if (! app()->isProduction() || env('FIXSA_SEED_DEMO', false)) {
            $this->call(FixsaDemoSeeder::class);
        }
    }
}
