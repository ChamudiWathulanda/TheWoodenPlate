<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Promotion extends Model
{
    protected $fillable = [
        'title',
        'type',
        'value',
        'application_type',
        'target_type',
        'target_ids',
        'applicable_days',
        'buy_quantity',
        'get_quantity',
        'starts_at',
        'ends_at',
        'is_active',
        'description',
        'image',
    ];
    protected $casts = [
        'is_active' => 'boolean',
        'starts_at' => 'datetime',
        'ends_at'   => 'datetime',
        'target_ids' => 'array',
        'applicable_days' => 'array',
    ];
}
