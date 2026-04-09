<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'customer_id',
        'order_number',
        'customer_name',
        'customer_phone',
        'customer_email',
        'order_type',
        'delivery_address',
        'subtotal',
        'discount',
        'total',
        'total_amount',
        'status',
        'is_locked',
        'special_instructions',
        'notes',
        'payment_status',
        'payment_method',
        'payment_receipt_path',
    ];

    protected $casts = [
        'is_locked' => 'boolean',
        'total_amount' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    /**
     * Get the customer that owns the order
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the order items
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Check if order can be deleted by customer
     */
    public function canBeDeletedByCustomer(): bool
    {
        return $this->status === 'pending' && !$this->is_locked;
    }

    /**
     * Check if order can be edited
     */
    public function canBeEdited(): bool
    {
        return !$this->is_locked;
    }

    /**
     * Lock the order when status changes from pending
     */
    public function updateStatus(string $newStatus): bool
    {
        // If moving from pending to any other status, lock the order
        if ($this->status === 'pending' && $newStatus !== 'pending') {
            $this->is_locked = true;
        }

        $this->status = $newStatus;
        return $this->save();
    }

    /**
     * Get status badge color for frontend
     */
    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            'pending' => 'warning',
            'preparing' => 'info',
            'ready' => 'primary',
            'completed' => 'success',
            default => 'secondary'
        };
    }
}
