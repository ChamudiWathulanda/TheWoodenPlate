import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import toast from "react-hot-toast";

const formatPromotionRule = (promotion) => {
  if (!promotion) return "-";

  if (promotion.application_type === "bxgy") {
    return `Buy ${promotion.buy_quantity || 1} Get ${promotion.get_quantity || 1}`;
  }

  if (promotion.type === "fixed") {
    return `Rs. ${Number(promotion.value || 0).toFixed(2)} off`;
  }

  return `${Number(promotion.value || 0)}% off`;
};

const formatPromotionScope = (promotion) => {
  if (!promotion) return "-";

  if (promotion.application_type === "order") return "Order level";
  if (promotion.application_type === "item") return "Item level";
  return "Buy X Get Y";
};

const Reports = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("this_month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [loading, setLoading] = useState(true);

  const [kpis, setKpis] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [orderStatusData, setOrderStatusData] = useState(null);
  const [topProductsData, setTopProductsData] = useState(null);
  const [promotionsData, setPromotionsData] = useState(null);
  const [customersData, setCustomersData] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, [dateRange, customStartDate, customEndDate]);

  const getDateParams = () => {
    const params = new URLSearchParams();

    if (dateRange === "custom" && customStartDate && customEndDate) {
      params.append("start_date", customStartDate);
      params.append("end_date", customEndDate);
    } else if (dateRange === "today") {
      const today = new Date().toISOString().split("T")[0];
      params.append("start_date", today);
      params.append("end_date", today);
    } else if (dateRange === "this_week") {
      const today = new Date();
      const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
      params.append("start_date", weekStart.toISOString().split("T")[0]);
      params.append("end_date", new Date().toISOString().split("T")[0]);
    } else if (dateRange === "this_month") {
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      params.append("start_date", monthStart.toISOString().split("T")[0]);
      params.append("end_date", new Date().toISOString().split("T")[0]);
    }

    return params.toString();
  };

  const fetchAllData = async () => {
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    const params = getDateParams();

    try {
      const [kpisRes, salesRes, statusRes, productsRes, promosRes, customersRes] = await Promise.all([
        fetch(`http://localhost:8000/api/admin/reports/kpis?${params}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        }),
        fetch(`http://localhost:8000/api/admin/reports/sales-summary?${params}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        }),
        fetch(`http://localhost:8000/api/admin/reports/order-status?${params}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        }),
        fetch(`http://localhost:8000/api/admin/reports/top-products?${params}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        }),
        fetch(`http://localhost:8000/api/admin/reports/promotions?${params}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        }),
        fetch(`http://localhost:8000/api/admin/reports/customers?${params}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        }),
      ]);

      const [kpisData, salesDataRes, statusDataRes, productsDataRes, promosDataRes, customersDataRes] =
        await Promise.all([
          kpisRes.json(),
          salesRes.json(),
          statusRes.json(),
          productsRes.json(),
          promosRes.json(),
          customersRes.json(),
        ]);

      setKpis(kpisData.data);
      setSalesData(salesDataRes.data);
      setOrderStatusData(statusDataRes.data);
      setTopProductsData(productsDataRes.data);
      setPromotionsData(promosDataRes.data);
      setCustomersData(customersDataRes.data);
    } catch (error) {
      toast.error("Failed to fetch reports data");
    } finally {
      setLoading(false);
    }
  };

  const KPICard = ({ title, value, icon, color, onClick }) => (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-lg border-l-4 bg-white p-6 shadow-md transition-shadow hover:shadow-lg ${color}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`text-3xl ${color.replace("border-", "text-")}`}>{icon}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-xl text-gray-600">Loading reports...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-md">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {dateRange === "custom" && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {kpis && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <KPICard title="Total Revenue" value={`Rs. ${kpis.total_revenue.toLocaleString()}`} icon="Rs" color="border-green-500" onClick={() => setActiveTab("sales")} />
            <KPICard title="Total Orders" value={kpis.total_orders} icon="#" color="border-blue-500" onClick={() => setActiveTab("orders")} />
            <KPICard title="Average Order Value" value={`Rs. ${kpis.avg_order_value.toFixed(2)}`} icon="AVG" color="border-purple-500" onClick={() => setActiveTab("sales")} />
            <KPICard title="Completion Rate" value={`${kpis.completion_rate.toFixed(1)}%`} icon="OK" color="border-yellow-500" onClick={() => setActiveTab("orders")} />
            <KPICard title="Total Discount" value={`Rs. ${kpis.total_discount.toLocaleString()}`} icon="OFF" color="border-red-500" onClick={() => setActiveTab("promotions")} />
            <KPICard title="New Customers" value={kpis.new_customers} icon="NEW" color="border-indigo-500" onClick={() => setActiveTab("customers")} />
          </div>
        )}

        <div className="rounded-lg bg-white shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: "overview", name: "Overview" },
                { id: "sales", name: "Sales Summary" },
                { id: "orders", name: "Order Status" },
                { id: "products", name: "Top Products" },
                { id: "promotions", name: "Promotions" },
                { id: "customers", name: "Customers" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`border-b-2 px-1 py-4 text-sm font-medium ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div className="py-12 text-center">
                <p className="text-lg text-gray-600">Select a tab above to view detailed reports</p>
                <p className="mt-2 text-gray-500">Or click on any KPI card to jump to related report</p>
              </div>
            )}

            {activeTab === "sales" && salesData && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Sales Summary</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Period</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Orders</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Revenue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Discount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">AOV</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {salesData.map((row, idx) => (
                        <tr key={idx}>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{row.period}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{row.orders_count}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">Rs. {parseFloat(row.revenue).toFixed(2)}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">Rs. {parseFloat(row.discount).toFixed(2)}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">Rs. {parseFloat(row.avg_order_value).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "orders" && orderStatusData && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Order Status Breakdown</h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                  {orderStatusData.status_breakdown.map((status) => (
                    <div key={status.status} className="rounded-lg bg-gray-50 p-4 text-center">
                      <p className="text-sm capitalize text-gray-600">{status.status}</p>
                      <p className="text-2xl font-bold text-gray-900">{status.count}</p>
                    </div>
                  ))}
                </div>
                {orderStatusData.peak_day && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm font-medium text-blue-600">Peak Day</p>
                    <p className="text-lg font-bold text-blue-900">
                      {orderStatusData.peak_day.date} - {orderStatusData.peak_day.count} orders
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "products" && topProductsData && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 text-xl font-bold text-gray-900">Best Selling (By Quantity)</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Product</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Quantity Sold</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Revenue</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Last Ordered</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {topProductsData.best_selling_qty.map((product) => (
                          <tr key={product.id}>
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{product.total_quantity}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">Rs. {parseFloat(product.total_revenue).toFixed(2)}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{new Date(product.last_ordered).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-xl font-bold text-gray-900">Highest Revenue</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Product</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Revenue</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Quantity Sold</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Last Ordered</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {topProductsData.highest_revenue.map((product) => (
                          <tr key={product.id}>
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">Rs. {parseFloat(product.total_revenue).toFixed(2)}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{product.total_quantity}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{new Date(product.last_ordered).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "promotions" && promotionsData && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Promotions Performance</h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-600">Total Discount Given</p>
                    <p className="text-2xl font-bold text-red-900">Rs. {promotionsData.total_discount.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                    <p className="text-sm text-purple-600">Total Usage</p>
                    <p className="text-2xl font-bold text-purple-900">{promotionsData.total_usage}</p>
                  </div>
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <p className="text-sm text-green-600">Revenue with Promos</p>
                    <p className="text-2xl font-bold text-green-900">Rs. {promotionsData.revenue_with_promos.toLocaleString()}</p>
                  </div>
                </div>

                {promotionsData.best_promo && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
                    <p className="mb-2 text-sm font-medium text-yellow-600">Best Performing Promotion</p>
                    <p className="text-xl font-bold text-yellow-900">{promotionsData.best_promo.title}</p>
                    <p className="text-sm text-yellow-700">
                      {formatPromotionScope(promotionsData.best_promo)} • {formatPromotionRule(promotionsData.best_promo)}
                    </p>
                    <p className="mt-2 text-sm text-yellow-700">
                      {promotionsData.best_promo.usage_count} uses • Rs. {parseFloat(promotionsData.best_promo.total_discount).toFixed(2)} discount given • Rs. {parseFloat(promotionsData.best_promo.revenue_generated).toFixed(2)} revenue generated
                    </p>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Promotion</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Offer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Usage</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Discount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Avg Discount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Revenue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Last Used</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {promotionsData.promo_performance.map((promo) => (
                        <tr key={promo.id}>
                          <td className="px-6 py-4 text-sm">
                            <p className="font-medium text-gray-900">{promo.title}</p>
                            <p className="mt-1 text-xs text-gray-500">{promo.description || "No description added"}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <p>{formatPromotionScope(promo)}</p>
                            <p className="mt-1 font-medium text-gray-900">{formatPromotionRule(promo)}</p>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{promo.usage_count}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">Rs. {parseFloat(promo.total_discount).toFixed(2)}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">Rs. {parseFloat(promo.avg_discount).toFixed(2)}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">Rs. {parseFloat(promo.revenue_generated).toFixed(2)}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {promo.last_used_at ? new Date(promo.last_used_at).toLocaleString() : "-"}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${promo.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                              {promo.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "customers" && customersData && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Customer Analytics</h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                    <p className="text-sm text-indigo-600">New Customers</p>
                    <p className="text-2xl font-bold text-indigo-900">{customersData.new_customers}</p>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm text-blue-600">Repeat Customers</p>
                    <p className="text-2xl font-bold text-blue-900">{customersData.repeat_customers}</p>
                  </div>
                </div>

                <div>
                  <h4 className="mb-4 text-lg font-semibold text-gray-900">Top Customers by Spend</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Orders</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Total Spent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {customersData.top_customers.map((customer) => (
                          <tr key={customer.id}>
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{customer.name}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{customer.email}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{customer.total_orders}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">Rs. {parseFloat(customer.total_spent).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Reports;
