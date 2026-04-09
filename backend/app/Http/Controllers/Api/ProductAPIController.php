<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\MenuItem;
use App\Models\Product;
use Illuminate\Http\Request;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ProductAPIController extends Controller
{
    // GET /api/products?search=...&category=...&available=1&featured=1&new=1
    public function index(Request $request)
    {
        try {
            $query = Product::query();

            if ($request->filled('search')) {
                $s = $request->string('search')->toString();
                $query->where(function ($q) use ($s) {
                    $q->where('name', 'like', "%{$s}%")
                      ->orWhere('description', 'like', "%{$s}%");
                });
            }

            if ($request->filled('category')) {
                $query->where('category', $request->category);
            }

            if ($request->filled('available')) {
                $available = filter_var($request->available, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                if ($available !== null) $query->where('is_available', $available);
            }

            if ($request->filled('featured')) {
                $featured = filter_var($request->featured, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                if ($featured !== null) $query->where('is_featured', $featured);
            }

            if ($request->filled('new')) {
                $isNew = filter_var($request->new, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                if ($isNew !== null) $query->where('is_new', $isNew);
            }

            $products = $query->orderByDesc('created_at')->paginate(10);

            return response()->json([
                'success' => true,
                'data' => $products
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load products.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    // POST /api/products
    public function store(StoreProductRequest $request)
    {
        try {
            $data = $request->validated();

            // Handle file upload
            if ($request->hasFile('image')) {
                $path = $request->file('image')->store('products', 'public');
                $data['image'] = $path;
            }

            $product = Product::create($data);
            $this->syncMenuItem($product);

            return response()->json([
                'success' => true,
                'message' => 'Product created successfully.',
                'data' => $product
            ], 201);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create product.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    // GET /api/products/{product}
    public function show(Product $product)
    {
        return response()->json([
            'success' => true,
            'data' => $product
        ]);
    }

    // PUT/PATCH /api/products/{product}
    public function update(UpdateProductRequest $request, Product $product)
    {
        try {
            $data = $request->validated();

            // Handle file upload
            if ($request->hasFile('image')) {
                // Delete old image if exists
                if ($product->image && Storage::disk('public')->exists($product->image)) {
                    Storage::disk('public')->delete($product->image);
                }
                $path = $request->file('image')->store('products', 'public');
                $data['image'] = $path;
            }

            $product->update($data);
            $product->refresh();
            $this->syncMenuItem($product);

            return response()->json([
                'success' => true,
                'message' => 'Product updated successfully.',
                'data' => $product
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update product.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    // DELETE /api/products/{product}
    public function destroy(Product $product)
    {
        try {
            $linkedMenuItem = $this->canSyncMenuItems()
                ? MenuItem::where('product_id', $product->id)->first()
                : null;

            // Delete image if exists
            if ($product->image && Storage::disk('public')->exists($product->image)) {
                Storage::disk('public')->delete($product->image);
            }

            $product->delete();
            $linkedMenuItem?->delete();

            return response()->json([
                'success' => true,
                'message' => 'Product deleted successfully.'
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete product.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    private function syncMenuItem(Product $product): void
    {
        if (!$this->canSyncMenuItems()) {
            return;
        }

        $menuItem = MenuItem::firstOrNew(['product_id' => $product->id]);

        if (!$product->is_available) {
            if ($menuItem->exists) {
                $menuItem->update(['is_available' => false]);
            }

            return;
        }

        $categoryId = $this->resolveCategoryId($product->category);
        if (!$categoryId) {
            return;
        }

        $menuItem->fill([
            'category_id' => $categoryId,
            'name' => $product->name,
            'price' => $product->price,
            'image' => $product->image,
            'description' => $product->description,
            'is_available' => true,
        ]);

        if (!$menuItem->exists) {
            $menuItem->product_id = $product->id;
        }

        $menuItem->save();
    }

    private function resolveCategoryId(?string $categoryName): ?int
    {
        if (!$categoryName) {
            return null;
        }

        return Category::query()
            ->whereRaw('LOWER(name) = ?', [mb_strtolower(trim($categoryName))])
            ->value('id');
    }

    private function canSyncMenuItems(): bool
    {
        return Schema::hasTable('menu_items') && Schema::hasColumn('menu_items', 'product_id');
    }
}
