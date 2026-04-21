import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
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

const ViewPromotion = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [promotion, setPromotion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  const token = localStorage.getItem("admin_token");

  useEffect(() => {
    const fetchPromotion = async () => {
      try {
        setLoading(true);
        const [promotionRes, categoryRes, menuItemRes] = await Promise.all([
          fetch(`http://localhost:8000/api/admin/promotions/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:8000/api/admin/categories", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:8000/api/admin/menu-items", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!promotionRes.ok) throw new Error("Failed to fetch promotion");

        const result = await promotionRes.json();
        const categoryData = await categoryRes.json();
        const menuItemData = await menuItemRes.json();

        setPromotion(result.data || result);
        setCategories(categoryData?.data?.data || categoryData?.data || []);
        setMenuItems(menuItemData?.data?.data || menuItemData?.data || []);
      } catch {
        toast.error("Failed to load promotion");
        navigate("/admin/promotions");
      } finally {
        setLoading(false);
      }
    };

    fetchPromotion();
  }, [id, navigate, token]);

  const isPromotionActive = () => {
    if (!promotion || !promotion.is_active) return false;

    const now = new Date();
    const start = getPromotionTimeValue(promotion.starts_at);
    const end = getPromotionTimeValue(promotion.ends_at);

    if (start !== null && now.getTime() < start) return false;
    if (end !== null && now.getTime() > end) return false;
    return true;
  };

  const Field = ({ label, value }) => (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900">
        {value || "-"}
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="w-full">
        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-100 px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Promotion Details</h1>
              <p className="mt-1 text-sm text-gray-600">Review how this offer behaves at checkout.</p>
            </div>

            <button
              onClick={() => navigate("/admin/promotions")}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
            >
              Back to Promotions
            </button>
          </div>
        </div>

        {loading ? (
          <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 text-gray-600 shadow-sm">
            Loading promotion...
          </div>
        ) : !promotion ? null : (
          <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-gray-200 p-6 md:flex-row md:items-center">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl font-semibold text-gray-900">{promotion.title || "Unnamed Promotion"}</h2>
                <p className="mt-1 text-sm text-gray-600">{getPromotionTypeLabel(promotion)}</p>

                <div className="mt-2 flex items-center justify-center gap-2 md:justify-start">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isPromotionActive() ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {isPromotionActive() ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate(`/admin/promotions/edit/${promotion.id}`)}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Edit Promotion
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Title" value={promotion.title} />
                <Field label="Offer Type" value={getPromotionTypeLabel(promotion)} />
                <Field label="Discount / Rule" value={getPromotionValueLabel(promotion)} />
                <Field
                  label="Application"
                  value={
                    promotion.application_type === "order"
                      ? "Order Level"
                      : promotion.application_type === "item"
                        ? "Item Level"
                        : "Buy X Get Y"
                  }
                />
                <Field label="Status" value={promotion.is_active ? "Enabled" : "Disabled"} />
                <Field label="Target" value={getTargetSummary(promotion, categories, menuItems)} />
                <Field
                  label="Days"
                  value={
                    promotion.applicable_days?.length
                      ? DAY_OPTIONS.filter((day) => promotion.applicable_days.includes(day.value))
                          .map((day) => day.label)
                          .join(", ")
                      : "Every day"
                  }
                />
                <Field
                  label="Start Date"
                  value={promotion.starts_at ? formatPromotionDateTime(promotion.starts_at) : "No start date"}
                />
                <Field
                  label="End Date"
                  value={promotion.ends_at ? formatPromotionDateTime(promotion.ends_at) : "No end date"}
                />

                <div className="md:col-span-2">
                  <Field label="Description" value={promotion.description || "No description available"} />
                </div>

                {promotion.created_at && (
                  <Field label="Created At" value={new Date(promotion.created_at).toLocaleString()} />
                )}

                {promotion.updated_at && (
                  <Field label="Updated At" value={new Date(promotion.updated_at).toLocaleString()} />
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
