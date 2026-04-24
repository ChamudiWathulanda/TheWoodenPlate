import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import toast from "react-hot-toast";
import { normalizeCustomerForm, validateCustomerForm } from "./customerValidation";

const CreateCustomer = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const token = localStorage.getItem("admin_token");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedData = normalizeCustomerForm(formData);
    const validationErrors = validateCustomerForm(normalizedData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix the highlighted customer details.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/admin/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(normalizedData),
      });

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
        throw new Error(data.message || "Failed to create customer");
      }

      toast.success("Customer created successfully");
      navigate("/admin/customers");
    } catch (err) {
      toast.error(err.message || "Failed to create customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex-1 py-8">
        <div className="w-full md:px-8 px-4">
          {/* ✅ HERO HEADER (Full width) */}
          <div className="mb-6">
            <div className="w-full rounded-xl border border-gray-200 bg-gray-100 px-6 py-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Create Customer
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Add a new customer to the system
                  </p>
                </div>

                <button
                  onClick={() => navigate("/admin/customers")}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg
                             bg-white hover:bg-gray-50 border border-gray-200
                             text-gray-800 text-sm font-medium transition cursor-pointer"
                >
                  ← Back to Customers
                </button>
              </div>
            </div>
          </div>

          {/* ✅ FORM CARD (Full width + bigger spacing) */}
          <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* form header inside card */}
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Customer Information
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Fill required fields and click “Create Customer”.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter customer name"
                    className={`w-full rounded-lg bg-white px-4 py-2.5 text-gray-900
                               focus:outline-none focus:ring-2 focus:ring-blue-500
                               ${errors.name ? "border-red-500" : "border-gray-300"}`}
                  />
                  {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="customer@example.com"
                    className={`w-full rounded-lg bg-white px-4 py-2.5 text-gray-900
                               focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                 errors.email ? "border-red-500" : "border-gray-300"
                               }`}
                  />
                  {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="07xxxxxxxx"
                    maxLength={15}
                    className={`w-full rounded-lg bg-white px-4 py-2.5 text-gray-900
                               focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                 errors.phone ? "border-red-500" : "border-gray-300"
                               }`}
                  />
                  {errors.phone && <p className="mt-2 text-sm text-red-600">{errors.phone}</p>}
                </div>

                
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter address"
                  className={`w-full rounded-lg bg-white px-4 py-2.5 text-gray-900
                             focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                               errors.address ? "border-red-500" : "border-gray-300"
                             }`}
                />
                {errors.address && <p className="mt-2 text-sm text-red-600">{errors.address}</p>}
              </div>

              {/* Buttons */}
              <div className="flex flex-col md:flex-row gap-3 pt-2 md:justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className={`rounded-md cursor-pointer px-4 py-2 text-sm font-medium transition ${
                    loading
                      ? "bg-blue-400 cursor-not-allowed text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {loading ? "Creating..." : "Create"}
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

          {/* bottom spacing */}
          <div className="h-6" />
        </div>
      </div>
    </AdminLayout>
  );
};

export default CreateCustomer;
