"use client";

export default function CTASection() {
  return (
    <section className="bg-[#F5F2ED] px-6 pb-6">
      <div className="max-w-5xl mx-auto border border-dashed border-[#C9A84C]/40 rounded-2xl p-6">
        <div className="border border-dashed border-[#C9A84C]/30 rounded-xl py-16 px-6 flex flex-col items-center text-center">
          <h2 className="font-serif font-black text-[#1A1A1A] leading-none mb-4">
            <span className="block text-6xl md:text-7xl tracking-tight uppercase">
              Your First
            </span>
            <span className="block text-6xl md:text-7xl tracking-tight uppercase italic text-[#C9A84C]">
              Note
            </span>
            <span className="block text-6xl md:text-7xl tracking-tight uppercase">
              Awaits.
            </span>
          </h2>

          <p className="text-[#7A6E65] text-sm leading-relaxed max-w-md mt-4 mb-8">
            Join 12,400 students who chose to stop waiting and start playing. Your
            14-day free trial includes full access to every lesson, tool, and
            masterclass.
          </p>

          <button className="bg-[#C9A84C] hover:bg-[#B8963E] text-white text-[10px] tracking-[0.3em] uppercase font-semibold rounded-full px-10 py-3.5 transition-colors duration-200">
            Get Started
          </button>
        </div>
      </div>
    </section>
  );
}