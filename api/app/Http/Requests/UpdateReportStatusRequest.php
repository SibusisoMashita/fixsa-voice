<?php

namespace App\Http\Requests;

use App\Enums\ReportStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateReportStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->is_active;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(ReportStatus::class)],
            'note' => ['required', 'string', 'min:3', 'max:1000'],
            'public' => ['required', 'boolean'],
            'lock_version' => ['required', 'integer', 'min:1'],
        ];
    }
}
