import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const toTime = (v) => {
  if (!v) return null;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? null : t;
};

const isActive = (item, nowMs) => {
  const startMs = toTime(item.start_at || item.startAt || item.starts_at);
  const endMs = toTime(item.end_at || item.endAt || item.ends_at || item.expires_at);

  if (startMs !== null && startMs > nowMs) return false;
  if (endMs !== null && endMs < nowMs) return false;
  return true;
};

export default function NewProductBannerStrip() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (aliveRef) => {
    try {
      const res = await fetch(`${API_BASE}/api/public/new-products`, {
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

    const t = setInterval(() => load(aliveRef), 60000);

    return () => {
      aliveRef.current = false;
      clearInterval(t);
    };
  }, []);

  const activeItems = useMemo(() => {
    const nowMs = Date.now();
    return (items || []).filter((x) => isActive(x, nowMs));
  }, [items]);

  if (loading) {
    return (
      <section className="mt-10 px-4 md:px-10">
        <div className="mb-5 h-8 w-56 animate-pulse rounded-md bg-[#2B1C15]" />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-[20rem] animate-pulse rounded-[2rem] bg-[#2B1C15]"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!activeItems.length) return null;

  return (
    <section className="mt-12 px-4 md:px-10">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#D7B38A]/70">
            Fresh from the kitchen
          </p>
          <h2 className="mt-3 text-3xl font-black text-[#F7ECD9] md:text-4xl">
            New Arrivals
          </h2>
        </div>
        <p className="max-w-xl text-sm text-[#E7D2B6]/60 md:text-right">
          Recently launched dishes, plated with signature flavors and styled to pull focus on the homepage.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {activeItems.slice(0, 2).map((p, index) => {
          let img = p.image_url || p.image || p.banner_image || p.banner || "";
          if (img && !img.startsWith("http")) {
            img = `${API_BASE}/storage/${img}`;
          }

          const name = p.name || p.title || "New Product";
          const desc =
            p.short_description ||
            p.description ||
            "Try our newest delicious item today!";

          return (
            <article
              key={p.id || `${name}-${img}`}
              className={`group relative overflow-hidden rounded-[2rem] border border-[#8B5A2B]/35 ${
                index === 0
                  ? "bg-[linear-gradient(135deg,#3A2418_0%,#1A110D_70%)]"
                  : "bg-[linear-gradient(135deg,#2A1A13_0%,#110B09_72%)]"
              } shadow-[0_25px_80px_rgba(0,0,0,0.42)]`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(215,179,138,0.16),transparent_38%)]" />
              <div className="grid min-h-[22rem] grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="relative order-2 flex flex-col justify-between p-6 sm:p-8 lg:order-1">
                  <div>
                    <span className="inline-flex rounded-full border border-[#D7B38A]/20 bg-[#D7B38A]/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#D7B38A]">
                      New drop
                    </span>
                    <h3 className="mt-5 text-3xl font-black text-[#F7ECD9] sm:text-[2.6rem]">
                      {name}
                    </h3>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-[#E7D2B6]/72 sm:text-base">
                      {desc}
                    </p>
                  </div>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Link
                      to="/menu"
                      className="inline-flex items-center justify-center rounded-full bg-[#D7B38A] px-6 py-3 text-sm font-bold text-[#140D0A] transition hover:bg-[#E6C39D]"
                    >
                      Explore menu
                    </Link>
                    <div className="rounded-full border border-[#8B5A2B]/30 bg-[#0F0A08]/45 px-4 py-3 text-xs uppercase tracking-[0.22em] text-[#E7D2B6]/55">
                      Chef recommended
                    </div>
                  </div>
                </div>

                <div className="relative order-1 min-h-[18rem] overflow-hidden lg:order-2">
                  <img
                    src={img}
                    alt={name}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A110D]/80 via-transparent to-transparent" />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
