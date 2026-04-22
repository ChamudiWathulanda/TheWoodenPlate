<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NewsletterSubscriber;
use Illuminate\Http\Request;

class NewsletterSubscriberController extends Controller
{
    public function index()
    {
        $subscribers = NewsletterSubscriber::query()
            ->latest()
            ->get();

        return response()->json([
            'data' => $subscribers,
        ]);
    }

    public function subscribe(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|max:255',
        ]);

        $subscriber = NewsletterSubscriber::query()->firstOrNew([
            'email' => strtolower(trim($validated['email'])),
        ]);

        $alreadyActive = $subscriber->exists && $subscriber->is_active;

        $subscriber->fill([
            'is_active' => true,
            'subscribed_at' => $subscriber->subscribed_at ?: now(),
            'unsubscribed_at' => null,
        ]);
        $subscriber->save();

        return response()->json([
            'message' => $alreadyActive
                ? 'This email is already subscribed to the newsletter.'
                : 'Subscribed to the newsletter successfully.',
            'data' => $subscriber,
        ], $alreadyActive ? 200 : 201);
    }

    public function toggleStatus(string $id)
    {
        $subscriber = NewsletterSubscriber::findOrFail($id);
        $nextActiveState = !$subscriber->is_active;

        $subscriber->update([
            'is_active' => $nextActiveState,
            'subscribed_at' => $nextActiveState ? ($subscriber->subscribed_at ?: now()) : $subscriber->subscribed_at,
            'unsubscribed_at' => $nextActiveState ? null : now(),
        ]);

        return response()->json([
            'message' => $nextActiveState
                ? 'Subscriber activated successfully.'
                : 'Subscriber deactivated successfully.',
            'data' => $subscriber,
        ]);
    }
}
