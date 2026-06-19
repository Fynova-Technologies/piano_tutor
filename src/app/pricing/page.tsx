"use client";

import { useState } from "react";
import Link from "next/link";

// ✅ Replace these with your actual Price IDs from Stripe Dashboard
// Stripe Dashboard → Products → Create Product → Copy price_xxx ID
const PRICE_IDS = {
  sonata_monthly:   "price_1TdktsAliuvzuFLSeCMhQAId",
  sonata_annual:    "price_1TdkzTAliuvzuFLSER8W026i",
  concerto_monthly: "price_1TdkwYAliuvzuFLSGNY6yOn2",
  concerto_annual:  "price_1TdkyVAliuvzuFLSjsPqJsNk",
};

type Feature = { text: string; included: boolean };

type Plan = {
  name: string;
  tag: string | null;
  description: string;
  price: number;
  period: string;
  priceId?: string;
  features: Feature[];
  cta: string;
  ctaStyle: string;
};

const plans: { monthly: Plan[]; annual: Plan[] } = {
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
      priceId: PRICE_IDS.sonata_monthly,
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
      priceId: PRICE_IDS.concerto_monthly,
      features: [
        { text: "Up to 8 student seats", included: true },
        { text: "Everything in Sonata", included: true },
        { text: "Instructor dashboard", included: true },
        { text: "Shared repertoire library", included: true },
        { text: "Unlimited masterclasses", included: true },
        { text: "Priority support", included: true },
      ],
      cta: "Get Concerto",
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
      priceId: PRICE_IDS.sonata_annual,
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
      priceId: PRICE_IDS.concerto_annual,
      features: [
        { text: "Up to 8 student seats", included: true },
        { text: "Everything in Sonata", included: true },
        { text: "Instructor dashboard", included: true },
        { text: "Shared repertoire library", included: true },
        { text: "Unlimited masterclasses", included: true },
        { text: "Priority support", included: true },
      ],
      cta: "Get Concerto",
      ctaStyle: "outline",
    },
  ],
};

const faqs = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your account settings whenever you like — you'll keep access through the end of your current billing period.",
  },
  {
    q: "Does the free trial require a card?",
    a: "Sonata's 14-day trial requires a card on file, but you won't be charged until the trial ends. Cancel before then and you won't pay a thing.",
  },
  {
    q: "Can I switch plans later?",
    a: "Absolutely. Upgrade, downgrade, or switch between monthly and annual billing at any time from your account page.",
  },
  {
    q: "What happens to my progress if I downgrade?",
    a: "Your lesson history and progress are always saved. Downgrading only limits which new lessons and features you can access going forward.",
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const active = annual ? plans.annual : plans.monthly;

  async function handleCheckout(plan: Plan) {
    // Free plan — just send them into the app
    if (!plan.priceId || plan.price === 0) {
      window.location.href = "/";
      return;
    }

    setError(null);
    setLoadingPlan(plan.name);

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: plan.priceId,
          planName: plan.name.toLowerCase(),
        }),
      });

      const data = await res.json();

      // Not logged in → send to login, then back here after
      if (res.status === 401) {
        window.location.href = "/login?redirect=/pricing";
        return;
      }

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      // ✅ Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <main className="bg-[#F5F2ED] min-h-screen">
      {/* Top bar — keeps people oriented since this is a standalone page, not a section */}
      <div className="border-b border-[#E3DDD0] px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-[#8A8078] hover:text-[#1A1A1A] text-xs tracking-[0.15em] uppercase font-medium transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            Back to Learnkeys
          </Link>
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            <span className="font-serif font-black text-sm text-[#1A1A1A]">Learnkeys</span>
          </div>
        </div>
      </div>

      <section className="px-6 py-16 md:py-24">
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
            <h1 className="font-serif text-5xl md:text-6xl font-black text-[#1A1A1A] leading-tight mb-4">
              Simple,{" "}
              <br className="hidden md:block" />
              <em className="text-[#C9A84C]">Honest</em> Plans
            </h1>
            <p className="text-[#8A8078] text-sm max-w-md mx-auto">
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
              className="relative w-11 h-6 rounded-full bg-[#C9A84C] transition-colors duration-300"
              aria-label="Toggle annual billing"
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

          {/* Error Banner */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center py-3 px-4 rounded-xl">
              {error}
            </div>
          )}

          {/* Cards */}
          <div className="bg-[#1C1C1C] rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#2A2A2A]">
            {active.map((plan) => (
              <div key={plan.name} className="p-8 flex flex-col gap-6 relative">

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
                      <span className={`text-xs ${f.included ? "text-[#CCCCCC]" : "text-[#3A3A3A]"}`}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-2">
                  {plan.ctaStyle === "gold" ? (
                    <button
                      onClick={() => handleCheckout(plan)}
                      disabled={loadingPlan === plan.name}
                      className="w-full bg-[#C9A84C] hover:bg-[#B8963E] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs tracking-[0.2em] uppercase font-semibold rounded-full py-3.5 transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      {loadingPlan === plan.name ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Redirecting...
                        </>
                      ) : plan.cta}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCheckout(plan)}
                      disabled={loadingPlan === plan.name}
                      className="w-full border border-[#3A3A3A] hover:border-[#C9A84C] disabled:opacity-60 disabled:cursor-not-allowed text-[#AAAAAA] hover:text-[#C9A84C] text-xs tracking-[0.2em] uppercase font-medium rounded-full py-3.5 transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      {loadingPlan === plan.name ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-[#C9A84C]/40 border-t-[#C9A84C] rounded-full animate-spin" />
                          Redirecting...
                        </>
                      ) : plan.cta}
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>

          {/* FAQ — extra content that earns its place on a full standalone page */}
          <div className="mt-20 max-w-2xl mx-auto">
            <h2 className="font-serif text-2xl font-black text-[#1A1A1A] text-center mb-8">
              Questions, answered
            </h2>
            <div className="flex flex-col divide-y divide-[#E3DDD0]">
              {faqs.map((item, i) => (
                <div key={item.q} className="py-4">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between text-left gap-4"
                  >
                    <span className="text-sm font-semibold text-[#1A1A1A]">{item.q}</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#C9A84C"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-45" : ""}`}
                    >
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                  {openFaq === i && (
                    <p className="text-[#8A8078] text-sm leading-relaxed mt-3 pr-8">
                      {item.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}