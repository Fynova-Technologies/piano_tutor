"use client";

export default function CTASection() {
  return (
    <section className="bg-[#0A0A0A] border-t border-[#F2ECE014] px-6 pb-12">
      <div className="max-w-7xl mx-auto border border-[#c4993c15] rounded-2xl p-6 mt-10 bg-[radial-gradient(ellipse_at_center,#C49A3C0F_10%,#C49A3C00_70%)]">
        <div className=" rounded-xl py-16 px-6 flex flex-col items-center text-center">
          <h2 className="font-playfair text-[#F2ECE0] leading-none mb-4">
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

          <p className="text-[#B9B9B9] text-sm leading-relaxed max-w-md mt-4 mb-8">
            Join 12,400 students who chose to stop waiting and start playing. Your
            14-day free trial includes full access to every lesson, tool, and
            masterclass.
          </p>

          <button className="bg-[#C49A3C] hover:bg-[#B8963E] text-white text-[14px] tracking-[0.3em] uppercase font-medium rounded-full px-10 py-3.5 transition-colors duration-200">
            Get Started
          </button>
        </div>
      </div>
    </section>
  );
}