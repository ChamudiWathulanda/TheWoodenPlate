<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AdminAuthAPIController;
use App\Http\Controllers\Api\CustomerAPIController;
use App\Http\Controllers\Api\DetailsAPIController;
use App\Http\Controllers\Api\ProductAPIController;
use App\Http\Controllers\Api\PromotionAPIController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\MenuItemController;
use App\Http\Controllers\Api\TableController;
use App\Http\Controllers\Api\ReservationController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\IngredientController;
use App\Http\Controllers\Api\StockMovementController;
use App\Http\Controllers\Api\InventoryReportController;
use App\Http\Controllers\Api\PublicMenuController;
use App\Http\Controllers\Api\PublicOrderController;
use App\Http\Controllers\Api\GalleryController;
use App\Http\Controllers\CustomerAuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\OrderController;

// ============================================
// PUBLIC CUSTOMER API ROUTES (No Auth Required)
// ============================================
Route::prefix('public')->group(function () {
    // Customer Authentication
    Route::post('register', [CustomerAuthController::class, 'register']);
    Route::post('login', [CustomerAuthController::class, 'login']);
    Route::post('check-email', [CustomerAuthController::class, 'checkEmail']);
    Route::post('send-otp', [CustomerAuthController::class, 'sendOTP']);
    Route::post('verify-otp', [CustomerAuthController::class, 'verifyOTP']);

    // Menu & Categories
    Route::get('categories', [PublicMenuController::class, 'categories']);
    Route::get('menu-items', [PublicMenuController::class, 'menuItems']);
    Route::get('menu-items/{id}', [PublicMenuController::class, 'showMenuItem']);
    Route::get('featured-items', [PublicMenuController::class, 'featuredItems']);
    Route::get('promotions', [PublicMenuController::class, 'promotions']);
    Route::get('new-products', [PublicMenuController::class, 'newProducts']);

    // Orders (Guest Checkout)
    Route::post('orders', [PublicOrderController::class, 'store']);
    Route::get('orders/{orderNumber}', [PublicOrderController::class, 'track']);

    // Gallery (Public - active images only)
    Route::get('gallery', [GalleryController::class, 'publicIndex']);

    // Tables (Public - for reservation form)
    Route::get('tables', [TableController::class, 'publicIndex']);
    Route::get('tables/available', [TableController::class, 'publicAvailable']);

    // Reservations (Public - with customer auth token)
    Route::post('reservations', [ReservationController::class, 'publicStore']);
});

// ============================================
// PROTECTED CUSTOMER ROUTES (Auth Required)
// ============================================
Route::middleware('auth:sanctum')->prefix('customer')->group(function () {
    Route::post('logout', [CustomerAuthController::class, 'logout']);
    Route::get('me', [CustomerAuthController::class, 'me']);

    // Customer's Own Orders
    Route::post('orders', [PublicOrderController::class, 'store']);
    Route::get('orders', [OrderController::class, 'customerIndex']);
    Route::get('orders/{id}', [OrderController::class, 'show']);
});

// ============================================
// ADMIN API ROUTES (Auth Required)
// ============================================

