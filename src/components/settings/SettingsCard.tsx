"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

type SettingsCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  id?: string;
};

export function SettingsCard({
  title,
  description,
  children,
  defaultOpen = true,
  collapsible = false,
  id,
}: SettingsCardProps) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="bg-[#FEFEFE]/90 backdrop-blur-sm rounded-xl border border-[#ECECEC] shadow-sm overflow-hidden"
    >
      <details open={defaultOpen} className="group">
        <summary
          className={`list-none px-5 py-4 flex items-start justify-between gap-4 ${
            collapsible ? "cursor-pointer hover:bg-[#FAFAFA]/80 transition-colors" : "cursor-default"
          } [&::-webkit-details-marker]:hidden`}
        >
          <motion.div layout="position">
            <h2 className="text-[17px] font-medium text-[#0A0A0B]">{title}</h2>
            {description && (
              <p className="text-[13px] text-[#6E6E73] mt-1 leading-relaxed max-w-2xl">
                {description}
              </p>
            )}
          </motion.div>
          {collapsible && (
            <span
              className="text-[#6E6E73] text-lg transition-transform duration-200 group-open:rotate-180 mt-0.5 shrink-0"
              aria-hidden
            >
              ▾
            </span>
          )}
        </summary>
        <motion.div
          layout="position"
          className="px-5 pb-5 pt-0 flex flex-col gap-4 border-t border-[#ECECEC]/80"
        >
          {children}
        </motion.div>
      </details>
    </motion.section>
  );
}
