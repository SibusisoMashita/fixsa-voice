<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class Evidence extends Model
{
    use HasUlids;

    protected $table = 'evidence';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['is_public' => 'boolean', 'captured_at' => 'datetime'];
    }
}
