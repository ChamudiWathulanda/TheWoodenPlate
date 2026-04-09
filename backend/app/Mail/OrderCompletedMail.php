<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OrderCompletedMail extends Mailable
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
        $this->subjectLine = 'Your Order Has Been Completed - The Wooden Plate';
        $this->heading = 'Order Completed';
        $this->accentColor = '#2563eb';
        $this->statusLabel = 'Completed';
        $this->introText = 'Good news. Your order has been marked as completed by our team.';
        $this->closingText = 'Thank you for choosing The Wooden Plate. We hope to serve you again soon.';
        $this->estimatedTimeLabel = 'Status';
        $this->estimatedTimeValue = 'Completed successfully';
        $this->highlightTitle = 'Order Finished';
        $this->highlightBody = 'If you need any help with this order, please contact our team and share your order number.';
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
