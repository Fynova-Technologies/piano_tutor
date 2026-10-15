"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Lock } from "lucide-react";
import { useSubscription } from "@/hooks/subscribed/issubscribed";
import { useState } from "react";

type PopupState = {
  type: "login" | "subscription";
  message: string;
} | null;

const TAGS = ["Mistake trends", "Skill heatmap", "Recovery plan"];

export default function AiAnalysisDashboardCard() {
  const router = useRouter();
  const { loading, isAuthenticated, isSubscribed } = useSubscription();
  const hasAccess = isAuthenticated && isSubscribed;
  const [popup, setPopup] = useState<PopupState>(null);

  const handleOpen = () => {
    // Don't act until subscription state has resolved
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
  };

  if (loading) {
    return (
      <div className="mt-8 h-[120px] w-full animate-pulse rounded-2xl border border-[#e8d9b5] bg-[#f6ecd6]/60" />
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
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleOpen();
          }
        }}
        className="group relative flex w-full cursor-pointer flex-col gap-5 rounded-2xl border border-[#EBD9BD] bg-gradient-to-r from-[#F3EBD8]  to-[#FFFBF2] px-9 py-9 text-left shadow-sm transition duration-300 hover:shadow-[0_6px_16px_rgba(120,90,20,0.15)] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b8862b] md:flex-row md:items-center md:justify-between md:px-8"
      >
        {/* Left: text + chips */}
        <div className="max-w-2xl space-y-3">
          <h3 className="font-source-serif-4  text-[34px] leading-tight text-[#171613] font-normal md:text-[30px]">
            AI performance analysis
          </h3>
          <p className="mt-2 text-sm text-[#5c5648]">
            See which notes trip you up and get a short practice plan built from
            your own sessions.
          </p>

          <div className="mt-4 pt-3 flex flex-wrap gap-2">
            {TAGS.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#ecd9b0] px-3 py-1 text-xs font-medium text-[#4a3a12]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Right: CTA (lock shown inside when user has no access) */}
        <div className="flex-shrink-0">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#b8862b] px-6 py-3 text-sm font-semibold text-[#2b1f05] transition duration-300 group-hover:bg-[#c9952f]">
            {!hasAccess && <Lock className="h-4 w-4" aria-label="Locked" />}
            Open AI review
          </span>
        </div>
      </div>

      {/* Login / upgrade popup */}
      {popup && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={() => setPopup(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-[#1A1A1A]">
              {popup.type === "login" ? "Authentication Required" : "Premium Feature"}
            </h3>

            <p className="mt-3 text-sm text-gray-600">{popup.message}</p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setPopup(null)}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                Close
              </button>

              <button
                onClick={() =>
                  router.push(popup.type === "login" ? "/login" : "/pricing")
                }
                className="rounded-lg bg-[#b8862b] px-4 py-2 text-sm text-white"
              >
                {popup.type === "login" ? "Login" : "Upgrade"}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}