import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { CartProvider } from './customer/context/CartContext.jsx'
import { WishlistProvider } from './customer/context/WishlistContext.jsx'
import { CustomerAuthProvider } from './contexts/CustomerAuthContext.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'

// Customer Pages (Public)
import HomePage from './customer/pages/HomePage.jsx'
import AboutPage from './customer/pages/AboutPage.jsx'
import MenuPage from './customer/pages/MenuPage.jsx'
import CartPage from './customer/pages/CartPage.jsx'
import GalleryPage from './customer/pages/GalleryPage.jsx'
import ReservationPage from './customer/pages/ReservationPage.jsx'
import ContactPage from './customer/pages/ContactPage.jsx'
import WishlistPage from './customer/pages/WishlistPage.jsx'
// Customer Auth Pages
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import MyOrdersPage from './pages/MyOrdersPage.jsx'

// Admin Pages
import AdminLogin from './admin/pages/AdminLogin.jsx'
import AdminDashboard from './admin/pages/AdminDashboard.jsx'

// Customer Management (Admin)
import CustomerList from './admin/pages/customers/CustomerList.jsx'
import CreateCustomer from './admin/pages/customers/CreateCustomer.jsx'
import EditCustomer from './admin/pages/customers/EditCustomer.jsx'
import ViewCustomer from './admin/pages/customers/ViewCustomer.jsx'

// Order Pages
import OrderList from './admin/pages/orders/OrderList.jsx'
import ViewOrder from './admin/pages/orders/ViewOrder.jsx'
import CheckoutPage from './customer/pages/CheckoutPage.jsx'

// Product Pages
import ProductList from './admin/pages/products/ProductList.jsx'
import CreateProduct from './admin/pages/products/CreateProduct.jsx'
import EditProduct from './admin/pages/products/EditProduct.jsx'
import ViewProduct from './admin/pages/products/ViewProduct.jsx'

// Promotion Pages
import PromotionList from './admin/pages/promotions/PromotionList.jsx'
import CreatePromotion from './admin/pages/promotions/CreatePromotion.jsx'
import EditPromotion from './admin/pages/promotions/EditPromotion.jsx'
import ViewPromotion from './admin/pages/promotions/ViewPromotion.jsx'

// Category Pages
import CategoryList from './admin/pages/categories/CategoryList.jsx'
import CreateCategory from './admin/pages/categories/CreateCategory.jsx'
import EditCategory from './admin/pages/categories/EditCategory.jsx'
import ViewCategory from './admin/pages/categories/ViewCategory.jsx'

// Menu Item Pages
import MenuItemList from './admin/pages/menu-items/MenuItemList.jsx'
import CreateMenuItem from './admin/pages/menu-items/CreateMenuItem.jsx'
import EditMenuItem from './admin/pages/menu-items/EditMenuItem.jsx'
import ViewMenuItem from './admin/pages/menu-items/ViewMenuItem.jsx'

// Table Pages
import TableList from './admin/pages/tables/TableList.jsx'
import CreateTable from './admin/pages/tables/CreateTable.jsx'
import EditTable from './admin/pages/tables/EditTable.jsx'
import ViewTable from './admin/pages/tables/ViewTable.jsx'

// Reservation Pages
import ReservationList from './admin/pages/reservations/ReservationList.jsx'

// Reports Pages
import Reports from './admin/pages/reports/Reports.jsx'

// Inventory Pages
import InventoryDashboard from './admin/pages/inventory/InventoryDashboard.jsx'
import IngredientList from './admin/pages/ingredients/IngredientList.jsx'
import CreateIngredient from './admin/pages/ingredients/CreateIngredient.jsx'
import EditIngredient from './admin/pages/ingredients/EditIngredient.jsx'
import StockMovementList from './admin/pages/stock-movements/StockMovementList.jsx'

// Settings Pages
import SettingsList from './admin/pages/settings/SettingsList.jsx'
import CreateSetting from './admin/pages/settings/CreateSetting.jsx'
import EditSetting from './admin/pages/settings/EditSetting.jsx'
import ViewSetting from './admin/pages/settings/ViewSetting.jsx'

// Gallery Pages (Admin)
import GalleryList from './admin/pages/gallery/GalleryList.jsx'
import {
  AdminGuestRoute,
  AdminOnlyRoute,
  CustomerGuestRoute,
  CustomerOnlyRoute,
} from './routes/RouteGuards.jsx'

import CustomerLayout from './customer/layout/customerLayout.jsx'

