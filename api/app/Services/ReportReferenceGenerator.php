<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

final class ReportReferenceGenerator
{
    public function next(?int $year = null): string
    {
        $year ??= now()->year;

        DB::table('report_sequences')->insertOrIgnore([
            'year' => $year,
            'next_value' => 1000,
            'updated_at' => now(),
        ]);

        $sequence = DB::table('report_sequences')->where('year', $year)->lockForUpdate()->firstOrFail();
        DB::table('report_sequences')->where('year', $year)->update([
            'next_value' => $sequence->next_value + 1,
            'updated_at' => now(),
        ]);

        return sprintf('FSA-%d-%04d', $year, $sequence->next_value);
    }
}
