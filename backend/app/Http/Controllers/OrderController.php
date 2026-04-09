<?php

namespace App\Http\Controllers;

use App\Mail\OrderPlacedMail;
use App\Mail\OrderPreparingMail;
use App\Mail\OrderReadyMail;
use App\Mail\OrderCompletedMail;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderStatusRequest;

class OrderController extends Controller
{
    /**
     * Customer: Get their orders
     */
    public function customerIndex(Request $request)
    {
        $customerId = $request->user('sanctum')?->id;

        if (!$customerId) {
            return response()->json(['message' => 'Customer profile not found'], 404);
        }

        $orders = Order::with(['items.product', 'customer'])
            ->where('customer_id', $customerId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($orders);
    }

    /**
     * Customer: Create a new order
     */
    public function store(StoreOrderRequest $request)
    {
        DB::beginTransaction();

        try {
            // Calculate total amount
            $totalAmount = 0;
            $orderItemsData = [];

            foreach ($request->items as $item) {
                $product = Product::findOrFail($item['product_id']);
                $subtotal = $product->price * $item['quantity'];
                $totalAmount += $subtotal;

                $orderItemsData[] = [
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'price' => $product->price,
                    'subtotal' => $subtotal
                ];
            }

            // Create order
            $order = Order::create([
                'customer_id' => $request->customer_id,
                'total_amount' => $totalAmount,
                'status' => 'pending',
                'is_locked' => false,
                'notes' => $request->notes
            ]);

            // Create order items
            foreach ($orderItemsData as $itemData) {
                $order->items()->create($itemData);
            }

            DB::commit();

            $order = $order->load(['items.product', 'customer']);
            $this->sendOrderPlacedEmail($order);

            return response()->json([
                'message' => 'Order placed successfully',
                'order' => $order
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single order details
     */
    public function show($id, Request $request)
    {
        $order = Order::with(['items.product', 'customer'])->findOrFail($id);

        $user = $request->user('sanctum');

        if ($user instanceof Customer && $order->customer_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($order);
    }

    /**
     * Customer: Delete their order (only if pending and not locked)
     */
    public function destroy($id, Request $request)
    {
        $order = Order::findOrFail($id);

        // Verify ownership
        $customerId = $request->user('sanctum')?->id;
        if ($order->customer_id !== $customerId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if can be deleted
        if (!$order->canBeDeletedByCustomer()) {
            return response()->json([
                'message' => 'Cannot delete this order. Only pending orders can be deleted.'
            ], 400);
        }

        $order->delete();

        return response()->json(['message' => 'Order deleted successfully']);
    }

    /**
     * Admin: Get all orders
     */
    public function adminIndex(Request $request)
    {
        $query = Order::with(['items.product', 'customer']);

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $orders = $query->orderBy('created_at', 'desc')->get();

        return response()->json($orders);
    }

    /**
     * Admin: Update order status (and lock if needed)
     */
    public function updateStatus(UpdateOrderStatusRequest $request, $id)
    {
        $order = Order::with(['items.product', 'customer'])->findOrFail($id);
        $previousStatus = $order->status;

        // Use the updateStatus method which handles locking
        $order->updateStatus($request->status);

        if ($previousStatus !== $request->status) {
            $this->sendStatusUpdateEmail($order->fresh(['items.product', 'customer']), $request->status);
        }

        return response()->json([
            'message' => 'Order status updated successfully',
            'order' => $order->load(['items.product', 'customer'])
        ]);
    }

    /**
     * Admin: Update payment status
     */
    public function updatePaymentStatus(Request $request, $id)
    {
        $request->validate([
            'payment_status' => 'required|in:pending,paid,failed,refunded',
        ]);

        $order = Order::findOrFail($id);
        $order->update(['payment_status' => $request->payment_status]);

        return response()->json([
            'message' => 'Payment status updated successfully',
            'order' => $order->load(['items.product', 'customer'])
        ]);
    }

    /**
     * Generate PDF invoice for an order
     */
    public function generateInvoice($id, Request $request)
    {
        $order = Order::with(['items.product', 'customer'])->findOrFail($id);

        $user = $request->user('sanctum');

        if ($user instanceof Customer && $order->customer_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $pdf = Pdf::loadView('invoices.order', compact('order'));

        return $pdf->download('invoice-' . ($order->order_number ?: $order->id) . '.pdf');
    }

    /**
     * Admin: Download uploaded payment receipt
     */
    public function downloadReceipt($id)
    {
        $order = Order::findOrFail($id);

        if (!$order->payment_receipt_path || !Storage::disk('public')->exists($order->payment_receipt_path)) {
            return response()->json([
                'message' => 'Receipt file not found'
            ], 404);
        }

        $absolutePath = Storage::disk('public')->path($order->payment_receipt_path);
        $extension = pathinfo($order->payment_receipt_path, PATHINFO_EXTENSION);
        $downloadName = 'order-' . ($order->order_number ?: $order->id) . '-receipt.' . $extension;

        return response()->download($absolutePath, $downloadName);
    }

    private function sendOrderCompletedEmail(Order $order): void
    {
        $this->sendMailNotification($order, new OrderCompletedMail($order), 'order completed');
    }

    private function sendOrderPlacedEmail(Order $order): void
    {
        $this->sendMailNotification($order, new OrderPlacedMail($order), 'order placed');
    }

    private function sendOrderPreparingEmail(Order $order): void
    {
        $this->sendMailNotification($order, new OrderPreparingMail($order), 'order preparing');
    }

    private function sendOrderReadyEmail(Order $order): void
    {
        $this->sendMailNotification($order, new OrderReadyMail($order), 'order ready');
    }

    private function sendStatusUpdateEmail(Order $order, string $status): void
    {
        match ($status) {
            'preparing' => $this->sendOrderPreparingEmail($order),
            'ready' => $this->sendOrderReadyEmail($order),
            'completed' => $this->sendOrderCompletedEmail($order),
            default => null,
        };
    }

    private function sendMailNotification(Order $order, $mailable, string $context): void
    {
        $recipient = $this->resolveNotificationEmail($order);

        if (!$recipient) {
            return;
        }

        try {
            Mail::to($recipient)->send($mailable);
        } catch (\Exception $e) {
            Log::error('Failed to send ' . $context . ' email: ' . $e->getMessage(), [
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
