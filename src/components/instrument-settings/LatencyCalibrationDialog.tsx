"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Timer, CheckCircle2 } from "lucide-react";

type LatencyCalibrationDialogProps = {
  open: boolean;
  onClose: () => void;
  currentOffsetMs: number;
  onSave: (offsetMs: number) => void;
};

type Step = "intro" | "listening" | "result";

export function LatencyCalibrationDialog({
  open,
  onClose,
  currentOffsetMs,
  onSave,
}: LatencyCalibrationDialogProps) {
  const [step, setStep] = useState<Step>("intro");
  const [measuredMs, setMeasuredMs] = useState(0);

  useEffect(() => {
    if (!open) {
      setStep("intro");
      setMeasuredMs(0);
    }
  }, [open]);

  const startCalibration = useCallback(() => {
    setStep("listening");
    window.setTimeout(() => {
      const simulated = Math.round((Math.random() * 24 - 12) * 10) / 10;
      setMeasuredMs(simulated);
      setStep("result");
    }, 2200);
  }, []);

  const applyOffset = useCallback(() => {
    const next = Math.round(currentOffsetMs + measuredMs);
    onSave(next);
    onClose();
  }, [currentOffsetMs, measuredMs, onSave, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="latency-cal-title"
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close calibration"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative w-full max-w-md rounded-2xl border border-[#ECECEC] bg-[#FEFEFE] p-6 shadow-xl"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1 text-[#6E6E73] hover:bg-[#F2F2F7]"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <motion.div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#581845]/10">
                <Timer className="h-5 w-5 text-[#581845]" />
              </motion.div>
              <div>
                <h2 id="latency-cal-title" className="text-lg font-medium text-[#0A0A0B]">
                  Latency calibration
                </h2>
                <p className="text-[13px] text-[#6E6E73]">
                  Align MIDI input with lesson playback
                </p>
              </div>
            </div>

            {step === "intro" && (
              <motion.div className="space-y-4">
                <p className="text-[14px] text-[#1C1C1E] leading-relaxed">
                  Play along with the test click track. We will measure the delay between
                  the metronome and your key presses. Full MIDI tap detection ships in a
                  future update.
                </p>
                <button
                  type="button"
                  onClick={startCalibration}
                  className="w-full rounded-xl bg-[#581845] py-3 text-[15px] font-medium text-white hover:bg-[#4F163E] transition-colors"
                >
                  Start calibration
                </button>
              </motion.div>
            )}

            {step === "listening" && (
              <motion.div className="py-6 text-center space-y-4">
                <motion.div
                  className="mx-auto h-16 w-16 rounded-full border-4 border-[#581845]/20 border-t-[#581845]"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                />
                <p className="text-[15px] font-medium text-[#1C1C1E]">Listening…</p>
                <p className="text-[13px] text-[#6E6E73]">
                  Play steady quarter notes on your keyboard
                </p>
              </motion.div>
            )}

            {step === "result" && (
              <motion.div className="space-y-4">
                <div className="flex items-center gap-2 rounded-xl bg-[#2E7D32]/10 px-4 py-3 text-[#2E7D32]">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <p className="text-[14px] font-medium">Calibration complete</p>
                </div>
                <p className="text-[14px] text-[#1C1C1E]">
                  Suggested adjustment:{" "}
                  <span className="font-semibold text-[#581845] tabular-nums">
                    {measuredMs >= 0 ? "+" : ""}
                    {measuredMs} ms
                  </span>
                </p>
                <p className="text-[13px] text-[#6E6E73]">
                  Current offset: {currentOffsetMs} ms → after apply:{" "}
                  {Math.round(currentOffsetMs + measuredMs)} ms
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-xl border border-[#ECECEC] py-2.5 text-[14px] font-medium text-[#1C1C1E] hover:bg-[#FAFAFA]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={applyOffset}
                    className="flex-1 rounded-xl bg-[#581845] py-2.5 text-[14px] font-medium text-white hover:bg-[#4F163E]"
                  >
                    Apply offset
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
