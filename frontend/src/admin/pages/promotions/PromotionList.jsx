import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import ConfirmModal from "../../components/ConfirmModal";
import toast from "react-hot-toast";
import {
  DAY_OPTIONS,
  getPromotionTypeLabel,
  getPromotionValueLabel,
  getTargetSummary,
} from "./promotionFormConfig";
import {
  formatPromotionDateTime,
  getPromotionTimeValue,
} from "../../../utils/promotionDateTime";

const PromotionList = () => {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const token = localStorage.getItem("admin_token");

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setLoading(true);
        const [promotionRes, categoryRes, menuItemRes] = await Promise.all([
          fetch("http://localhost:8000/api/admin/promotions", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:8000/api/admin/categories", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:8000/api/admin/menu-items", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!promotionRes.ok) throw new Error("Failed to fetch promotions");

        const promotionData = await promotionRes.json();
        const categoryData = categoryRes.ok ? await categoryRes.json() : { data: [] };
        const menuItemData = menuItemRes.ok ? await menuItemRes.json() : { data: [] };

        setPromotions(promotionData.data?.data || promotionData.data || []);
        setCategories(categoryData?.data?.data || categoryData?.data || []);
        setMenuItems(menuItemData?.data?.data || menuItemData?.data || []);
      } catch {
        toast.error("Failed to load promotions");
        setPromotions([]);
        setCategories([]);
        setMenuItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, [token]);

  const handleDeleteConfirm = async () => {
    const id = deleteModal.id;
    if (!id) return;

    try {
      const res = await fetch(`http://localhost:8000/api/admin/promotions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete promotion");
      toast.success("Promotion deleted successfully");
      setPromotions((prev) => prev.filter((promotion) => promotion.id !== id));
    } catch {
      toast.error("Failed to delete promotion");
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const res = await fetch(`http://localhost:8000/api/admin/promotions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      toast.success(`Promotion ${!currentStatus ? "activated" : "deactivated"} successfully`);
      setPromotions((prev) =>
        prev.map((promotion) =>
          promotion.id === id ? { ...promotion, is_active: !currentStatus } : promotion
        )
      );
    } catch {
      toast.error("Failed to update promotion status");
    }
  };

  const formatScheduleDateTime = (dateString) => {
    if (!dateString) return "-";
    return formatPromotionDateTime(dateString, "en-US");
  };

  const formatDaySummary = (promotion) => {
    if (!promotion.applicable_days?.length) return "Every day";

    return DAY_OPTIONS.filter((day) => promotion.applicable_days.includes(day.value))
      .map((day) => day.label.slice(0, 3))
      .join(", ");
  };

  const getScheduleStatus = (promotion) => {
    if (!promotion.is_active) {
      return { label: "Disabled", className: "bg-gray-100 text-gray-700" };
    }

    const now = new Date();
    const start = getPromotionTimeValue(promotion.starts_at);
    const end = getPromotionTimeValue(promotion.ends_at);

    if (start !== null && now.getTime() < start) {
      return { label: "Upcoming", className: "bg-amber-100 text-amber-800" };
    }

    if (end !== null && now.getTime() > end) {
      return { label: "Expired", className: "bg-red-100 text-red-700" };
    }

    return { label: "Live", className: "bg-emerald-100 text-emerald-800" };
  };

  const filteredPromotions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return promotions.filter((promotion) => {
      const scheduleStatus = getScheduleStatus(promotion).label.toLowerCase();
      const targetSummary = getTargetSummary(promotion, categories, menuItems).toLowerCase();
      const matchesSearch =
        query === "" ||
        [
          promotion.title,
          promotion.description,
          promotion.application_type,
          promotion.target_type,
          getPromotionTypeLabel(promotion),
          getPromotionValueLabel(promotion),
          targetSummary,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "all" || scheduleStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [categories, menuItems, promotions, searchTerm, statusFilter]);

  const totalPages = useMemo(
    () => Math.ceil(filteredPromotions.length / itemsPerPage) || 1,
    [filteredPromotions.length, itemsPerPage]
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPromotions = filteredPromotions.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const filterChips = [
    { value: "all", label: "All" },
    { value: "live", label: "Live" },
    { value: "upcoming", label: "Upcoming" },
    { value: "disabled", label: "Disabled" },
  ];

  return (
    <AdminLayout>
      <div className="flex-1 py-8">
        <div className="w-full px-4 md:px-8">
          <div className="mb-6 rounded-xl border border-gray-200 bg-gray-100 px-6 py-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Promotions</h1>
                <p className="mt-1 text-sm text-gray-600">Manage checkout-ready discount logic.</p>
              </div>

              <button
                onClick={() => navigate("/admin/promotions/create")}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
              >
                + Create Promotion
              </button>
            </div>
          </div>

          <div className="overflow-visible rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Promotion List <span className="font-normal text-gray-400">({filteredPromotions.length})</span>
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Search by title, target, offer type, or rule details.
                  </p>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search promotions..."
                      className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:w-80"
                    />
                    <svg
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  {filteredPromotions.length > 0 && (
                    <select
                      value={itemsPerPage}
                      onChange={(event) => {
                        setItemsPerPage(Number(event.target.value));
                        setCurrentPage(1);
                      }}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={10}>10 per page</option>
                      <option value={25}>25 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {filterChips.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setStatusFilter(chip.value)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      statusFilter === chip.value
                        ? "bg-blue-600 text-white shadow-sm"
                        : "border border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:text-blue-700"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-sm text-gray-600">Loading promotions...</div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full border-separate border-spacing-0">
                  <thead className="bg-gray-50">
                    <tr className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                      <th className="w-16 border-r border-gray-200 px-4 py-3 text-center">ID</th>
                      <th className="min-w-[240px] border-r border-gray-200 px-4 py-3 text-left">Promotion</th>
                      <th className="min-w-[170px] border-r border-gray-200 px-4 py-3 text-center">Offer Type</th>
                      <th className="min-w-[120px] border-r border-gray-200 px-4 py-3 text-left">Value</th>
                      <th className="min-w-[220px] border-r border-gray-200 px-4 py-3 text-left">Target</th>
                      <th className="min-w-[120px] border-r border-gray-200 px-4 py-3 text-center">Days</th>
                      <th className="min-w-[190px] border-r border-gray-200 px-4 py-3 text-left">Schedule</th>
                      <th className="w-28 border-r border-gray-200 px-4 py-3 text-center">Live Status</th>
                      <th className="w-28 border-r border-gray-200 px-4 py-3 text-center">Enabled</th>
                      <th className="w-32 px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="text-sm text-gray-700">
                    {filteredPromotions.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="border-t border-gray-200 px-5 py-12 text-center">
                          <p className="font-semibold text-gray-900">
                            {promotions.length === 0 ? "No promotions found" : "No promotions match your filters"}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {promotions.length === 0
                              ? "Create your first promotion to see it here."
                              : "Try a different keyword or switch the filter chip."}
                          </p>
                          {promotions.length === 0 ? (
                            <button
                              onClick={() => navigate("/admin/promotions/create")}
                              className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                            >
                              + Create Promotion
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSearchTerm("");
                                setStatusFilter("all");
                              }}
                              className="mt-4 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
                            >
                              Clear Filters
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      paginatedPromotions.map((promotion) => {
                        const scheduleStatus = getScheduleStatus(promotion);

                        return (
                        <tr key={promotion.id} className="hover:bg-gray-50">
                          <td className="border-r border-t border-gray-200 px-4 py-3 text-center font-semibold text-gray-900">
                            {promotion.id}
                          </td>
                          <td className="border-r border-t border-gray-200 px-4 py-3 text-left">
                            <div className="space-y-1">
                              <div className="font-semibold text-gray-900">{promotion.title || "-"}</div>
                              <div className="text-xs text-gray-500">
                                {promotion.application_type === "order"
                                  ? "Order level"
                                  : promotion.application_type === "item"
                                    ? "Item level"
                                    : "Buy X Get Y"}
                              </div>
                              <div className="line-clamp-2 text-xs text-gray-500">
                                {promotion.description || "No description added"}
                              </div>
                            </div>
                          </td>
                          <td className="border-r border-t border-gray-200 px-4 py-3 text-center">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                promotion.application_type === "bxgy"
                                  ? "bg-amber-100 text-amber-800"
                                  : promotion.type === "percentage"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {getPromotionTypeLabel(promotion)}
                            </span>
                          </td>
                          <td className="border-r border-t border-gray-200 px-4 py-3 text-left">
                            {getPromotionValueLabel(promotion)}
                          </td>
                          <td className="border-r border-t border-gray-200 px-4 py-3 text-left">
                            <div className="max-w-[220px]">
                              <div className="font-medium text-gray-900">
                                {getTargetSummary(promotion, categories, menuItems)}
                              </div>
                              <div className="mt-1 text-xs text-gray-500 capitalize">
                                {promotion.target_type === "all" ? "all items" : promotion.target_type.replace("_", " ")}
                              </div>
                            </div>
                          </td>
                          <td className="border-r border-t border-gray-200 px-4 py-3 text-center text-xs text-gray-600">
                            {formatDaySummary(promotion)}
                          </td>
                          <td className="border-r border-t border-gray-200 px-4 py-3 text-left text-xs text-gray-600">
                            <div>Start: {formatScheduleDateTime(promotion.starts_at)}</div>
                            <div className="mt-1">End: {formatScheduleDateTime(promotion.ends_at)}</div>
                          </td>
                          <td className="border-r border-t border-gray-200 px-4 py-3 text-center">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${scheduleStatus.className}`}>
                              {scheduleStatus.label}
                            </span>
                          </td>
                          <td className="border-r border-t border-gray-200 px-4 py-3 text-center">
                            <button
                              onClick={() => handleToggleStatus(promotion.id, promotion.is_active)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                promotion.is_active ? "bg-green-500" : "bg-gray-300"
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  promotion.is_active ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
                            </button>
                          </td>
                          <td className="border-t border-gray-200 px-5 py-3">
                            <div className="flex items-center justify-center gap-6">
                              <button
                                onClick={() => navigate(`/admin/promotions/view/${promotion.id}`)}
                                title="View"
                                className="rounded-md border border-blue-200 bg-blue-50 p-1.5 text-blue-600 transition hover:bg-blue-100"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>

                              <button
                                onClick={() => navigate(`/admin/promotions/edit/${promotion.id}`)}
                                title="Edit"
                                className="rounded-md border border-gray-300 bg-gray-100 p-1.5 text-gray-800 transition hover:bg-gray-200"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>

                              <button
                                onClick={() => setDeleteModal({ open: true, id: promotion.id })}
                                title="Delete"
                                className="rounded-md border border-red-200 bg-red-50 p-1.5 text-red-600 transition hover:bg-red-100"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredPromotions.length > 0 && (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{" "}
                  <span className="font-semibold text-gray-900">{Math.min(endIndex, filteredPromotions.length)}</span> of{" "}
                  <span className="font-semibold text-gray-900">{filteredPromotions.length}</span> results
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>

                  <button className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white" disabled>
                    {currentPage} / {totalPages}
                  </button>

                  <button
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Promotion"
        message="Are you sure you want to delete this promotion? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </AdminLayout>
  );
};

export default PromotionList;
