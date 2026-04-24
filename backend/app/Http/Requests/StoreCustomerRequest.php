<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => trim((string) $this->name),
            'email' => strtolower(trim((string) $this->email)),
            'phone' => $this->filled('phone') ? trim((string) $this->phone) : null,
            'address' => $this->filled('address') ? trim((string) $this->address) : null,
        ]);
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:255', "regex:/^[A-Za-z][A-Za-z\s'.-]*$/"],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:customers,email'],
            'phone' => ['nullable', 'string', 'max:20', 'unique:customers,phone', 'regex:/^(?:\+94|0)\d{9}$/'],
            'address' => 'nullable|string|max:500',
        ];
    }


    public function messages(): array
    {
        return [
            'name.required' => 'Customer name is required.',
            'name.min' => 'Customer name must be at least 2 characters.',
            'name.regex' => 'Customer name can only contain letters, spaces, apostrophes, dots, and hyphens.',
            'email.required' => 'Email is required.',
            'email.email' => 'Please enter a valid email address.',
            'email.unique' => 'This email is already used.',
            'phone.unique' => 'This phone number is already used.',
            'phone.regex' => 'Phone number must be like 07XXXXXXXX or +94XXXXXXXXX.',
            'address.max' => 'Address cannot exceed 500 characters.',
        ];
    }

}
