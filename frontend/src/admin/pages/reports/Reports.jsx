import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import toast from "react-hot-toast";

const API_BASE = "http://localhost:8000";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "sales", label: "Sales" },
  { id: "orders", label: "Orders" },
  { id: "products", label: "Products" },
  { id: "promotions", label: "Promotions" },
  { id: "customers", label: "Customers" },
];

const reportTemplates = [
  { value: "executive", label: "Executive Snapshot", description: "Fast KPI summary for owners and managers." },
  { value: "sales", label: "Sales Deep Dive", description: "Revenue, order value and sales rhythm." },
  { value: "operations", label: "Operations Review", description: "Order flow, completion rate and status health." },
  { value: "growth", label: "Growth Report", description: "Customers, promotions and top performers." },
];

const rangeOptions = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "custom", label: "Custom" },
];

const toneClasses = {
  amber: "from-amber-400 via-orange-400 to-red-500",
  blue: "from-sky-400 via-blue-500 to-indigo-500",
  green: "from-emerald-400 via-green-500 to-teal-500",
  rose: "from-rose-400 via-red-500 to-orange-500",
  violet: "from-fuchsia-400 via-violet-500 to-indigo-500",
  slate: "from-slate-500 via-slate-700 to-slate-900",
};

const statusToneClasses = {
  pending: "bg-amber-100 text-amber-800",
  preparing: "bg-sky-100 text-sky-800",
  ready: "bg-indigo-100 text-indigo-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
};

const toIsoDate = (value) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getRangeDates = (range, customStartDate, customEndDate) => {
  const now = new Date();

  if (range === "custom" && customStartDate && customEndDate) {
    return { startDate: customStartDate, endDate: customEndDate };
  }

  if (range === "today") {
    const today = toIsoDate(now);
    return { startDate: today, endDate: today };
  }

  if (range === "this_week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    return { startDate: toIsoDate(start), endDate: toIsoDate(now) };
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return { startDate: toIsoDate(monthStart), endDate: toIsoDate(now) };
};

const formatCurrency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const formatNumber = (value) => Number(value || 0).toLocaleString();

const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatRangeLabel = (startDate, endDate) => `${formatDate(startDate)} - ${formatDate(endDate)}`;

const formatPromotionRule = (promotion) => {
  if (!promotion) return "-";

  if (promotion.application_type === "bxgy") {
    return `Buy ${promotion.buy_quantity || 1} Get ${promotion.get_quantity || 1}`;
  }

  if (promotion.type === "fixed") {
    return `Rs. ${Number(promotion.value || 0).toFixed(2)} off`;
  }

  return `${Number(promotion.value || 0)}% off`;
};

const formatPromotionScope = (promotion) => {
  if (!promotion) return "-";
  if (promotion.application_type === "order") return "Order level";
  if (promotion.application_type === "item") return "Item level";
  return "Buy X Get Y";
};

const safeJson = async (response) => {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || "Failed to load reports");
  }
  return payload;
};

const downloadFile = (content, fileName, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const buildCsv = (rows) => {
  if (!rows.length) return "";

  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(",")
    )
    .join("\n");
};

const escapePdfText = (value) =>
  String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const wrapPdfText = (text, maxChars = 84) => {
  const words = String(text ?? "").split(" ");
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length > maxChars) {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length ? lines : [""];
};

