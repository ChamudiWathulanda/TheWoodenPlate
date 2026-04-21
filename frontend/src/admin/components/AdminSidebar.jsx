import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const AdminSidebar = ({ mobile = false, onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path || (path !== "/admin/dashboard" && location.pathname.startsWith(path));

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      description: "Overview",
      icon: (
        <svg className="h-5 w-5 stroke-current" fill="none" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      name: "Customers",
      path: "/admin/customers",
      description: "Profiles",
      icon: (
        <svg className="h-5 w-5 stroke-current" fill="none" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
    },
    {
      name: "Orders",
      path: "/admin/orders",
      description: "Fulfillment",
      icon: (
        <svg className="h-5 w-5 stroke-current" fill="none" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      ),
    },
    {
      name: "Products",
      path: "/admin/products",
      description: "Catalog",
      icon: (
        <svg className="h-5 w-5 stroke-current" fill="none" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
    },
    {
      name: "Promotions",
      path: "/admin/promotions",
      description: "Campaigns",
      icon: (
        <svg className="h-5 w-5 stroke-current" fill="none" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      ),
    },
    {
      name: "Categories",
      path: "/admin/categories",
      description: "Structure",
      icon: (
        <svg className="h-5 w-5 stroke-current" fill="none" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
    },
    {
      name: "Menu Items",
      path: "/admin/menu-items",
      description: "Dining menu",
      icon: (
        <svg className="h-5 w-5 stroke-current" fill="none" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
    },
    {
      name: "Reservations",
      path: "/admin/reservations",
      description: "Bookings",
      icon: (
        <svg className="h-5 w-5 stroke-current" fill="none" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      name: "Tables",
      path: "/admin/tables",
      description: "Floor map",
      icon: (
        <svg className="h-5 w-5 stroke-current" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
    },
    {
      name: "Gallery",
      path: "/admin/gallery",
      description: "Media",
      icon: (
        <svg className="h-5 w-5 stroke-current" fill="none" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      name: "Inventory",
      path: "/admin/inventory",
      description: "Stock room",
      icon: (
        <svg className="h-5 w-5 stroke-current" fill="none" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
    },
    {
      name: "Reports",
      path: "/admin/reports",
      description: "Analytics",
      icon: (
        <svg className="h-5 w-5 stroke-current" fill="none" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      name: "Settings",
      path: "/admin/settings",
      description: "Business info",
      icon: (
        <svg className="h-5 w-5 stroke-current" fill="none" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <aside
      className={`h-full shrink-0 text-white ${mobile ? "block overflow-y-auto" : "hidden w-80 border-r border-slate-200/70 bg-[linear-gradient(180deg,_#111827_0%,_#1f2937_38%,_#7c2d12_140%)] lg:block lg:overflow-y-auto"}`}
    >
      <div className={`px-6 pb-4 pt-6 ${mobile ? "bg-[linear-gradient(180deg,_#111827_0%,_#1f2937_38%,_#7c2d12_140%)]" : ""}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-orange-400 to-red-500 text-lg font-black text-slate-950 shadow-lg shadow-orange-900/30">
              WP
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/80">
                The Wooden Plate
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight">Admin Suite</h2>
            </div>
          </div>

          {mobile && (
            <button
              type="button"
              onClick={() => onNavigate?.()}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-slate-100 transition hover:bg-white/15"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/8 p-4 shadow-inner shadow-black/10">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Operations status</p>
          <p className="mt-3 text-lg font-bold text-white">All core modules connected</p>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            Orders, reservations, inventory, promotions, reports, and customer management in one workspace.
          </p>
        </div>
      </div>

      <nav className={`px-4 py-4 ${mobile ? "bg-[linear-gradient(180deg,_#111827_0%,_#1f2937_38%,_#7c2d12_140%)]" : ""}`}>
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const active = isActive(item.path);

            return (
              <li key={item.path}>
                <button
                  type="button"
                  onClick={() => handleNavigate(item.path)}
                  className={`group flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
                    active
                      ? "border-white/20 bg-white text-slate-900 shadow-lg shadow-black/10"
                      : "border-transparent bg-transparent text-slate-200 hover:border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition ${
                      active
                        ? "bg-gradient-to-br from-amber-300 via-orange-400 to-red-500 text-slate-950"
                        : "bg-white/10 text-slate-100 group-hover:bg-white/15"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm font-semibold ${active ? "text-slate-900" : "text-current"}`}>
                      {item.name}
                    </span>
                    <span className={`block text-xs ${active ? "text-slate-500" : "text-slate-400"}`}>
                      {item.description}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={`px-4 pb-4 pt-2 ${mobile ? "bg-[linear-gradient(180deg,_#111827_0%,_#1f2937_38%,_#7c2d12_140%)]" : ""}`}>
        <div className="rounded-3xl bg-gradient-to-r from-amber-400/20 to-orange-500/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">Daily focus</p>
          <p className="mt-2 text-sm font-semibold text-white">
            Check pending orders, confirm bookings, and review low stock before peak hours.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
