import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import toast from "react-hot-toast";

const CreateProduct = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    is_available: true,
    is_featured: false,
    is_new: true,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  const token = localStorage.getItem("admin_token");

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/admin/categories", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        setCategories(data.data || data || []);
      } catch (err) {
        console.error("Failed to load categories");
      }
    };
    fetchCategories();
  }, [token]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("price", formData.price);
      submitData.append("description", formData.description || "");
      submitData.append("category", formData.category || "");
      submitData.append("is_available", formData.is_available ? "1" : "0");
      submitData.append("is_featured", formData.is_featured ? "1" : "0");
      submitData.append("is_new", formData.is_new ? "1" : "0");
      if (imageFile) {
        submitData.append("image", imageFile);
      }

      const res = await fetch("http://localhost:8000/api/admin/products", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitData,
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle validation errors (422)
        if (res.status === 422 && data.errors) {
          const errorMessages = Object.values(data.errors).flat();
          errorMessages.forEach((msg) => toast.error(msg));
          return;
        }
        throw new Error(data.message || "Failed to create product");
      }

      toast.success("Product created successfully");
      navigate("/admin/products");
    } catch (err) {
      toast.error(err.message || "Failed to create product");
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
                    Create Product
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Add a new product to the system
                  </p>
                </div>

                <button
                  onClick={() => navigate("/admin/products")}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg
                             bg-white hover:bg-gray-50 border border-gray-200
                             text-gray-800 text-sm font-medium transition cursor-pointer"
                >
                  ← Back to Products
                </button>
              </div>
            </div>
          </div>

          {/* ✅ FORM CARD (Full width + bigger spacing) */}
          <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* form header inside card */}
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Product Information
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Fill required fields and click "Create".
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
                    placeholder="Enter product name"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Product Image
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-3
                                 file:rounded-md file:border-0 file:text-sm file:font-medium
                                 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {imagePreview && (
                      <div className="relative w-32 h-32">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter product description"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900
                             focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_available"
                    checked={formData.is_available}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-800">
                    Available for order
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-800">
                    Featured product
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_new"
                    checked={formData.is_new}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-800">
                    New product
                  </label>
                </div>
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
                  onClick={() => navigate("/admin/products")}
                  className="rounded-md px-4 py-2 text-sm font-medium
                            bg-gray-100 hover:bg-gray-200 border border-gray-200
                            text-gray-800 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CreateProduct;