Route::prefix('admin')->group(function () {
    Route::post('login', [AdminAuthAPIController::class, 'login'])->name('admin.login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AdminAuthAPIController::class, 'logout'])->name('admin.logout');
        Route::get('profile', [AdminAuthAPIController::class, 'profile'])->name('admin.profile');
        Route::put('profile', [AdminAuthAPIController::class, 'updateProfile'])->name('admin.updateProfile');

        // Dashboard
        Route::get('dashboard', function () {
            return response()->json(['message' => 'Welcome to Admin Dashboard']);
        })->name('admin.dashboard');

        // Customer Management (Admin CRUD)
        Route::apiResource('customers', CustomerController::class);

        // Shop Details Management
        Route::apiResource('details', DetailsAPIController::class);

        // Product Management
        Route::apiResource('products', ProductAPIController::class);

        // Promotion Management
        Route::apiResource('promotions', PromotionAPIController::class);

        // Category Management
        Route::apiResource('categories', CategoryController::class);

        // Menu Item Management
        Route::apiResource('menu-items', MenuItemController::class);

        // Table Management
        Route::apiResource('tables', TableController::class);
        Route::get('tables/available/check', [TableController::class, 'available'])->name('admin.tables.available');

        // Reservation Management - Admin
        Route::get('reservations', [ReservationController::class, 'adminIndex'])->name('admin.reservations.index');
        Route::patch('reservations/{id}/status', [ReservationController::class, 'updateStatus'])->name('admin.reservations.updateStatus');
        Route::get('reservations/pending/count', [ReservationController::class, 'pendingCount'])->name('admin.reservations.pendingCount');

        // Order Management - Admin
        Route::get('orders', [OrderController::class, 'adminIndex'])->name('admin.orders.index');
        Route::get('orders/{id}', [OrderController::class, 'show'])->name('admin.orders.show');
        Route::patch('orders/{id}/status', [OrderController::class, 'updateStatus'])->name('admin.orders.updateStatus');
        Route::patch('orders/{id}/payment-status', [OrderController::class, 'updatePaymentStatus'])->name('admin.orders.updatePaymentStatus');
        Route::get('orders/{id}/invoice', [OrderController::class, 'generateInvoice'])->name('admin.orders.invoice');
        Route::get('orders/{id}/receipt-download', [OrderController::class, 'downloadReceipt'])->name('admin.orders.downloadReceipt');

        // Reports
        Route::prefix('reports')->group(function () {
            Route::get('kpis', [ReportController::class, 'kpis'])->name('admin.reports.kpis');
            Route::get('sales-summary', [ReportController::class, 'salesSummary'])->name('admin.reports.salesSummary');
            Route::get('order-status', [ReportController::class, 'orderStatus'])->name('admin.reports.orderStatus');
            Route::get('top-products', [ReportController::class, 'topProducts'])->name('admin.reports.topProducts');
            Route::get('promotions', [ReportController::class, 'promotions'])->name('admin.reports.promotions');
            Route::get('customers', [ReportController::class, 'customers'])->name('admin.reports.customers');
        });

        // Gallery Management
        Route::apiResource('gallery', GalleryController::class);
        Route::patch('gallery/{id}/toggle-active', [GalleryController::class, 'toggleActive'])->name('admin.gallery.toggleActive');
    });
});

// Customer Order Routes (protected by auth)
Route::middleware('auth:sanctum')->group(function () {
    // Customer Orders
    Route::prefix('orders')->group(function () {
        Route::get('/', [OrderController::class, 'customerIndex'])->name('customer.orders.index');
        Route::post('/', [OrderController::class, 'store'])->name('customer.orders.store');
        Route::get('/{id}', [OrderController::class, 'show'])->name('customer.orders.show');
        Route::delete('/{id}', [OrderController::class, 'destroy'])->name('customer.orders.destroy');
        Route::get('/{id}/invoice', [OrderController::class, 'generateInvoice'])->name('orders.invoice');
    });

    // Customer Reservations
    Route::prefix('reservations')->group(function () {
        Route::get('/', [ReservationController::class, 'customerIndex'])->name('customer.reservations.index');
        Route::post('/', [ReservationController::class, 'store'])->name('customer.reservations.store');
        Route::get('/{id}', [ReservationController::class, 'show'])->name('customer.reservations.show');
        Route::post('/{id}/cancel', [ReservationController::class, 'cancel'])->name('customer.reservations.cancel');
    });

    // Available Tables (for customer booking)
    Route::get('tables/available', [TableController::class, 'available'])->name('customer.tables.available');
});

// Inventory Management Routes (Admin)
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    // Ingredients CRUD
    Route::apiResource('ingredients', IngredientController::class);
    Route::get('ingredients-low-stock', [IngredientController::class, 'lowStock'])->name('ingredients.low-stock');

    // Stock Movements (IN/OUT logging)
    Route::apiResource('stock-movements', StockMovementController::class)->except(['update']);
    Route::get('ingredients/{ingredient}/movements', [StockMovementController::class, 'recentMovements'])->name('ingredients.movements');

    // Inventory Reports
    Route::prefix('inventory-reports')->group(function () {
        Route::get('monthly-dashboard', [InventoryReportController::class, 'monthlyDashboard'])->name('inventory.monthly');
        Route::get('usage-analysis/{ingredientId}', [InventoryReportController::class, 'usageAnalysis'])->name('inventory.usage');
        Route::get('stock-valuation', [InventoryReportController::class, 'stockValuation'])->name('inventory.valuation');
        Route::get('purchase-suggestions', [InventoryReportController::class, 'purchaseSuggestions'])->name('inventory.suggestions');
    });
});
