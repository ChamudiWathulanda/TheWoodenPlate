import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import toast from "react-hot-toast";
import PromotionFormFields from "./PromotionFormFields";

const initialForm = {
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
};

const CreatePromotion = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  const token = localStorage.getItem("admin_token");

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [categoryRes, menuItemRes] = await Promise.all([
          fetch("http://localhost:8000/api/admin/categories", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:8000/api/admin/menu-items", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const categoryData = await categoryRes.json();
        const menuItemData = await menuItemRes.json();

        setCategories(categoryData?.data?.data || categoryData?.data || []);
        setMenuItems(menuItemData?.data?.data || menuItemData?.data || []);
      } catch {
        setCategories([]);
        setMenuItems([]);
      }
    };

    fetchOptions();
  }, [token]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

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
      if (imageFile) {
        submitData.append("image", imageFile);
      }

      const res = await fetch("http://localhost:8000/api/admin/promotions", {
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
        throw new Error(data.message || "Failed to create promotion");
      }

      toast.success("Promotion created successfully");
      navigate("/admin/promotions");
    } catch (error) {
      toast.error(error.message || "Failed to create promotion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex-1 py-8">
        <div className="w-full px-4 md:px-8">
          <div className="mb-6 rounded-xl border border-gray-200 bg-gray-100 px-6 py-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Create Promotion</h1>
                <p className="mt-1 text-sm text-gray-600">Build flexible offers that work at checkout.</p>
              </div>

              <button
                onClick={() => navigate("/admin/promotions")}
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
              >
                Back to Promotions
              </button>
            </div>
          </div>

          <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-5">
              <h2 className="text-lg font-semibold text-gray-900">Promotion Information</h2>
              <p className="mt-1 text-sm text-gray-500">Set the offer rules, targets, and schedule.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              <PromotionFormFields
                formData={formData}
                onChange={handleChange}
                onToggle={handleToggle}
                imagePreview={imagePreview}
                existingImage={null}
                onImageChange={handleImageChange}
                onRemoveImage={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
                categories={categories}
                menuItems={menuItems}
              />

              <div className="flex flex-col gap-3 pt-2 md:flex-row md:justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className={`rounded-md px-4 py-2 text-sm font-medium text-white transition ${
                    loading ? "cursor-not-allowed bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {loading ? "Creating..." : "Create"}
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
        </div>
      </div>
    </AdminLayout>
  );
};

export default CreatePromotion;
