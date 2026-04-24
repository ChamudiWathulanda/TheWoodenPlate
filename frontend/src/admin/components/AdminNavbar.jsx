import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  clearAdminSession,
  getStoredAdminNotificationIdentity,
  persistAdminNotificationIdentity,
} from "../../utils/authStorage";

const API_BASE = "http://localhost:8000";
const READ_NOTIFICATIONS_KEY = "admin_notifications_read_items";

const severityStyles = {
  info: "bg-sky-50 text-sky-700 ring-sky-100",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  warning: "bg-amber-50 text-amber-700 ring-amber-100",
  danger: "bg-rose-50 text-rose-700 ring-rose-100",
};

const sectionTitles = {
  "/admin/dashboard": "Dashboard",
  "/admin/customers": "Customers",
  "/admin/contact-messages": "Messages",
  "/admin/newsletter": "Newsletter",
  "/admin/email-campaigns": "Email Campaigns",
  "/admin/orders": "Orders",
  "/admin/products": "Products",
  "/admin/promotions": "Promotions",
  "/admin/categories": "Categories",
  "/admin/menu-items": "Menu Items",
  "/admin/reservations": "Reservations",
  "/admin/tables": "Tables",
  "/admin/gallery": "Gallery",
  "/admin/inventory": "Inventory",
  "/admin/reports": "Reports",
  "/admin/settings": "Settings",
};

const getSectionTitle = (pathname) => {
  const match = Object.keys(sectionTitles).find(
    (route) => pathname === route || (route !== "/admin/dashboard" && pathname.startsWith(route))
  );

  return sectionTitles[match] || "Admin";
};

const formatRelativeTime = (value) => {
  if (!value) return "Just now";

  const createdAt = new Date(value);
  const diffMs = Date.now() - createdAt.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  }

  return createdAt.toLocaleDateString();
};

