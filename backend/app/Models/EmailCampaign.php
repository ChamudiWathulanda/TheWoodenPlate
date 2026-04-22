<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmailCampaign extends Model
{
    protected $fillable = [
        'subject',
        'heading',
        'body',
        'cta_label',
        'cta_url',
        'status',
        'total_recipients',
        'sent_count',
        'failed_count',
        'queued_at',
        'sent_at',
        'created_by',
    ];

    protected $casts = [
        'queued_at' => 'datetime',
        'sent_at' => 'datetime',
    ];

    public function logs(): HasMany
    {
        return $this->hasMany(EmailCampaignLog::class, 'campaign_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
