"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserclient";

const CATEGORIES = [
  "All",
  "Library",
  "Method Lessons",
  "Sight Reading",
  "Technique Lessons",
  "AI Analysis",
] as const;

type Testimonial = {
  id: string;
  user_name: string;
  category: string;
  rating: number;
  comment: string;
  created_at: string;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          viewBox="0 0 24 24"
          fill={star <= rating ? "#C9A84C" : "none"}
          stroke={star <= rating ? "#C9A84C" : "#3A3A3A"}
          strokeWidth="1.5"
          className="w-3.5 h-3.5"
        >
          <path d="M12 3.5l2.6 5.3 5.9.8-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.8L12 3.5Z" />
        </svg>
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("testimonials")
        .select("id, user_name, category, rating, comment, created_at")
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setTestimonials(data as Testimonial[]);
      }
      setLoading(false);
    };

    load();
  }, []);

  const visible = useMemo(
    () =>
      filter === "All"
        ? testimonials
        : testimonials.filter((t) => t.category === filter),
    [testimonials, filter]
  );

  return (
    <section className="bg-[#F5F2ED] px-8 py-20 md:py-28">
      <div className="max-w-5xl mx-auto">
        {/* Header — matches PlatformSection */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-8 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-[10px] tracking-[0.3em] uppercase font-medium">
              Testimonials
            </span>
            <div className="w-8 h-px bg-[#C9A84C]" />
          </div>
          <h2 className="font-serif text-5xl md:text-6xl font-black text-[#1A1A1A] leading-tight mb-4">
            What Students Are <br className="hidden md:block" />
            <em className="text-[#C9A84C]">Saying</em>
          </h2>
          <p className="text-[#8A8078] text-sm max-w-md mx-auto leading-relaxed">
            Real feedback on the lessons, tools, and practice sessions that make
            up Learnkeys.
          </p>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`text-xs rounded-full px-4 py-2 border transition-colors ${
                filter === c
                  ? "bg-[#1A1A1A] border-[#1A1A1A] text-white font-bold"
                  : "border-[#D8D2C6] text-[#8A8078] hover:border-[#C9A84C]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <p className="text-center text-[#8A8078] text-sm">Loading testimonials...</p>
        ) : visible.length === 0 ? (
          <p className="text-center text-[#8A8078] text-sm">
            No testimonials in this category yet — be the first to leave one.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {visible.map((t) => (
              <div
                key={t.id}
                className="bg-[#0F0D0B] rounded-2xl p-6 flex flex-col gap-4 border border-[#1E1E1E]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wide text-[#C9A84C] border border-[#EFC264] rounded-full px-3 py-1">
                    {t.category}
                  </span>
                  <Stars rating={t.rating} />
                </div>

                <p className="text-[#CFCFCF] text-sm leading-relaxed">
                  {t.comment}
                </p>

                <div className="flex items-center gap-3 mt-auto pt-2 border-t border-[#1E1E1E]">
                  <div className="w-8 h-8 rounded-full bg-[#C9A84C] text-[#0F0D0B] text-xs font-bold flex items-center justify-center">
                    {t.user_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white text-xs font-medium">
                    {t.user_name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}