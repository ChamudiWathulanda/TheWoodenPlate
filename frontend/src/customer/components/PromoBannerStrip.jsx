import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  formatPromotionDateTime,
  getPromotionTimeValue,
} from "../../utils/promotionDateTime";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const toTime = (value) => {
  if (!value) return null;
  return getPromotionTimeValue(value);
};

const isActive = (item, nowMs) => {
  const startMs = toTime(item.start_at || item.startAt || item.starts_at);
  const endMs = toTime(item.end_at || item.endAt || item.ends_at || item.expires_at);

  if (startMs !== null && startMs > nowMs) return false;
  if (endMs !== null && endMs < nowMs) return false;

  return true;
};

const getStatus = (item, nowMs) => {
  if (item.availability_status) return item.availability_status;
  return isActive(item, nowMs) ? "active" : "upcoming";
};

const formatDateTime = (value) => {
  if (!value) return "";
  return formatPromotionDateTime(value, "en-LK")
    .replace(/, /, " ")
    .replace(/^(\w+\s\d+,\s\d{4})/, (match) => match.replace(",", ""));
};

const DAY_LABELS = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const getPromotionHeadline = (promotion) => {
  if (promotion.offer_summary) return promotion.offer_summary;

  if (promotion.application_type === "bxgy") {
    return `Buy ${promotion.buy_quantity || 1} Get ${promotion.get_quantity || 1}`;
  }

  if (promotion.type === "fixed") {
    return `Save Rs. ${Number(promotion.value || 0).toFixed(2)}`;
  }

  return `Save ${promotion.value || 0}%`;
};

const getPromotionDescription = (promotion) =>
  promotion.description ||
  promotion.subtitle ||
  "Enjoy this limited-time deal crafted to make your next order even better.";

const getTargetNames = (promotion) => {
  if (Array.isArray(promotion.target_names) && promotion.target_names.length) {
    return promotion.target_names;
  }

  if (Array.isArray(promotion.target_details) && promotion.target_details.length) {
    return promotion.target_details
      .map((item) => item?.name)
      .filter(Boolean);
  }

  return [];
};

const getTargetSummary = (promotion) => {
  if (promotion.target_summary) return promotion.target_summary;

  if (promotion.target_type === "all") {
    return promotion.application_type === "order" ? "All bill items" : "All items";
  }

  if (promotion.target_type === "categories") {
    return "Selected categories";
  }

  return "Selected items";
};

const getDayLabels = (promotion) => {
  if (Array.isArray(promotion.applicable_day_labels) && promotion.applicable_day_labels.length) {
    return promotion.applicable_day_labels;
  }

  if (!Array.isArray(promotion.applicable_days) || !promotion.applicable_days.length) {
    return ["Every day"];
  }

  return promotion.applicable_days.map((day) => DAY_LABELS[day] || day);
};

const getDateWindow = (promotion) => {
  const startsAt = promotion.start_at || promotion.startAt || promotion.starts_at;
  const endsAt = promotion.end_at || promotion.endAt || promotion.ends_at || promotion.expires_at;

  return {
    startsAt,
    endsAt,
    startLabel: startsAt ? formatDateTime(startsAt) : "Available now",
    endLabel: endsAt ? formatDateTime(endsAt) : "No expiry date",
  };
};

