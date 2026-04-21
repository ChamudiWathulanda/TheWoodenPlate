import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MenuItemTiltCard from "../components/MenuItemTiltCard";
import Footer from "../components/Footer";
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import CustomerAuthModal from '../components/CustomerAuthModal';

export default function MenuPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialCat = params.get("cat") || "all";

  const [activeCat, setActiveCat] = useState("all");
  const [q, setQ] = useState("");
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const { addItem } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();
  const { isAuthenticated } = useCustomerAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingWishlistItem, setPendingWishlistItem] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch categories
        const catRes = await fetch('http://localhost:8000/api/public/categories');
        if (!catRes.ok) throw new Error('Failed to fetch categories');
        const catData = await catRes.json();
        const cats = catData.data || [];
        const catsWithFullImage = cats.map(cat => ({
          ...cat,
          image: cat.image ? `http://localhost:8000/storage/${cat.image}` : null
        }));
        setCategories([{ id: 'all', name: 'All Items' }, ...catsWithFullImage]);

        // Fetch menu items
        const itemRes = await fetch('http://localhost:8000/api/public/menu-items');
        if (!itemRes.ok) throw new Error('Failed to fetch menu items');
        const itemData = await itemRes.json();
        const itemsWithFullImage = itemData.data.map(item => ({
          ...item,
          image: item.image ? `http://localhost:8000/storage/${item.image}` : null
        }));
        setMenuItems(itemsWithFullImage || []);
      } catch (error) {
        toast.error('Failed to load menu data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      const catExists = categories.some(c => c.id === initialCat || c.value === initialCat);
      setActiveCat(catExists ? initialCat : "all");
    }
  }, [categories, initialCat]);

  const filtered = useMemo(() => {
    let list = [...menuItems];
    if (activeCat !== "all") {
      list = list.filter((i) => i.category_id === activeCat || i.category?.id === activeCat);
    }
    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(t) ||
          i.description.toLowerCase().includes(t)
      );
    }
    return list;
  }, [activeCat, q, menuItems]);

  const handleWishlistToggle = (item) => {
    if (!isAuthenticated()) {
      setPendingWishlistItem(item);
      setShowAuthModal(true);
      return;
    }

    const added = toggleItem(item);
    toast.success(added ? `${item.name} added to wishlist` : `${item.name} removed from wishlist`);
  };

  return (
    <>
      <main className="min-h-screen bg-[#0F0A08] text-[#E7D2B6]">
        <section className="px-4 md:px-10 pt-14 pb-10">
          <div className="max-w-6xl mx-auto">
            {/* <div className="text-center">
              <h1 className="text-3xl md:text-5xl font-extrabold text-[#C98A5A]">
                Explore Our Menu
              </h1>
              <p className="mt-3 text-[#BFA58A] max-w-2xl mx-auto">
                Pick a category and discover your next favorite bite.
              </p>
            </div> */}

            {/* Search */}
            <div className="mt-10 max-w-2xl mx-auto">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search items..."
                className="w-full rounded-2xl border border-[#8B5A2B]/45 bg-black/25 px-5 py-4
                           text-[#E7D2B6] placeholder:text-[#BFA58A]/60
                           focus:outline-none focus:ring-2 focus:ring-[#C98A5A]/60"
              />
            </div>

            {/* Category tabs */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {categories.map((c) => {
                const catId = c.id || c.value;
                const catName = c.name || c.label;
                const active = catId === activeCat;
                return (
                  <button
                    key={catId}
                    onClick={() => setActiveCat(catId)}
                    className={`px-5 py-2.5 rounded-full border transition text-sm font-semibold
                      ${
                        active
                          ? "bg-[#C98A5A] text-[#0F0A08] border-[#C98A5A]"
                          : "bg-[#1A110D] text-[#E7D2B6] border-[#8B5A2B]/45 hover:border-[#C98A5A]/70"
                      }`}
                  >
                    {catName}
                  </button>
                );
              })}
            </div>

            {/* Items grid */}
            {loading ? (
              <div className="mt-10 text-center text-[#BFA58A]">Loading menu...</div>
            ) : (
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((item) => (
                  <MenuItemTiltCard
                    key={item.id}
                    item={item}
                    isWishlisted={isInWishlist(item.id)}
                    onToggleWishlist={() => handleWishlistToggle(item)}
                    onAddToCart={() => {
                      addItem(item);
                      toast.custom((t) => (
                        <div className="w-72 bg-[#f5cf89]/95 border border-[#C98A5A]/60 rounded-xl p-4 shadow-xl backdrop-blur-sm">
                          <div className="flex items-start gap-3">
                            {/* Item Image */}
                            <div className="relative flex-shrink-0">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-14 h-14 object-cover rounded-lg border border-[#0F0A08]/10"
                              />
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#0F0A08] rounded-full flex items-center justify-center text-xs font-bold text-[#F7F3EB]">
                                1
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 mb-1">
                                <span className="text-lg">✅</span>
                                <h4 className="text-sm font-bold text-[#0F0A08]">Added to Cart!</h4>
                              </div>
                              <p className="text-[#0F0A08] font-semibold text-sm truncate">{item.name}</p>
                              <p className="text-[#0F0A08]/70 text-xs">Rs. {item.price.toLocaleString()}</p>
                            </div>

                            {/* Close Button */}
                            <button
                              onClick={() => toast.dismiss(t.id)}
                              className="flex-shrink-0 text-[#0F0A08]/50 hover:text-[#0F0A08] transition-colors"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-3">
                            <button
                              className="flex-1 py-2 bg-[#1A110D] text-[#E7D2B6] rounded-lg font-semibold text-sm hover:bg-[#231A14] transition-colors duration-200"
                              onClick={() => {
                                toast.dismiss(t.id);
                                navigate('/cart');
                              }}
                            >
                              <span className="mr-1">🛒</span>
                              View Cart
                            </button>
                            <button
                              className="px-3 py-2 bg-transparent border border-[#1A110D] text-[#0F0A08] rounded-lg font-semibold text-sm hover:bg-[#1A110D]/10 transition-colors duration-200"
                              onClick={() => toast.dismiss(t.id)}
                            >
                              Continue
                            </button>
                          </div>
                        </div>
                      ), {
                        duration: 4000,
                        position: 'bottom-right'
                      });
                    }}
                  />
                ))}
              </div>
            )}

            {/* empty */}
            {!loading && !filtered.length && (
              <div className="mt-14 text-center text-[#BFA58A]">
                No items found for your filter.
              </div>
            )}
          </div>
        </section>
      </main>

      <CustomerAuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingWishlistItem(null);
        }}
        onSuccess={() => {
          if (pendingWishlistItem) {
            const added = toggleItem(pendingWishlistItem);
            toast.success(
              added
                ? `${pendingWishlistItem.name} added to wishlist`
                : `${pendingWishlistItem.name} removed from wishlist`
            );
          }
          setShowAuthModal(false);
          setPendingWishlistItem(null);
        }}
        title="Save to Wishlist"
        description="Log in or create an account to save your favorite dishes."
      />
      <Footer />
    </>
  );
}
