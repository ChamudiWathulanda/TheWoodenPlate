import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import ConfirmModal from '../../components/ConfirmModal';
import toast from 'react-hot-toast';

const MenuItemList = () => {
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // delete modal
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });

  const token = localStorage.getItem('admin_token');

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch categories');

      const data = await res.json();
      setCategories(data.data || []);
    } catch (e) {
      console.error('Failed to fetch categories');
    }
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);

      const res = await fetch('http://localhost:8000/api/admin/menu-items', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch menu items');

      const data = await res.json();
      setMenuItems(data.data || []);
    } catch (e) {
      toast.error('Failed to load menu items');
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchMenuItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  const handleDeleteClick = (id) => {
    setDeleteModal({ open: true, id });
  };

  const handleDeleteConfirm = async () => {
    const id = deleteModal.id;
    if (!id) return;

    try {
      const res = await fetch(`http://localhost:8000/api/admin/menu-items/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete menu item');

      toast.success('Menu item deleted successfully');
      setMenuItems((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      toast.error('Failed to delete menu item');
    }
  };

  const toggleAvailability = async (item) => {
    try {
      const res = await fetch(`http://localhost:8000/api/admin/menu-items/${item.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...item,
          category_id: item.category_id,
          is_available: !item.is_available,
        }),
      });

      if (!res.ok) throw new Error('Failed to update availability');

      toast.success('Availability updated successfully');
      fetchMenuItems();
    } catch (e) {
      toast.error('Failed to update availability');
    }
  };

  const togglePopular = async (item) => {
    try {
      const res = await fetch(`http://localhost:8000/api/admin/menu-items/${item.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...item,
          category_id: item.category_id,
          is_popular: !item.is_popular,
        }),
      });

      if (!res.ok) throw new Error('Failed to update popular status');

      toast.success(item.is_popular ? 'Removed from popular items' : 'Added to popular items');
      fetchMenuItems();
    } catch (e) {
      toast.error('Failed to update popular status');
    }
  };

  // pagination derived values
  const filteredMenuItems = useMemo(() => {
    if (selectedCategory === 'all') return menuItems;

    return menuItems.filter((item) => String(item.category_id) === selectedCategory);
  }, [menuItems, selectedCategory]);

  const totalPages = useMemo(
    () => Math.ceil(filteredMenuItems.length / itemsPerPage) || 1,
    [filteredMenuItems.length, itemsPerPage]
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMenuItems = filteredMenuItems.slice(startIndex, endIndex);

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  return (
    <AdminLayout>
      <div className="flex-1 py-8">
        <div className="w-full md:px-8 px-4">
          {/* Header card */}
          <div className="mb-6">
            <div className="bg-gray-100 border border-gray-200 rounded-xl px-6 py-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Menu Items
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage your menu items
                  </p>
                </div>

                <button
                  onClick={() => navigate('/admin/menu-items/create')}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg
                             bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition cursor-pointer"
                >
                  + Create Menu Item
                </button>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-visible">
            {/* top bar */}
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-gray-900">
                Menu Item List{' '}
                <span className="text-gray-400 font-normal">
                  ({filteredMenuItems.length})
                </span>
              </p>

              {menuItems.length > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-700
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={String(category.id)}>
                        {category.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                    className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-gray-700
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                </div>
              )}
            </div>

            {loading ? (
              <div className="p-8 text-sm text-gray-600">Loading menu items...</div>
            ) : (
              <div className="w-full">
                <table className="w-full border-separate border-spacing-0">
                  <thead className="bg-gray-50">
                    <tr className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                      <th className="px-4 py-3 w-16 text-center border-r border-gray-200">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left border-r border-gray-200">
                        Item
                      </th>
                      <th className="px-4 py-3 w-32 text-left border-r border-gray-200">
                        Category
                      </th>
                      <th className="px-4 py-3 w-28 text-center border-r border-gray-200">
                        Price
                      </th>
                      <th className="px-4 py-3 w-28 text-center border-r border-gray-200">
                        Status
                      </th>
                      <th className="px-4 py-3 w-28 text-center border-r border-gray-200">
                        Popular
                      </th>
                      <th className="px-4 py-3 w-32 text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="text-sm text-gray-700">
                    {filteredMenuItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-12 border-t border-gray-200 text-center"
                        >
                          <p className="text-gray-900 font-semibold">
                            {menuItems.length === 0 ? 'No menu items found' : 'No menu items match this category'}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {menuItems.length === 0
                              ? 'Create your first menu item to see it here.'
                              : 'Try selecting a different category or clear the filter.'}
                          </p>
                          {menuItems.length === 0 ? (
                            <button
                              onClick={() => navigate('/admin/menu-items/create')}
                              className="mt-4 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
                            >
                              + Create Menu Item
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedCategory('all')}
                              className="mt-4 px-5 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium"
                            >
                              Clear Filter
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      paginatedMenuItems.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 w-16 border-t border-gray-200 border-r border-gray-200 font-semibold text-gray-900 text-center">
                            {m.id}
                          </td>

                          <td className="px-4 py-3 border-t border-gray-200 border-r border-gray-200 text-left">
                            <div className="flex items-center gap-3">
                              {m.image && (
                                <img
                                  src={m.image}
                                  alt={m.name}
                                  className="w-10 h-10 rounded object-cover"
                                />
                              )}
                              <div>
                                <div className="truncate text-gray-900 font-medium">
                                  {m.name || '—'}
                                </div>
                                {m.description && (
                                  <div className="text-xs text-gray-500 truncate max-w-xs">
                                    {m.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 w-32 border-t border-gray-200 border-r border-gray-200 text-left">
                            {m.category?.name || 'N/A'}
                          </td>

                          <td className="px-4 py-3 w-28 border-t border-gray-200 border-r border-gray-200 text-center font-semibold">
                            Rs. {parseFloat(m.price).toFixed(2)}
                          </td>

                          <td className="px-4 py-3 w-28 border-t border-gray-200 border-r border-gray-200 text-center">
                            <button
                              onClick={() => toggleAvailability(m)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                                m.is_available ? "bg-green-500" : "bg-gray-300"
                              }`}
                              title={m.is_available ? "Click to make unavailable" : "Click to make available"}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  m.is_available ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
                            </button>
                          </td>

                          <td className="px-4 py-3 w-28 border-t border-gray-200 border-r border-gray-200 text-center">
                            <button
                              onClick={() => togglePopular(m)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                                m.is_popular ? "bg-amber-500" : "bg-gray-300"
                              }`}
                              title={m.is_popular ? "Click to remove from popular" : "Click to mark as popular"}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  m.is_popular ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
                            </button>
                          </td>

                          {/* Actions: icons only */}
                          <td className="px-5 py-3 w-32 border-t border-gray-200">
                            <div className="flex items-center justify-center gap-6">
                              {/* VIEW */}
                              <button
                                onClick={() => navigate(`/admin/menu-items/${m.id}`)}
                                title="View"
                                className="p-1.5 rounded-md border border-blue-200 bg-blue-50 
                                           text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              </button>

                              {/* EDIT */}
                              <button
                                onClick={() => navigate(`/admin/menu-items/${m.id}/edit`)}
                                title="Edit"
                                className="p-1.5 rounded-md border border-gray-300 bg-gray-100 
                                           text-gray-800 hover:bg-gray-200 transition cursor-pointer"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>

                              {/* DELETE */}
                              <button
                                onClick={() => handleDeleteClick(m.id)}
                                title="Delete"
                                className="p-1.5 rounded-md border border-red-200 bg-red-50 
                                           text-red-600 hover:bg-red-100 transition cursor-pointer"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination footer */}
            {!loading && filteredMenuItems.length > 0 && (
              <div className="px-5 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-gray-600">
                  Showing{' '}
                  <span className="font-semibold text-gray-900">
                    {startIndex + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-semibold text-gray-900">
                    {Math.min(endIndex, filteredMenuItems.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-gray-900">
                    {filteredMenuItems.length}
                  </span>{' '}
                  results
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700
                               hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>

                  <button
                    className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium"
                    disabled
                  >
                    {currentPage} / {totalPages}
                  </button>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700
                               hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Menu Item"
        message="Are you sure you want to delete this menu item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </AdminLayout>
  );
};

export default MenuItemList;
