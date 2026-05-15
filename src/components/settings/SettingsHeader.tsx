"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Loader2, Check, CloudOff, AlertCircle } from "lucide-react";
import type { SyncStatus } from "@/hooks/settings/useUserSettings";

type SettingsHeaderProps = {
  title: string;
  subtitle: string;
  syncStatus?: SyncStatus;
  backLink?: ReactNode;
};

function SyncBadge({ status }: { status: SyncStatus }) {
  if (status === "loading") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] text-[#6E6E73]">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        Loading…
      </span>
    );
  }
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] text-[#6E6E73]">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        Saving…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] text-[#2E7D32]">
        <Check className="h-3.5 w-3.5" aria-hidden />
        Saved
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] text-[#C62828]">
        <AlertCircle className="h-3.5 w-3.5" aria-hidden />
        Sync issue
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-[#6E6E73]">
      <CloudOff className="h-3.5 w-3.5 opacity-60" aria-hidden />
      Auto-save on
    </span>
  );
}

export function SettingsHeader({
  title,
  subtitle,
  syncStatus = "idle",
  backLink,
}: SettingsHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mb-8"
    >
      {backLink}
      <motion.div
        className="relative overflow-hidden rounded-2xl border border-[#ECECEC] bg-gradient-to-br from-[#FEFEFE] via-[#FAFAFA] to-[#F5F0EB] p-6 shadow-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
      >
        <motion.div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#D4AF37]/10 blur-2xl"
          aria-hidden
        />
        <motion.div
          className="pointer-events-none absolute -bottom-6 left-1/3 h-24 w-24 rounded-full bg-[#581845]/5 blur-2xl"
          aria-hidden
        />
        <motion.div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#0A0A0B] sm:text-[28px]">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#6E6E73]">
              {subtitle}
            </p>
          </div>
          <SyncBadge status={syncStatus} />
        </motion.div>
      </motion.div>
    </motion.header>
  );
}
