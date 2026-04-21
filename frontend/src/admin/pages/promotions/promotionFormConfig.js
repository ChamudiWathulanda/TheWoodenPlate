export const APPLICATION_OPTIONS = [
  { value: "order", label: "Order Discount", description: "Apply the discount to the whole bill or matched subtotal." },
  { value: "item", label: "Item Discount", description: "Discount selected categories or menu items directly." },
  { value: "bxgy", label: "Buy X Get Y", description: "Create offers like buy one get one free." },
];

export const TARGET_OPTIONS = [
  { value: "all", label: "All Items / Bill" },
  { value: "categories", label: "Selected Categories" },
  { value: "menu_items", label: "Selected Menu Items" },
];

export const DAY_OPTIONS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

export const getPromotionTypeLabel = (promotion) => {
  if (promotion.application_type === "bxgy") {
    return `Buy ${promotion.buy_quantity || 1} Get ${promotion.get_quantity || 1}`;
  }

  return promotion.type === "fixed" ? "Fixed Amount" : "Percentage";
};

export const getPromotionValueLabel = (promotion) => {
  if (promotion.application_type === "bxgy") {
    return `${promotion.buy_quantity || 1}+${promotion.get_quantity || 1}`;
  }

  return promotion.type === "percentage"
    ? `${promotion.value}%`
    : `Rs. ${parseFloat(promotion.value || 0).toFixed(2)}`;
};

export const getTargetSummary = (promotion, categories = [], menuItems = []) => {
  if (promotion.target_type === "all") {
    return promotion.application_type === "order" ? "Whole bill" : "All menu items";
  }

  const ids = Array.isArray(promotion.target_ids) ? promotion.target_ids.map(String) : [];
  const source = promotion.target_type === "categories" ? categories : menuItems;
  const names = source.filter((item) => ids.includes(String(item.id))).map((item) => item.name);

  if (!names.length) {
    return promotion.target_type === "categories" ? "Selected categories" : "Selected menu items";
  }

  return names.join(", ");
};
