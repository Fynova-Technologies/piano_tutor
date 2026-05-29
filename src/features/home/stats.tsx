"use client";

const stats = [
  { value: "12,400", label: "Active\nStudents" },
  { value: "340", label: "Lessons\nAvailable" },
  { value: "98", label: "% Satisfaction\nRate" },
  { value: "47", label: "Expert\nInstructors" },
];

export default function Stats() {
  return (
    <section className="bg-[#EDEAE4] border-t border-[#D8D4CC]">
      <div className="max-w-5xl mx-auto grid grid-cols-4 divide-x divide-[#D8D4CC]">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center py-10 px-6 gap-2"
          >
            <span className="text-[#1A1A1A] font-black text-4xl md:text-5xl tracking-tight font-serif">
              {stat.value}
            </span>
            <span className="text-[#8A8078] text-[10px] tracking-[0.25em] uppercase text-center leading-relaxed font-medium whitespace-pre-line">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
