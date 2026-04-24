import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import ConfirmModal from "../../components/ConfirmModal";
import toast from "react-hot-toast";
import { normalizeCustomerForm, validateCustomerForm } from "./customerValidation";

const EditCustomer = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  const token = localStorage.getItem("admin_token");

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `http://localhost:8000/api/admin/customers/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) throw new Error("Failed to fetch customer");

        const result = await res.json();
        const data = result.data || result;

        setFormData({
          name: data?.name ?? "",
          email: data?.email ?? "",
          phone: data?.phone ?? "",
          address: data?.address ?? "",
        });
      } catch (e) {
        toast.error("Failed to load customer");
        navigate("/admin/customers");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchCustomer();
  }, [id, navigate, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;
    const normalizedData = normalizeCustomerForm(formData);
    const validationErrors = validateCustomerForm(normalizedData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix the highlighted customer details.");
      return;
    }

    setFormData(normalizedData);
    setShowConfirm(true);
  };

  const handleConfirmUpdate = async () => {
    setSubmitting(true);

    try {
      const res = await fetch(
        `http://localhost:8000/api/admin/customers/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        // Handle validation errors (422)
        if (res.status === 422 && data.errors) {
          setErrors((prev) => ({
            ...prev,
            ...Object.fromEntries(
              Object.entries(data.errors).map(([field, messages]) => [field, messages[0]])
            ),
          }));
          const errorMessages = Object.values(data.errors).flat();
          errorMessages.forEach((msg) => toast.error(msg));
          return;
        }
        throw new Error(data.message || "Failed to update customer");
      }

      toast.success("Customer updated successfully");
      navigate("/admin/customers");
    } catch (e2) {
      toast.error(e2.message || "Failed to update customer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="w-full">
        {/* ✅ HEADER (match View page style) */}
        <div className="mb-6">
          <div className="w-full rounded-xl border border-gray-200 bg-gray-100 px-6 py-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Edit Customer
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Update customer information
              </p>
            </div>

            <button
              onClick={() => navigate("/admin/customers")}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg
                         bg-white hover:bg-gray-50 border border-gray-200
                         text-gray-800 text-sm font-medium transition"
            >
              ← Back to Customers
            </button>
          </div>
        </div>

        {/* ✅ CONTENT */}
        {loading ? (
          <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm p-6 text-gray-600">
            Loading customer...
          </div>
        ) : (
          <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* TOP BAR (like view card top) */}
            <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl font-semibold text-gray-900">
                  Update Details
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Change fields and click “Update Customer”
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/admin/customers/view/${id}`)}
                  className="px-5 py-2.5 rounded-lg bg-white hover:bg-gray-50 border border-gray-200
                             text-gray-800 text-sm font-medium transition"
                >
                  View
                </button>
              </div>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Name */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500">
                    Name <span className="text-red-500">*</span>
                  </p>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={`w-full rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition ${
                                 errors.name ? "border-red-500" : "border-gray-200"
                               }`}
                    placeholder="Enter customer name"
                  />
                  {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* Email */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500">
                    Email <span className="text-red-500">*</span>
                  </p>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`w-full rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition ${
                                 errors.email ? "border-red-500" : "border-gray-200"
                               }`}
                    placeholder="Enter email"
                  />
                  {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500">Phone</p>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition ${
                                 errors.phone ? "border-red-500" : "border-gray-200"
                               }`}
                    placeholder="Enter phone"
                  />
                  {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
                </div>

                {/* Address */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500">Address</p>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition resize-none ${
                                 errors.address ? "border-red-500" : "border-gray-200"
                               }`}
                    placeholder="Enter address"
                  />
                  {errors.address && <p className="text-sm text-red-600">{errors.address}</p>}
                </div>
              </div>

              {/* ACTION BUTTONS (same vibe as View) */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3 md:justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`rounded-md cursor-pointer px-4 py-2 text-sm font-medium transition ${
                    submitting
                      ? "bg-blue-400 cursor-not-allowed text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {submitting ? "Updating..." : "Update Customer"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/admin/customers")}
                  className="rounded-md px-4 py-2 text-sm font-medium
                            bg-gray-100 hover:bg-gray-200 border border-gray-200
                            text-gray-800 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Confirm Update Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmUpdate}
        title="Update Customer"
        message="Are you sure you want to update this customer's details?"
        confirmText="Update"
        cancelText="Cancel"
        type="warning"
      />
    </AdminLayout>
  );
};

export default EditCustomer;
