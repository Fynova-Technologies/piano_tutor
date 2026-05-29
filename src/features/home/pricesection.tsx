"use client";

import { useState } from "react";

const plans = {
  monthly: [
    {
      name: "Prelude",
      tag: null,
      description: "Perfect for curious beginners exploring the instrument.",
      price: 0,
      period: "/ forever",
      features: [
        { text: "5 lessons per month", included: true },
        { text: "Beginner curriculum only", included: true },
        { text: "Mobile & web access", included: true },
        { text: "AI feedback & ear training", included: false },
        { text: "Live masterclasses", included: false },
        { text: "Certificates", included: false },
      ],
      cta: "Get Started Free",
      ctaStyle: "outline",
    },
    {
      name: "Sonata",
      tag: "Most Popular",
      description: "For serious learners committed to real progress.",
      price: 19,
      period: "/ month",
      features: [
        { text: "Unlimited lessons", included: true },
        { text: "All skill levels & genres", included: true },
        { text: "AI feedback & ear training", included: true },
        { text: "Progress analytics dashboard", included: true },
        { text: "2 live masterclasses/month", included: true },
        { text: "Completion certificates", included: true },
      ],
      cta: "Start 14-Day Trial",
      ctaStyle: "gold",
    },
    {
      name: "Concerto",
      tag: null,
      description: "For institutions, studios, and multi-student households.",
      price: 49,
      period: "/ month",
      features: [
        { text: "Up to 8 student seats", included: true },
        { text: "Everything in Sonata", included: true },
        { text: "Instructor dashboard", included: true },
        { text: "Shared repertoire library", included: true },
        { text: "Unlimited masterclasses", included: true },
        { text: "Priority support", included: true },
      ],
      cta: "Contact Sales",
      ctaStyle: "outline",
    },
  ],
  annual: [
    {
      name: "Prelude",
      tag: null,
      description: "Perfect for curious beginners exploring the instrument.",
      price: 0,
      period: "/ forever",
      features: [
        { text: "5 lessons per month", included: true },
        { text: "Beginner curriculum only", included: true },
        { text: "Mobile & web access", included: true },
        { text: "AI feedback & ear training", included: false },
        { text: "Live masterclasses", included: false },
        { text: "Certificates", included: false },
      ],
      cta: "Get Started Free",
      ctaStyle: "outline",
    },
    {
      name: "Sonata",
      tag: "Most Popular",
      description: "For serious learners committed to real progress.",
      price: 13,
      period: "/ month",
      features: [
        { text: "Unlimited lessons", included: true },
        { text: "All skill levels & genres", included: true },
        { text: "AI feedback & ear training", included: true },
        { text: "Progress analytics dashboard", included: true },
        { text: "2 live masterclasses/month", included: true },
        { text: "Completion certificates", included: true },
      ],
      cta: "Start 14-Day Trial",
      ctaStyle: "gold",
    },
    {
      name: "Concerto",
      tag: null,
      description: "For institutions, studios, and multi-student households.",
      price: 34,
      period: "/ month",
      features: [
        { text: "Up to 8 student seats", included: true },
        { text: "Everything in Sonata", included: true },
        { text: "Instructor dashboard", included: true },
        { text: "Shared repertoire library", included: true },
        { text: "Unlimited masterclasses", included: true },
        { text: "Priority support", included: true },
      ],
      cta: "Contact Sales",
      ctaStyle: "outline",
    },
  ],
};

export default function PricingSection() {
  const [annual, setAnnual] = useState(false);
  const active = annual ? plans.annual : plans.monthly;

  return (
    <section className="bg-[#F5F2ED] px-6 py-20 md:py-28">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-8 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-[10px] tracking-[0.3em] uppercase font-medium">
              Pricing
            </span>
            <div className="w-8 h-px bg-[#C9A84C]" />
          </div>
          <h2 className="font-serif text-5xl md:text-6xl font-black text-[#1A1A1A] leading-tight mb-4">
            Simple,{" "}
            <br className="hidden md:block" />
            <em className="text-[#C9A84C]">Honest</em> Plans
          </h2>
          <p className="text-[#8A8078] text-sm">
            No hidden fees. No instrument required to start. Cancel any time.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-xs tracking-[0.2em] uppercase font-medium ${!annual ? "text-[#1A1A1A]" : "text-[#8A8078]"}`}>
            Monthly
          </span>
          <button
            onClick={() => setAnnual((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${annual ? "bg-[#C9A84C]" : "bg-[#C9A84C]"}`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${annual ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
          <span className={`text-xs tracking-[0.2em] uppercase font-medium ${annual ? "text-[#1A1A1A]" : "text-[#8A8078]"}`}>
            Annual
          </span>
          <span className="bg-[#C9A84C]/20 text-[#C9A84C] text-[9px] tracking-[0.15em] uppercase font-bold px-2.5 py-1 rounded-full">
            Save 35%
          </span>
        </div>

        {/* Cards */}
        <div className="bg-[#1C1C1C] rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#2A2A2A]">
          {active.map((plan) => (
            <div
              key={plan.name}
              className="p-8 flex flex-col gap-6 relative"
            >
              {/* Most Popular tag */}
              {plan.tag && (
                <div className="absolute top-6 left-8">
                  <span className="bg-[#C9A84C]/20 text-[#C9A84C] text-[9px] tracking-[0.15em] uppercase font-bold px-2.5 py-1 rounded-full border border-[#C9A84C]/30">
                    {plan.tag}
                  </span>
                </div>
              )}

              {/* Plan name & description */}
              <div className={plan.tag ? "mt-7" : ""}>
                <h3 className="text-white font-serif font-black text-2xl mb-2">
                  {plan.name}
                </h3>
                <p className="text-[#5A5A5A] text-xs leading-relaxed">
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="flex items-end gap-1">
                <span className="text-[#C9A84C] text-sm font-bold self-start mt-2">$</span>
                <span className="text-white font-serif font-black text-6xl leading-none">
                  {plan.price}
                </span>
                <span className="text-[#5A5A5A] text-xs mb-2 ml-1">{plan.period}</span>
              </div>

              {/* Divider */}
              <div className="h-px bg-[#2A2A2A]" />

              {/* Features */}
              <ul className="flex flex-col gap-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-center gap-3">
                    {f.included ? (
                      <span className="text-[#C9A84C] text-base leading-none shrink-0">✦</span>
                    ) : (
                      <span className="w-3.5 h-px bg-[#3A3A3A] shrink-0 ml-0.5" />
                    )}
                    <span
                      className={`text-xs ${
                        f.included ? "text-[#CCCCCC]" : "text-[#3A3A3A]"
                      }`}
                    >
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-2">
                {plan.ctaStyle === "gold" ? (
                  <button className="w-full bg-[#C9A84C] hover:bg-[#B8963E] text-white text-xs tracking-[0.2em] uppercase font-semibold rounded-full py-3.5 transition-colors duration-200">
                    {plan.cta}
                  </button>
                ) : (
                  <button className="w-full border border-[#3A3A3A] hover:border-[#C9A84C] text-[#AAAAAA] hover:text-[#C9A84C] text-xs tracking-[0.2em] uppercase font-medium rounded-full py-3.5 transition-colors duration-200">
                    {plan.cta}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}