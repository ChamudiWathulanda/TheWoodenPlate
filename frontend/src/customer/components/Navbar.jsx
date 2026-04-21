import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCustomerAuth } from "../../contexts/CustomerAuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { clearAdminSession } from "../../utils/authStorage";

const navLinks = [
  { name: "Home", id: "home", path: "/" },
  { name: "Menu", id: "menu", path: "/menu" },
  { name: "About", id: "about", path: "/about" },
  { name: "Gallery", id: "gallery", path: "/gallery" },
  { name: "Reservation", id: "reservation", path: "/reservation" },
  { name: "Contact", id: "contact", path: "/contact" },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showMiniCart, setShowMiniCart] = useState(false);
  const { customer, isAuthenticated, logout } = useCustomerAuth();
  const { items, itemCount, total } = useCart();
  const { itemCount: wishlistCount } = useWishlist();

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = (link) => {
    if (location.pathname === "/") {
      const el = document.getElementById(link.id);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: y, behavior: "smooth" });
      } else {
        navigate(link.path);
      }
    } else {
      navigate(link.path);
    }

    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  const handleCustomerAuthNavigation = (path) => {
    clearAdminSession();
    setIsMenuOpen(false);
    navigate(path);
  };

  return (
    <nav
      className={`fixed top-0 left-0 z-50 w-full transition-all duration-500 ${
        isScrolled
          ? "bg-[#1A120F]/88 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.38)] backdrop-blur-xl"
          : "bg-transparent py-5"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="The Wooden Plate"
            className="h-20 w-20 object-contain"
          />
        </Link>

        <div className="hidden items-center gap-8 text-sm text-[#E7D2B6] md:flex">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link)}
              className="group relative cursor-pointer transition hover:text-[#D7B38A]"
            >
              {link.name}
              <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-[#D7B38A] transition-all group-hover:w-full" />
            </button>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/wishlist"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#8B5A2B]/45 bg-[#1A110D] text-[#E7D2B6] transition hover:bg-[#C98A5A] hover:text-[#0F0A08]"
            title="View wishlist"
          >
            ♡
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F16A7B] px-1 text-[11px] font-semibold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setShowMiniCart(true)}
            onMouseLeave={() => setShowMiniCart(false)}
          >
            <Link
              to="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#8B5A2B]/45 bg-[#1A110D] text-[#E7D2B6] transition hover:bg-[#C98A5A] hover:text-[#0F0A08]"
              title="View cart"
            >
              🛒
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F16A7B] px-1 text-[11px] font-semibold text-white">
                  {itemCount}
                </span>
              )}
            </Link>

            {showMiniCart && (
              <div className="absolute right-0 mt-4 w-[24rem] overflow-hidden rounded-[1.75rem] border border-[#8B5A2B]/35 bg-[linear-gradient(160deg,rgba(19,13,10,0.98),rgba(42,26,19,0.96))] p-5 text-sm shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-[#D7B38A]/60">
                      Quick cart
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-[#F6E7D0]">
                      {itemCount > 0 ? "Your current picks" : "Cart is waiting"}
                    </h3>
                  </div>
                  <span className="inline-flex min-w-10 items-center justify-center rounded-full border border-[#D7B38A]/20 bg-[#D7B38A]/10 px-3 py-2 text-xs font-semibold text-[#F6E7D0]">
                    {itemCount}
                  </span>
                </div>

                {itemCount > 0 ? (
                  <>
                    <div className="mb-4 max-h-72 space-y-3 overflow-auto pr-1">
                      {items.slice(0, 4).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 rounded-2xl border border-[#8B5A2B]/18 bg-[#0F0A08]/55 p-3"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-14 w-14 rounded-2xl object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-[#F6E7D0]">
                              {item.name}
                            </div>
                            <div className="mt-1 text-xs text-[#E7D2B6]/62">
                              {item.quantity} × Rs. {item.price.toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right text-xs font-semibold text-[#D7B38A]">
                            Rs. {(item.quantity * item.price).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>

                    {items.length > 4 && (
                      <div className="mb-4 rounded-2xl border border-[#8B5A2B]/16 bg-[#0F0A08]/45 px-4 py-3 text-xs text-[#E7D2B6]/58">
                        +{items.length - 4} more items in your cart
                      </div>
                    )}

                    <div className="mb-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-[#8B5A2B]/20 bg-[#0F0A08]/55 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-[#E7D2B6]/42">
                          Items
                        </p>
                        <p className="mt-2 text-2xl font-bold text-[#F6E7D0]">
                          {itemCount}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[#8B5A2B]/20 bg-[#0F0A08]/55 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-[#E7D2B6]/42">
                          Total
                        </p>
                        <p className="mt-2 text-2xl font-bold text-[#C98A5A]">
                          Rs. {total.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        to="/menu"
                        className="rounded-2xl border border-[#8B5A2B]/35 bg-transparent px-4 py-3 text-center font-semibold text-[#E7D2B6] transition hover:bg-[#8B5A2B]/14"
                        onClick={() => setShowMiniCart(false)}
                      >
                        Add more
                      </Link>
                      <Link
                        to="/cart"
                        className="rounded-2xl bg-gradient-to-r from-[#C98A5A] to-[#D4A574] px-4 py-3 text-center font-semibold text-[#0F0A08] transition hover:brightness-105"
                        onClick={() => setShowMiniCart(false)}
                      >
                        View cart
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-[#8B5A2B]/35 bg-[#0F0A08]/35 px-5 py-8 text-center">
                    <p className="text-base font-semibold text-[#F6E7D0]">
                      Your cart is empty
                    </p>
                    <p className="mt-2 text-sm text-[#E7D2B6]/62">
                      Hover here anytime to preview what you have picked.
                    </p>
                    <Link
                      to="/menu"
                      className="mt-5 inline-flex rounded-full bg-[#C98A5A] px-5 py-2 font-semibold text-[#0F0A08] transition hover:bg-[#D4A574]"
                      onClick={() => setShowMiniCart(false)}
                    >
                      Explore Menu
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {isAuthenticated() ? (
            <>
              <Link
                to="/my-orders"
                className="rounded-full border border-[#D7B38A]/50 px-4 py-2 text-[#E7D2B6] transition hover:bg-[#D7B38A]/10"
              >
                My Orders
              </Link>
              <span className="text-sm text-[#E7D2B6]">
                Hi,{" "}
                <span className="font-medium text-[#D7B38A]">
                  {customer?.name?.split(" ")[0] || "Guest"}
                </span>
              </span>
              <button
                onClick={handleLogout}
                className="rounded-full border border-[#D7B38A]/50 px-4 py-2 text-[#E7D2B6] transition hover:border-red-500/50 hover:bg-red-500/20"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleCustomerAuthNavigation('/login')}
                className="rounded-full border border-[#D7B38A]/50 px-4 py-2 text-[#E7D2B6] transition hover:bg-[#D7B38A]/10"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => handleCustomerAuthNavigation('/register')}
                className="rounded-full bg-[#D7B38A] px-4 py-2 text-[#1A120F] transition hover:opacity-90"
              >
                Register
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => setIsMenuOpen(true)}
          className="text-[#E7D2B6] md:hidden"
        >
          ☰
        </button>
      </div>

      <div
        className={`fixed inset-0 flex flex-col items-center justify-center gap-6 bg-[#0F0A08] text-[#E7D2B6] transition-transform duration-500 md:hidden ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          className="absolute top-6 right-6 text-2xl"
          onClick={() => setIsMenuOpen(false)}
        >
          ✕
        </button>

        {navLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => handleNavClick(link)}
            className="text-lg"
          >
            {link.name}
          </button>
        ))}

        <Link
          to="/wishlist"
          className="flex items-center gap-2 text-lg"
          onClick={() => setIsMenuOpen(false)}
        >
          ♡ Wishlist
          {wishlistCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F16A7B] px-1 text-[11px] font-semibold text-white">
              {wishlistCount}
            </span>
          )}
        </Link>

        <Link
          to="/cart"
          className="flex items-center gap-2 text-lg"
          onClick={() => setIsMenuOpen(false)}
        >
          🛒 Cart
          {itemCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
              {itemCount}
            </span>
          )}
        </Link>

        {isAuthenticated() ? (
          <>
            <Link
              to="/my-orders"
              className="rounded-full border border-[#D7B38A] px-6 py-2 transition hover:bg-[#D7B38A]/10"
              onClick={() => setIsMenuOpen(false)}
            >
              My Orders
            </Link>
            <span className="font-medium text-[#D7B38A]">
              {customer?.name || "Guest"}
            </span>
            <button
              onClick={handleLogout}
              className="rounded-full border border-red-500/50 px-6 py-2 text-red-400 transition hover:bg-red-500/20"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => handleCustomerAuthNavigation('/login')}
              className="rounded-full border border-[#D7B38A] px-6 py-2 transition hover:bg-[#D7B38A]/10"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => handleCustomerAuthNavigation('/register')}
              className="rounded-full bg-[#D7B38A] px-6 py-2 text-[#1A120F] transition hover:opacity-90"
            >
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