const buildPdfDocument = (sections) => {
  const pageWidth = 595;
  const pageHeight = 842;
  const marginX = 42;
  const contentWidth = pageWidth - marginX * 2;
  const bottomMargin = 48;
  const topStart = 792;
  const pages = [];
  let commands = [];
  let y = topStart;

  const pushPage = () => {
    pages.push(commands.join("\n"));
    commands = [];
    y = topStart;
  };

  const ensureSpace = (requiredHeight) => {
    if (y - requiredHeight < bottomMargin) {
      pushPage();
    }
  };

  const drawText = (text, x, currentY, font = "F1", size = 11) => {
    commands.push("BT");
    commands.push(`/${font} ${size} Tf`);
    commands.push(`${x} ${currentY} Td`);
    commands.push(`(${escapePdfText(text)}) Tj`);
    commands.push("ET");
  };

  const drawWrappedText = (text, x, currentY, options = {}) => {
    const { font = "F1", size = 11, maxChars = 84, lineHeight = 15 } = options;
    const wrapped = wrapPdfText(text, maxChars);
    wrapped.forEach((line, index) => {
      drawText(line, x, currentY - index * lineHeight, font, size);
    });
    return wrapped.length * lineHeight;
  };

  const drawFilledBox = (x, boxY, width, height, rgb = [0.96, 0.97, 0.99]) => {
    commands.push("q");
    commands.push(`${rgb[0]} ${rgb[1]} ${rgb[2]} rg`);
    commands.push(`${x} ${boxY} ${width} ${height} re f`);
    commands.push("Q");
  };

  sections.forEach((section) => {
    if (section.type === "title") {
      ensureSpace(64);
      drawText(section.eyebrow || "The Wooden Plate", marginX, y, "F2", 11);
      drawText(section.text, marginX, y - 24, "F2", 24);
      y -= 48;
      if (section.subtext) {
        y -= drawWrappedText(section.subtext, marginX, y, { size: 11, maxChars: 82, lineHeight: 14 });
      }
      y -= 12;
      return;
    }

    if (section.type === "metaGrid") {
      const boxWidth = (contentWidth - 12) / 2;
      const boxHeight = 58;
      ensureSpace(boxHeight * 2 + 28);

      section.items.forEach((item, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const boxX = marginX + col * (boxWidth + 12);
        const boxTopY = y - row * (boxHeight + 12);
        const boxBottomY = boxTopY - boxHeight;

        drawFilledBox(boxX, boxBottomY, boxWidth, boxHeight, [0.96, 0.96, 0.98]);
        drawText(item.label, boxX + 12, boxTopY - 18, "F2", 9);
        drawText(item.value, boxX + 12, boxTopY - 38, "F1", 12);
      });

      y -= Math.ceil(section.items.length / 2) * (boxHeight + 12) + 4;
      return;
    }

    if (section.type === "sectionHeader") {
      ensureSpace(28);
      drawText(section.text, marginX, y, "F2", 14);
      commands.push("q");
      commands.push("0.86 0.42 0.10 rg");
      commands.push(`${marginX} ${y - 8} 90 2.4 re f`);
      commands.push("Q");
      y -= 22;
      return;
    }

    if (section.type === "highlight") {
      const wrapped = wrapPdfText(section.text, 78);
      const boxHeight = wrapped.length * 14 + 24;
      ensureSpace(boxHeight + 12);
      drawFilledBox(marginX, y - boxHeight, contentWidth, boxHeight, [1, 0.97, 0.93]);
      drawText(section.label || "Insight", marginX + 14, y - 18, "F2", 9);
      wrapped.forEach((line, index) => {
        drawText(line, marginX + 14, y - 36 - index * 14, "F1", 11);
      });
      y -= boxHeight + 10;
      return;
    }

    if (section.type === "bulletList") {
      section.items.forEach((item) => {
        const wrapped = wrapPdfText(item, 78);
        const requiredHeight = wrapped.length * 14 + 4;
        ensureSpace(requiredHeight + 4);
        drawText("-", marginX, y, "F2", 11);
        wrapped.forEach((line, index) => {
          drawText(line, marginX + 14, y - index * 14, "F1", 11);
        });
        y -= requiredHeight;
      });
      y -= 4;
      return;
    }

    if (section.type === "spacer") {
      y -= section.size || 10;
    }
  });

  if (commands.length) {
    pushPage();
  }

  const objects = [];

  const addObject = (body) => {
    const id = objects.length + 1;
    objects.push({ id, body });
    return id;
  };

  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const boldFontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pageIds = [];

  const contentIds = pages.map((pageStream) => {
    const stream = pageStream;
    return addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });

  const pagesRootId = objects.length + contentIds.length + pages.length + 1;

  pages.forEach((_, index) => {
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesRootId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${contentIds[index]} 0 R >>`
    );
    pageIds.push(pageId);
  });

  const pagesId = addObject(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`);
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += `${object.id} 0 obj\n${object.body}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
};

const FilterChip = ({ active, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
      active
        ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
        : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
    }`}
  >
    {children}
  </button>
);

