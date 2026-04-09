import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import toast from "react-hot-toast";

const ViewPromotion = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [promotion, setPromotion] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("admin_token");

  useEffect(() => {
    const fetchPromotion = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `http://localhost:8000/api/admin/promotions/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) throw new Error("Failed to fetch promotion");

        const result = await res.json();
        setPromotion(result.data || result);
      } catch (err) {
        toast.error("Failed to load promotion");
        navigate("/admin/promotions");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPromotion();
  }, [id, navigate, token]);

  const isPromotionActive = () => {
    if (!promotion || !promotion.is_active) return false;

    const now = new Date();
    const start = promotion.starts_at ? new Date(promotion.starts_at) : null;
    const end = promotion.ends_at ? new Date(promotion.ends_at) : null;

    if (start && now < start) return false;
    if (end && now > end) return false;

    return true;
  };

  const Field = ({ label, value }) => (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900">
        {value || "—"}
      </div>
    </div>
  );

  return (
    <AdminLayout>
      {/* FULL WIDTH WRAPPER */}
      <div className="w-full">
        {/* ✅ HEADER (full width inside content area) */}
        <div className="mb-6">
          <div className="w-full rounded-xl border border-gray-200 bg-gray-100 px-6 py-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Promotion Details
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                View promotion information
              </p>
            </div>

            <button
              onClick={() => navigate("/admin/promotions")}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg
                         bg-white hover:bg-gray-50 border border-gray-200
                         text-gray-800 text-sm font-medium transition cursor-pointer"
            >
              ← Back to Promotions
            </button>
          </div>
        </div>

        {/* ✅ CONTENT */}
        {loading ? (
          <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm p-6 text-gray-600">
            Loading promotion...
          </div>
        ) : !promotion ? null : (
          <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* TOP BAR */}
            <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center gap-4">
              {/* title section */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl font-semibold text-gray-900">
                  {promotion.title || "Unnamed Promotion"}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {promotion.type === "percentage" ? "Percentage Discount" : "Fixed Amount Discount"}
                </p>

                <div className="mt-2 flex items-center justify-center md:justify-start gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      isPromotionActive()
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {isPromotionActive() ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/admin/promotions/edit/${promotion.id}`)}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition cursor-pointer"
                >
                  Edit Promotion
                </button>
              </div>
            </div>

            {/* DETAILS GRID (label = value style) */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Title" value={promotion.title} />
                <Field
                  label="Discount Value"
                  value={
                    promotion.type === "percentage"
                      ? `${promotion.value}%`
                      : `Rs. ${parseFloat(promotion.value).toFixed(2)}`
                  }
                />
                <Field
                  label="Type"
                  value={promotion.type === "percentage" ? "Percentage" : "Fixed Amount"}
                />
                <Field
                  label="Status"
                  value={promotion.is_active ? "Enabled" : "Disabled"}
                />
                <Field
                  label="Start Date"
                  value={
                    promotion.starts_at
                      ? new Date(promotion.starts_at).toLocaleString()
                      : "No start date"
                  }
                />
                <Field
                  label="End Date"
                  value={
                    promotion.ends_at
                      ? new Date(promotion.ends_at).toLocaleString()
                      : "No end date"
                  }
                />
                <div className="md:col-span-2">
                  <Field
                    label="Description"
                    value={promotion.description || "No description available"}
                  />
                </div>

                {promotion.created_at && (
                  <Field
                    label="Created At"
                    value={new Date(promotion.created_at).toLocaleString()}
                  />
                )}

                {promotion.updated_at && (
                  <Field
                    label="Updated At"
                    value={new Date(promotion.updated_at).toLocaleString()}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ViewPromotion;