const formatDateLabel = new Intl.DateTimeFormat("en-LK", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const getNotificationStorageKey = (adminUser) => {
  const identity = adminUser || "default";
  return `${READ_NOTIFICATIONS_KEY}_${identity}`;
};

const AdminNavbar = ({ onMenuClick, isMobileSidebarOpen = false }) => {
  const [open, setOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [adminUser, setAdminUser] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [notificationError, setNotificationError] = useState("");
  const [readNotificationIds, setReadNotificationIds] = useState({});
  const [notificationIdentity, setNotificationIdentity] = useState(() => getStoredAdminNotificationIdentity());
  const navigate = useNavigate();
  const location = useLocation();
  const notificationRef = useRef(null);
  const profileRef = useRef(null);
  const notificationStorageKey = getNotificationStorageKey(notificationIdentity);

  useEffect(() => {
    const stored = localStorage.getItem("admin_user");
    if (stored) {
      try {
        const parsedUser = JSON.parse(stored);
        setAdminUser(parsedUser);
        setNotificationIdentity(persistAdminNotificationIdentity(parsedUser));
      } catch {
        setAdminUser({});
        setNotificationIdentity(getStoredAdminNotificationIdentity());
      }
    } else {
      setNotificationIdentity(getStoredAdminNotificationIdentity());
    }
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(notificationStorageKey);
      setReadNotificationIds(stored ? JSON.parse(stored) : {});
    } catch {
      setReadNotificationIds({});
    }
  }, [notificationStorageKey]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }

      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setNotificationOpen(false);
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let isMounted = true;

    const fetchNotifications = async ({ silent = false } = {}) => {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        if (isMounted) {
          setLoadingNotifications(false);
          setNotifications([]);
        }
        return;
      }

      if (!silent && isMounted) {
        setLoadingNotifications(true);
      }

      try {
        const response = await fetch(`${API_BASE}/api/admin/notifications`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.message || "Failed to load notifications");
        }

        if (isMounted) {
          setNotifications(payload?.data?.items || []);
          setNotificationError("");
        }
      } catch (error) {
        if (isMounted) {
          setNotificationError(error.message || "Failed to load notifications");
        }
      } finally {
        if (isMounted) {
          setLoadingNotifications(false);
        }
      }
    };

    fetchNotifications();
    const intervalId = window.setInterval(() => fetchNotifications({ silent: true }), 30000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter((item) => !readNotificationIds[item.id]).length;
  }, [notifications, readNotificationIds]);

  const markNotificationAsRead = (notificationId) => {
    if (!notificationId) return;

    setReadNotificationIds((current) => {
      if (current[notificationId]) {
        return current;
      }

      const next = {
        ...current,
        [notificationId]: true,
      };

      localStorage.setItem(notificationStorageKey, JSON.stringify(next));
      return next;
    });
  };

  const handleLogout = () => {
    clearAdminSession();
    navigate("/admin/login", { replace: true });
  };

  const handleViewProfile = () => {
    setOpen(false);
    navigate("/admin/profile");
  };

  const handleToggleNotifications = () => {
    setOpen(false);
    setNotificationOpen((current) => !current);
  };

  const handleNotificationClick = (item) => {
    markNotificationAsRead(item?.id);
    setNotificationOpen(false);
    if (item?.link) {
      navigate(item.link);
    }
  };

  const isUnreadNotification = (notificationId) => !readNotificationIds[notificationId];

  const title = getSectionTitle(location.pathname);
  const adminInitial = (adminUser?.name || "A").charAt(0).toUpperCase();

  return (
    <header className="relative z-[80] overflow-visible border-b border-white/60 bg-white/75 px-4 py-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-3 md:gap-4">
        <div className="min-w-0 flex flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 lg:hidden"
          >
            {isMobileSidebarOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
              Admin workspace
            </p>
            <h1 className="truncate text-2xl font-black text-slate-900">{title}</h1>
            <p className="mt-2 hidden text-sm text-slate-500 md:block">
              {formatDateLabel.format(new Date())} and the latest operational updates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm md:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Unread</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{unreadCount}</p>
          </div>

          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={handleToggleNotifications}
              className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>

              {unreadCount > 0 && (
                <>
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-orange-500" />
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                </>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 top-full z-[90] mt-3 w-[21rem] max-w-[calc(100vw-1.25rem)] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl">
                <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Notifications</p>
                      <p className="text-xs text-slate-500">
                        Orders, customers, messages, newsletter, campaigns, stock and reservations
                      </p>
                    </div>
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                      {notifications.length} items
                    </span>
                  </div>
                </div>

                <div className="max-h-[26rem] overflow-y-auto">
                  {loadingNotifications ? (
                    <div className="px-5 py-6 text-sm text-slate-500">Loading notifications...</div>
                  ) : notificationError ? (
                    <div className="px-5 py-6 text-sm text-red-500">{notificationError}</div>
                  ) : notifications.length === 0 ? (
                    <div className="px-5 py-6 text-sm text-slate-500">No notifications right now.</div>
                  ) : (
                    notifications.map((item) => {
                      const unread = isUnreadNotification(item.id);

                      return (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => handleNotificationClick(item)}
                          className={`w-full border-b border-slate-100 px-5 py-3 text-left transition ${
                            unread ? "bg-orange-50/35 hover:bg-orange-50/60" : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                                    severityStyles[item.severity] || severityStyles.info
                                  }`}
                                >
                                  {item.title}
                                </span>
                                {unread && <span className="h-2 w-2 rounded-full bg-orange-500" />}
                              </div>
                              <p className="shrink-0 pt-0.5 text-[11px] text-slate-400">
                                {formatRelativeTime(item.created_at)}
                              </p>
                            </div>

                            <p className={`text-sm leading-5 ${unread ? "font-medium text-slate-800" : "text-slate-600"}`}>
                              {item.message}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setNotificationOpen(false);
                setOpen((value) => !value);
              }}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-sm font-bold text-white">
                {adminInitial}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-slate-900">{adminUser?.name || "Admin"}</p>
                <p className="text-xs text-slate-500">{adminUser?.email || "admin@woodenplate.com"}</p>
              </div>
            </button>

            {open && (
              <div className="absolute right-0 top-full z-[90] mt-3 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">{adminUser?.name || "Admin"}</p>
                  <p className="text-xs text-slate-500">{adminUser?.email || "admin@woodenplate.com"}</p>
                </div>

                <button
                  type="button"
                  onClick={handleViewProfile}
                  className="w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  View Profile
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
