"use client";

import Image from "next/image";
// import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { PianoKeysStripeLight } from "@/features/ai-review/PianoAnalysisChrome";
import { Lock } from "lucide-react";
import { useSubscription } from "@/hooks/subscribed/issubscribed";
import { useState } from "react";

/**
 * Standalone dashboard entry — matches MusicCategories card rhythm (premium white tile, gold hover).
 * Does not modify existing category cards; place this sibling in the dashboard layout.
 */
export default function AiAnalysisDashboardCard() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { loading, isAuthenticated, isSubscribed } = useSubscription();
  const hasAccess = isAuthenticated && isSubscribed;
  const [popup, setPopup] = useState<{
  type: "login" | "subscription";
  message: string;
} | null>(null);

if (loading) {
  return (
    <div className="mt-8 w-full rounded-2xl bg-gray-100 p-10 text-center text-sm text-gray-500">
      Checking access...
    </div>
  );
}

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mt-8 w-full"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
  // Guard: don't act if subscription state hasn't resolved yet
  if (loading) return;

  if (!isAuthenticated) {
    setPopup({
      type: "login",
      message: "Please sign in to access AI Performance Analysis.",
    });
    return;
  }

  if (!isSubscribed) {
    setPopup({
      type: "subscription",
      message: "AI Performance Analysis is available for premium subscribers only.",
    });
    return;
  }

  router.push("/ai-analysis");
}}
        onKeyDown={(e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    // ✅ Was using hasAccess (stale snapshot) — now matches onClick logic exactly
    if (!isAuthenticated) {
      setPopup({ type: "login", message: "Please sign in to access AI Performance Analysis." });
      return;
    }
    if (!isSubscribed) {
      setPopup({ type: "subscription", message: "AI Performance Analysis is available for premium subscribers only." });
      return;
    }
    router.push("/ai-analysis");
  }
}}
        className="relative bg-[#FEFEFE] rounded-2xl w-full hover:bg-[#f2e6c1] hover:rounded-3xl p-6 hover:shadow-[0_5px_10px_0px_#505050] transition duration-300 cursor-pointer group hover:scale-[1.02] text-left"
      >
        <Lock className={`absolute right-8 top-4 z-10 h-5 w-5 ${hasAccess ? "text-green-500 hidden" : "text-gray-400 "}`} />
        {/* <Link
          href="/ai-analysis/recovery"
          onClick={(e) => e.stopPropagation()}
          className="absolute right-4 top-4 z-10 rounded-full border border-[#D4AF37]/40 bg-white/95 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#6b5612] shadow-sm transition hover:bg-[#f2e6c1]"
        >
          Recovery studio
        </Link> */}
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="relative flex items-center overflow-hidden rounded-3xl">
            <div className="bg-[#FEFEFE] group-hover:bg-[#f2e6c1] transition duration-300 flex flex-col items-start justify-center z-10 min-h-[120px] ml-8 md:ml-16">
              <h3 className="primary-color-text text-[32px] md:text-[36px] font-bold p-0 m-0 leading-tight">
                AI
              </h3>
              <h3 className="text-[32px] md:text-[36px] font-bold bg-gradient-to-r from-[#5f4f19] to-[#aa8c2c] bg-clip-text text-transparent p-0 m-0 leading-tight">
                Performance Analysis
              </h3>
              <p className="mt-3 max-w-md text-sm text-[#535356]">
                Mistake trends, skill heatmaps, recovery roadmaps, and a personal coach view — powered by
                your history (cloud + device).
              </p>
            </div>
            <div className="pointer-events-none absolute left-[120px] md:left-[180px] opacity-80 group-hover:translate-x-4 transition-transform duration-700 ease-out">
              <div className="relative h-[140px] w-[140px] md:h-[160px] md:w-[160px]">
                <Image
                  src="/gifs/Vector.png"
                  alt=""
                  fill
                  className="object-contain drop-shadow-md"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 flex-col items-stretch gap-3 md:items-end md:pr-2">
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#D4AF37]/50 bg-[#0A0A0B] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#D4AF37] md:self-end">
              <Sparkles className="h-3.5 w-3.5" />
              Premium coach
            </div>
            <div className="rounded-2xl border border-black/10 bg-white px-5 py-4 shadow-[0_5px_10px_0px_rgba(80,80,80,0.12)] group-hover:border-[#D4AF37]/35 transition-colors">
              <p className="text-xs uppercase tracking-wide text-black/45">Explore</p>
              <p className="text-lg font-semibold text-[#0A0A0B]">Open AI Review Center →</p>
              <p className="mt-1 text-xs text-black/55">Charts, forecasts, and adaptive practice plans</p>
            </div>
          </div>
        </div>

        <PianoKeysStripeLight className="mt-6 rounded-md opacity-[0.55] transition-opacity duration-300 group-hover:opacity-[0.72]" />
      </div>
      {popup && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
      <h3 className="text-xl font-bold text-[#1A1A1A]">
        {popup.type === "login"
          ? "Authentication Required"
          : "Premium Feature"}
      </h3>

      <p className="mt-3 text-sm text-gray-600">
        {popup.message}
      </p>

      <div className="mt-6 flex gap-3 justify-end">
        <button
          onClick={() => setPopup(null)}
          className="rounded-lg border px-4 py-2 text-sm"
        >
          Close
        </button>

        {popup.type === "login" ? (
          <button
            onClick={() => router.push("/login")}
            className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm text-white"
          >
            Login
          </button>
        ) : (
          <button
            onClick={() => router.push("/pricing")}
            className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm text-white"
          >
            Upgrade
          </button>
        )}
      </div>
    </div>
  </div>
)}
    </motion.div>
  );
}
