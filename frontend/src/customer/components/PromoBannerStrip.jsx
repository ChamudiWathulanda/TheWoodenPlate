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

export default function PromoBannerStrip() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (!activeItems.length) return null;

  return (
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
          Spotlight offers with richer contrast, stronger hierarchy, and a cleaner premium-homepage look.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {activeItems.slice(0, 3).map((p, index) => {
          let img = p.image_url || p.image || p.banner_image || p.banner || "";
          if (img && !img.startsWith("http")) {
            img = `${API_BASE}/storage/${img}`;
          }
          const title = p.title || p.name || "Promotion";
          const subtitle = p.subtitle || p.description || "Limited-time dining experience.";
          const href = p.link || p.url || "/menu";

          const card = (
            <article
              className={`group relative overflow-hidden rounded-[2rem] border border-[#8B5A2B]/35 shadow-[0_25px_80px_rgba(0,0,0,0.38)] ${
                index === 1
                  ? "min-h-[22rem] bg-[linear-gradient(160deg,#2F1B13_0%,#120C0A_72%)]"
                  : "min-h-[19rem] bg-[linear-gradient(160deg,#291A13_0%,#120C0A_78%)]"
              }`}
            >
              <img
                src={img}
                alt={title}
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#120C0A] via-[#120C0A]/30 to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(215,179,138,0.18),transparent_34%)]" />

              <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex rounded-full border border-[#D7B38A]/25 bg-[#D7B38A]/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#F5DEBE]">
                    Limited offer
                  </span>
                  <div className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-white/70 backdrop-blur-sm">
                    Save more
                  </div>
                </div>

                <div>
                  <h3 className="max-w-[15rem] text-3xl font-black text-[#FFF3E3]">
                    {title}
                  </h3>
                  <p className="mt-3 max-w-[18rem] text-sm leading-7 text-white/78">
                    {subtitle}
                  </p>
                  <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#FFF3E3] px-5 py-3 text-sm font-bold text-[#140D0A] transition group-hover:bg-[#F7DAB1]">
                    Claim this offer
                    <span aria-hidden="true">→</span>
                  </div>
                </div>
              </div>
            </article>
          );

          return href.startsWith("http") ? (
            <a
              key={p.id || `${title}-${img}`}
              href={href}
              target="_blank"
              rel="noreferrer"
            >
              {card}
            </a>
          ) : (
            <Link key={p.id || `${title}-${img}`} to={href}>
              {card}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
