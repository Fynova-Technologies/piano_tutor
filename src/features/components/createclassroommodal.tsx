"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

interface CreateClassroomModalProps {
  teacherId: string;
  onClose: () => void;
}

export default function CreateClassroomModal({ teacherId, onClose }: CreateClassroomModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Give your classroom a name first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data, error: insertError } = await supabase
        .from("classrooms")
        .insert({ teacher_id: teacherId, name: name.trim() })
        .select("id")
        .single();
      if (insertError) throw insertError;
      onClose();
      router.push(`/teacher/classrooms/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create classroom");
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
        <h2 className="text-lg font-semibold text-[#0A0A0B] mb-1">Create classroom</h2>
        <p className="text-sm text-[#6E6E73] mb-4">
          Give it a name. You&apos;ll be able to invite students once it&apos;s created.
        </p>

        <input
          type="text"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Saturday Beginners"
          className="w-full px-4 py-2.5 rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] text-sm text-[#151517] placeholder-[#AEAEB2] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
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
            onClick={handleCreate}
            disabled={submitting}
            className="px-5 py-2 rounded-full text-sm font-semibold bg-[#D4AF37] text-[#0A0A0B] hover:opacity-95 disabled:opacity-60 transition-opacity"
          >
            {submitting ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}