import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import toast from "react-hot-toast";

const ViewProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("admin_token");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `http://localhost:8000/api/admin/products/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) throw new Error("Failed to fetch product");

        const result = await res.json();
        const data = result.data || result;

        setProduct(data);
      } catch (e) {
        toast.error("Failed to load product");
        navigate("/admin/products");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id, navigate, token]);

  const Field = ({ label, value }) => (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900">
        {value || "—"}
      </div>
    </div>
  );

  const Badge = ({ active, activeText, inactiveText, activeColor = "green" }) => {
    const colors = {
      green: active ? "bg-green-100 text-green-800" : "",
      yellow: active ? "bg-yellow-100 text-yellow-800" : "",
      blue: active ? "bg-blue-100 text-blue-800" : "",
    };
    
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          active ? colors[activeColor] : "bg-gray-100 text-gray-600"
        }`}
      >
        {active ? activeText : inactiveText}
      </span>
    );
  };

  return (
    <AdminLayout>
      {/* FULL WIDTH WRAPPER */}
      <div className="w-full">
        {/* ✅ HEADER (full width inside content area) */}
        <div className="mb-6">
          <div className="w-full rounded-xl border border-gray-200 bg-gray-100 px-6 py-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Product Details
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                View product information
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

        {/* ✅ CONTENT */}
        {loading ? (
          <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm p-6 text-gray-600">
            Loading product...
          </div>
        ) : !product ? null : (
          <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* TOP BAR */}
            <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center gap-4">
              {/* title section */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl font-semibold text-gray-900">
                  {product.name || "Unnamed Product"}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {product.category || "No category"}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2 justify-center md:justify-start">
                  <Badge
                    active={product.is_available}
                    activeText="Available"
                    inactiveText="Unavailable"
                    activeColor="green"
                  />
                  {product.is_featured && (
                    <Badge
                      active={true}
                      activeText="Featured"
                      inactiveText=""
                      activeColor="yellow"
                    />
                  )}
                  {product.is_new && (
                    <Badge
                      active={true}
                      activeText="New"
                      inactiveText=""
                      activeColor="blue"
                    />
                  )}
                </div>
              </div>

              {/* actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition cursor-pointer"
                >
                  Edit Product
                </button>
              </div>
            </div>

            {/* DETAILS GRID (label = value style) */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Name" value={product.name} />
                <Field
                  label="Price"
                  value={product.price ? `Rs. ${parseFloat(product.price).toFixed(2)}` : null}
                />
                <Field label="Category" value={product.category} />
                <Field label="Image URL" value={product.image} />
              </div>

              {/* Description full width */}
              <div className="mt-5">
                <Field label="Description" value={product.description} />
              </div>

              {/* Image preview */}
              {product.image && (
                <div className="mt-5">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Image Preview</p>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="max-w-md h-48 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Status badges section */}
              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500">Availability</p>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                    <Badge
                      active={product.is_available}
                      activeText="Available"
                      inactiveText="Unavailable"
                      activeColor="green"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500">Featured</p>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                    <Badge
                      active={product.is_featured}
                      activeText="Yes"
                      inactiveText="No"
                      activeColor="yellow"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-gray-500">New Product</p>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                    <Badge
                      active={product.is_new}
                      activeText="Yes"
                      inactiveText="No"
                      activeColor="blue"
                    />
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                {product.created_at && (
                  <Field
                    label="Created At"
                    value={new Date(product.created_at).toLocaleString()}
                  />
                )}

                {product.updated_at && (
                  <Field
                    label="Updated At"
                    value={new Date(product.updated_at).toLocaleString()}
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

export default ViewProduct;
