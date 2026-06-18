"use client";

const stats = [
  { value: "12,400", label: "Active\nStudents" },
  { value: "340", label: "Lessons\nAvailable" },
  { value: "98", label: "% Satisfaction\nRate" },
  { value: "47", label: "Expert\nInstructors" },
];

export default function Stats() {
  return (
    <section className="bg-[#F5F2ED] border-y border-[#000000]/8">
      <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`flex flex-col items-center justify-center py-8 sm:py-10 px-4 sm:px-6 gap-2
              ${i % 2 === 0 && i !== stats.length - 1 ? "border-r border-[#000000]/8 sm:border-r-0" : ""}
              ${i < 2 ? "border-b border-[#000000]/8 sm:border-b-0" : ""}
              sm:[&:not(:last-child)]:border-r sm:[&:not(:last-child)]:border-[#000000]/8
            `}
          >
            <span className="text-[#000000] font-bold text-3xl sm:text-4xl md:text-[38.4px] tracking-tight font-inter">
              {stat.value}
            </span>
            <span className="text-[#5D5D5D] text-[11px] sm:text-[13px] md:text-[14px] tracking-[1.8px] sm:tracking-[2.3px] uppercase text-center leading-relaxed font-normal whitespace-pre-line">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}