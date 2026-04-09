import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import ConfirmModal from "../../components/ConfirmModal";
import toast from "react-hot-toast";

const parseJsonResponse = async (response) => {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Server returned an invalid response. Please check the API endpoint.");
  }
};

const EditTable = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    table_number: "",
    chair_count: "",
    is_active: true,
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const token = localStorage.getItem("admin_token");

  useEffect(() => {
    const fetchTable = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:8000/api/admin/tables/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch table");

        const result = await parseJsonResponse(response);
        const data = result.data || result;

        setFormData({
          table_number: data?.table_number ?? "",
          chair_count: data?.chair_count ?? "",
          is_active: data?.is_active ?? true,
          notes: data?.notes ?? "",
        });
      } catch (err) {
        toast.error("Failed to load table");
        navigate("/admin/tables");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTable();
  }, [id, navigate, token]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;
    setShowConfirm(true);
  };

  const handleConfirmUpdate = async () => {
    setSubmitting(true);

    try {
      const response = await fetch(
        `http://localhost:8000/api/admin/tables/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        if (response.status === 422 && data.errors) {
          const errorMessages = Object.values(data.errors).flat();
          errorMessages.forEach((msg) => toast.error(msg));
          return;
        }
        throw new Error(data.message || "Failed to update table");
      }

      toast.success("Table updated successfully");
      navigate("/admin/tables");
    } catch (e2) {
      toast.error(e2.message || "Failed to update table");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="w-full rounded-xl border border-gray-200 bg-gray-100 px-6 py-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Edit Table
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Update table information
              </p>
            </div>

            <button
              onClick={() => navigate("/admin/tables")}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg
                         bg-white hover:bg-gray-50 border border-gray-200
                         text-gray-800 text-sm font-medium transition cursor-pointer"
            >
              ← Back to Tables
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm p-6 text-gray-600">
            Loading table...
          </div>
        ) : (
          <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* Top Bar */}
            <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl font-semibold text-gray-900">
                  Update Details
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Change fields and click "Update Table"
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/admin/tables/${id}`)}
                  className="px-5 py-2.5 rounded-lg bg-white hover:bg-gray-50 border border-gray-200
                             text-gray-800 text-sm font-medium transition cursor-pointer"
                >
                  View
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Table Number */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500">
                    Table Number <span className="text-red-500">*</span>
                  </p>
                  <input
                    type="text"
                    name="table_number"
                    value={formData.table_number}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    placeholder="e.g., 1, A1, VIP-1"
                  />
                </div>

                {/* Chair Count */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500">
                    Number of Chairs <span className="text-red-500">*</span>
                  </p>
                  <input
                    type="number"
                    name="chair_count"
                    value={formData.chair_count}
                    onChange={handleChange}
                    required
                    min="1"
                    max="20"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    placeholder="e.g., 4"
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-2 flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500">Notes</p>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    placeholder="Any special notes about this table..."
                  />
                </div>

                {/* Is Active */}
                <div className="md:col-span-2 flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500">Status</p>
                  <label className="inline-flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-800">
                      Active (available for reservations)
                    </span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-lg
                             bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
                             disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {submitting ? "Updating..." : "Update Table"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/admin/tables")}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-lg
                             bg-gray-100 hover:bg-gray-200 border border-gray-200
                             text-gray-800 text-sm font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmUpdate}
        title="Update Table"
        message="Are you sure you want to update this table?"
        confirmText="Update"
        cancelText="Cancel"
        type="warning"
      />
    </AdminLayout>
  );
};

export default EditTable;