const SectionCard = ({ title, subtitle, action, children, className = "" }) => (
  <section className={`rounded-[1.75rem] border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur-sm md:p-6 ${className}`}>
    {(title || subtitle || action) && (
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          {title && <h3 className="text-lg font-black tracking-tight text-slate-900">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    {children}
  </section>
);

const MetricCard = ({ title, value, caption, tone = "amber", onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full rounded-[1.6rem] border border-white/70 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
  >
    <div className={`h-2 w-20 rounded-full bg-gradient-to-r ${toneClasses[tone] || toneClasses.amber}`} />
    <p className="mt-4 text-sm font-medium text-slate-500">{title}</p>
    <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{value}</p>
    <p className="mt-2 text-sm text-slate-500">{caption}</p>
  </button>
);

const TabButton = ({ active, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
      active
        ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
    }`}
  >
    {label}
  </button>
);

const HorizontalBarList = ({ items, valueKey, labelKey, formatter = formatNumber, tone = "amber", emptyText = "No data available." }) => {
  const maxValue = Math.max(...items.map((item) => Number(item?.[valueKey] || 0)), 0);

  if (!items.length) {
    return <p className="text-sm text-slate-500">{emptyText}</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const value = Number(item?.[valueKey] || 0);
        const width = maxValue > 0 ? Math.max((value / maxValue) * 100, 6) : 6;

        return (
          <div key={`${item?.[labelKey]}-${index}`} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-semibold text-slate-700">{item?.[labelKey] || "-"}</p>
              <p className="shrink-0 text-sm font-semibold text-slate-900">{formatter(value)}</p>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${toneClasses[tone] || toneClasses.amber}`}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Reports = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("this_month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [reportTemplate, setReportTemplate] = useState("executive");
  const [groupBy, setGroupBy] = useState("day");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatedAt, setGeneratedAt] = useState("");

  const [kpis, setKpis] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState(null);
  const [topProductsData, setTopProductsData] = useState(null);
  const [promotionsData, setPromotionsData] = useState(null);
  const [customersData, setCustomersData] = useState(null);

  const { startDate, endDate } = useMemo(
    () => getRangeDates(dateRange, customStartDate, customEndDate),
    [dateRange, customStartDate, customEndDate]
  );

  const rangeLabel = useMemo(() => formatRangeLabel(startDate, endDate), [startDate, endDate]);

  useEffect(() => {
    if (dateRange === "custom" && (!customStartDate || !customEndDate)) {
      return;
    }

    fetchAllData({ silent: true });
  }, [dateRange, customStartDate, customEndDate, groupBy]);

  const getDateParams = () => {
    const params = new URLSearchParams();
    params.append("start_date", startDate);
    params.append("end_date", endDate);
    params.append("group_by", groupBy);
    return params.toString();
  };

  const fetchAllData = async ({ silent = false } = {}) => {
    const token = localStorage.getItem("admin_token");
    const params = getDateParams();

    if (!token) {
      toast.error("Admin session not found.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      };

      const [kpisPayload, salesPayload, statusPayload, productsPayload, promosPayload, customersPayload] =
        await Promise.all([
          fetch(`${API_BASE}/api/admin/reports/kpis?${params}`, { headers }).then(safeJson),
          fetch(`${API_BASE}/api/admin/reports/sales-summary?${params}`, { headers }).then(safeJson),
          fetch(`${API_BASE}/api/admin/reports/order-status?${params}`, { headers }).then(safeJson),
          fetch(`${API_BASE}/api/admin/reports/top-products?${params}`, { headers }).then(safeJson),
          fetch(`${API_BASE}/api/admin/reports/promotions?${params}`, { headers }).then(safeJson),
          fetch(`${API_BASE}/api/admin/reports/customers?${params}`, { headers }).then(safeJson),
        ]);

      setKpis(kpisPayload?.data || null);
      setSalesData(salesPayload?.data || []);
      setOrderStatusData(statusPayload?.data || null);
      setTopProductsData(productsPayload?.data || null);
      setPromotionsData(promosPayload?.data || null);
      setCustomersData(customersPayload?.data || null);
      setGeneratedAt(new Date().toISOString());

      if (!silent) {
        toast.success("Report generated successfully.");
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch reports data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const reportHeadline = useMemo(() => {
    switch (reportTemplate) {
      case "sales":
        return "Sales performance report ready for review";
      case "operations":
        return "Operations health report generated";
      case "growth":
        return "Growth report prepared with customer and promo insights";
      default:
        return "Executive snapshot prepared for decision making";
    }
  }, [reportTemplate]);

  const topSalesPeriod = useMemo(() => {
    return [...salesData].sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0))[0] || null;
  }, [salesData]);

  const orderCompletionSummary = useMemo(() => {
    const breakdown = orderStatusData?.status_breakdown || [];
    const completed = breakdown.find((item) => item.status === "completed")?.count || 0;
    const cancelled = breakdown.find((item) => item.status === "cancelled")?.count || 0;
    const pending = breakdown.find((item) => item.status === "pending")?.count || 0;
    return { completed, cancelled, pending };
  }, [orderStatusData]);

  const promoEfficiency = useMemo(() => {
    if (!promotionsData?.revenue_with_promos || !promotionsData?.total_discount) return 0;
    return Number(promotionsData.revenue_with_promos) / Math.max(Number(promotionsData.total_discount), 1);
  }, [promotionsData]);

  const customerRetentionRatio = useMemo(() => {
    const total = Number(customersData?.new_customers || 0) + Number(customersData?.repeat_customers || 0);
    if (!total) return 0;
    return (Number(customersData?.repeat_customers || 0) / total) * 100;
  }, [customersData]);

  const exportCurrentReport = () => {
    const stamp = toIsoDate(new Date());
    let rows = [];

    if (activeTab === "sales") {
      rows = [
        ["Period", "Orders", "Revenue", "Discount", "Average Order Value"],
        ...salesData.map((row) => [
          row.period,
          row.orders_count,
          row.revenue,
          row.discount,
          row.avg_order_value,
        ]),
      ];
    } else if (activeTab === "orders") {
      rows = [
        ["Status", "Count"],
        ...(orderStatusData?.status_breakdown || []).map((row) => [row.status, row.count]),
      ];
    } else if (activeTab === "products") {
      rows = [
        ["Product", "Quantity Sold", "Revenue", "Last Ordered"],
        ...(topProductsData?.best_selling_qty || []).map((row) => [
          row.name,
          row.total_quantity,
          row.total_revenue,
          row.last_ordered,
        ]),
      ];
    } else if (activeTab === "promotions") {
      rows = [
        ["Promotion", "Usage", "Discount", "Revenue", "Last Used", "Status"],
        ...(promotionsData?.promo_performance || []).map((row) => [
          row.title,
          row.usage_count,
          row.total_discount,
          row.revenue_generated,
          row.last_used_at,
          row.is_active ? "Active" : "Inactive",
        ]),
      ];
    } else if (activeTab === "customers") {
      rows = [
        ["Customer", "Email", "Orders", "Total Spent"],
        ...(customersData?.top_customers || []).map((row) => [
          row.name,
          row.email,
          row.total_orders,
          row.total_spent,
        ]),
      ];
    } else {
      rows = [
        ["Metric", "Value"],
        ["Total Revenue", kpis?.total_revenue || 0],
        ["Total Orders", kpis?.total_orders || 0],
        ["Average Order Value", kpis?.avg_order_value || 0],
        ["Completion Rate", kpis?.completion_rate || 0],
        ["Total Discount", kpis?.total_discount || 0],
        ["New Customers", kpis?.new_customers || 0],
      ];
    }

    downloadFile(buildCsv(rows), `admin-report-${activeTab}-${stamp}.csv`, "text/csv;charset=utf-8;");
    toast.success("CSV exported.");
  };

  const exportPdfReport = () => {
    const stamp = toIsoDate(new Date());
    const sections = [
      {
        type: "title",
        eyebrow: "The Wooden Plate | Admin Analytics",
        text: `${tabs.find((tab) => tab.id === activeTab)?.label || "Overview"} Report`,
        subtext: "Performance snapshot prepared from the admin reporting workspace.",
      },
      {
        type: "metaGrid",
        items: [
          { label: "Template", value: reportTemplates.find((item) => item.value === reportTemplate)?.label || "Executive Snapshot" },
          { label: "Date Range", value: rangeLabel },
          { label: "Generated At", value: generatedAt ? formatDateTime(generatedAt) : formatDateTime(new Date()) },
          { label: "Grouping", value: groupBy === "day" ? "Daily" : "Monthly" },
        ],
      },
      { type: "sectionHeader", text: "Executive Summary" },
      {
        type: "bulletList",
        items: [
          `Total revenue reached ${formatCurrency(kpis?.total_revenue)} across ${formatNumber(kpis?.total_orders)} orders.`,
          `Average order value is ${formatCurrency(kpis?.avg_order_value)} with a completion rate of ${formatPercent(kpis?.completion_rate)}.`,
          `Promotional discount impact is ${formatCurrency(kpis?.total_discount)} and new customers added are ${formatNumber(kpis?.new_customers)}.`,
        ],
      },
    ];

    if (activeTab === "sales") {
      sections.push({ type: "sectionHeader", text: "Sales Breakdown" });
      sections.push({
        type: "highlight",
        label: "Best Revenue Period",
        text: topSalesPeriod
          ? `${topSalesPeriod.period} delivered ${formatCurrency(topSalesPeriod.revenue)} from ${formatNumber(topSalesPeriod.orders_count)} orders.`
          : "No sales trend data is available for the selected range.",
      });
      sections.push({
        type: "bulletList",
        items: salesData.map((row) =>
          `${row.period} | Orders: ${formatNumber(row.orders_count)} | Revenue: ${formatCurrency(row.revenue)} | Discount: ${formatCurrency(row.discount)} | AOV: ${formatCurrency(row.avg_order_value)}`
        ),
      });
    } else if (activeTab === "orders") {
      sections.push({ type: "sectionHeader", text: "Order Status Breakdown" });
      sections.push({
        type: "highlight",
        label: "Peak Day",
        text: orderStatusData?.peak_day
          ? `${orderStatusData.peak_day.date} recorded ${formatNumber(orderStatusData.peak_day.count)} orders, making it the busiest day in this range.`
          : "Peak day information is not available.",
      });
      sections.push({
        type: "bulletList",
        items: (orderStatusData?.status_breakdown || []).map((row) => `${row.status}: ${formatNumber(row.count)}`),
      });
      sections.push({ type: "sectionHeader", text: "Daily Outcome Trend" });
      sections.push({
        type: "bulletList",
        items: (orderStatusData?.daily_trend || []).map((row) => `${row.date} | ${row.status} | ${formatNumber(row.count)}`),
      });
    } else if (activeTab === "products") {
      sections.push({ type: "sectionHeader", text: "Best Selling Products" });
      sections.push({
        type: "highlight",
        label: "Product Focus",
        text: topProductsData?.best_selling_qty?.[0]
          ? `${topProductsData.best_selling_qty[0].name} leads quantity sold with ${formatNumber(topProductsData.best_selling_qty[0].total_quantity)} units.`
          : "No product performance data is available.",
      });
      sections.push({
        type: "bulletList",
        items: (topProductsData?.best_selling_qty || []).map((row) =>
          `${row.name} | Qty: ${formatNumber(row.total_quantity)} | Revenue: ${formatCurrency(row.total_revenue)} | Last Ordered: ${formatDate(row.last_ordered)}`
        ),
      });
    } else if (activeTab === "promotions") {
      sections.push({ type: "sectionHeader", text: "Promotion Performance" });
      sections.push({
        type: "highlight",
        label: "Best Promotion",
        text: promotionsData?.best_promo
          ? `${promotionsData.best_promo.title} is the top promotion with ${formatNumber(promotionsData.best_promo.usage_count)} uses and ${formatCurrency(promotionsData.best_promo.revenue_generated)} revenue generated.`
          : "No promotion activity found for the selected range.",
      });
      sections.push({
        type: "bulletList",
        items: (promotionsData?.promo_performance || []).map((row) =>
          `${row.title} | ${formatPromotionScope(row)} | ${formatPromotionRule(row)} | Usage: ${formatNumber(row.usage_count)} | Discount: ${formatCurrency(row.total_discount)} | Revenue: ${formatCurrency(row.revenue_generated)}`
        ),
      });
    } else if (activeTab === "customers") {
      sections.push({ type: "sectionHeader", text: "Top Customers" });
      sections.push({
        type: "highlight",
        label: "Retention Snapshot",
        text: `Repeat customer share is ${formatPercent(customerRetentionRatio)} with ${formatNumber(customersData?.repeat_customers)} repeat customers and ${formatNumber(customersData?.new_customers)} new customers.`,
      });
      sections.push({
        type: "bulletList",
        items: (customersData?.top_customers || []).map((row) =>
          `${row.name} | ${row.email} | Orders: ${formatNumber(row.total_orders)} | Total Spent: ${formatCurrency(row.total_spent)}`
        ),
      });
    } else {
      sections.push({ type: "sectionHeader", text: "Highlights" });
      sections.push({
        type: "highlight",
        label: "Management Insight",
        text: reportHeadline,
      });
      sections.push({
        type: "bulletList",
        items: [
          `Best revenue period: ${topSalesPeriod?.period || "-"}${topSalesPeriod ? ` with ${formatCurrency(topSalesPeriod.revenue)}` : ""}.`,
          `Peak day: ${orderStatusData?.peak_day?.date || "-"}${orderStatusData?.peak_day ? ` with ${formatNumber(orderStatusData.peak_day.count)} orders` : ""}.`,
          `Promotion efficiency: ${promoEfficiency.toFixed(1)}x revenue generated per rupee of discount.`,
          `Repeat customer share: ${formatPercent(customerRetentionRatio)}.`,
        ],
      });
    }

    const pdfContent = buildPdfDocument(sections);
    downloadFile(pdfContent, `admin-report-${activeTab}-${stamp}.pdf`, "application/pdf");
    toast.success("PDF exported.");
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[24rem] items-center justify-center">
          <div className="rounded-[1.75rem] border border-white/70 bg-white/80 px-8 py-10 text-center shadow-sm">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
            <p className="mt-4 text-lg font-semibold text-slate-800">Generating reports...</p>
            <p className="mt-2 text-sm text-slate-500">Pulling revenue, orders, products, promotions, and customer analytics.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-900/10 bg-[linear-gradient(135deg,_#111827_0%,_#1e293b_38%,_#9a3412_140%)] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)] md:p-8">
          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
            <div>
              <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-amber-100/90">
                Reports Command Center
              </div>
              <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
                Generate modern admin reports without leaving the dashboard.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 md:text-base">
                Review sales, order health, promotions, top products, and customer growth in one clean workspace. Use the generator panel to refresh the current reporting window instantly.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Active Window</p>
                  <p className="mt-2 text-lg font-bold text-white">{rangeLabel}</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Template</p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {reportTemplates.find((item) => item.value === reportTemplate)?.label || "Executive Snapshot"}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Last Generated</p>
                  <p className="mt-2 text-lg font-bold text-white">{generatedAt ? formatDateTime(generatedAt) : "Just now"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 shadow-inner shadow-black/10 backdrop-blur-sm md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Report Generator</p>
                  <p className="mt-1 text-sm text-slate-200">{reportHeadline}</p>
                </div>
                {refreshing && <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-amber-100">Refreshing...</span>}
              </div>

              <div className="mt-5 space-y-5">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Template</label>
                  <select
                    value={reportTemplate}
                    onChange={(event) => setReportTemplate(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none ring-0 transition placeholder:text-slate-300 focus:border-amber-300"
                  >
                    {reportTemplates.map((template) => (
                      <option key={template.value} value={template.value} className="text-slate-900">
                        {template.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-slate-300">
                    {reportTemplates.find((item) => item.value === reportTemplate)?.description}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Date Range</label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {rangeOptions.map((option) => (
                      <FilterChip key={option.value} active={dateRange === option.value} onClick={() => setDateRange(option.value)}>
                        {option.label}
                      </FilterChip>
                    ))}
                  </div>
                </div>

                {dateRange === "custom" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Start Date</span>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(event) => setCustomStartDate(event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none focus:border-amber-300"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">End Date</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(event) => setCustomEndDate(event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none focus:border-amber-300"
                      />
                    </label>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Summarize By</label>
                  <div className="mt-3 flex gap-2">
                    <FilterChip active={groupBy === "day"} onClick={() => setGroupBy("day")}>
                      Daily
                    </FilterChip>
                    <FilterChip active={groupBy === "month"} onClick={() => setGroupBy("month")}>
                      Monthly
                    </FilterChip>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => fetchAllData()}
                    className="rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-orange-900/25 transition hover:brightness-105"
                  >
                    Generate Report
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    Print View
                  </button>
                  <button
                    type="button"
                    onClick={exportCurrentReport}
                    className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={exportPdfReport}
                    className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    Export PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {kpis && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(kpis.total_revenue)}
              caption="Net revenue from completed kitchen flow states."
              tone="green"
              onClick={() => setActiveTab("sales")}
            />
            <MetricCard
              title="Total Orders"
              value={formatNumber(kpis.total_orders)}
              caption="Orders created within the selected reporting window."
              tone="blue"
              onClick={() => setActiveTab("orders")}
            />
            <MetricCard
              title="Average Order Value"
              value={formatCurrency(kpis.avg_order_value)}
              caption="Useful for menu engineering and promo decisions."
              tone="violet"
              onClick={() => setActiveTab("sales")}
            />
            <MetricCard
              title="Completion Rate"
              value={formatPercent(kpis.completion_rate)}
              caption="Tracks how many orders reached completed status."
              tone="amber"
              onClick={() => setActiveTab("orders")}
            />
            <MetricCard
              title="Discount Given"
              value={formatCurrency(kpis.total_discount)}
              caption="Promotion cost absorbed in the selected period."
              tone="rose"
              onClick={() => setActiveTab("promotions")}
            />
            <MetricCard
              title="New Customers"
              value={formatNumber(kpis.new_customers)}
              caption="Fresh customer acquisition during this range."
              tone="slate"
              onClick={() => setActiveTab("customers")}
            />
          </div>
        )}

        <SectionCard
          title="Report Navigation"
          subtitle="Jump between focused report views and export the one you need."
          action={<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{rangeLabel}</p>}
        >
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <TabButton key={tab.id} active={activeTab === tab.id} label={tab.label} onClick={() => setActiveTab(tab.id)} />
            ))}
          </div>
        </SectionCard>

        {activeTab === "overview" && (
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <SectionCard
              title="Executive Overview"
              subtitle="A fast operational summary for the selected report window."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-500">Best Revenue Period</p>
                  <p className="mt-3 text-2xl font-black text-slate-900">{topSalesPeriod?.period || "-"}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {topSalesPeriod ? `${formatCurrency(topSalesPeriod.revenue)} from ${formatNumber(topSalesPeriod.orders_count)} orders.` : "No sales trend data for this range."}
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-500">Peak Operations Day</p>
                  <p className="mt-3 text-2xl font-black text-slate-900">{orderStatusData?.peak_day?.date || "-"}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {orderStatusData?.peak_day ? `${formatNumber(orderStatusData.peak_day.count)} total orders processed on the busiest day.` : "Peak day data is not available."}
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-500">Top Promotion Efficiency</p>
                  <p className="mt-3 text-2xl font-black text-slate-900">{promoEfficiency.toFixed(1)}x</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Revenue generated per rupee of discount when promotions were used.
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-500">Repeat Customer Share</p>
                  <p className="mt-3 text-2xl font-black text-slate-900">{formatPercent(customerRetentionRatio)}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Returning customers within combined new and repeat customer activity.
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Report Brief"
              subtitle="Use this summary while sharing progress with management."
            >
              <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,_#fff7ed_0%,_#ffffff_45%,_#eff6ff_100%)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Generated insight</p>
                <p className="mt-3 text-xl font-black text-slate-900">{reportHeadline}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Revenue is currently {formatCurrency(kpis?.total_revenue)} across {formatNumber(kpis?.total_orders)} orders, with a completion rate of {formatPercent(kpis?.completion_rate)}. Promotions contributed {formatCurrency(promotionsData?.revenue_with_promos)} in promo-driven revenue while customer growth added {formatNumber(customersData?.new_customers)} new customers.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Generated At</p>
                    <p className="mt-2 font-semibold text-slate-900">{generatedAt ? formatDateTime(generatedAt) : "-"}</p>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Selected Template</p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {reportTemplates.find((item) => item.value === reportTemplate)?.label}
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Sales Momentum"
              subtitle="Highest-grossing periods in the current report window."
              className="xl:col-span-2"
            >
              <HorizontalBarList
                items={[...salesData].sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0)).slice(0, 6)}
                valueKey="revenue"
                labelKey="period"
                formatter={(value) => formatCurrency(value)}
                tone="green"
                emptyText="Sales data is not available for this range."
              />
            </SectionCard>
          </div>
        )}

        {activeTab === "sales" && (
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <SectionCard
              title="Sales Highlights"
              subtitle="Key outcomes from the selected reporting period."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-emerald-50 p-5">
                  <p className="text-sm font-semibold text-emerald-700">Revenue</p>
                  <p className="mt-3 text-3xl font-black text-emerald-900">{formatCurrency(kpis?.total_revenue)}</p>
                </div>
                <div className="rounded-[1.5rem] bg-sky-50 p-5">
                  <p className="text-sm font-semibold text-sky-700">Average Order Value</p>
                  <p className="mt-3 text-3xl font-black text-sky-900">{formatCurrency(kpis?.avg_order_value)}</p>
                </div>
                <div className="rounded-[1.5rem] bg-orange-50 p-5">
                  <p className="text-sm font-semibold text-orange-700">Orders</p>
                  <p className="mt-3 text-3xl font-black text-orange-900">{formatNumber(kpis?.total_orders)}</p>
                </div>
                <div className="rounded-[1.5rem] bg-rose-50 p-5">
                  <p className="text-sm font-semibold text-rose-700">Discount Impact</p>
                  <p className="mt-3 text-3xl font-black text-rose-900">{formatCurrency(kpis?.total_discount)}</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Revenue Trend"
              subtitle={`Grouped by ${groupBy === "day" ? "day" : "month"} for easier comparison.`}
            >
              <HorizontalBarList
                items={salesData}
                valueKey="revenue"
                labelKey="period"
                formatter={(value) => formatCurrency(value)}
                tone="green"
              />
            </SectionCard>

            <SectionCard
              title="Sales Breakdown"
              subtitle="Detailed sales summary by reporting period."
              className="xl:col-span-2"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Period</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Orders</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Revenue</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Discount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">AOV</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salesData.map((row) => (
                      <tr key={row.period} className="bg-white">
                        <td className="px-4 py-4 text-sm font-semibold text-slate-800">{row.period}</td>
                        <td className="px-4 py-4 text-sm text-slate-600">{formatNumber(row.orders_count)}</td>
                        <td className="px-4 py-4 text-sm text-slate-600">{formatCurrency(row.revenue)}</td>
                        <td className="px-4 py-4 text-sm text-slate-600">{formatCurrency(row.discount)}</td>
                        <td className="px-4 py-4 text-sm text-slate-600">{formatCurrency(row.avg_order_value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <SectionCard
              title="Order Status Breakdown"
              subtitle="Quick status visibility for operational monitoring."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {(orderStatusData?.status_breakdown || []).map((status) => (
                  <div key={status.status} className="rounded-[1.4rem] bg-slate-50 p-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusToneClasses[status.status] || "bg-slate-100 text-slate-700"}`}>
                      {status.status}
                    </span>
                    <p className="mt-3 text-3xl font-black text-slate-900">{formatNumber(status.count)}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Operational Health"
              subtitle="Track completion, cancellations, and pending load."
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.4rem] bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-700">Completed</p>
                  <p className="mt-3 text-3xl font-black text-emerald-900">{formatNumber(orderCompletionSummary.completed)}</p>
                </div>
                <div className="rounded-[1.4rem] bg-rose-50 p-4">
                  <p className="text-sm font-semibold text-rose-700">Cancelled</p>
                  <p className="mt-3 text-3xl font-black text-rose-900">{formatNumber(orderCompletionSummary.cancelled)}</p>
                </div>
                <div className="rounded-[1.4rem] bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-700">Pending</p>
                  <p className="mt-3 text-3xl font-black text-amber-900">{formatNumber(orderCompletionSummary.pending)}</p>
                </div>
              </div>

              <div className="mt-5 rounded-[1.4rem] bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-500">Peak Day</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{orderStatusData?.peak_day?.date || "-"}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {orderStatusData?.peak_day ? `${formatNumber(orderStatusData.peak_day.count)} orders were recorded on the busiest day.` : "Peak day information is not available."}
                </p>
              </div>
            </SectionCard>

            <SectionCard
              title="Daily Outcome Trend"
              subtitle="Completed and cancelled volumes by day."
              className="xl:col-span-2"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(orderStatusData?.daily_trend || []).map((row, index) => (
                      <tr key={`${row.date}-${row.status}-${index}`}>
                        <td className="px-4 py-4 text-sm font-semibold text-slate-800">{row.date}</td>
                        <td className="px-4 py-4 text-sm capitalize text-slate-600">{row.status}</td>
                        <td className="px-4 py-4 text-sm text-slate-600">{formatNumber(row.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === "products" && (
          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard
              title="Best Selling Products"
              subtitle="Products ranked by quantity sold."
            >
              <HorizontalBarList
                items={topProductsData?.best_selling_qty || []}
                valueKey="total_quantity"
                labelKey="name"
                formatter={(value) => `${formatNumber(value)} units`}
                tone="amber"
              />
            </SectionCard>

            <SectionCard
              title="Highest Revenue Products"
              subtitle="Products ranked by generated revenue."
            >
              <HorizontalBarList
                items={topProductsData?.highest_revenue || []}
                valueKey="total_revenue"
                labelKey="name"
                formatter={(value) => formatCurrency(value)}
                tone="violet"
              />
            </SectionCard>

            <SectionCard
              title="Product Performance Table"
              subtitle="Use this table to plan menu placement and stock priorities."
              className="xl:col-span-2"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Quantity Sold</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Revenue</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Last Ordered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(topProductsData?.best_selling_qty || []).map((product) => (
                      <tr key={product.id}>
                        <td className="px-4 py-4 text-sm font-semibold text-slate-800">{product.name}</td>
                        <td className="px-4 py-4 text-sm text-slate-600">{formatNumber(product.total_quantity)}</td>
                        <td className="px-4 py-4 text-sm text-slate-600">{formatCurrency(product.total_revenue)}</td>
                        <td className="px-4 py-4 text-sm text-slate-600">{formatDate(product.last_ordered)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === "promotions" && (
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <SectionCard
              title="Promotion Snapshot"
              subtitle="Measure discount usage and promo-driven revenue."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.4rem] bg-rose-50 p-4">
                  <p className="text-sm font-semibold text-rose-700">Total Discount</p>
                  <p className="mt-3 text-3xl font-black text-rose-900">{formatCurrency(promotionsData?.total_discount)}</p>
                </div>
                <div className="rounded-[1.4rem] bg-violet-50 p-4">
                  <p className="text-sm font-semibold text-violet-700">Usage Count</p>
                  <p className="mt-3 text-3xl font-black text-violet-900">{formatNumber(promotionsData?.total_usage)}</p>
                </div>
                <div className="rounded-[1.4rem] bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-700">Revenue With Promos</p>
                  <p className="mt-3 text-3xl font-black text-emerald-900">{formatCurrency(promotionsData?.revenue_with_promos)}</p>
                </div>
                <div className="rounded-[1.4rem] bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-600">Revenue Without Promos</p>
                  <p className="mt-3 text-3xl font-black text-slate-900">{formatCurrency(promotionsData?.revenue_without_promos)}</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Best Performing Promotion"
              subtitle="Highest usage promotion in the current report window."
            >
              {promotionsData?.best_promo ? (
                <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,_#fff7ed_0%,_#ffffff_42%,_#fdf2f8_100%)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Top promotion</p>
                  <p className="mt-3 text-2xl font-black text-slate-900">{promotionsData.best_promo.title}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {formatPromotionScope(promotionsData.best_promo)} | {formatPromotionRule(promotionsData.best_promo)}
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white/80 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Usage</p>
                      <p className="mt-2 font-bold text-slate-900">{formatNumber(promotionsData.best_promo.usage_count)}</p>
                    </div>
                    <div className="rounded-2xl bg-white/80 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Discount</p>
                      <p className="mt-2 font-bold text-slate-900">{formatCurrency(promotionsData.best_promo.total_discount)}</p>
                    </div>
                    <div className="rounded-2xl bg-white/80 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Revenue</p>
                      <p className="mt-2 font-bold text-slate-900">{formatCurrency(promotionsData.best_promo.revenue_generated)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No promotion activity found for this date range.</p>
              )}
            </SectionCard>

            <SectionCard
              title="Promotion Performance Table"
              subtitle="Compare active and inactive offers by usage, discount, and revenue."
              className="xl:col-span-2"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Promotion</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Offer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Usage</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Discount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Revenue</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Last Used</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(promotionsData?.promo_performance || []).map((promo) => (
                      <tr key={promo.id}>
                        <td className="px-4 py-4 text-sm">
                          <p className="font-semibold text-slate-800">{promo.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{promo.description || "No description added"}</p>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          <p>{formatPromotionScope(promo)}</p>
                          <p className="mt-1 font-semibold text-slate-800">{formatPromotionRule(promo)}</p>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">{formatNumber(promo.usage_count)}</td>
                        <td className="px-4 py-4 text-sm text-slate-600">{formatCurrency(promo.total_discount)}</td>
                        <td className="px-4 py-4 text-sm text-slate-600">{formatCurrency(promo.revenue_generated)}</td>
                        <td className="px-4 py-4 text-sm text-slate-600">{formatDateTime(promo.last_used_at)}</td>
                        <td className="px-4 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${promo.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                            {promo.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === "customers" && (
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <SectionCard
              title="Customer Growth Snapshot"
              subtitle="Understand acquisition and repeat purchase behavior."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.4rem] bg-indigo-50 p-4">
                  <p className="text-sm font-semibold text-indigo-700">New Customers</p>
                  <p className="mt-3 text-3xl font-black text-indigo-900">{formatNumber(customersData?.new_customers)}</p>
                </div>
                <div className="rounded-[1.4rem] bg-sky-50 p-4">
                  <p className="text-sm font-semibold text-sky-700">Repeat Customers</p>
                  <p className="mt-3 text-3xl font-black text-sky-900">{formatNumber(customersData?.repeat_customers)}</p>
                </div>
                <div className="rounded-[1.4rem] bg-slate-50 p-4 sm:col-span-2">
                  <p className="text-sm font-semibold text-slate-600">Repeat Share</p>
                  <p className="mt-3 text-3xl font-black text-slate-900">{formatPercent(customerRetentionRatio)}</p>
                  <p className="mt-2 text-sm text-slate-500">A quick signal of retention strength in the current window.</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Top Customers by Spend"
              subtitle="Most valuable customers ranked by total spend."
            >
              <HorizontalBarList
                items={customersData?.top_customers || []}
                valueKey="total_spent"
                labelKey="name"
                formatter={(value) => formatCurrency(value)}
                tone="blue"
              />
            </SectionCard>

            <SectionCard
              title="Customer Performance Table"
              subtitle="Useful for VIP lists, retention offers, and outreach."
              className="xl:col-span-2"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Orders</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(customersData?.top_customers || []).map((customer) => (
                      <tr key={customer.id}>
                        <td className="px-4 py-4 text-sm font-semibold text-slate-800">{customer.name}</td>
                        <td className="px-4 py-4 text-sm text-slate-600">{customer.email}</td>
                        <td className="px-4 py-4 text-sm text-slate-600">{formatNumber(customer.total_orders)}</td>
                        <td className="px-4 py-4 text-sm text-slate-600">{formatCurrency(customer.total_spent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Reports;
