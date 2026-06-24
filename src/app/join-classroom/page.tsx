"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function JoinClassroomPage() {
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
        .single<{ classroom_name: string }>();
      if (rpcError) throw rpcError;
      router.push(`/student-classes?joined=${encodeURIComponent(data?.classroom_name ?? "")}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't join that classroom");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#E8E4DC] bg-[#FEFEFE] p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-[#0A0A0B] font-poppins">Join a classroom</h1>
        <p className="text-sm text-[#6E6E73] mt-2 mb-5">
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

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

        <button
          type="button"
          onClick={handleJoin}
          disabled={submitting}
          className="w-full mt-5 px-5 py-3 rounded-full text-sm font-semibold bg-[#D4AF37] text-[#0A0A0B] hover:opacity-95 disabled:opacity-60 transition-opacity"
        >
          {submitting ? "Joining…" : "Join classroom"}
        </button>
      </div>
    </div>
  );
}