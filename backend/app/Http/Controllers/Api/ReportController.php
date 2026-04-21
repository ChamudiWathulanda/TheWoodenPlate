<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Customer;
use App\Models\Promotion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Get dashboard KPIs
     */
    public function kpis(Request $request): JsonResponse
    {
        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

        // Total Revenue
        $totalRevenue = Order::whereBetween('created_at', [$startDate, $endDate])
            ->whereIn('status', ['preparing', 'ready', 'completed'])
            ->sum('total_amount');

        // Total Orders
        $totalOrders = Order::whereBetween('created_at', [$startDate, $endDate])->count();

        // Average Order Value
        $avgOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;

        // Completion Rate
        $completedOrders = Order::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->count();
        $completionRate = $totalOrders > 0 ? ($completedOrders / $totalOrders) * 100 : 0;

        // Total Discount (from promotions)
        $totalDiscount = Order::whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('promotion_id')
            ->sum('discount');

        // New Customers
        $newCustomers = Customer::whereBetween('created_at', [$startDate, $endDate])->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_revenue' => round($totalRevenue, 2),
                'total_orders' => $totalOrders,
                'avg_order_value' => round($avgOrderValue, 2),
                'completion_rate' => round($completionRate, 2),
                'total_discount' => round($totalDiscount, 2),
                'new_customers' => $newCustomers,
            ]
        ]);
    }

    /**
     * Get sales summary with trends
     */
    public function salesSummary(Request $request): JsonResponse
    {
        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());
        $groupBy = $request->input('group_by', 'day'); // day or month

        $dateFormat = $groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';

        $salesTrend = Order::whereBetween('created_at', [$startDate, $endDate])
            ->whereIn('status', ['preparing', 'ready', 'completed'])
            ->select(
                DB::raw("DATE_FORMAT(created_at, '{$dateFormat}') as period"),
                DB::raw('COUNT(*) as orders_count'),
                DB::raw('SUM(total_amount) as revenue'),
                DB::raw('COALESCE(SUM(discount), 0) as discount'),
                DB::raw('AVG(total_amount) as avg_order_value')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $salesTrend
        ]);
    }

    /**
     * Get order status breakdown
     */
    public function orderStatus(Request $request): JsonResponse
    {
        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

        // Status counts
        $statusBreakdown = Order::whereBetween('created_at', [$startDate, $endDate])
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get();

        // Daily completed vs cancelled
        $dailyTrend = Order::whereBetween('created_at', [$startDate, $endDate])
            ->whereIn('status', ['completed', 'cancelled'])
            ->select(
                DB::raw("DATE(created_at) as date"),
                'status',
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('date', 'status')
            ->orderBy('date')
            ->get();

        // Peak day
        $peakDay = Order::whereBetween('created_at', [$startDate, $endDate])
            ->select(DB::raw("DATE(created_at) as date"), DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->orderByDesc('count')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'status_breakdown' => $statusBreakdown,
                'daily_trend' => $dailyTrend,
                'peak_day' => $peakDay,
            ]
        ]);
    }

    /**
     * Get top products report
     */
    public function topProducts(Request $request): JsonResponse
    {
        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());
        $limit = $request->input('limit', 10);

        // Best selling by quantity
        $bestSellingQty = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->whereIn('orders.status', ['preparing', 'ready', 'completed'])
            ->select(
                'products.id',
                'products.name',
                DB::raw('SUM(order_items.quantity) as total_quantity'),
                DB::raw('SUM(order_items.subtotal) as total_revenue'),
                DB::raw('MAX(orders.created_at) as last_ordered')
            )
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_quantity')
            ->limit($limit)
            ->get();

        // Highest revenue
        $highestRevenue = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->whereIn('orders.status', ['preparing', 'ready', 'completed'])
            ->select(
                'products.id',
                'products.name',
                DB::raw('SUM(order_items.quantity) as total_quantity'),
                DB::raw('SUM(order_items.subtotal) as total_revenue'),
                DB::raw('MAX(orders.created_at) as last_ordered')
            )
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_revenue')
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'best_selling_qty' => $bestSellingQty,
                'highest_revenue' => $highestRevenue,
            ]
        ]);
    }

    /**
     * Get promotions report
     */
    public function promotions(Request $request): JsonResponse
    {
        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

        // Total discount given
        $totalDiscount = Order::whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('promotion_id')
            ->sum('discount');

        // Total promo usage
        $totalUsage = Order::whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('promotion_id')
            ->count();

        // Revenue with vs without promos
        $revenueWithPromos = Order::whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('promotion_id')
            ->sum('total_amount');

        $revenueWithoutPromos = Order::whereBetween('created_at', [$startDate, $endDate])
            ->whereNull('promotion_id')
            ->sum('total_amount');

        // Promo performance
        $promoPerformance = Order::join('promotions', 'orders.promotion_id', '=', 'promotions.id')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->select(
                'promotions.id',
                'promotions.title',
                'promotions.is_active',
                DB::raw('COUNT(*) as usage_count'),
                DB::raw('SUM(orders.discount) as total_discount'),
                DB::raw('SUM(orders.total_amount) as revenue_generated')
            )
            ->groupBy('promotions.id', 'promotions.title', 'promotions.is_active')
            ->orderByDesc('usage_count')
            ->get();

        // Best performing promo
        $bestPromo = $promoPerformance->first();

        return response()->json([
            'success' => true,
            'data' => [
                'total_discount' => round($totalDiscount, 2),
                'total_usage' => $totalUsage,
                'revenue_with_promos' => round($revenueWithPromos, 2),
                'revenue_without_promos' => round($revenueWithoutPromos, 2),
                'promo_performance' => $promoPerformance,
                'best_promo' => $bestPromo,
            ]
        ]);
    }

    /**
     * Get customers report
     */
    public function customers(Request $request): JsonResponse
    {
        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

        // New customers
        $newCustomers = Customer::whereBetween('created_at', [$startDate, $endDate])->count();

        // Repeat customers (those with more than 1 order)
        $repeatCustomers = Customer::whereIn('id', function ($query) {
            $query->select('customer_id')
                ->from('orders')
                ->whereNotNull('customer_id')
                ->groupBy('customer_id')
                ->havingRaw('COUNT(*) > 1');
        })->count();

        // Top customers by spend
        $topCustomers = Customer::join('orders', 'customers.id', '=', 'orders.customer_id')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->select(
                'customers.id',
                'customers.name',
                'customers.email',
                DB::raw('COUNT(orders.id) as total_orders'),
                DB::raw('SUM(orders.total_amount) as total_spent')
            )
            ->groupBy('customers.id', 'customers.name', 'customers.email')
            ->orderByDesc('total_spent')
            ->limit(10)
            ->get();

        // Customer growth trend
        $growthTrend = Customer::whereBetween('created_at', [$startDate, $endDate])
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                DB::raw('COUNT(*) as new_customers')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'new_customers' => $newCustomers,
                'repeat_customers' => $repeatCustomers,
                'top_customers' => $topCustomers,
                'growth_trend' => $growthTrend,
            ]
        ]);
    }
}