function App() {
  return (
    <CustomerAuthProvider>
      <CartProvider>
        <WishlistProvider>
          <ScrollToTop />
          <Toaster
          position="top-center"
          gutter={10}
          containerStyle={{
            top: 88,
            left: 0,
            right: 0,
            zIndex: 999999,
          }}
          toastOptions={{
            duration: 3000,
            style: {
              background: "#111827",
              color: "#fff",
              borderRadius: "12px",
              padding: "12px 14px",
              boxShadow:
                "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
            },
            success: {
              style: { background: "#16a34a" },
              iconTheme: { primary: "#fff", secondary: "#16a34a" },
            },
            error: {
              style: { background: "#dc2626" },
              iconTheme: { primary: "#fff", secondary: "#dc2626" },
            },
          }}
        />
          <Routes>
           {/* Customer Routes */}
           <Route
                path="/"
                element={
                  <CustomerLayout>
                    <HomePage />
                  </CustomerLayout>
                }
              />

              <Route
                path="/menu"
                element={
                  <CustomerLayout>
                    <MenuPage />
                  </CustomerLayout>
                }
              />

              <Route
                path="/about"
                element={
                  <CustomerLayout>
                    <AboutPage />
                  </CustomerLayout>
                }
              />

              <Route
                path="/gallery"
                element={
                  <CustomerLayout>
                    <GalleryPage />
                  </CustomerLayout>
                }
              />

              <Route
                path="/reservation"
                element={<ReservationPage />}
              />

              <Route
                path="/contact"
                element={
                  <CustomerLayout>
                    <ContactPage />
                  </CustomerLayout>
                }
              />

              <Route
                path="/cart"
                element={<CartPage />}
              />

              <Route
                path="/wishlist"
                element={<WishlistPage />}
              />

            <Route element={<CustomerGuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route element={<CustomerOnlyRoute />}>
              <Route path="/my-orders" element={<MyOrdersPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
            </Route>
            









        
        {/* Admin Routes */}
        <Route element={<AdminGuestRoute />}>
          <Route path="/admin/login" element={<AdminLogin />} />
        </Route>

        <Route element={<AdminOnlyRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        
          {/* Customer Routes */}
          <Route path="/admin/customers" element={<CustomerList />} />
          <Route path="/admin/customers/create" element={<CreateCustomer />} />
          <Route path="/admin/customers/edit/:id" element={<EditCustomer />} />
          <Route path="/admin/customers/view/:id" element={<ViewCustomer />} />
          
          {/* Order Routes */}
          <Route path="/admin/orders" element={<OrderList />} />
          <Route path="/admin/orders/view/:id" element={<ViewOrder />} />
          
          {/* Product Routes */}
          <Route path="/admin/products" element={<ProductList />} />
          <Route path="/admin/products/create" element={<CreateProduct />} />
          <Route path="/admin/products/edit/:id" element={<EditProduct />} />
          <Route path="/admin/products/view/:id" element={<ViewProduct />} />
          
          {/* Promotion Routes */}
          <Route path="/admin/promotions" element={<PromotionList />} />
          <Route path="/admin/promotions/create" element={<CreatePromotion />} />
          <Route path="/admin/promotions/edit/:id" element={<EditPromotion />} />
          <Route path="/admin/promotions/view/:id" element={<ViewPromotion />} />
          
          {/* Category Routes */}
          <Route path="/admin/categories" element={<CategoryList />} />
          <Route path="/admin/categories/create" element={<CreateCategory />} />
          <Route path="/admin/categories/:id/edit" element={<EditCategory />} />
          <Route path="/admin/categories/:id" element={<ViewCategory />} />
          
          {/* Menu Item Routes */}
          <Route path="/admin/menu-items" element={<MenuItemList />} />
          <Route path="/admin/menu-items/create" element={<CreateMenuItem />} />
          <Route path="/admin/menu-items/:id/edit" element={<EditMenuItem />} />
          <Route path="/admin/menu-items/:id" element={<ViewMenuItem />} />
          
          {/* Table Routes */}
          <Route path="/admin/tables" element={<TableList />} />
          <Route path="/admin/tables/create" element={<CreateTable />} />
          <Route path="/admin/tables/:id" element={<ViewTable />} />
          <Route path="/admin/tables/:id/edit" element={<EditTable />} />
          
          {/* Reservation Routes */}
          <Route path="/admin/reservations" element={<ReservationList />} />
          
          {/* Inventory Routes */}
          <Route path="/admin/inventory" element={<InventoryDashboard />} />
          <Route path="/admin/ingredients" element={<IngredientList />} />
          <Route path="/admin/ingredients/create" element={<CreateIngredient />} />
          <Route path="/admin/ingredients/:id/edit" element={<EditIngredient />} />
          <Route path="/admin/stock-movements" element={<StockMovementList />} />
          
          {/* Reports Routes */}
          <Route path="/admin/reports" element={<Reports />} />
          
          {/* Settings Routes */}
          <Route path="/admin/settings" element={<SettingsList />} />
          <Route path="/admin/settings/create" element={<CreateSetting />} />
          <Route path="/admin/settings/edit/:id" element={<EditSetting />} />
          <Route path="/admin/settings/view/:id" element={<ViewSetting />} />
          
          {/* Gallery Routes (Admin) */}
          <Route path="/admin/gallery" element={<GalleryList />} />
        </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </WishlistProvider>
      </CartProvider>
    </CustomerAuthProvider>
  )
}

export default App
