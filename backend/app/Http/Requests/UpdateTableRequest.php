<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $table = $this->route('table');
        $tableId = is_object($table) ? $table->getKey() : $table;

        return [
            'table_number' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('tables', 'table_number')->ignore($tableId),
            ],
            'chair_count' => 'sometimes|required|integer|min:1|max:20',
            'is_active' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'table_number.required' => 'Table number is required',
            'table_number.unique' => 'This table number already exists',
            'chair_count.required' => 'Chair count is required',
            'chair_count.min' => 'Table must have at least 1 chair',
            'chair_count.max' => 'Chair count cannot exceed 20',
        ];
    }
}
