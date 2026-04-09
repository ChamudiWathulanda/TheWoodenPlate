import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import ConfirmModal from "../../components/ConfirmModal";
import toast from "react-hot-toast";

const EditPromotion = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    type: "percentage",
    value: "",
    starts_at: "",
    ends_at: "",
    is_active: true,
    description: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
        const data = result.data || result;

        setFormData({
          title: data?.title ?? "",
          type: data?.type ?? "percentage",
          value: data?.value ?? "",
          starts_at: data?.starts_at ? data.starts_at.slice(0, 16) : "",
          ends_at: data?.ends_at ? data.ends_at.slice(0, 16) : "",
          is_active: data?.is_active ?? true,
          description: data?.description ?? "",
        });
        if (data?.image) {
          setExistingImage(data.image);
        }
      } catch (err) {
        toast.error("Failed to load promotion");
        navigate("/admin/promotions");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPromotion();
  }, [id, navigate, token]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;
    setShowConfirm(true);
  };

  const handleConfirmUpdate = async () => {
    setSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("type", formData.type);
      submitData.append("value", formData.value);
      submitData.append("starts_at", formData.starts_at || "");
      submitData.append("ends_at", formData.ends_at || "");
      submitData.append("is_active", formData.is_active ? "1" : "0");
      submitData.append("description", formData.description || "");
      submitData.append("_method", "PUT");
      if (imageFile) {
        submitData.append("image", imageFile);
      }

      const res = await fetch(
        `http://localhost:8000/api/admin/promotions/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: submitData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 422 && data.errors) {
          const errorMessages = Object.values(data.errors).flat();
          errorMessages.forEach((msg) => toast.error(msg));
          return;
        }
        throw new Error(data.message || "Failed to update promotion");
      }

      toast.success("Promotion updated successfully");
      navigate("/admin/promotions");
    } catch (e2) {
      toast.error(e2.message || "Failed to update promotion");
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
                Edit Promotion
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Update promotion information
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
        ) : (
          <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* TOP BAR (like view card top) */}
            <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl font-semibold text-gray-900">
                  Update Details
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Change fields and click "Update Promotion"
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/admin/promotions/view/${id}`)}
                  className="px-5 py-2.5 rounded-lg bg-white hover:bg-gray-50 border border-gray-200
                             text-gray-800 text-sm font-medium transition cursor-pointer"
                >
                  View
                </button>
              </div>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Title */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500">
                    Promotion Title <span className="text-red-500">*</span>
                  </p>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    placeholder="e.g., Weekend Special"
                  />
                </div>

                {/* Type */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500">
                    Discount Type <span className="text-red-500">*</span>
                  </p>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Rs.)</option>
                  </select>
                </div>

                {/* Value */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500">
                    Discount Value <span className="text-red-500">*</span>
                  </p>
                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    required
                    min="0"
                    max={formData.type === "percentage" ? "100" : undefined}
                    step="0.01"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    placeholder={
                      formData.type === "percentage"
                        ? "e.g., 20 for 20%"
                        : "e.g., 1000.00 for Rs. 1000"
                    }
                  />
                  {formData.type === "percentage" && (
                    <p className="text-xs text-gray-500">Maximum value is 100%</p>
                  )}
                </div>

                {/* Start Date */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500">Start Date & Time</p>
                  <input
                    type="datetime-local"
                    name="starts_at"
                    value={formData.starts_at}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>

                {/* End Date */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500">End Date & Time</p>
                  <input
                    type="datetime-local"
                    name="ends_at"
                    value={formData.ends_at}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-2 md:col-span-2">
                  <p className="text-xs font-semibold text-gray-500">Description</p>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition resize-none"
                    placeholder="Enter promotion description"
                  />
                </div>

                {/* Image Upload */}
                <div className="flex flex-col gap-2 md:col-span-2">
                  <p className="text-xs font-semibold text-gray-500">Promotion Image</p>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition
                                 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0
                                 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {(imagePreview || existingImage) && (
                      <div className="relative w-32 h-32">
                        <img
                          src={imagePreview || (existingImage?.startsWith('http') ? existingImage : `http://localhost:8000/storage/${existingImage}`)}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                            setExistingImage(null);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center md:col-span-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                    Promotion is active
                  </label>
                </div>
              </div>

              {/* ACTION BUTTONS */}
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
                  {submitting ? "Updating..." : "Update Promotion"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/admin/promotions")}
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
        title="Update Promotion"
        message="Are you sure you want to update this promotion?"
        confirmText="Update"
        cancelText="Cancel"
        type="warning"
      />
    </AdminLayout>
  );
};

export default EditPromotion;
