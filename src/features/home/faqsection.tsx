"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Do I need a piano to start?",
    a: "No — you can begin with any keyboard, including a free virtual piano on our app. We recommend at least 25 keys, but many students start on a phone or tablet.",
  },
  {
    q: "How does AI feedback actually work?",
    a: "You record yourself playing through your device microphone or MIDI connection. Our model analyzes timing, dynamics, and pitch accuracy in real time, then surfaces specific suggestions — like a teacher listening over your shoulder.",
  },
  {
    q: "Can I switch plans or cancel anytime?",
    a: "Yes, completely. Upgrade, downgrade, or cancel from your account settings with no penalties. Annual plans are refundable within 30 days.",
  },
  {
    q: "What genres are covered?",
    a: "Classical, jazz, pop, R&B, film scores, and contemporary. The library grows weekly and you can request specific pieces through your dashboard.",
  },
  {
    q: "Is there a student or educator discount?",
    a: "Yes — students get 20% off Sonata with a valid .edu email. Educators and institutions should contact us for Concerto pricing tailored to their setup.",
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-[#F5F2ED] px-6 pb-24">
      <div className="max-w-5xl mx-auto">
        <div
          className="rounded-2xl border border-dashed border-[#C9A84C]/40 p-8 md:p-12 grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-12 items-start"
        >
          {/* Left */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-px bg-[#C9A84C]" />
              <span className="text-[#C9A84C] text-[10px] tracking-[0.3em] uppercase font-medium">
                Questions
              </span>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-black text-[#1A1A1A] leading-tight">
              Things
              <br />
              <em className="text-[#C9A84C]">People</em>{" "}
              <span className="italic">Ask</span>
            </h2>
            <p className="text-[#8A8078] text-xs leading-relaxed max-w-[200px]">
              Still unsure? Reach us at hello@learnkeys.app — we reply within 24
              hours.
            </p>
            <button className="self-start bg-[#C9A84C] hover:bg-[#B8963E] text-white text-[10px] tracking-[0.2em] uppercase font-semibold rounded-full px-6 py-3 transition-colors duration-200">
              Contact Support
            </button>
          </div>

          {/* Right — accordion */}
          <div className="flex flex-col divide-y divide-[#1A1A1A]/10">
            {faqs.map((faq, i) => (
              <div key={i} className="py-4">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 text-left group"
                >
                  <span className="text-[#1A1A1A] text-sm font-medium group-hover:text-[#C9A84C] transition-colors duration-150">
                    {faq.q}
                  </span>
                  <span
                    className={`shrink-0 w-5 h-5 rounded-full border border-[#1A1A1A]/20 flex items-center justify-center transition-transform duration-200 ${
                      open === i ? "rotate-45 border-[#C9A84C]" : ""
                    }`}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      className={open === i ? "stroke-[#C9A84C]" : "stroke-[#1A1A1A]"}
                    >
                      <path d="M5 1v8M1 5h8" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>

                {open === i && (
                  <p className="text-[#7A6E65] text-xs leading-relaxed mt-3 pr-8">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}