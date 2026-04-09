<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OrderPreparingMail extends Mailable
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
        $this->subjectLine = 'Your Order Is Now Being Prepared - The Wooden Plate';
        $this->heading = 'Order Is Being Prepared';
        $this->accentColor = '#f59e0b';
        $this->statusLabel = 'Preparing';
        $this->introText = 'Our kitchen has started preparing your order. Everything is moving along and your items are now in progress.';
        $this->closingText = 'We will send another update as soon as your order is ready.';
        $this->estimatedTimeLabel = 'Estimated Time';
        $this->estimatedTimeValue = $this->resolveEstimatedTime($order);
        $this->highlightTitle = 'What Happens Next';
        $this->highlightBody = 'Your order is currently being prepared. Please keep an eye on your email for the ready notification.';
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

    private function resolveEstimatedTime(Order $order): string
    {
        return match ($order->order_type) {
            'delivery' => '30-45 minutes',
            'takeaway' => '15-25 minutes',
            'dine-in' => '20-30 minutes',
            default => '15-30 minutes',
        };
    }
}
