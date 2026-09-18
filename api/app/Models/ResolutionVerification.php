<?php

namespace App\Models;

use App\Enums\ResolutionOutcome;
use App\Enums\ResolutionState;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class ResolutionVerification extends Model
{
    use HasUlids;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'outcome' => ResolutionOutcome::class,
            'state' => ResolutionState::class,
            'verified_at' => 'datetime',
            'superseded_at' => 'datetime',
        ];
    }
}
