import React from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerLayout from '../layout/customerLayout';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const WishlistPage = () => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { items, removeItem, clearWishlist } = useWishlist();

  if (items.length === 0) {
    return (
      <CustomerLayout>
        <div className="min-h-[70vh] flex items-center justify-center px-4 pt-32 pb-12 sm:px-6">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#8B5A2B]/30 bg-[#1A110D]">
              <span className="text-4xl">♡</span>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-[#E7D2B6]">Your wishlist is empty</h1>
            <p className="mb-8 text-[#E7D2B6]/70">
              Save your favorite dishes here and order them anytime.
            </p>
            <button
              onClick={() => navigate('/menu')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C98A5A] to-[#D4A574] px-8 py-4 font-semibold text-[#0F0A08] shadow-lg transition-all duration-300 hover:from-[#B07D4A] hover:to-[#C49A66] hover:shadow-xl"
            >
              Browse Menu
            </button>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0F0A08] via-[#1A110D] to-[#0F0A08]">
        <div className="mx-auto max-w-6xl px-4 pt-32 pb-12 sm:px-6">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="bg-gradient-to-r from-[#C98A5A] to-[#D4A574] bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
                Your Wishlist
              </h1>
              <p className="mt-3 text-[#E7D2B6]/70">
                Your saved favorites are ready whenever you are.
              </p>
            </div>
            <button
              onClick={clearWishlist}
              className="rounded-xl border border-red-500/40 px-5 py-3 text-red-300 transition hover:bg-red-500/10"
            >
              Clear Wishlist
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-3xl border border-[#8B5A2B]/45 bg-[#1A110D] shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-52 w-full object-cover"
                />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-[#E7D2B6]">{item.name}</h2>
                      <p className="mt-2 line-clamp-2 text-sm text-[#E7D2B6]/70">
                        {item.description || item.desc || 'A delicious favorite from The Wooden Plate.'}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-[#E7D2B6]/70 transition hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-2xl font-bold text-[#C98A5A]">
                      Rs. {Number(item.price).toLocaleString()}
                    </span>
                    <button
                      onClick={() => addItem(item)}
                      className="rounded-full bg-[#C98A5A] px-5 py-2 font-semibold text-[#1A110D] transition hover:opacity-90"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default WishlistPage;
