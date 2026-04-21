<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\MenuItem;
use App\Models\Promotion;
use App\Models\Product;
use Illuminate\Http\Request;

class PublicMenuController extends Controller
{
    /**
     * Get all active categories
     */
    public function categories()
    {
        $categories = Category::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'image']);

        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }

    /**
     * Get menu items (with optional category filter)
     */
    public function menuItems(Request $request)
    {
        $query = MenuItem::with('category:id,name')
            ->where('is_available', true);

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Search by name
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $menuItems = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $menuItems
        ]);
    }

    /**
     * Get single menu item details
     */
    public function showMenuItem($id)
    {
        $menuItem = MenuItem::with('category')
            ->where('is_available', true)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $menuItem
        ]);
    }

    /**
     * Get featured/popular items
     */
    public function featuredItems()
    {
        $items = MenuItem::where('is_available', true)
            ->where('is_popular', true)
            ->with('category:id,name')
            ->limit(8)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $items
        ]);
    }

    /**
     * Get active promotions (valid now or upcoming)
     */
    public function promotions()
    {
        $now = now();
        $dayLabels = collect([
            'monday' => 'Monday',
            'tuesday' => 'Tuesday',
            'wednesday' => 'Wednesday',
            'thursday' => 'Thursday',
            'friday' => 'Friday',
            'saturday' => 'Saturday',
            'sunday' => 'Sunday',
        ]);
        $promotions = Promotion::where('is_active', true)
            ->where(function ($query) use ($now) {
                // Keep current promotions plus future ones, but hide expired offers.
                $query->whereNull('ends_at')
                    ->orWhere('ends_at', '>=', $now);
            })
            ->orderByRaw('CASE WHEN starts_at IS NULL OR starts_at <= ? THEN 0 ELSE 1 END', [$now])
            ->orderBy('starts_at')
            ->orderByDesc('created_at')
            ->get();

        $allTargetIds = $promotions
            ->pluck('target_ids')
            ->flatten()
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $categoryNames = Category::whereIn('id', $allTargetIds)->pluck('name', 'id');
        $menuItemNames = MenuItem::whereIn('id', $allTargetIds)->pluck('name', 'id');

        $promotions->transform(function (Promotion $promotion) use ($now, $dayLabels, $categoryNames, $menuItemNames) {
            $startAt = $promotion->starts_at;
            $endAt = $promotion->ends_at;
            $targetIds = collect($promotion->target_ids ?? [])->map(fn ($id) => (int) $id);
            $targetNames = $targetIds
                ->map(function (int $id) use ($promotion, $categoryNames, $menuItemNames) {
                    if ($promotion->target_type === 'categories') {
                        return $categoryNames->get($id);
                    }

                    return $menuItemNames->get($id);
                })
                ->filter()
                ->values();

            $offerSummary = match ($promotion->application_type) {
                'bxgy' => 'Buy ' . ($promotion->buy_quantity ?: 1) . ' and get ' . ($promotion->get_quantity ?: 1) . ' free',
                default => $promotion->type === 'fixed'
                    ? 'Save Rs. ' . number_format((float) $promotion->value, 2)
                    : 'Save ' . rtrim(rtrim(number_format((float) $promotion->value, 2), '0'), '.') . '%',
            };

            $targetSummary = match ($promotion->target_type) {
                'all' => $promotion->application_type === 'order' ? 'Applies to the full bill' : 'Applies to all menu items',
                'categories' => $targetNames->isNotEmpty()
                    ? 'Selected categories: ' . $targetNames->join(', ')
                    : 'Selected categories',
                default => $targetNames->isNotEmpty()
                    ? 'Selected items: ' . $targetNames->join(', ')
                    : 'Selected menu items',
            };

            $applicableDayLabels = collect($promotion->applicable_days ?? [])
                ->map(fn ($day) => $dayLabels->get($day, ucfirst((string) $day)))
                ->values();

            return array_merge($promotion->toArray(), [
                'availability_status' => !$startAt || $startAt->lte($now) ? 'active' : 'upcoming',
                'offer_summary' => $offerSummary,
                'target_names' => $targetNames,
                'target_summary' => $targetSummary,
                'application_label' => match ($promotion->application_type) {
                    'order' => 'Order level offer',
                    'item' => 'Item level offer',
                    default => 'Buy X Get Y offer',
                },
                'applicable_day_labels' => $applicableDayLabels,
                'schedule_summary' => !$startAt && !$endAt
                    ? 'Available until stocks last'
                    : trim(collect([
                        $startAt ? 'Starts ' . $startAt->format('M j, Y g:i A') : null,
                        $endAt ? 'Ends ' . $endAt->format('M j, Y g:i A') : null,
                    ])->filter()->join(' | ')),
            ]);
        });

        return response()->json([
            'success' => true,
            'data' => $promotions
        ]);
    }

    /**
     * Get new products
     */
    public function newProducts()
    {
        $products = Product::where('is_available', true)
            ->where('is_new', true)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }
}
