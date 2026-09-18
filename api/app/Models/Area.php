<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Area extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = ['slug', 'name', 'municipality', 'province', 'centroid_latitude', 'centroid_longitude'];

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }
}
