<?php

namespace App\Http\Requests;

use App\Enums\ResolutionOutcome;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VerifyResolutionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'outcome' => ['required', Rule::enum(ResolutionOutcome::class)],
            'statement' => ['required', 'string', 'min:3', 'max:500'],
            'method' => ['required', Rule::in(['voice', 'text', 'judge_demo'])],
        ];
    }
}
