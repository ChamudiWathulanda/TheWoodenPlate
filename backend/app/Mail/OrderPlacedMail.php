<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OrderPlacedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $order;
    public $customerName;
    public $subjectLine;
    public $heading;
    public $accentColor;
    public $statusLabel;
    public $introText;
    public $closingText;
    public $items;
    public $estimatedTimeLabel;
    public $estimatedTimeValue;
    public $highlightTitle;
    public $highlightBody;

    public function __construct(Order $order)
    {
        $this->order = $order->loadMissing(['items.product', 'customer']);
        $this->customerName = $order->customer_name ?: ($order->customer->name ?? 'Valued Guest');
        $this->subjectLine = 'Order Confirmed Successfully - The Wooden Plate';
        $this->heading = 'Order Confirmed Successfully';
        $this->accentColor = '#22c55e';
        $this->statusLabel = 'Pending Preparation';
        $this->introText = 'Thank you for your order. We have received it successfully and our team will start processing it shortly.';
        $this->closingText = 'We will keep your order moving and prepare it as quickly as possible.';
        $this->estimatedTimeLabel = 'Next Update';
        $this->estimatedTimeValue = 'We will email you again when your order starts preparing.';
        $this->highlightTitle = 'Order Received';
        $this->highlightBody = 'Your order has been confirmed successfully and added to our queue.';
        $this->items = $this->order->items->map(function ($item) {
            return [
                'name' => $item->product->name ?? 'Menu Item',
                'quantity' => $item->quantity,
                'price' => $item->price,
                'subtotal' => $item->subtotal,
            ];
        });
    }

    public function build()
    {
        return $this->subject($this->subjectLine)
            ->view('emails.order-status');
    }
}
