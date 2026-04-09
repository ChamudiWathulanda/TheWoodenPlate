import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import toast from "react-hot-toast";

const getReceiptUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `http://localhost:8000/storage/${path}`;
};

const getAdminInvoiceUrl = (orderId) => `http://localhost:8000/api/admin/orders/${orderId}/invoice`;

const getFilenameFromResponse = (res, fallback) => {
  const contentDisposition = res.headers.get("content-disposition");
  const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/i);
  return filenameMatch?.[1] || fallback;
};

const downloadBlobResponse = async (res, fallbackFilename) => {
  const blob = await res.blob();
  const filename = getFilenameFromResponse(res, fallbackFilename);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const downloadInvoice = async (orderId) => {
  const token = localStorage.getItem("admin_token");
  const res = await fetch(getAdminInvoiceUrl(orderId), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to download invoice");
  }

  await downloadBlobResponse(res, `invoice-${orderId}.pdf`);
};

const downloadReceipt = async (orderId) => {
  const token = localStorage.getItem("admin_token");

  const res = await fetch(`http://localhost:8000/api/admin/orders/${orderId}/receipt-download`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to download receipt");
  }

  await downloadBlobResponse(res, `order-${orderId}-receipt`);
};

const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");

  const getLockIcon = (isLocked) => {
    if (!isLocked) {
      return null;
    }

    return (
      <span title="Locked order">
        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V8a4 4 0 118 0v3m-9 0h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6a2 2 0 012-2z" />
        </svg>
      </span>
    );
  };

  // Load Orders
  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const url = filterStatus
        ? `/api/admin/orders?status=${filterStatus}`
        : "/api/admin/orders";

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch orders");

      const data = await res.json();
      setOrders(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // Update Order Status
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("admin_token");

      const res = await fetch(
        `/api/admin/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!res.ok) throw new Error("Failed to update status");

      toast.success("Order status updated successfully");
      fetchOrders(); // Reload
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order status");
    }
  };

  // Get Status Badge Color
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "preparing":
        return "bg-blue-100 text-blue-800";
      case "ready":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Update Payment Status
  const handlePaymentStatusUpdate = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("admin_token");

      const res = await fetch(
        `/api/admin/orders/${orderId}/payment-status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ payment_status: newStatus }),
        }
      );

      if (!res.ok) throw new Error("Failed to update payment status");

      toast.success("Payment status updated successfully");
      fetchOrders(); // Reload
    } catch (err) {
      console.error(err);
      toast.error("Failed to update payment status");
    }
  };

  // Get Payment Status Badge Color
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading orders...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Order Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              View and manage all customer orders
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Orders</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
            </select>
            {filterStatus && (
              <button
                onClick={() => setFilterStatus("")}
                className="text-sm text-blue-600 hover:underline"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Orders Table */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Top Bar */}
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">
              Order List
              <span className="text-gray-400 font-normal"> ({orders.length})</span>
            </p>

            <button
              onClick={fetchOrders}
              className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 text-sm text-gray-700"
            >
              Refresh
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-900 font-semibold">No orders found</p>
              <p className="text-sm text-gray-500 mt-1">
                Orders will appear here when customers place them.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="min-w-[1000px] w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    <th className="px-5 py-3">Order ID</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Total Amount</th>
                    <th className="px-5 py-3">Payment Status</th>
                    <th className="px-5 py-3">Order Status</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            #{String(order.id).padStart(6, "0")}
                          </span>
                          {getLockIcon(order.is_locked)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {order.customer?.name || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.customer?.email || ""}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                        Rs. {parseFloat(order.total ?? order.total_amount ?? 0).toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-2">
                          <select
                            value={order.payment_status}
                            onChange={(e) =>
                              handlePaymentStatusUpdate(order.id, e.target.value)
                            }
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(
                              order.payment_status
                            )}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                          </select>
                          <div className="text-xs text-gray-500">
                            {order.payment_method}
                          </div>
                          {order.payment_receipt_path && (
                            <div className="flex flex-wrap gap-2">
                              <a
                                href={getReceiptUrl(order.payment_receipt_path)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200 hover:bg-blue-100"
                              >
                                Preview Receipt
                              </a>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await downloadReceipt(order.id);
                                  } catch (error) {
                                    console.error(error);
                                    toast.error("Failed to download receipt");
                                  }
                                }}
                                className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              >
                                Download
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusUpdate(order.id, e.target.value)
                          }
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            order.status
                          )}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                        <div className="text-xs text-gray-400">
                          {new Date(order.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/admin/orders/view/${order.id}`)}
                            className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                            title="View"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await downloadInvoice(order.id);
                              } catch (error) {
                                console.error(error);
                                toast.error("Failed to download invoice");
                              }
                            }}
                            className="p-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 transition-colors"
                            title="Invoice"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="rounded-2xl bg-yellow-50 p-5 border border-yellow-200 shadow-sm">
            <div className="text-sm text-yellow-600 font-semibold">Pending Orders</div>
            <div className="text-2xl font-bold text-yellow-800 mt-1">
              {orders.filter((o) => o.status === "pending").length}
            </div>
          </div>
          <div className="rounded-2xl bg-blue-50 p-5 border border-blue-200 shadow-sm">
            <div className="text-sm text-blue-600 font-semibold">Preparing</div>
            <div className="text-2xl font-bold text-blue-800 mt-1">
              {orders.filter((o) => o.status === "preparing").length}
            </div>
          </div>
          <div className="rounded-2xl bg-purple-50 p-5 border border-purple-200 shadow-sm">
            <div className="text-sm text-purple-600 font-semibold">Ready</div>
            <div className="text-2xl font-bold text-purple-800 mt-1">
              {orders.filter((o) => o.status === "ready").length}
            </div>
          </div>
          <div className="rounded-2xl bg-green-50 p-5 border border-green-200 shadow-sm">
            <div className="text-sm text-green-600 font-semibold">Completed</div>
            <div className="text-2xl font-bold text-green-800 mt-1">
              {orders.filter((o) => o.status === "completed").length}
            </div>
          </div>
        </div>

        {/* Payment Status Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="rounded-2xl bg-orange-50 p-5 border border-orange-200 shadow-sm">
            <div className="text-sm text-orange-600 font-semibold">Payment Pending</div>
            <div className="text-2xl font-bold text-orange-800 mt-1">
              {orders.filter((o) => o.payment_status === "pending").length}
            </div>
          </div>
          <div className="rounded-2xl bg-green-50 p-5 border border-green-200 shadow-sm">
            <div className="text-sm text-green-600 font-semibold">Payment Paid</div>
            <div className="text-2xl font-bold text-green-800 mt-1">
              {orders.filter((o) => o.payment_status === "paid").length}
            </div>
          </div>
          <div className="rounded-2xl bg-red-50 p-5 border border-red-200 shadow-sm">
            <div className="text-sm text-red-600 font-semibold">Payment Failed</div>
            <div className="text-2xl font-bold text-red-800 mt-1">
              {orders.filter((o) => o.payment_status === "failed").length}
            </div>
          </div>
          <div className="rounded-2xl bg-gray-50 p-5 border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-600 font-semibold">Refunded</div>
            <div className="text-2xl font-bold text-gray-800 mt-1">
              {orders.filter((o) => o.payment_status === "refunded").length}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrderList;
