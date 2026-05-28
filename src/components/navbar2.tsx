"use client";

export default function UnauthUserNavbar() {
  return (
    <nav className="bg-[#1A1A1A] px-8 py-4 flex items-center justify-between">
      {/* Left nav links */}
      <div className="flex items-center gap-8">
        <a
          href="#"
          className="text-white text-xs tracking-[0.2em] font-medium hover:text-[#C9A84C] transition-colors duration-200 uppercase"
        >
          About
        </a>
        <a
          href="#"
          className="text-white text-xs tracking-[0.2em] font-medium hover:text-[#C9A84C] transition-colors duration-200 uppercase"
        >
          Courses
        </a>
      </div>

      {/* Centered logo */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <span className="text-white font-bold text-xl tracking-wide">
          Learn<span className="text-[#C9A84C] italic font-light">keys</span>
        </span>
      </div>

      {/* Right CTA buttons */}
      <div className="flex items-center gap-3">
        <button className="text-white text-xs tracking-[0.2em] uppercase border border-white/30 rounded-full px-5 py-2 hover:border-white transition-colors duration-200">
          Login
        </button>
        <button className="bg-[#C9A84C] text-white text-xs tracking-[0.2em] uppercase rounded-full px-5 py-2 font-semibold hover:bg-[#B8963E] transition-colors duration-200">
          Get Started
        </button>
      </div>
    </nav>
  );
}
