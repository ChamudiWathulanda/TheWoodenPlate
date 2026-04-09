<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OrderReadyMail extends Mailable
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
        $this->subjectLine = 'Your Order Is Ready - The Wooden Plate';
        $this->heading = 'Order Ready';
        $this->accentColor = '#10b981';
        $this->statusLabel = 'Ready';
        $this->introText = 'Your order is now ready. If this is a takeaway or dine-in order, you can collect it now. For delivery, our team will dispatch it shortly.';
        $this->closingText = 'Thank you for your patience. Your meal is almost with you.';
        $this->estimatedTimeLabel = 'Pickup / Dispatch';
        $this->estimatedTimeValue = $this->resolveReadyNote($order);
        $this->highlightTitle = 'Ready Update';
        $this->highlightBody = 'Please use your order number when collecting your order or when contacting us about delivery.';
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

    private function resolveReadyNote(Order $order): string
    {
        return match ($order->order_type) {
            'delivery' => 'Preparing for dispatch',
            'takeaway' => 'Ready for pickup now',
            'dine-in' => 'Ready to be served',
            default => 'Ready now',
        };
    }
}
