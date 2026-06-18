"use client";
import Link from 'next/link';
import { useState } from 'react';

export default function UnauthUserNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-[#1A1A1A] px-6 sm:px-8 py-4 flex items-center justify-between relative">
      {/* Left nav links — hidden on mobile */}
      <div className="hidden sm:flex items-center gap-8">
        <a href="/dashboard" className="text-white text-xs tracking-[0.2em] font-medium hover:text-[#C9A84C] transition-colors duration-200 uppercase">
          About
        </a>
        <a href="/method" className="text-white text-xs tracking-[0.2em] font-medium hover:text-[#C9A84C] transition-colors duration-200 uppercase">
          Courses
        </a>
      </div>

      {/* Hamburger — visible on mobile only */}
      <button
        className="sm:hidden flex flex-col gap-[5px] p-1 z-10"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span className={`block w-5 h-px bg-white transition-transform duration-200 origin-center ${menuOpen ? 'translate-y-[6px] rotate-45' : ''}`} />
        <span className={`block w-5 h-px bg-white transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
        <span className={`block w-5 h-px bg-white transition-transform duration-200 origin-center ${menuOpen ? '-translate-y-[6px] -rotate-45' : ''}`} />
      </button>

      {/* Centered logo */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <span className="text-white font-bold text-xl tracking-wide">
          Learn<span className="text-[#C9A84C] italic font-light">keys</span>
        </span>
      </div>

      {/* Right CTA buttons — hidden on mobile */}
      <div className="hidden sm:flex items-center gap-3">
        <Link href="/login" className="text-white text-xs tracking-[0.2em] uppercase border border-white/30 rounded-full px-5 py-2 hover:border-white transition-colors duration-200">
          Login
        </Link>
        <Link href="/dashboard" className="bg-[#C9A84C] text-white text-xs tracking-[0.2em] uppercase rounded-full px-5 py-2 font-semibold hover:bg-[#B8963E] transition-colors duration-200">
          Get Started
        </Link>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-[#1A1A1A] border-t border-white/10 flex flex-col px-6 py-5 gap-5 z-50">
          <a href="/dashboard" onClick={() => setMenuOpen(false)} className="text-white text-xs tracking-[0.2em] font-medium hover:text-[#C9A84C] transition-colors duration-200 uppercase">
            About
          </a>
          <a href="/method" onClick={() => setMenuOpen(false)} className="text-white text-xs tracking-[0.2em] font-medium hover:text-[#C9A84C] transition-colors duration-200 uppercase">
            Courses
          </a>
          <div className="flex flex-col gap-3 pt-2 border-t border-white/10">
            <Link href="/login" onClick={() => setMenuOpen(false)} className="text-white text-xs tracking-[0.2em] uppercase border border-white/30 rounded-full px-5 py-2.5 hover:border-white transition-colors duration-200 text-center">
              Login
            </Link>
            <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="bg-[#C9A84C] text-white text-xs tracking-[0.2em] uppercase rounded-full px-5 py-2.5 font-semibold hover:bg-[#B8963E] transition-colors duration-200 text-center">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}