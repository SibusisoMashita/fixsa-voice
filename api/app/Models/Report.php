<?php

namespace App\Models;

use App\Enums\ReportStatus;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Report extends Model
{
    use HasFactory, HasUlids;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'status' => ReportStatus::class,
            'hazard_flags' => 'array',
            'metadata' => 'array',
            'safety_hold' => 'boolean',
            'synthetic' => 'boolean',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'sla_due_at' => 'datetime',
            'resolved_at' => 'datetime',
            'verified_at' => 'datetime',
        ];
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function transcriptSegments(): HasMany
    {
        return $this->hasMany(TranscriptSegment::class)->orderBy('sequence');
    }

    public function evidence(): HasMany
    {
        return $this->hasMany(Evidence::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(ReportNote::class);
    }

    public function statusEvents(): HasMany
    {
        return $this->hasMany(StatusEvent::class)->orderBy('occurred_at');
    }

    public function resolutionVerifications(): HasMany
    {
        return $this->hasMany(ResolutionVerification::class)->latest('created_at');
    }

    public function currentResolutionVerification(): HasOne
    {
        return $this->hasOne(ResolutionVerification::class)->whereNull('superseded_at')->latestOfMany();
    }

    public function duplicateOf(): BelongsTo
    {
        return $this->belongsTo(self::class, 'duplicate_of_id');
    }
}
