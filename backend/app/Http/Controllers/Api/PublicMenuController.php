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
        $promotions = Promotion::where('is_active', true)
            ->where(function ($query) use ($now) {
                // Either no start time, or start time has passed
                $query->whereNull('starts_at')
                    ->orWhere('starts_at', '<=', $now);
            })
            ->where(function ($query) use ($now) {
                // Either no end time, or end time has not passed
                $query->whereNull('ends_at')
                    ->orWhere('ends_at', '>=', $now);
            })
            ->orderByDesc('created_at')
            ->get();

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
