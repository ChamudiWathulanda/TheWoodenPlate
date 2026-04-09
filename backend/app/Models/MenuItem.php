<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MenuItem extends Model
{
    protected $fillable = [
        'product_id',
        'category_id',
        'name',
        'price',
        'image',
        'description',
        'is_available',
        'is_popular'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_available' => 'boolean',
        'is_popular' => 'boolean'
    ];

    /**
     * Get the category that owns the menu item
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
