<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ContactMessageReplyMail;
use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactMessageController extends Controller
{
    public function index()
    {
        $messages = ContactMessage::with('repliedBy:id,name,email')
            ->latest()
            ->get();

        return response()->json([
            'data' => $messages,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'message' => 'required|string|max:5000',
        ]);

        $message = ContactMessage::create($validated);

        return response()->json([
            'message' => 'Your message has been sent successfully.',
            'data' => $message,
        ], 201);
    }

    public function show(string $id)
    {
        $message = ContactMessage::with('repliedBy:id,name,email')->findOrFail($id);

        if (!$message->is_read) {
            $message->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
            $message->refresh();
        }

        return response()->json([
            'data' => $message,
        ]);
    }

    public function reply(Request $request, string $id)
    {
        $validated = $request->validate([
            'reply_subject' => 'nullable|string|max:255',
            'reply_message' => 'required|string|max:5000',
        ]);

        $message = ContactMessage::findOrFail($id);
        $admin = $request->user('sanctum');
        $subject = $validated['reply_subject'] ?: 'Reply from The Wooden Plate';

        Mail::to($message->email)->send(
            new ContactMessageReplyMail($message, $validated['reply_message'], $subject)
        );

        $message->update([
            'is_read' => true,
            'read_at' => $message->read_at ?: now(),
            'reply_subject' => $subject,
            'reply_message' => $validated['reply_message'],
            'replied_at' => now(),
            'replied_by' => $admin?->id,
        ]);

        return response()->json([
            'message' => 'Reply sent successfully.',
            'data' => $message->load('repliedBy:id,name,email'),
        ]);
    }
}
