"use client";
import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQs", href: "/#faqs" },
];

export default function UnauthUserNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-black px-6 sm:px-10 py-4 flex items-center">
      {/* Logo (left) */}
      <div className="flex-1">
        <Link href="/" className="no-underline">
          <span className="text-white font-bold text-xl tracking-wide font-serif">
            Learn<span className="text-[#C9A84C]">keys</span>
          </span>
        </Link>
      </div>

      {/* Center links (desktop) */}
      <div className="hidden md:flex items-center gap-10">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-[#D8C89A] text-xs tracking-[0.2em] uppercase hover:text-white transition-colors duration-200"
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Login (right, desktop) */}
      <div className="flex-1 hidden md:flex justify-end">
        <Link
          href="/login"
          className="bg-[#C9A84C] text-white text-xs tracking-[0.2em] uppercase rounded-full px-5 py-2 hover:bg-[#B8963E] transition-colors duration-200"
        >
          Login
        </Link>
      </div>

      {/* Hamburger (mobile) */}
      <button
        className="md:hidden flex flex-col gap-[5px] p-1"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
      >
        <span className={`block w-5 h-px bg-white transition-transform duration-200 origin-center ${menuOpen ? "translate-y-[6px] rotate-45" : ""}`} />
        <span className={`block w-5 h-px bg-white transition-opacity duration-200 ${menuOpen ? "opacity-0" : ""}`} />
        <span className={`block w-5 h-px bg-white transition-transform duration-200 origin-center ${menuOpen ? "-translate-y-[6px] -rotate-45" : ""}`} />
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black border-t border-white/10 flex flex-col px-6 py-5 gap-5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-[#D8C89A] text-xs tracking-[0.2em] uppercase hover:text-white transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="bg-[#C9A84C] text-white text-xs tracking-[0.2em] uppercase rounded-full px-5 py-2.5 text-center hover:bg-[#B8963E] transition-colors duration-200"
          >
            Login
          </Link>
        </div>
      )}
    </nav>
  );
}