import React, { useState } from "react";
import WishlistButton from "./WishlistButton";

export default function MenuItemTiltCard({ item, onAddToCart, onToggleWishlist, isWishlisted = false }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const threshold = 10;

  const handleMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    setTilt({ x: y * -threshold, y: x * threshold });
  };

  return (
    <div
      className="rounded-3xl overflow-hidden transition-transform duration-200 ease-out cursor-pointer
                 bg-[#1A110D] border border-[#8B5A2B]/45 hover:border-[#C98A5A]/70
                 shadow-[0_20px_60px_rgba(0,0,0,0.45)] group"
      onMouseMove={handleMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
      }}
    >
      <div className="relative h-52">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

        {/* Price */}
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#D7B38A] text-[#0F0A08] text-sm font-extrabold">
          Rs. {Number(item.price).toLocaleString()}
        </div>

        <WishlistButton
          active={isWishlisted}
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist?.(item);
          }}
          className="absolute top-4 left-4 w-10 h-10 bg-black/35 border-[#8B5A2B]/60 hover:bg-black/55"
        />
      </div>

      <div className="p-5">
        <h3 className="text-lg font-extrabold text-[#E7D2B6]">{item.name}</h3>
        <p className="mt-2 text-sm text-[#E7D2B6]/70 line-clamp-2">
          {item.description}
        </p>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart?.(item);
          }}
          className="mt-5 w-full py-3 rounded-2xl bg-[#D7B38A]/10 border border-[#D7B38A]/30
                     text-[#D7B38A] text-sm font-semibold hover:bg-[#D7B38A] hover:text-[#0F0A08] transition"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
