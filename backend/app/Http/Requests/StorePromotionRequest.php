<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePromotionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Admin authorization handled by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
         return [
            'title'       => 'required|string|max:255',
            'type'        => 'required|in:percentage,fixed',
            'value'       => 'required|numeric|min:0',
            'application_type' => 'required|in:order,item,bxgy',
            'target_type' => 'required|in:all,categories,menu_items',
            'target_ids' => 'nullable|array',
            'target_ids.*' => 'integer',
            'applicable_days' => 'nullable|array',
            'applicable_days.*' => 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
            'buy_quantity' => 'nullable|integer|min:1',
            'get_quantity' => 'nullable|integer|min:1',

            'starts_at'   => 'nullable|date',
            'ends_at'     => 'nullable|date|after_or_equal:starts_at',

            'is_active'   => 'nullable',
            'description' => 'nullable|string',
            'image'       => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ];
    }

    protected function prepareForValidation()
    {
        $this->merge([
            'is_active' => filter_var($this->is_active, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true,
            'target_ids' => $this->normalizeArrayInput($this->target_ids),
            'applicable_days' => $this->normalizeArrayInput($this->applicable_days),
        ]);
    }

     public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $applicationType = $this->input('application_type');
            $targetType = $this->input('target_type');
            $type = $this->input('type');
            $value = (float) $this->input('value');

            if ($type === 'percentage' && $value > 100) {
                $validator->errors()->add('value', 'Percentage value cannot be greater than 100.');
            }

            if ($applicationType === 'bxgy') {
                if (!$this->filled('buy_quantity') || !$this->filled('get_quantity')) {
                    $validator->errors()->add('buy_quantity', 'Buy X Get Y promotions require buy and free quantities.');
                }
            }

            if ($targetType !== 'all' && empty($this->input('target_ids', []))) {
                $validator->errors()->add('target_ids', 'Select at least one target for this promotion.');
            }
        });
    }

    private function normalizeArrayInput($value): array
    {
        if (is_array($value)) {
            return array_values(array_filter($value, fn ($item) => $item !== null && $item !== ''));
        }

        if (is_string($value) && $value !== '') {
            $decoded = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return array_values(array_filter($decoded, fn ($item) => $item !== null && $item !== ''));
            }
        }

        return [];
    }
}
