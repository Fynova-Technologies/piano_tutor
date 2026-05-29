"use client";

const links = {
  Product: ["How it Works", "Features", "Pricing", "Masterclasses", "Mobile App"],
  Learn: ["Beginner Path", "Classical", "Jazz & Blues", "Music Theory", "Blog"],
  Company: ["About", "Instructors", "Careers", "Privacy", "Terms"],
};

const socialIcons = {
  X: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.727-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  In: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
  Yt: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#1A1A1A" />
    </svg>
  ),
  Ig: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  ),
};

export default function Footer() {
  return (
    <footer className="bg-[#111111] px-8 pt-14 pb-8">
      <div className="max-w-5xl mx-auto">
        {/* Top row */}
        <div className="grid grid-cols-2 md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 bg-[#C9A84C] rounded-md flex items-center justify-center">
                <span className="text-[#1A1A1A] text-[10px] font-black tracking-tight">LK</span>
              </div>
              <span className="text-white font-bold text-base tracking-wide">
                Learnkeys
              </span>
            </div>
            <p className="text-[#4A4A4A] text-xs leading-relaxed max-w-[180px]">
              The more thoughtfully designed piano learning platform for the modern era.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([heading, items]) => (
            <div key={heading}>
              <p className="text-[#4A4A4A] text-[9px] tracking-[0.25em] uppercase font-semibold mb-4">
                {heading}
              </p>
              <ul className="flex flex-col gap-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-[#666] text-xs hover:text-[#C9A84C] transition-colors duration-150"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="border-t border-[#222] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#333] text-[10px]">
            © 2026 Learnkeys Inc. All rights reserved.
          </p>

          {/* Social icons */}
          <div className="flex items-center gap-2">
            {Object.entries(socialIcons).map(([label, icon]) => (
              <button
                key={label}
                aria-label={label}
                className="w-7 h-7 rounded-full border border-[#2A2A2A] flex items-center justify-center text-[#444] hover:text-[#C9A84C] hover:border-[#C9A84C]/40 transition-colors duration-150"
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}