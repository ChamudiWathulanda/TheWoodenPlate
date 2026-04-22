<?php

namespace App\Mail;

use App\Models\EmailCampaign;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NewsletterCampaignMail extends Mailable
{
    use Queueable, SerializesModels;

    public EmailCampaign $campaign;

    /**
     * Create a new message instance.
     */
    public function __construct(EmailCampaign $campaign)
    {
        $this->campaign = $campaign;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject($this->campaign->subject)
            ->view('emails.newsletter-campaign');
    }
}