export default function PromoBannerStrip() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPromotion, setSelectedPromotion] = useState(null);

  const load = async (aliveRef) => {
    try {
      const res = await fetch(`${API_BASE}/api/public/promotions`, {
        headers: { Accept: "application/json" },
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.data || [];
      if (aliveRef.current) setItems(list);
    } catch {
      if (aliveRef.current) setItems([]);
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    const aliveRef = { current: true };
    setLoading(true);
    load(aliveRef);

    const timer = setInterval(() => load(aliveRef), 60000);

    return () => {
      aliveRef.current = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!selectedPromotion) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedPromotion(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPromotion]);

  const visibleItems = useMemo(() => {
    const nowMs = Date.now();

    return (items || [])
      .filter((item) => {
        const endMs = toTime(item.end_at || item.endAt || item.ends_at || item.expires_at);
        return endMs === null || endMs >= nowMs;
      })
      .map((item) => ({
        ...item,
        availability_status: getStatus(item, nowMs),
      }));
  }, [items]);

  if (loading) {
    return (
      <section className="mt-10 px-4 md:px-10">
        <div className="mb-5 h-8 w-44 animate-pulse rounded-md bg-[#2B1C15]" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[18rem] animate-pulse rounded-[2rem] bg-[#2B1C15]"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!visibleItems.length) return null;

  return (
    <>
      <section className="mt-10 px-4 md:px-10">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#D7B38A]/70">
              Signature deals
            </p>
            <h2 className="mt-3 text-3xl font-black text-[#F7ECD9] md:text-4xl">
              Promotions
            </h2>
          </div>
          <p className="max-w-xl text-sm text-[#E7D2B6]/60 md:text-right">
            Active offers show up right away, and upcoming deals stay visible so customers know what is starting next.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {visibleItems.slice(0, 3).map((promotion) => {
          let img = promotion.image_url || promotion.image || promotion.banner_image || promotion.banner || "";
          if (img && !img.startsWith("http")) {
            img = `${API_BASE}/storage/${img}`;
          }

          const title = promotion.title || promotion.name || "Promotion";
          const subtitle = promotion.subtitle || promotion.description || "Limited-time dining experience.";
          const href = promotion.link || promotion.url || "/menu";
          const startsAt = promotion.start_at || promotion.startAt || promotion.starts_at;
          const isUpcomingOffer = promotion.availability_status === "upcoming";
          const badgeLabel = isUpcomingOffer ? "Upcoming offer" : "Limited offer";
          const scheduleLabel = isUpcomingOffer && startsAt ? `Starts ${formatDateTime(startsAt)}` : "Available now";
          const ctaLabel = isUpcomingOffer ? "View menu" : "Claim this offer";
          const accentLabel = getPromotionHeadline(promotion);

          const card = (
            <article
              className="group relative min-h-[22rem] overflow-hidden rounded-[2rem] border border-[#8B5A2B]/35 bg-[linear-gradient(160deg,#291A13_0%,#120C0A_78%)] shadow-[0_25px_80px_rgba(0,0,0,0.38)]"
            >
              <img
                src={img}
                alt={title}
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#120C0A] via-[#120C0A]/30 to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(215,179,138,0.18),transparent_34%)]" />
              <div className="absolute -right-16 top-12 h-32 w-32 rounded-full bg-[#D7B38A]/12 blur-3xl transition duration-700 group-hover:scale-125" />
              <div className="absolute left-8 top-24 h-px w-24 bg-gradient-to-r from-[#F7DAB1]/70 to-transparent" />

              <div className="relative flex h-full flex-col p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex rounded-full border border-[#D7B38A]/25 bg-[#D7B38A]/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#F5DEBE]">
                    {badgeLabel}
                  </span>
                  <div className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-white/70 backdrop-blur-sm">
                    {scheduleLabel}
                  </div>
                </div>

                <div className="mt-8 flex-1">
                  <div className="inline-flex rounded-full border border-[#F7DAB1]/15 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#FFE8C7] backdrop-blur-sm">
                    {accentLabel}
                  </div>
                  <h3 className="max-w-[15rem] text-3xl font-black text-[#FFF3E3]">
                    {title}
                  </h3>
                  <p className="mt-3 max-w-[18rem] text-sm leading-7 text-white/78">
                    {subtitle}
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                    {href.startsWith("http") ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-[#FFF3E3] px-5 py-3 text-sm font-bold text-[#140D0A] transition group-hover:bg-[#F7DAB1]"
                      >
                        {ctaLabel}
                        <span aria-hidden="true">-&gt;</span>
                      </a>
                    ) : (
                      <Link
                        to={href}
                        className="inline-flex items-center gap-2 rounded-full bg-[#FFF3E3] px-5 py-3 text-sm font-bold text-[#140D0A] transition group-hover:bg-[#F7DAB1]"
                      >
                        {ctaLabel}
                        <span aria-hidden="true">-&gt;</span>
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedPromotion(promotion)}
                      className="inline-flex items-center rounded-full border border-[#EED9BA]/35 bg-black/25 px-5 py-3 text-sm font-semibold text-[#FFF3E3] backdrop-blur-md transition hover:border-[#EED9BA]/60 hover:bg-black/40"
                    >
                      More Details
                    </button>
                </div>
              </div>
            </article>
          );

            return (
              <div key={promotion.id || `${title}-${img}`}>
                {card}
              </div>
            );
          })}
        </div>
      </section>

      {selectedPromotion && (() => {
        const { startsAt, endsAt, startLabel, endLabel } = getDateWindow(selectedPromotion);
        const targetNames = getTargetNames(selectedPromotion);
        const dayLabels = getDayLabels(selectedPromotion);
        const detailImage = (() => {
          const rawImage =
            selectedPromotion.image_url ||
            selectedPromotion.image ||
            selectedPromotion.banner_image ||
            selectedPromotion.banner ||
            "";

          if (!rawImage) return "";
          return rawImage.startsWith("http") ? rawImage : `${API_BASE}/storage/${rawImage}`;
        })();
        const detailHref = selectedPromotion.link || selectedPromotion.url || "/menu";

        return (
          <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-8">
            <button
              type="button"
              aria-label="Close promotion details"
              onClick={() => setSelectedPromotion(null)}
              className="absolute inset-0 bg-[#120C0A]/72 backdrop-blur-md"
            />

            <div className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[2rem] border border-[#D7B38A]/18 bg-[linear-gradient(155deg,rgba(34,22,17,0.98),rgba(15,10,8,0.96))] shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
              <div className="grid max-h-[90vh] grid-cols-1 overflow-y-auto lg:grid-cols-[1.05fr_0.95fr]">
                <div className="relative min-h-[18rem]">
                  {detailImage ? (
                    <img
                      src={detailImage}
                      alt={selectedPromotion.title || "Promotion"}
                      className="absolute inset-0 h-full w-full object-cover transition duration-[1400ms] ease-out hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#6f4b33_0%,#2b1c15_36%,#120c0a_82%)]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#120C0A] via-[#120C0A]/35 to-transparent" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(215,179,138,0.18),transparent_38%)]" />
                  <div className="absolute -left-12 bottom-10 h-36 w-36 rounded-full bg-[#D7B38A]/14 blur-3xl" />
                  <div className="absolute right-10 top-12 h-20 w-20 rounded-full border border-white/10 bg-white/5 backdrop-blur-md" />

                  <div className="relative flex h-full flex-col justify-between p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex rounded-full border border-[#D7B38A]/25 bg-[#D7B38A]/12 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#F5DEBE]">
                        {selectedPromotion.availability_status === "upcoming" ? "Upcoming offer" : "Available now"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedPromotion(null)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/30 text-xl text-white/85 backdrop-blur-md transition hover:bg-black/45"
                      >
                        &times;
                      </button>
                    </div>

                    <div>
                      <div className="mb-4 flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full border border-[#F7DAB1]/20 bg-[#F7DAB1]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#FFE8C7]">
                          Exclusive offer
                        </span>
                      </div>
                      <p className="text-sm uppercase tracking-[0.32em] text-[#E7D2B6]/75">
                        Signature deal
                      </p>
                      <h3 className="mt-3 max-w-md text-4xl font-black text-[#FFF3E3] sm:text-5xl">
                        {selectedPromotion.title || selectedPromotion.name || "Promotion"}
                      </h3>
                      <p className="mt-4 max-w-lg text-base leading-8 text-white/80">
                        {getPromotionDescription(selectedPromotion)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-[#8B5A2B]/22 bg-[#160F0C]/88 p-5">
                      <p className="text-xs uppercase tracking-[0.28em] text-[#D7B38A]/70">Offer</p>
                      <p className="mt-3 text-2xl font-bold text-[#FFF3E3]">{getPromotionHeadline(selectedPromotion)}</p>
                    </div>

                    <div className="rounded-[1.5rem] border border-[#8B5A2B]/22 bg-[#160F0C]/88 p-5">
                      <p className="text-xs uppercase tracking-[0.28em] text-[#D7B38A]/70">Applies To</p>
                      <p className="mt-3 text-2xl font-bold text-[#FFF3E3]">
                        {selectedPromotion.target_type === "all"
                          ? selectedPromotion.application_type === "order"
                            ? "Whole bill"
                            : "All items"
                          : selectedPromotion.target_type === "categories"
                            ? "Selected categories"
                            : "Selected items"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#E7D2B6]/70">
                        {getTargetSummary(selectedPromotion)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.35rem] border border-[#8B5A2B]/18 bg-white/5 p-4 backdrop-blur-sm">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-[#D7B38A]/70">Status</p>
                      <p className="mt-2 text-lg font-semibold text-[#FFF3E3]">
                        {selectedPromotion.availability_status === "upcoming" ? "Starting Soon" : "Live Now"}
                      </p>
                    </div>
                    <div className="rounded-[1.35rem] border border-[#8B5A2B]/18 bg-white/5 p-4 backdrop-blur-sm">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-[#D7B38A]/70">Start</p>
                      <p className="mt-2 text-lg font-semibold text-[#FFF3E3]">{startLabel}</p>
                    </div>
                    <div className="rounded-[1.35rem] border border-[#8B5A2B]/18 bg-white/5 p-4 backdrop-blur-sm">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-[#D7B38A]/70">End</p>
                      <p className="mt-2 text-lg font-semibold text-[#FFF3E3]">{endLabel}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[1.5rem] border border-[#8B5A2B]/22 bg-[#160F0C]/78 p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-[#D7B38A]/70">Promotion Details</p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-semibold text-[#FFF3E3]">Description</p>
                        <p className="mt-2 text-sm leading-7 text-[#E7D2B6]/72">
                          {getPromotionDescription(selectedPromotion)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#FFF3E3]">Validity</p>
                        <p className="mt-2 text-sm leading-7 text-[#E7D2B6]/72">
                          {selectedPromotion.schedule_summary ||
                            `${startsAt ? `Starts ${startLabel}` : "Available now"}${endsAt ? ` | Ends ${endLabel}` : ""}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-[#8B5A2B]/22 bg-[#160F0C]/78 p-5">
                      <p className="text-sm font-semibold text-[#FFF3E3]">Selected Items</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedPromotion.target_type === "all" ? (
                          <span className="rounded-full border border-[#D7B38A]/20 bg-[#D7B38A]/10 px-3 py-2 text-xs font-medium text-[#F5DEBE]">
                            All items
                          </span>
                        ) : targetNames.length ? (
                          targetNames.map((name) => (
                            <span
                              key={name}
                              className="rounded-full border border-[#D7B38A]/20 bg-[#D7B38A]/10 px-3 py-2 text-xs font-medium text-[#F5DEBE]"
                            >
                              {name}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-[#E7D2B6]/60">Selected items will be shown at checkout.</span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-[#8B5A2B]/22 bg-[#160F0C]/78 p-5">
                      <p className="text-sm font-semibold text-[#FFF3E3]">Available Days</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {dayLabels.map((day) => (
                          <span
                            key={day}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80"
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {detailHref.startsWith("http") ? (
                      <a
                        href={detailHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-full bg-[#D7B38A] px-6 py-3 text-sm font-bold text-[#120C0A] transition hover:bg-[#E9C79D]"
                      >
                        Go to Offer
                      </a>
                    ) : (
                      <Link
                        to={detailHref}
                        onClick={() => setSelectedPromotion(null)}
                        className="inline-flex items-center justify-center rounded-full bg-[#D7B38A] px-6 py-3 text-sm font-bold text-[#120C0A] transition hover:bg-[#E9C79D]"
                      >
                        Go to Offer
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedPromotion(null)}
                      className="inline-flex items-center justify-center rounded-full border border-[#8B5A2B]/35 bg-transparent px-6 py-3 text-sm font-semibold text-[#FFF3E3] transition hover:bg-white/5"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
