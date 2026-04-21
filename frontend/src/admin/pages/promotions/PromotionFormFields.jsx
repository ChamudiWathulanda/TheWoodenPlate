import React from "react";
import { APPLICATION_OPTIONS, DAY_OPTIONS, TARGET_OPTIONS } from "./promotionFormConfig";

const inputClassName =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition";

const SelectionList = ({ title, items, selectedIds, onToggle, emptyText }) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
    <p className="text-sm font-semibold text-gray-800">{title}</p>
    <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyText}</p>
      ) : (
        items.map((item) => (
          <label
            key={item.id}
            className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 hover:border-blue-300"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{item.name}</p>
              {item.meta && <p className="text-xs text-gray-500">{item.meta}</p>}
            </div>
            <input
              type="checkbox"
              checked={selectedIds.includes(String(item.id))}
              onChange={() => onToggle("target", String(item.id))}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
        ))
      )}
    </div>
  </div>
);

const PromotionFormFields = ({
  formData,
  onChange,
  onToggle,
  imagePreview,
  existingImage,
  onImageChange,
  onRemoveImage,
  categories,
  menuItems,
}) => {
  const selectedTargetIds = (formData.target_ids || []).map(String);
  const isBxgy = formData.application_type === "bxgy";
  const showTargetSelector = formData.target_type !== "all";
  const selectionItems =
    formData.target_type === "categories"
      ? categories.map((item) => ({ id: item.id, name: item.name }))
      : menuItems.map((item) => ({
          id: item.id,
          name: item.name,
          meta: `${item.category?.name || "No category"} • Rs. ${Number(item.price || 0).toFixed(2)}`,
        }));

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-gray-500">
          Promotion Title <span className="text-red-500">*</span>
        </p>
        <input type="text" name="title" value={formData.title} onChange={onChange} required className={inputClassName} placeholder="e.g., Weekend 15% Off Burgers" />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-gray-500">
          Offer Mode <span className="text-red-500">*</span>
        </p>
        <select name="application_type" value={formData.application_type} onChange={onChange} className={inputClassName}>
          {APPLICATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500">
          {APPLICATION_OPTIONS.find((option) => option.value === formData.application_type)?.description}
        </p>
      </div>

      {!isBxgy && (
        <>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-500">
              Discount Type <span className="text-red-500">*</span>
            </p>
            <select name="type" value={formData.type} onChange={onChange} className={inputClassName}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (Rs.)</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-500">
              Discount Value <span className="text-red-500">*</span>
            </p>
            <input type="number" name="value" value={formData.value} onChange={onChange} required min="0" max={formData.type === "percentage" ? "100" : undefined} step="0.01" className={inputClassName} placeholder={formData.type === "percentage" ? "10" : "500.00"} />
          </div>
        </>
      )}

      {isBxgy && (
        <>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-500">
              Buy Quantity <span className="text-red-500">*</span>
            </p>
            <input type="number" name="buy_quantity" value={formData.buy_quantity} onChange={onChange} required min="1" step="1" className={inputClassName} placeholder="1" />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-500">
              Free Quantity <span className="text-red-500">*</span>
            </p>
            <input type="number" name="get_quantity" value={formData.get_quantity} onChange={onChange} required min="1" step="1" className={inputClassName} placeholder="1" />
          </div>
        </>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-gray-500">
          Target Scope <span className="text-red-500">*</span>
        </p>
        <select name="target_type" value={formData.target_type} onChange={onChange} className={inputClassName}>
          {TARGET_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-gray-500">Applicable Days</p>
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-4">
          {DAY_OPTIONS.map((day) => (
            <label key={day.value} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={(formData.applicable_days || []).includes(day.value)}
                onChange={() => onToggle("day", day.value)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>{day.label}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500">Leave empty to allow every day.</p>
      </div>

      {showTargetSelector && (
        <div className="md:col-span-2">
          <SelectionList
            title={formData.target_type === "categories" ? "Select Categories" : "Select Menu Items"}
            items={selectionItems}
            selectedIds={selectedTargetIds}
            onToggle={onToggle}
            emptyText={formData.target_type === "categories" ? "No categories available." : "No menu items available."}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-gray-500">Start Date & Time</p>
        <input type="datetime-local" name="starts_at" value={formData.starts_at} onChange={onChange} className={inputClassName} />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-gray-500">End Date & Time</p>
        <input type="datetime-local" name="ends_at" value={formData.ends_at} onChange={onChange} className={inputClassName} />
      </div>

      <div className="flex flex-col gap-2 md:col-span-2">
        <p className="text-xs font-semibold text-gray-500">Description</p>
        <textarea name="description" value={formData.description} onChange={onChange} rows="3" className={`${inputClassName} resize-none`} placeholder="Describe the offer in a way staff can understand quickly." />
      </div>

      <div className="flex flex-col gap-2 md:col-span-2">
        <p className="text-xs font-semibold text-gray-500">Promotion Image</p>
        <div className="space-y-3">
          <input
            type="file"
            accept="image/*"
            onChange={onImageChange}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
          />
          {(imagePreview || existingImage) && (
            <div className="relative h-32 w-32">
              <img
                src={imagePreview || (existingImage?.startsWith("http") ? existingImage : `http://localhost:8000/storage/${existingImage}`)}
                alt="Preview"
                className="h-32 w-32 rounded-lg border border-gray-200 object-cover"
              />
              <button type="button" onClick={onRemoveImage} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600">
                x
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center md:col-span-2">
        <input type="checkbox" name="is_active" id="is_active" checked={formData.is_active} onChange={onChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
        <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
          Promotion is active
        </label>
      </div>
    </div>
  );
};

export default PromotionFormFields;
