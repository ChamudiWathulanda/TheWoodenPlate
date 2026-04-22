<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Customer;
use App\Models\Ingredient;
use App\Models\NewsletterSubscriber;
use App\Models\Order;
use App\Models\Promotion;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class AdminNotificationController extends Controller
{
    public function index(): JsonResponse
    {
        $now = now();
        $cutoff = $now->copy()->subDays(30);

        $notifications = collect()
            ->merge($this->recentOrderNotifications())
            ->merge($this->recentCustomerNotifications())
            ->merge($this->recentReservationNotifications())
            ->merge($this->recentContactMessageNotifications())
            ->merge($this->recentNewsletterNotifications())
            ->merge($this->expiredPromotionNotifications($cutoff))
            ->merge($this->lowStockNotifications());

        $items = $notifications
            ->sortByDesc(fn (array $item) => Carbon::parse($item['created_at'])->timestamp)
            ->take(20)
            ->values()
            ->all();

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $items,
                'generated_at' => $now->toIso8601String(),
                'counts' => [
                    'orders' => Order::where('status', 'pending')->count(),
                    'reservations' => Reservation::where('status', 'pending')->count(),
                    'messages' => ContactMessage::whereNull('replied_at')->count(),
                    'newsletter' => NewsletterSubscriber::where('is_active', true)->count(),
                    'low_stock' => Ingredient::active()->lowStock()->count(),
                    'expired_promotions' => Promotion::whereNotNull('ends_at')
                        ->where('ends_at', '<=', $now)
                        ->count(),
                ],
            ],
        ]);
    }

    private function recentOrderNotifications(): Collection
    {
        return Order::query()
            ->latest()
            ->take(6)
            ->get()
            ->map(function (Order $order) {
                return [
                    'id' => 'order-' . $order->id,
                    'type' => 'new_order',
                    'severity' => 'info',
                    'title' => 'New order received',
                    'message' => sprintf(
                        '%s placed order %s for Rs. %s.',
                        $order->customer_name ?: 'A customer',
                        $order->order_number ?: '#' . $order->id,
                        number_format((float) ($order->total ?? $order->total_amount ?? 0), 2)
                    ),
                    'link' => '/admin/orders/view/' . $order->id,
                    'created_at' => optional($order->created_at)->toIso8601String(),
                ];
            });
    }

    private function recentCustomerNotifications(): Collection
    {
        return Customer::query()
            ->where('email', 'not like', 'guest+%@example.com')
            ->latest()
            ->take(6)
            ->get()
            ->map(function (Customer $customer) {
                return [
                    'id' => 'customer-' . $customer->id,
                    'type' => 'new_customer',
                    'severity' => 'success',
                    'title' => 'New customer registered',
                    'message' => sprintf(
                        '%s joined with %s.',
                        $customer->name,
                        $customer->email
                    ),
                    'link' => '/admin/customers/view/' . $customer->id,
                    'created_at' => optional($customer->created_at)->toIso8601String(),
                ];
            });
    }

    private function recentReservationNotifications(): Collection
    {
        return Reservation::query()
            ->with(['customer', 'table'])
            ->latest()
            ->take(6)
            ->get()
            ->map(function (Reservation $reservation) {
                $customerName = $reservation->customer?->name ?: 'A customer';
                $tableName = $reservation->table ? ('table ' . $reservation->table->table_number) : 'a table';

                return [
                    'id' => 'reservation-' . $reservation->id,
                    'type' => 'new_reservation',
                    'severity' => $reservation->status === 'pending' ? 'warning' : 'info',
                    'title' => 'New reservation request',
                    'message' => sprintf(
                        '%s requested %s on %s.',
                        $customerName,
                        $tableName,
                        optional($reservation->reservation_date)->format('M d, Y')
                    ),
                    'link' => '/admin/reservations',
                    'created_at' => optional($reservation->created_at)->toIso8601String(),
                ];
            });
    }

    private function recentContactMessageNotifications(): Collection
    {
        return ContactMessage::query()
            ->latest()
            ->take(6)
            ->get()
            ->map(function (ContactMessage $contactMessage) {
                $isPendingReply = !$contactMessage->replied_at;

                return [
                    'id' => 'contact-message-' . $contactMessage->id,
                    'type' => 'contact_message',
                    'severity' => $isPendingReply ? 'warning' : 'info',
                    'title' => $isPendingReply ? 'New contact message' : 'Contact message replied',
                    'message' => sprintf(
                        '%s sent a message from %s.',
                        $contactMessage->name,
                        $contactMessage->email
                    ),
                    'link' => '/admin/contact-messages/' . $contactMessage->id,
                    'created_at' => optional($contactMessage->created_at)->toIso8601String(),
                ];
            });
    }

    private function recentNewsletterNotifications(): Collection
    {
        return NewsletterSubscriber::query()
            ->latest()
            ->take(6)
            ->get()
            ->map(function (NewsletterSubscriber $subscriber) {
                return [
                    'id' => 'newsletter-subscriber-' . $subscriber->id,
                    'type' => 'newsletter_subscriber',
                    'severity' => $subscriber->is_active ? 'success' : 'info',
                    'title' => $subscriber->is_active ? 'New newsletter subscriber' : 'Newsletter subscriber updated',
                    'message' => sprintf(
                        '%s %s the newsletter list.',
                        $subscriber->email,
                        $subscriber->is_active ? 'joined' : 'left'
                    ),
                    'link' => '/admin/newsletter',
                    'created_at' => optional($subscriber->updated_at ?? $subscriber->created_at)->toIso8601String(),
                ];
            });
    }

    private function expiredPromotionNotifications(Carbon $cutoff): Collection
    {
        return Promotion::query()
            ->whereNotNull('ends_at')
            ->whereBetween('ends_at', [$cutoff, now()])
            ->orderByDesc('ends_at')
            ->take(6)
            ->get()
            ->map(function (Promotion $promotion) {
                return [
                    'id' => 'promotion-expired-' . $promotion->id,
                    'type' => 'promotion_expired',
                    'severity' => 'warning',
                    'title' => 'Promotion expired',
                    'message' => sprintf(
                        '%s expired on %s.',
                        $promotion->title,
                        optional($promotion->ends_at)->format('M d, Y h:i A')
                    ),
                    'link' => '/admin/promotions',
                    'created_at' => optional($promotion->ends_at)->toIso8601String(),
                ];
            });
    }

    private function lowStockNotifications(): Collection
    {
        return Ingredient::query()
            ->active()
            ->lowStock()
            ->orderBy('current_stock')
            ->take(6)
            ->get()
            ->map(function (Ingredient $ingredient) {
                return [
                    'id' => 'ingredient-low-stock-' . $ingredient->id,
                    'type' => 'low_stock',
                    'severity' => 'danger',
                    'title' => 'Low stock alert',
                    'message' => sprintf(
                        '%s is low: %s %s left (reorder at %s %s).',
                        $ingredient->name,
                        rtrim(rtrim((string) $ingredient->current_stock, '0'), '.'),
                        $ingredient->unit,
                        rtrim(rtrim((string) $ingredient->reorder_level, '0'), '.'),
                        $ingredient->unit
                    ),
                    'link' => '/admin/ingredients',
                    'created_at' => optional($ingredient->updated_at ?? $ingredient->created_at)->toIso8601String(),
                ];
            });
    }
}
