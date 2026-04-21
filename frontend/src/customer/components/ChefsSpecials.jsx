import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useCustomerAuth } from "../../contexts/CustomerAuthContext";
import WishlistButton from "./WishlistButton";
import CustomerAuthModal from "./CustomerAuthModal";

const ChefsSpecials = () => {
  const navigate = useNavigate();
  const [specials, setSpecials] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();
  const { isAuthenticated } = useCustomerAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingWishlistItem, setPendingWishlistItem] = useState(null);

  useEffect(() => {
    const fetchSpecials = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/public/featured-items");
        if (!res.ok) throw new Error("Failed to fetch chef specials");

        const data = await res.json();
        const items = (data.data || []).map((item) => ({
          ...item,
          desc: item.description || item.desc || "",
          image: item.image ? `/storage/${item.image}` : "https://via.placeholder.com/600x400?text=No+Image",
        }));

        setSpecials(items);
      } catch (error) {
        console.error("ChefsSpecials error:", error);
        setSpecials([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecials();
  }, []);

  const handleWishlistToggle = (item) => {
    if (!isAuthenticated()) {
      setPendingWishlistItem(item);
      setShowAuthModal(true);
      return;
    }

    const added = toggleItem(item);
    toast.success(added ? "Added to wishlist" : "Removed from wishlist");
  };

  return (
    <section id="specials" className="py-20 bg-[#0F0A08] text-[#E7D2B6]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-[#C98A5A]">
            Chef&apos;s Specials
          </h2>
          <p className="mt-3 text-[#BFA58A]">Signature dishes you cannot miss</p>
        </div>

        {loading ? (
          <div className="text-center text-[#BFA58A]">Loading chef specials...</div>
        ) : specials.length === 0 ? (
          <div className="text-center text-[#BFA58A]">No chef specials available right now.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {specials.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-[#8B5A2B]/60 bg-[#1A110D] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.45)] cursor-pointer hover:border-[#C98A5A]/80 transition"
                onClick={() => navigate("/menu")}
              >
                <div className="relative">
                  <img src={item.image} alt={item.name} className="h-52 w-full object-cover" />

                  <WishlistButton
                    active={isInWishlist(item.id)}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleWishlistToggle(item);
                    }}
                    className="absolute top-4 right-4 w-10 h-10 bg-black/40 border-[#8B5A2B]/60 hover:bg-black/55"
                  />
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[#E7D2B6] leading-snug">{item.name}</h3>
                  <p className="mt-3 text-sm text-[#BFA58A] leading-relaxed">
                    {item.desc}
                  </p>

                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-2xl font-bold text-[#C98A5A]">Rs {Number(item.price).toFixed(2)}</p>
                    <button
                      className="px-5 py-2 rounded-full bg-[#C98A5A] text-[#1A110D] font-semibold text-sm hover:opacity-90 transition"
                      onClick={(event) => {
                        event.stopPropagation();
                        addItem(item);
                        toast.success(`${item.name} added to cart`);
                      }}
                    >
                      Order Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 border-t border-[#8B5A2B]/30" />

        <CustomerAuthModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            setPendingWishlistItem(null);
          }}
          onSuccess={() => {
            if (pendingWishlistItem) {
              const added = toggleItem(pendingWishlistItem);
              toast.success(added ? "Added to wishlist" : "Removed from wishlist");
            }
            setShowAuthModal(false);
            setPendingWishlistItem(null);
          }}
          title="Save Chef Specials"
          description="Log in or create an account to save this dish to your wishlist."
        />
      </div>
    </section>
  );
};

export default ChefsSpecials;
