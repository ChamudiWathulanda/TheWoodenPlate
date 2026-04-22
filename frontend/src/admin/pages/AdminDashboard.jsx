import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import AdminLayout from "../components/AdminLayout";

const API_BASE = "http://localhost:8000";

const rangeOptions = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
];

const quickActions = [
  {
    title: "Review Messages",
    description: "Read customer inquiries and send email replies.",
    href: "/admin/contact-messages",
  },
  {
    title: "Review Orders",
    description: "Check incoming orders and update kitchen progress.",
    href: "/admin/orders",
  },
  {
    title: "Manage Reservations",
    description: "Confirm tables and respond to pending bookings.",
    href: "/admin/reservations",
  },
  {
    title: "Restock Inventory",
    description: "Review low-stock items and purchase suggestions.",
    href: "/admin/inventory",
  },
  {
    title: "Launch Promotions",
    description: "Create limited-time offers and monitor usage.",
    href: "/admin/promotions",
  },
];

const getDateParams = (range) => {
  const params = new URLSearchParams();

  if (range === "today") {
    const today = new Date().toISOString().split("T")[0];
    params.append("start_date", today);
    params.append("end_date", today);
    return params.toString();
  }

  if (range === "this_week") {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    params.append("start_date", start.toISOString().split("T")[0]);
    params.append("end_date", new Date().toISOString().split("T")[0]);
    return params.toString();
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  params.append("start_date", monthStart.toISOString().split("T")[0]);
  params.append("end_date", new Date().toISOString().split("T")[0]);
  return params.toString();
};

const formatCurrency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const formatNumber = (value) => Number(value || 0).toLocaleString();

const formatDateLabel = () =>
  new Intl.DateTimeFormat("en-LK", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

const formatRelativeTime = (value) => {
  if (!value) return "Just now";

  const createdAt = new Date(value);
  const diffMs = Date.now() - createdAt.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return createdAt.toLocaleDateString();
};

const StatCard = ({ title, value, caption, tone = "amber", link }) => {
  const tones = {
    amber: "from-amber-500 to-orange-500",
    blue: "from-sky-500 to-blue-600",
    green: "from-emerald-500 to-green-600",
    rose: "from-rose-500 to-red-600",
  };

  const content = (
    <div className="rounded-3xl border border-white/60 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className={`mb-4 h-1.5 w-16 rounded-full bg-gradient-to-r ${tones[tone] || tones.amber}`} />
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{caption}</p>
    </div>
  );

  if (!link) return content;

  return (
    <Link to={link} className="block">
      {content}
    </Link>
  );
};

const AdminDashboard = () => {
  const [dateRange, setDateRange] = useState("this_month");
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState({
    kpis: null,
    salesData: [],
    orderStatusData: null,
    topProductsData: null,
    customersData: null,
    notifications: [],
    notificationCounts: null,
    inventoryData: null,
    purchaseSuggestions: [],
  });

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      const token = localStorage.getItem("admin_token");

      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }

      const params = getDateParams(dateRange);

      try {
        const headers = {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        };

        const [
          kpisRes,
          salesRes,
          orderStatusRes,
          topProductsRes,
          customersRes,
          notificationsRes,
          inventoryRes,
          purchaseRes,
        ] = await Promise.all([
          fetch(`${API_BASE}/api/admin/reports/kpis?${params}`, { headers }),
          fetch(`${API_BASE}/api/admin/reports/sales-summary?${params}`, { headers }),
          fetch(`${API_BASE}/api/admin/reports/order-status?${params}`, { headers }),
          fetch(`${API_BASE}/api/admin/reports/top-products?${params}&limit=5`, { headers }),
          fetch(`${API_BASE}/api/admin/reports/customers?${params}`, { headers }),
          fetch(`${API_BASE}/api/admin/notifications`, { headers }),
          fetch(
            `${API_BASE}/api/admin/inventory-reports/monthly-dashboard?year=${new Date().getFullYear()}&month=${
              new Date().getMonth() + 1
            }`,
            { headers }
          ),
          fetch(`${API_BASE}/api/admin/inventory-reports/purchase-suggestions`, { headers }),
        ]);

        const responses = [
          kpisRes,
          salesRes,
          orderStatusRes,
          topProductsRes,
          customersRes,
          notificationsRes,
          inventoryRes,
          purchaseRes,
        ];

        if (responses.some((response) => !response.ok)) {
          throw new Error("Failed to load admin dashboard data.");
        }

        const [
          kpisPayload,
          salesPayload,
          orderStatusPayload,
          topProductsPayload,
          customersPayload,
          notificationsPayload,
          inventoryPayload,
          purchasePayload,
        ] = await Promise.all(responses.map((response) => response.json()));

        if (!isMounted) return;

        setDashboard({
          kpis: kpisPayload?.data || null,
          salesData: salesPayload?.data || [],
          orderStatusData: orderStatusPayload?.data || null,
          topProductsData: topProductsPayload?.data || null,
          customersData: customersPayload?.data || null,
          notifications: notificationsPayload?.data?.items || [],
          notificationCounts: notificationsPayload?.data?.counts || null,
          inventoryData: inventoryPayload?.data || null,
          purchaseSuggestions: purchasePayload?.data || [],
        });
      } catch (error) {
        toast.error(error.message || "Failed to load admin dashboard");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [dateRange]);

  const salesMax = dashboard.salesData.length
    ? Math.max(...dashboard.salesData.map((item) => Number(item.revenue || 0)), 1)
    : 1;

  const completionRate = dashboard.kpis?.completion_rate || 0;
  const recentCustomers = dashboard.customersData?.top_customers?.slice(0, 5) || [];
  const bestSellers = dashboard.topProductsData?.best_selling_qty?.slice(0, 5) || [];
  const orderBreakdown = dashboard.orderStatusData?.status_breakdown || [];
  const lowStockItems =
    dashboard.inventoryData?.inventory?.filter((item) => item.needs_reorder).slice(0, 5) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 text-white shadow-xl">
          <div className="grid gap-8 px-6 py-7 lg:grid-cols-[1.8fr_1fr] lg:px-8">
            <div>
              <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-orange-100">
                Admin Command Center
              </div>
              <h1 className="mt-4 text-3xl font-black leading-tight md:text-4xl">
                Keep orders moving, stock healthy, and guests happy.
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
                Monitor revenue, service bottlenecks, customer momentum, and inventory risks from one place.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Today</p>
                  <p className="mt-1 text-sm font-semibold text-white">{formatDateLabel()}</p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                  <label className="text-xs uppercase tracking-[0.22em] text-slate-300">Focus Range</label>
                  <select
                    value={dateRange}
                    onChange={(event) => setDateRange(event.target.value)}
                    className="mt-1 w-full bg-transparent text-sm font-semibold text-white outline-none"
                  >
                    {rangeOptions.map((option) => (
                      <option key={option.value} value={option.value} className="text-slate-900">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-sm text-slate-300">Pending attention</p>
                <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-3">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-300">Orders</p>
                    <p className="mt-2 text-2xl font-bold">
                      {formatNumber(dashboard.notificationCounts?.orders)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-300">Bookings</p>
                    <p className="mt-2 text-2xl font-bold">
                      {formatNumber(dashboard.notificationCounts?.reservations)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-300">Messages</p>
                    <p className="mt-2 text-2xl font-bold">
                      {formatNumber(dashboard.notificationCounts?.messages)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-300">Low Stock</p>
                    <p className="mt-2 text-2xl font-bold">
                      {formatNumber(dashboard.notificationCounts?.low_stock)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-300">Expired Promos</p>
                    <p className="mt-2 text-2xl font-bold">
                      {formatNumber(dashboard.notificationCounts?.expired_promotions)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Revenue"
            value={formatCurrency(dashboard.kpis?.total_revenue)}
            caption="Completed pipeline revenue in the selected period."
            tone="amber"
            link="/admin/reports"
          />
          <StatCard
            title="Orders"
            value={formatNumber(dashboard.kpis?.total_orders)}
            caption="Track volume spikes and kitchen workload."
            tone="blue"
            link="/admin/orders"
          />
          <StatCard
            title="Completion Rate"
            value={`${completionRate.toFixed(1)}%`}
            caption="Share of orders fully completed."
            tone="green"
            link="/admin/reports"
          />
          <StatCard
            title="New Customers"
            value={formatNumber(dashboard.kpis?.new_customers)}
            caption="Fresh customer growth in this range."
            tone="rose"
            link="/admin/customers"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Sales Pulse
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Revenue trend</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Quick view of how sales are pacing through the selected period.
                </p>
              </div>
              <Link
                to="/admin/reports"
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Open reports
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {dashboard.salesData.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                  No sales data available for this range yet.
                </div>
              ) : (
                dashboard.salesData.map((item) => {
                  const width = `${Math.max((Number(item.revenue || 0) / salesMax) * 100, 8)}%`;

                  return (
                    <div key={item.period}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-700">{item.period}</span>
                        <span className="text-slate-500">
                          {formatCurrency(item.revenue)} / {formatNumber(item.orders_count)} orders
                        </span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-orange-400 via-amber-500 to-red-500"
                          style={{ width }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
              Order Flow
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Status breakdown</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {orderBreakdown.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                  No order status data to show.
                </div>
              ) : (
                orderBreakdown.map((status) => (
                  <div
                    key={status.status}
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold capitalize text-slate-700">{status.status}</p>
                      <p className="text-2xl font-black text-slate-900">{formatNumber(status.count)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {dashboard.orderStatusData?.peak_day && (
              <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-emerald-900">
                <p className="text-xs font-semibold uppercase tracking-wide">Peak day</p>
                <p className="mt-2 text-lg font-bold">
                  {dashboard.orderStatusData.peak_day.date}
                </p>
                <p className="text-sm">
                  {formatNumber(dashboard.orderStatusData.peak_day.count)} orders recorded.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Best Sellers
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Top products</h2>
              </div>
              <Link
                to="/admin/products"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Manage products
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {bestSellers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                  No product sales data yet.
                </div>
              ) : (
                bestSellers.map((product, index) => (
                  <Link
                    key={product.id}
                    to={`/admin/products/view/${product.id}`}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 p-4 transition hover:border-orange-200 hover:bg-orange-50/40"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
                        0{index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{product.name}</p>
                        <p className="text-sm text-slate-500">
                          {formatNumber(product.total_quantity)} sold
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      {formatCurrency(product.total_revenue)}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Customer Value
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Top spenders</h2>
              </div>
              <Link
                to="/admin/customers"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                View customers
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {recentCustomers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                  No customer spend data available.
                </div>
              ) : (
                recentCustomers.map((customer) => (
                  <Link
                    key={customer.id}
                    to={`/admin/customers/view/${customer.id}`}
                    className="block rounded-2xl border border-slate-100 p-4 transition hover:border-sky-200 hover:bg-sky-50/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{customer.name}</p>
                        <p className="text-sm text-slate-500">{customer.email}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        {formatCurrency(customer.total_spent)}
                      </p>
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
                      {formatNumber(customer.total_orders)} orders
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Inventory Watch
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Restock priorities</h2>
              </div>
              <Link
                to="/admin/inventory"
                className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                Open inventory
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Active ingredients</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatNumber(dashboard.inventoryData?.kpis?.total_ingredients)}
                </p>
              </div>
              <div className="rounded-2xl bg-rose-50 p-4">
                <p className="text-sm text-rose-600">Low stock</p>
                <p className="mt-2 text-2xl font-bold text-rose-900">
                  {formatNumber(dashboard.inventoryData?.kpis?.low_stock_count)}
                </p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="text-sm text-amber-600">Need reorder</p>
                <p className="mt-2 text-2xl font-bold text-amber-900">
                  {formatNumber(dashboard.inventoryData?.kpis?.ingredients_needing_reorder)}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {(dashboard.purchaseSuggestions.length > 0
                ? dashboard.purchaseSuggestions.slice(0, 5)
                : lowStockItems
              ).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">
                      Current stock: {item.current_stock ?? item.closing_stock} {item.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    {"suggested_quantity" in item ? (
                      <p className="text-sm font-semibold text-emerald-700">
                        Buy {item.suggested_quantity} {item.unit}
                      </p>
                    ) : (
                      <p className="text-sm font-semibold text-rose-700">Reorder now</p>
                    )}
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      {item.priority || "Low stock"}
                    </p>
                  </div>
                </div>
              ))}

              {dashboard.purchaseSuggestions.length === 0 && lowStockItems.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                  Inventory is looking healthy right now.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                Quick Actions
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">What needs action now?</h2>
              <div className="mt-6 grid gap-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    to={action.href}
                    className="rounded-2xl border border-slate-100 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <p className="font-semibold text-slate-900">{action.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{action.description}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Activity Feed
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">Recent alerts</h2>
                </div>
                <Link
                  to="/admin/contact-messages"
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Open messages
                </Link>
              </div>

              <div className="mt-6 space-y-3">
                {dashboard.notifications.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                    No new admin activity right now.
                  </div>
                ) : (
                  dashboard.notifications.slice(0, 6).map((item) => (
                    <Link
                      key={item.id}
                      to={item.link || "/admin/dashboard"}
                      className="block rounded-2xl border border-slate-100 p-4 transition hover:border-orange-200 hover:bg-orange-50/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                        </div>
                        <p className="shrink-0 text-xs uppercase tracking-wide text-slate-400">
                          {formatRelativeTime(item.created_at)}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {loading && (
        <div className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center bg-slate-950/10 backdrop-blur-[1px]">
          <div className="rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-xl">
            Loading dashboard...
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
