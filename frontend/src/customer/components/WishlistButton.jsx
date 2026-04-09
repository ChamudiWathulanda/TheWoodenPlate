import React from 'react';

export default function WishlistButton({ active = false, onClick, className = '', title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title || (active ? 'Remove from wishlist' : 'Add to wishlist')}
      aria-pressed={active}
      className={`flex items-center justify-center rounded-full border transition ${className}`}
    >
      <svg
        className={`w-5 h-5 transition ${active ? 'fill-current text-[#F16A7B]' : 'text-[#E7D2B6]'}`}
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.84 4.61c-1.54-1.34-3.77-1.33-5.3.02L12 8.09 8.46 4.63c-1.53-1.35-3.76-1.36-5.3-.02-1.74 1.52-1.85 4.16-.33 5.82l8.47 8.64a1 1 0 0 0 1.43 0l8.47-8.64c1.52-1.66 1.41-4.3-.33-5.82z"
        />
      </svg>
    </button>
  );
}
