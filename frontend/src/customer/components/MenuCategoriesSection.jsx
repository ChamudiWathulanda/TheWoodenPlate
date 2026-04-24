import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MenuCategoriesSection() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([
    {
      id: "all",
      label: "All Items",
      desc: "Browse everything we serve",
      image:
        "https://images.unsplash.com/photo-1561758033-d89a9ad46330?q=80&w=1200&auto=format&fit=crop",
    },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/public/categories");
        if (!res.ok) throw new Error("Failed to fetch categories");

        const data = await res.json();
        const dynamicCategories = (data.data || []).map((category) => ({
          id: String(category.id),
          label: category.name,
          desc: `Explore ${category.name.toLowerCase()} from our kitchen`,
          image: category.image
            ? `http://localhost:8000/storage/${category.image}`
            : "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1200&auto=format&fit=crop",
        }));

        setCategories((prev) => [prev[0], ...dynamicCategories]);
      } catch (error) {
        console.error("Failed to load home menu categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const goMenu = (catId) => {
    navigate(`/menu?cat=${encodeURIComponent(catId)}`);
  };

  return (
    <section id="menu" className="py-20 bg-[#0F0A08] text-[#E7D2B6]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#C98A5A]">
            Our Menu
          </h2>
          <p className="mt-3 text-[#BFA58A]">
            Choose a category to explore the full menu
          </p>
        </div>

        {loading ? (
          <div className="text-center text-[#BFA58A]">Loading menu categories...</div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => goMenu(c.id)}
              className="text-left rounded-3xl overflow-hidden border border-[#8B5A2B]/45 bg-[#1A110D]
                         hover:border-[#C98A5A]/70 transition shadow-[0_20px_60px_rgba(0,0,0,0.45)] group"
            >
              <div className="relative h-44">
                <img
                  src={c.image}
                  alt={c.label}
                  className="w-full h-full object-cover group-hover:scale-[1.04] transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
              </div>

              <div className="p-5">
                <p className="text-lg font-extrabold text-[#E7D2B6]">
                  {c.label}
                </p>
                <p className="mt-1 text-sm text-[#E7D2B6]/70">{c.desc}</p>

                <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#D7B38A]">
                  <span>Explore</span>
                  <span>→</span>
                </div>
              </div>
            </button>
          ))}
        </div>
        )}
      </div>
    </section>
  );
}
