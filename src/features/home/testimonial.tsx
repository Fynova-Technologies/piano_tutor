"use client";

const testimonials = [
  {
    initials: "SM",
    name: "Sarah M.",
    role: "Graphic Designer, 8 months on Learnkeys",
    quote:
      "I tried three other apps before Learnkeys. The difference is the AI feedback — it caught my wrist tension issue in week two. No human teacher ever mentioned it.",
  },
  {
    initials: "RK",
    name: "Robert K.",
    role: "Retired Engineer, 14 months on Learnkeys",
    quote:
      "I'm 54 and always thought it was too late. Learnkeys proved me completely wrong. I performed Für Elise at my daughter's wedding six months in.",
  },
  {
    initials: "AL",
    name: "Aisha L.",
    role: "Music Producer, 6 months on Learnkeys",
    quote:
      "The Jazz curriculum is exceptional. I went from knowing zero theory to improvising over standards in 4 months. The masterclasses push you further than you expect.",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="bg-[#F5F2ED] px-6 py-20 md:py-28">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-8 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-[10px] tracking-[0.3em] uppercase font-medium">
              Stories
            </span>
            <div className="w-8 h-px bg-[#C9A84C]" />
          </div>
          <h2 className="font-serif text-5xl md:text-6xl font-black text-[#1A1A1A] leading-tight">
            Students Who
            <br />
            <em className="text-[#C9A84C]">Found</em>{" "}
            <span className="italic">Their Sound</span>
          </h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-[#1C1C1C] rounded-2xl p-7 flex flex-col justify-between gap-6"
            >
              <div className="flex flex-col gap-4">
                {/* Quote mark */}
                <span className="text-[#C9A84C] text-lg font-serif leading-none">&quot;</span>

                {/* Stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#C9A84C">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>

                {/* Quote text */}
                <p className="text-[#AAAAAA] text-xs leading-relaxed italic">
                  {t.quote}
                </p>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-[#2A2A2A]">
                <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/30 flex items-center justify-center shrink-0">
                  <span className="text-[#C9A84C] text-[9px] font-bold tracking-wide">
                    {t.initials}
                  </span>
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">{t.name}</p>
                  <p className="text-[#4A4A4A] text-[10px] leading-snug">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}