import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import toast from "react-hot-toast";

const getReceiptUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `http://localhost:8000/storage/${path}`;
};

const isPdfReceipt = (path) => path?.toLowerCase().endsWith(".pdf");
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

const formatPromotionRule = (promotion) => {
  if (!promotion) return "No promotion";

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

const getBonusQuantityFromOrderItem = (item) => {
  const quantity = Number(item.quantity ?? 0);
  const unitPrice = Number(item.price ?? 0);
  const subtotal = Number(item.subtotal ?? quantity * unitPrice);

  if (quantity <= 0 || unitPrice <= 0) {
    return 0;
  }

  const paidQuantityEstimate = subtotal / unitPrice;
  const roundedPaidQuantity = Math.round(paidQuantityEstimate);
  const hasWholePaidQuantity = Math.abs(paidQuantityEstimate - roundedPaidQuantity) < 0.001;

  return hasWholePaidQuantity && roundedPaidQuantity < quantity
    ? quantity - roundedPaidQuantity
    : 0;
};

const ViewOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem("admin_token");

      const res = await fetch(`http://localhost:8000/api/admin/orders/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch order");

      const data = await res.json();
      setOrder(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load order details");
      navigate("/admin/orders");
    } finally {
      setLoading(false);
    }
  };

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

  const handleStatusUpdate = async (newStatus) => {
    try {
      const token = localStorage.getItem("admin_token");

      const res = await fetch(
        `http://localhost:8000/api/admin/orders/${id}/status`,
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
      fetchOrder(); // Reload order
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order status");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading order details...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center text-red-600">Order not found</div>
        </div>
      </AdminLayout>
    );
  }

  const receiptUrl = getReceiptUrl(order.payment_receipt_path);
  const hasReceipt = Boolean(receiptUrl);
  const receiptIsPdf = isPdfReceipt(order.payment_receipt_path);
  const appliedPromotions = Array.isArray(order.applied_promotions) ? order.applied_promotions : [];
  const subtotalAmount = Number(order.subtotal ?? order.total_amount ?? 0);
  const discountAmount = Number(order.discount ?? order.discount_amount ?? 0);
  const totalAmount = Number(order.total ?? order.total_amount ?? 0);

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Order Details #{String(order.id).padStart(6, "0")}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Placed on {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-3">
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Download Invoice
              </button>
              <button
                onClick={() => navigate("/admin/orders")}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Back to Orders
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 md:p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Customer Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-gray-900">{order.customer?.name || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{order.customer?.email || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-gray-900">{order.customer?.phone || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Address</label>
                  <p className="text-gray-900">
                    {order.customer?.address || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 md:p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Order Items
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Item
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Price
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {order.items?.map((item) => {
                      const bonusQuantity = getBonusQuantityFromOrderItem(item);

                      return (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            <div>
                              <p>{item.product?.name || "N/A"}</p>
                              {bonusQuantity > 0 && (
                                <p className="mt-1 text-xs font-semibold text-emerald-600">
                                  Includes {bonusQuantity} free item{bonusQuantity > 1 ? "s" : ""}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.product?.description || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">
                            Rs. {parseFloat(item.price).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                            Rs. {parseFloat(item.subtotal).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td
                        colSpan="4"
                        className="px-4 py-3 text-right text-sm font-bold text-gray-900"
                      >
                        Total:
                      </td>
                      <td className="px-4 py-3 text-right text-lg font-bold text-gray-900">
                        Rs. {totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 md:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Promotion Details</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Shows the promotion rules and discount applied to this order.
                  </p>
                </div>
                {appliedPromotions.length > 0 && (
                  <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 border border-emerald-200">
                    Rs. {discountAmount.toFixed(2)} saved
                  </span>
                )}
              </div>

              {appliedPromotions.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm text-gray-500">
                  No promotion was applied to this order.
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {appliedPromotions.map((promotion) => {
                    const promotionMeta =
                      order.promotion && order.promotion.id === promotion.promotion_id
                        ? order.promotion
                        : {
                            ...promotion,
                            title: promotion.title,
                            application_type: promotion.application_type,
                            target_type: promotion.target_type,
                          };

                    return (
                      <div
                        key={promotion.promotion_id}
                        className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-4"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-base font-semibold text-gray-900">{promotion.title}</p>
                            <p className="mt-1 text-sm text-gray-600">
                              {formatPromotionScope(promotionMeta)} • {formatPromotionRule(promotionMeta)}
                            </p>
                            {Number(promotion.bonus_quantity || 0) > 0 && (
                              <p className="mt-2 text-sm font-semibold text-emerald-700">
                                Free items added: {Number(promotion.bonus_quantity)}
                              </p>
                            )}
                          </div>
                          <div className="text-left md:text-right">
                            <p className="text-xs uppercase tracking-wide text-gray-500">Discount Applied</p>
                            <p className="mt-1 text-lg font-bold text-emerald-700">
                              Rs. {Number(promotion.discount || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Subtotal</p>
                      <p className="mt-2 text-lg font-semibold text-gray-900">Rs. {subtotalAmount.toFixed(2)}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                      <p className="text-xs uppercase tracking-wide text-emerald-700">Promotion Discount</p>
                      <p className="mt-2 text-lg font-semibold text-emerald-800">Rs. {discountAmount.toFixed(2)}</p>
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4">
                      <p className="text-xs uppercase tracking-wide text-blue-700">Payable Total</p>
                      <p className="mt-2 text-lg font-semibold text-blue-800">Rs. {totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 md:p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
                <p className="text-gray-700 bg-gray-50 p-4 rounded border-l-4 border-blue-500">
                  {order.notes}
                </p>
              </div>
            )}

            {hasReceipt && (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Payment Receipt
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Uploaded by the customer for online payment verification.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <a
                      href={receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
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
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200"
                    >
                      Download Receipt
                    </button>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                  {receiptIsPdf ? (
                    <iframe
                      src={receiptUrl}
                      title="Payment Receipt"
                      className="h-[32rem] w-full"
                    />
                  ) : (
                    <img
                      src={receiptUrl}
                      alt="Payment receipt"
                      className="max-h-[32rem] w-full object-contain bg-white"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Status & Actions */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 md:p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Order Status
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Current Status
                  </label>
                  <div className="mt-2">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">
                    Update Status
                  </label>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Lock Status */}
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2">
                    {order.is_locked ? (
                      <>
                        <svg
                          className="w-5 h-5 text-red-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        <span className="text-sm text-red-600 font-semibold">
                          Order Locked
                        </span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-sm text-green-600 font-semibold">
                          Order Unlocked
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {order.is_locked
                      ? "This order cannot be edited or deleted by the customer"
                      : "Customer can still delete this order"}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 md:p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-semibold">
                    #{String(order.id).padStart(6, "0")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items Count:</span>
                  <span className="font-semibold">{order.items?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">Rs. {subtotalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Promotion Discount:</span>
                  <span className="font-semibold text-emerald-600">Rs. {discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-semibold text-lg text-blue-600">
                    Rs. {totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Promotions Used:</span>
                  <span className="font-semibold">{appliedPromotions.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-semibold">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-semibold capitalize">
                    {order.payment_method || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Receipt:</span>
                  <span className="font-semibold">
                    {hasReceipt ? "Uploaded" : "Not uploaded"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-semibold">
                    {new Date(order.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ViewOrder;
