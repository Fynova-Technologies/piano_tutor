"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

interface JoinClassroomModalProps {
  onClose: () => void;
}

export default function JoinClassroomModal({ onClose }: JoinClassroomModalProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleJoin = async () => {
    if (!code.trim()) {
      setError("Enter the code your teacher gave you.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase
        .rpc("join_classroom_by_code", { p_class_code: code.trim() })
        .single();

      if (rpcError) {
        console.error("join_classroom_by_code error:", rpcError);
        throw rpcError;
      }
      const result = data as {
  result_classroom_id: string;
};

      onClose();
      router.push(`/student/classrooms/${result.result_classroom_id}`);
    } catch (err) {
      const supabaseStyleError = err as { message?: string; details?: string; hint?: string } | null;
      const readableMessage =
        supabaseStyleError?.message ||
        (err instanceof Error ? err.message : null) ||
        "Couldn't join that classroom";
      setError(readableMessage);
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[#FEFEFE] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-[#0A0A0B] mb-1">Join a classroom</h2>
        <p className="text-sm text-[#6E6E73] mb-4">
          Enter the code your teacher shared with you.
        </p>

        <input
          type="text"
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. 9A5F28"
          maxLength={6}
          className="w-full px-4 py-3 rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] text-center text-lg font-mono tracking-widest text-[#151517] placeholder-[#AEAEB2] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleJoin();
          }}
        />

        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-sm font-medium text-[#6E6E73] hover:bg-[#F5F3EE] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleJoin}
            disabled={submitting}
            className="px-5 py-2 rounded-full text-sm font-semibold bg-[#D4AF37] text-[#0A0A0B] hover:opacity-95 disabled:opacity-60 transition-opacity"
          >
            {submitting ? "Joining…" : "Join"}
          </button>
        </div>
      </div>
    </div>
  );
}