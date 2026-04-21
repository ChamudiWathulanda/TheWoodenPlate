import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import ConfirmModal from "../../components/ConfirmModal";
import toast from "react-hot-toast";
import PromotionFormFields from "./PromotionFormFields";
import { toPromotionDateTimeInput } from "../../../utils/promotionDateTime";

const EditPromotion = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    application_type: "order",
    target_type: "all",
    target_ids: [],
    applicable_days: [],
    type: "percentage",
    value: "",
    buy_quantity: "1",
    get_quantity: "1",
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
        const promotion = result.data || result;
        const categoryData = await categoryRes.json();
        const menuItemData = await menuItemRes.json();

        setCategories(categoryData?.data?.data || categoryData?.data || []);
        setMenuItems(menuItemData?.data?.data || menuItemData?.data || []);
        setFormData({
          title: promotion?.title ?? "",
          application_type: promotion?.application_type ?? "order",
          target_type: promotion?.target_type ?? "all",
          target_ids: promotion?.target_ids ?? [],
          applicable_days: promotion?.applicable_days ?? [],
          type: promotion?.type ?? "percentage",
          value: promotion?.application_type === "bxgy" ? "100" : promotion?.value ?? "",
          buy_quantity: promotion?.buy_quantity ? String(promotion.buy_quantity) : "1",
          get_quantity: promotion?.get_quantity ? String(promotion.get_quantity) : "1",
          starts_at: toPromotionDateTimeInput(promotion?.starts_at),
          ends_at: toPromotionDateTimeInput(promotion?.ends_at),
          is_active: promotion?.is_active ?? true,
          description: promotion?.description ?? "",
        });
        setExistingImage(promotion?.image ?? null);
      } catch {
        toast.error("Failed to load promotion");
        navigate("/admin/promotions");
      } finally {
        setLoading(false);
      }
    };

    fetchPromotion();
  }, [id, navigate, token]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "application_type") {
        if (value === "bxgy") {
          next.type = "percentage";
          next.value = "100";
          if (prev.target_type === "all") {
            next.target_type = "menu_items";
          }
        } else if (prev.application_type === "bxgy") {
          next.value = "";
        }
      }

      if (name === "target_type" && value === "all") {
        next.target_ids = [];
      }

      return next;
    });
  };

  const handleToggle = (kind, value) => {
    setFormData((prev) => {
      if (kind === "day") {
        const exists = prev.applicable_days.includes(value);
        return {
          ...prev,
          applicable_days: exists
            ? prev.applicable_days.filter((item) => item !== value)
            : [...prev.applicable_days, value],
        };
      }

      const normalizedValue = String(value);
      const exists = prev.target_ids.map(String).includes(normalizedValue);
      return {
        ...prev,
        target_ids: exists
          ? prev.target_ids.filter((item) => String(item) !== normalizedValue)
          : [...prev.target_ids, normalizedValue],
      };
    });
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleConfirmUpdate = async () => {
    setSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("application_type", formData.application_type);
      submitData.append("target_type", formData.target_type);
      submitData.append("target_ids", JSON.stringify(formData.target_ids));
      submitData.append("applicable_days", JSON.stringify(formData.applicable_days));
      submitData.append("type", formData.application_type === "bxgy" ? "percentage" : formData.type);
      submitData.append("value", formData.application_type === "bxgy" ? "100" : formData.value);
      submitData.append("buy_quantity", formData.application_type === "bxgy" ? formData.buy_quantity : "");
      submitData.append("get_quantity", formData.application_type === "bxgy" ? formData.get_quantity : "");
      submitData.append("starts_at", formData.starts_at || "");
      submitData.append("ends_at", formData.ends_at || "");
      submitData.append("is_active", formData.is_active ? "1" : "0");
      submitData.append("description", formData.description || "");
      submitData.append("_method", "PUT");
      if (imageFile) {
        submitData.append("image", imageFile);
      }

      const res = await fetch(`http://localhost:8000/api/admin/promotions/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: submitData,
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 422 && data.errors) {
          Object.values(data.errors).flat().forEach((message) => toast.error(message));
          return;
        }
        throw new Error(data.message || "Failed to update promotion");
      }

      toast.success("Promotion updated successfully");
      navigate("/admin/promotions");
    } catch (error) {
      toast.error(error.message || "Failed to update promotion");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="w-full">
        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-100 px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Edit Promotion</h1>
              <p className="mt-1 text-sm text-gray-600">Update the offer logic and schedule.</p>
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
        ) : (
          <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-gray-200 p-6 md:flex-row md:items-center">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl font-semibold text-gray-900">Update Details</h2>
                <p className="mt-1 text-sm text-gray-600">Change fields and save the new offer behavior.</p>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/admin/promotions/view/${id}`)}
                className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
              >
                View
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!submitting) {
                  setShowConfirm(true);
                }
              }}
              className="p-6"
            >
              <PromotionFormFields
                formData={formData}
                onChange={handleChange}
                onToggle={handleToggle}
                imagePreview={imagePreview}
                existingImage={existingImage}
                onImageChange={handleImageChange}
                onRemoveImage={() => {
                  setImageFile(null);
                  setImagePreview(null);
                  setExistingImage(null);
                }}
                categories={categories}
                menuItems={menuItems}
              />

              <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`rounded-md px-4 py-2 text-sm font-medium text-white transition ${
                    submitting ? "cursor-not-allowed bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {submitting ? "Updating..." : "Update Promotion"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/admin/promotions")}
                  className="rounded-md border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-200"
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
