import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import toast from "react-hot-toast";

const InventoryDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dashboardData, setDashboardData] = useState(null);
  const [purchaseSuggestions, setPurchaseSuggestions] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchPurchaseSuggestions();
  }, [selectedMonth, selectedYear]);

  const fetchDashboardData = async () => {
    setLoading(true);
    const token = localStorage.getItem("admin_token");

    try {
      const response = await fetch(
        `http://localhost:8000/api/admin/inventory-reports/monthly-dashboard?year=${selectedYear}&month=${selectedMonth}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setDashboardData(result.data);
      } else {
        toast.error("Failed to fetch dashboard data");
      }
    } catch (error) {
      toast.error("Error fetching dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseSuggestions = async () => {
    const token = localStorage.getItem("admin_token");

    try {
      const response = await fetch(
        "http://localhost:8000/api/admin/inventory-reports/purchase-suggestions",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setPurchaseSuggestions(result.data);
      }
    } catch (error) {
      console.error("Error fetching suggestions");
    }
  };

  const KPICard = ({ title, value, icon, color, description }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-gray-600">Loading inventory dashboard...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Dashboard</h1>
            <p className="text-gray-600 mt-1">Monthly stock analysis and usage tracking</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/admin/stock-movements"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              📝 Log Stock Movement
            </Link>
            <Link
              to="/admin/ingredients"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              📦 Manage Ingredients
            </Link>
          </div>
        </div>

        {/* Month Selector */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i, 1).toLocaleString("default", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="text-center md:text-right">
              <div className="text-sm text-gray-600">Viewing Period</div>
              <div className="text-lg font-bold text-gray-900">
                {dashboardData?.period.month_name}
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KPICard
              title="Total Ingredients"
              value={dashboardData.kpis.total_ingredients}
              icon="📦"
              color="border-blue-500"
              description="Active ingredients in system"
            />
            <KPICard
              title="Low Stock Items"
              value={dashboardData.kpis.low_stock_count}
              icon="⚠️"
              color="border-red-500"
              description="Below reorder level"
            />
            <KPICard
              title="Needs Reorder"
              value={dashboardData.kpis.ingredients_needing_reorder}
              icon="🛒"
              color="border-yellow-500"
              description="Require immediate purchase"
            />
          </div>
        )}

        {/* Purchase Suggestions */}
        {purchaseSuggestions.length > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
            <h3 className="text-xl font-bold text-yellow-900 mb-4">
              🛒 Suggested Purchases ({purchaseSuggestions.length} items)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {purchaseSuggestions.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg p-4 border-l-4 ${
                    item.priority === "CRITICAL" ? "border-red-500" : "border-yellow-500"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        Current: <span className="font-semibold">{item.current_stock} {item.unit}</span>
                      </p>
                      <p className="text-sm text-green-600 font-semibold mt-1">
                        Buy: {item.suggested_quantity} {item.unit}
                      </p>
                      {item.supplier_name && (
                        <p className="text-xs text-gray-500 mt-1">
                          📞 {item.supplier_name}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded ${
                        item.priority === "CRITICAL"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Inventory Table */}
        {dashboardData && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                📊 Monthly Inventory Report - {dashboardData.period.month_name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Opening stock, movements, and closing balance for each ingredient
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ingredient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Unit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Opening Stock
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Stock IN
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Usage (OUT)
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Closing Stock
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Avg Usage (3M)
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.inventory.map((item) => (
                    <tr
                      key={item.id}
                      className={item.needs_reorder ? "bg-red-50" : ""}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {item.supplier_name && (
                          <div className="text-xs text-gray-500">{item.supplier_name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {item.opening_stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600 font-semibold">
                        +{item.stock_in}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600 font-semibold">
                        -{item.stock_out}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span
                          className={`text-sm font-bold ${
                            item.needs_reorder ? "text-red-600" : "text-gray-900"
                          }`}
                        >
                          {item.closing_stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                        {item.avg_monthly_usage}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {item.needs_reorder ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            ⚠️ Reorder
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            ✓ OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">📝 How to read this report:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>Opening Stock:</strong> Stock at the start of selected month</li>
            <li><strong>Stock IN:</strong> Total quantity purchased/received this month</li>
            <li><strong>Usage (OUT):</strong> Total quantity used/consumed this month </li>
            <li><strong>Closing Stock:</strong> Current stock level</li>
            <li><strong>Avg Usage (3M):</strong> Average monthly usage over last 3 months </li>
            <li><strong>Suggested Purchase:</strong> Recommended quantity to buy based on usage patterns</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
};

export default InventoryDashboard;
