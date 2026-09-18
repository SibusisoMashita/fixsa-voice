<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class TranscriptSegment extends Model
{
    use HasUlids;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['spoken_at' => 'datetime', 'is_final' => 'boolean'];
    }
}
