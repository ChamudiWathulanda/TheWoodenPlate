import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import ConfirmModal from "../../components/ConfirmModal";
import toast from "react-hot-toast";

const IngredientList = () => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, low_stock, active
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });

  useEffect(() => {
    fetchIngredients();
  }, [filter]);

  const fetchIngredients = async () => {
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    
    let url = "http://localhost:8000/api/admin/ingredients";
    const params = new URLSearchParams();
    
    if (filter === "low_stock") {
      url = "http://localhost:8000/api/admin/ingredients-low-stock";
    } else if (filter === "active") {
      params.append("is_active", "1");
    }

    try {
      const response = await fetch(`${url}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        setIngredients(result.data);
      } else {
        toast.error("Failed to fetch ingredients");
      }
    } catch (error) {
      toast.error("Error fetching ingredients");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteModal({ open: true, id });
  };

  const handleDeleteConfirm = async () => {
    const id = deleteModal.id;
    if (!id) return;

    const token = localStorage.getItem("admin_token");
    try {
      const response = await fetch(`http://localhost:8000/api/admin/ingredients/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        toast.success("Ingredient deleted successfully");
        fetchIngredients();
      } else {
        toast.error("Failed to delete ingredient");
      }
    } catch (error) {
      toast.error("Error deleting ingredient");
    }
  };

  return (
    <AdminLayout>
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Ingredients Master
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your ingredient inventory
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/admin/inventory"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium shadow-sm"
            >
              View Dashboard
            </Link>
            <Link
              to="/admin/ingredients/create"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm"
            >
              + Add Ingredient
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Ingredients
            </button>
            <button
              onClick={() => setFilter("low_stock")}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === "low_stock"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              🔴 Low Stock
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === "active"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ✅ Active Only
            </button>
          </div>
        </div>

        {/* Ingredients Table */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Top Bar */}
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">
              Ingredient List
              <span className="text-gray-400 font-normal"> ({ingredients.length})</span>
            </p>

            <button
              onClick={fetchIngredients}
              className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 text-sm text-gray-700"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-10 text-center">
              <p className="text-gray-900 font-semibold">Loading...</p>
            </div>
          ) : ingredients.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-900 font-semibold">No ingredients found</p>
              <p className="text-sm text-gray-500 mt-1">
                Add your first ingredient to see it here.
              </p>

              <Link
                to="/admin/ingredients/create"
                className="mt-4 inline-block px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
              >
                + Add Ingredient
              </Link>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="min-w-[1000px] w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    <th className="px-5 py-3">Ingredient</th>
                    <th className="px-5 py-3">Unit</th>
                    <th className="px-5 py-3">Current Stock</th>
                    <th className="px-5 py-3">Reorder Level</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Supplier</th>
                    <th className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {ingredients.map((ingredient) => {
                    const isLowStock = ingredient.current_stock <= ingredient.reorder_level;
                    return (
                      <tr key={ingredient.id} className={isLowStock ? "bg-red-50" : "hover:bg-gray-50"}>
                        <td className="px-5 py-4">
                          <div className="text-sm font-medium text-gray-900">{ingredient.name}</div>
                          {isLowStock && (
                            <span className="text-xs text-red-600 font-semibold">⚠️ Low Stock</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-900">{ingredient.unit}</td>
                        <td className="px-5 py-4">
                          <span className={`text-sm font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                            {ingredient.current_stock}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-900">
                          {ingredient.reorder_level}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              ingredient.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {ingredient.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500">
                          {ingredient.supplier_name || "-"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              to={`/admin/ingredients/${ingredient.id}`}
                              className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                              title="View"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>

                            <Link
                              to={`/admin/ingredients/${ingredient.id}/edit`}
                              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>

                            <button
                              onClick={() => handleDeleteClick(ingredient.id)}
                              className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Ingredient"
        message="Are you sure you want to delete this ingredient? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </AdminLayout>
  );
};

export default IngredientList;
