"use client";

import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type SettingsSectionProps = {
  title: string;
  description?: string;
  icon: LucideIcon;
  children: ReactNode;
  index?: number;
  id?: string;
};

export function SettingsSection({
  title,
  description,
  icon: Icon,
  children,
  index = 0,
  id,
}: SettingsSectionProps) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        ease: "easeOut",
        delay: index * 0.05,
      }}
      className="bg-[#FEFEFE]/90 backdrop-blur-sm rounded-xl border border-[#ECECEC] shadow-sm overflow-hidden"
    >
      <div className="px-5 pt-5 pb-4 flex items-start gap-4">
        <motion.div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#581845]/10 to-[#D4AF37]/15 border border-[#ECECEC]/80"
          whileHover={{ scale: 1.03 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
        >
          <Icon className="h-5 w-5 text-[#581845]" strokeWidth={1.75} aria-hidden />
        </motion.div>
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="text-[17px] font-medium text-[#0A0A0B]">{title}</h2>
          {description && (
            <p className="text-[13px] text-[#6E6E73] mt-1 leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>
      </div>
      <motion.div className="mx-5 border-t border-[#ECECEC]/80" />
      <div className="px-5 py-5 flex flex-col gap-4">{children}</div>
    </motion.section>
  );
}
