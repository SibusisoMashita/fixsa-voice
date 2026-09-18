<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'source' => ['required', Rule::in(['voice', 'text', 'demo_scenario'])],
            'category' => ['required', Rule::in(['water_leak', 'pothole', 'electricity_fault', 'sewer_overflow', 'broken_streetlight', 'illegal_dumping', 'damaged_public_asset'])],
            'priority' => ['required', Rule::in(['routine', 'priority', 'urgent', 'emergency_hold'])],
            'severity' => ['required', Rule::in(['low', 'moderate', 'high', 'critical'])],
            'details' => ['required', 'string', 'min:10', 'max:4000'],
            'duration' => ['nullable', 'string', 'max:160'],
            'hazards' => ['array', 'max:12'],
            'hazards.*' => ['string', 'max:160'],
            'people_affected' => ['integer', 'min:0', 'max:10000000'],
            'safety_hold' => ['boolean'],
            'synthetic' => ['boolean'],
            'language' => ['nullable', 'string', 'max:16'],
            'channel' => ['nullable', 'string', 'max:32'],
            'location' => ['required', 'array'],
            'location.address' => ['required', 'string', 'min:3', 'max:255'],
            'location.area' => ['required', 'string', 'min:2', 'max:120'],
            'location.landmark' => ['nullable', 'string', 'max:255'],
            'location.latitude' => ['required', 'numeric', 'between:-90,90'],
            'location.longitude' => ['required', 'numeric', 'between:-180,180'],
            'location.precision' => ['required', Rule::in(['approximate', 'confirmed'])],
            'transcript' => ['array', 'max:100'],
            'transcript.*.speaker' => ['required', Rule::in(['resident', 'agent', 'system'])],
            'transcript.*.text' => ['required', 'string', 'max:4000'],
            'transcript.*.timestamp' => ['nullable', 'date'],
            'transcript.*.final' => ['boolean'],
        ];
    }
}
