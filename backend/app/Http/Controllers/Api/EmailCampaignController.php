<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SendNewsletterCampaignEmailJob;
use App\Models\EmailCampaign;
use App\Models\EmailCampaignLog;
use App\Models\NewsletterSubscriber;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmailCampaignController extends Controller
{
    public function index()
    {
        $campaigns = EmailCampaign::with('creator:id,name,email')
            ->withCount([
                'logs as pending_logs_count' => fn ($query) => $query->where('status', 'pending'),
                'logs as sent_logs_count' => fn ($query) => $query->where('status', 'sent'),
                'logs as failed_logs_count' => fn ($query) => $query->where('status', 'failed'),
            ])
            ->latest()
            ->get();

        return response()->json([
            'data' => $campaigns,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'heading' => 'nullable|string|max:255',
            'body' => 'required|string|max:10000',
            'cta_label' => 'nullable|string|max:100',
            'cta_url' => 'nullable|url|max:500',
        ]);

        $subscribers = NewsletterSubscriber::query()
            ->where('is_active', true)
            ->orderBy('id')
            ->get(['id', 'email']);

        if ($subscribers->isEmpty()) {
            return response()->json([
                'message' => 'There are no active newsletter subscribers to send this campaign to.',
            ], 422);
        }

        $campaign = DB::transaction(function () use ($request, $validated, $subscribers) {
            $campaign = EmailCampaign::create([
                ...$validated,
                'status' => 'queued',
                'total_recipients' => $subscribers->count(),
                'queued_at' => now(),
                'created_by' => $request->user('sanctum')?->id,
            ]);

            $logs = $subscribers->map(function (NewsletterSubscriber $subscriber) use ($campaign) {
                return [
                    'campaign_id' => $campaign->id,
                    'subscriber_id' => $subscriber->id,
                    'email' => $subscriber->email,
                    'status' => 'pending',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            })->all();

            EmailCampaignLog::insert($logs);

            return $campaign;
        });

        EmailCampaignLog::query()
            ->where('campaign_id', $campaign->id)
            ->orderBy('id')
            ->get(['id'])
            ->each(function (EmailCampaignLog $log) use ($campaign) {
                SendNewsletterCampaignEmailJob::dispatch($campaign->id, $log->id);
            });

        return response()->json([
            'message' => 'Campaign queued successfully.',
            'data' => $campaign->load('creator:id,name,email'),
        ], 201);
    }

    public function show(string $id)
    {
        $campaign = EmailCampaign::with('creator:id,name,email')
            ->findOrFail($id);

        $logs = EmailCampaignLog::with('subscriber:id,email,is_active')
            ->where('campaign_id', $campaign->id)
            ->latest()
            ->get();

        return response()->json([
            'data' => [
                'campaign' => $campaign,
                'logs' => $logs,
            ],
        ]);
    }
}
