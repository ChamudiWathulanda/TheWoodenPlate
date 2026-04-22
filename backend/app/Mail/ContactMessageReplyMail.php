<?php

namespace App\Mail;

use App\Models\ContactMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ContactMessageReplyMail extends Mailable
{
    use Queueable, SerializesModels;

    public ContactMessage $contactMessage;
    public string $replyBody;
    public string $subjectLine;

    /**
     * Create a new message instance.
     */
    public function __construct(ContactMessage $contactMessage, string $replyBody, string $subjectLine)
    {
        $this->contactMessage = $contactMessage;
        $this->replyBody = $replyBody;
        $this->subjectLine = $subjectLine;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject($this->subjectLine)
            ->view('emails.contact-message-reply');
    }
}
