<?php

namespace App\Jobs;

use App\Mail\NewsletterCampaignMail;
use App\Models\EmailCampaign;
use App\Models\EmailCampaignLog;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;

class SendNewsletterCampaignEmailJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $campaignId,
        public int $logId,
    ) {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $campaign = EmailCampaign::find($this->campaignId);
        $log = EmailCampaignLog::with('subscriber')->find($this->logId);

        if (!$campaign || !$log || !$log->subscriber || !$log->subscriber->is_active) {
            $this->markAsFailed($campaign, $log, 'Subscriber no longer active.');
            return;
        }

        try {
            Mail::to($log->email)->send(new NewsletterCampaignMail($campaign));

            $log->update([
                'status' => 'sent',
                'sent_at' => now(),
                'error_message' => null,
            ]);

            $campaign->increment('sent_count');
            $this->refreshCampaignStatus($campaign->fresh());
        } catch (\Throwable $exception) {
            $this->markAsFailed($campaign, $log, $exception->getMessage());
            throw $exception;
        }
    }

    public function failed(?\Throwable $exception): void
    {
        $campaign = EmailCampaign::find($this->campaignId);
        $log = EmailCampaignLog::find($this->logId);

        $this->markAsFailed($campaign, $log, $exception?->getMessage() ?: 'Queued email job failed.');
    }

    private function markAsFailed(?EmailCampaign $campaign, ?EmailCampaignLog $log, ?string $message): void
    {
        if ($log && $log->status !== 'sent' && $log->status !== 'failed') {
            $log->update([
                'status' => 'failed',
                'error_message' => $message,
            ]);
        }

        if ($campaign && $log && $log->status !== 'sent') {
            $campaign->increment('failed_count');
            $this->refreshCampaignStatus($campaign->fresh());
        }
    }

    private function refreshCampaignStatus(?EmailCampaign $campaign): void
    {
        if (!$campaign) {
            return;
        }

        $processed = $campaign->sent_count + $campaign->failed_count;
        if ($processed < $campaign->total_recipients) {
            $campaign->update(['status' => 'processing']);
            return;
        }

        $status = 'completed';
        if ($campaign->sent_count === 0 && $campaign->failed_count > 0) {
            $status = 'failed';
        } elseif ($campaign->failed_count > 0) {
            $status = 'completed_with_errors';
        }

        $campaign->update([
            'status' => $status,
            'sent_at' => now(),
        ]);
    }
}
