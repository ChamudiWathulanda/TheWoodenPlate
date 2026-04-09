<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\OrderPlacedMail;
use App\Models\Customer;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PublicOrderController extends Controller
{
    /**
     * Place a new order (guest checkout)
     */
    public function store(Request $request)
    {
        if (is_string($request->input('items'))) {
            $decodedItems = json_decode($request->input('items'), true);

            if (json_last_error() === JSON_ERROR_NONE && is_array($decodedItems)) {
                $request->merge(['items' => $decodedItems]);
            }
        }

        $validated = $request->validate([
            'customer_name' => ['required', 'string', 'min:2', 'max:100', 'regex:/^[\pL][\pL\s\'.-]*$/u'],
            'customer_phone' => ['required', 'regex:/^(?:\+94|0)\d{9}$/'],
            'customer_email' => 'nullable|email',
            'delivery_address' => 'required_if:order_type,delivery|nullable|string|min:10|max:255',
            'order_type' => 'required|in:dine-in,takeaway,delivery',
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'special_instructions' => 'nullable|string|max:500',
            'payment_method' => 'required|in:cash,card,online',
            'card_type' => 'nullable|required_if:payment_method,card|in:visa,mastercard,amex,discover,jcb,diners,other',
            'card_name' => 'nullable|required_if:payment_method,card|string|max:255',
            'card_number' => ['nullable', 'required_if:payment_method,card', 'regex:/^\d{4}\s\d{4}\s\d{4}\s?\d{1,7}$/'],
            'expiry_month' => ['nullable', 'required_if:payment_method,card', 'string', 'size:2', 'regex:/^(0[1-9]|1[0-2])$/'],
            'expiry_year' => ['nullable', 'required_if:payment_method,card', 'string', 'size:4', 'regex:/^\d{4}$/'],
            'cvv' => ['nullable', 'required_if:payment_method,card', 'regex:/^\d{3,4}$/'],
            'payment_receipt' => 'nullable|required_if:payment_method,online|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        DB::beginTransaction();
        try {
            $authenticatedCustomer = $request->user('sanctum');

            if ($authenticatedCustomer) {
                $customer = $authenticatedCustomer;
                $customer->fill([
                    'name' => $validated['customer_name'],
                    'phone' => $validated['customer_phone'],
                    'address' => $validated['delivery_address'] ?? $customer->address,
                ]);

                if (!empty($validated['customer_email'])) {
                    $customer->email = $validated['customer_email'];
                }

                $customer->save();
            } else {
                // Create or reuse a customer record for guest checkout.
                $email = $validated['customer_email'] ?? ('guest+' . Str::uuid() . '@example.com');

                $customer = Customer::firstOrCreate(
                    ['email' => $email],
                    [
                        'name' => $validated['customer_name'],
                        'phone' => $validated['customer_phone'],
                        'address' => $validated['delivery_address'] ?? null,
                    ]
                );
            }

            // Generate unique order number
            $orderNumber = 'ORD-' . strtoupper(Str::random(8));

            // Calculate totals
            $subtotal = 0;
            foreach ($validated['items'] as $item) {
                $subtotal += $item['price'] * $item['quantity'];
            }

            // Build notes for the order to store extra details (instructions and payment info)
            $notesParts = [];
            $notesParts[] = "Order Type: {$validated['order_type']}";
            if (!empty($validated['delivery_address'])) {
                $notesParts[] = "Delivery Address: {$validated['delivery_address']}";
            }
            if (!empty($validated['special_instructions'])) {
                $notesParts[] = "Special Instructions: {$validated['special_instructions']}";
            }
            if (!empty($validated['payment_method'])) {
                $notesParts[] = "Payment Method: {$validated['payment_method']}";
            }
            if (!empty($validated['card_type'])) {
                $cardTypeLabels = [
                    'visa' => 'Visa',
                    'mastercard' => 'MasterCard',
                    'amex' => 'American Express',
                    'discover' => 'Discover',
                    'jcb' => 'JCB',
                    'diners' => 'Diners Club',
                    'other' => 'Other'
                ];
                $cardTypeName = $cardTypeLabels[$validated['card_type']] ?? $validated['card_type'];
                $notesParts[] = "Card Type: {$cardTypeName}";
            }
            if (!empty($validated['card_number'])) {
                // Clean card number by removing spaces
                $cleanCardNumber = str_replace(' ', '', $validated['card_number']);
                // Mask card number for security
                $maskedCard = '**** **** **** ' . substr($cleanCardNumber, -4);
                $notesParts[] = "Card Number: {$maskedCard}";
            }
            if (!empty($validated['expiry_month']) && !empty($validated['expiry_year'])) {
                $notesParts[] = "Expiry: {$validated['expiry_month']}/{$validated['expiry_year']}";
            }
            if (!empty($validated['cvv'])) {
                $notesParts[] = "CVV: ***";
            }
            if ($request->hasFile('payment_receipt')) {
                $notesParts[] = "Online Payment Receipt: Uploaded";
            }

            $paymentReceiptPath = null;
            if ($request->hasFile('payment_receipt')) {
                $paymentReceiptPath = $request->file('payment_receipt')->store('order-receipts', 'public');
            }

            // Create order
            $order = Order::create([
                'customer_id' => $customer->id,
                'order_number' => $orderNumber,
                'customer_name' => $validated['customer_name'],
                'customer_phone' => $validated['customer_phone'],
                'customer_email' => $validated['customer_email'],
                'order_type' => $validated['order_type'],
                'delivery_address' => $validated['delivery_address'],
                'subtotal' => $subtotal,
                'discount' => 0,
                'total' => $subtotal,
                'total_amount' => $subtotal,
                'status' => 'pending',
                'is_locked' => false,
                'special_instructions' => $validated['special_instructions'],
                'payment_method' => $validated['payment_method'],
                'payment_status' => $validated['payment_method'] === 'card' ? 'paid' : 'pending',
                'payment_receipt_path' => $paymentReceiptPath,
                'notes' => implode("\n", $notesParts),
            ]);

            // Create order items
            foreach ($validated['items'] as $item) {
                $menuItem = MenuItem::findOrFail($item['menu_item_id']);

                $product = Product::firstOrCreate(
                    ['name' => $menuItem->name, 'price' => $menuItem->price],
                    [
                        'image' => $menuItem->image,
                        'description' => $menuItem->description,
                        'category' => $menuItem->category?->name ?? null,
                        'is_available' => $menuItem->is_available,
                    ]
                );

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'subtotal' => $item['price'] * $item['quantity'],
                ]);
            }

            DB::commit();

            $order->load(['items.product', 'customer']);
            $this->sendOrderPlacedEmail($order);

            return response()->json([
                'success' => true,
                'message' => 'Order placed successfully',
                'data' => [
                    'order_number' => $orderNumber,
                    'order_id' => $order->id,
                    'total' => $order->total,
                    'payment_status' => $order->payment_status,
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to place order: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Track order by order number
     */
    public function track($orderNumber)
    {
        $order = Order::with(['details.menuItem.category'])
            ->where('order_number', $orderNumber)
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'order_number' => $order->order_number,
                'customer_name' => $order->customer_name,
                'customer_phone' => $order->customer_phone,
                'order_type' => $order->order_type,
                'status' => $order->status,
                'subtotal' => $order->subtotal,
                'discount' => $order->discount,
                'total' => $order->total,
                'special_instructions' => $order->special_instructions,
                'items' => $order->details->map(function ($detail) {
                    return [
                        'name' => $detail->menuItem->name,
                        'category' => $detail->menuItem->category->name,
                        'quantity' => $detail->quantity,
                        'price' => $detail->price,
                        'subtotal' => $detail->quantity * $detail->price,
                    ];
                }),
                'created_at' => $order->created_at->format('Y-m-d H:i:s'),
                'estimated_time' => $this->getEstimatedTime($order->status),
            ]
        ]);
    }

    /**
     * Get estimated time based on status
     */
    private function getEstimatedTime($status)
    {
        $estimates = [
            'pending' => '15-20 minutes',
            'preparing' => '10-15 minutes',
            'ready' => 'Ready for pickup!',
            'completed' => 'Completed',
            'cancelled' => 'Cancelled',
        ];

        return $estimates[$status] ?? 'Processing...';
    }

    private function sendOrderPlacedEmail(Order $order): void
    {
        $recipient = $this->resolveNotificationEmail($order);

        if (!$recipient) {
            return;
        }

        try {
            Mail::to($recipient)->send(new OrderPlacedMail($order));
        } catch (\Exception $e) {
            Log::error('Failed to send order placed email: ' . $e->getMessage(), [
                'order_id' => $order->id,
                'recipient' => $recipient,
            ]);
        }
    }

    private function resolveNotificationEmail(Order $order): ?string
    {
        if (!empty($order->customer_email)) {
            return $order->customer_email;
        }

        $customerEmail = $order->customer?->email;

        if (!$customerEmail || str_ends_with($customerEmail, '@example.com')) {
            return null;
        }

        return $customerEmail;
    }
}
