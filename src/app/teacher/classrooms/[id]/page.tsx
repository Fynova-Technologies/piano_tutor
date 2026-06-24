"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useClassroomDashboardData } from "@/hooks/useClassroomDashboard";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-900",
  pending: "bg-amber-100 text-amber-900",
};

export default function ClassroomDashboardPage() {
  const params = useParams<{ id: string }>();
  const classroomId = params.id;
  const { loading, error, classroomName, classCode, students, inviteStudent } = useClassroomDashboardData(classroomId);

  const [email, setEmail] = useState("");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const handleInvite = async () => {
    if (!email.trim()) return;
    setInviteSubmitting(true);
    setInviteMessage(null);
    const result = await inviteStudent(email);
    setInviteMessage({ type: result.success ? "success" : "error", text: result.message });
    if (result.success) setEmail("");
    setInviteSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
          <p className="text-[#6E6E73] text-sm font-medium">Loading classroom…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1] pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        <div>
          <Link href="/teacher" className="text-sm font-medium text-[#581845] no-underline hover:underline">
            ← Back to dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#0A0A0B] mt-2 font-poppins">
            {classroomName}
          </h1>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Class code */}
        <section className="rounded-2xl border border-[#D4AF37]/40 bg-gradient-to-br from-[#FFFDF5] to-[#F8F6F1] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#6E6E73]">Class code</h3>
            <p className="text-3xl font-bold text-[#581845] tracking-widest mt-1 font-mono">{classCode}</p>
            <p className="text-sm text-[#6E6E73] mt-1">
              Students can join instantly by entering this code — no invite needed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(classCode)}
            className="self-start sm:self-center px-5 py-2.5 rounded-full text-sm font-semibold bg-[#D4AF37] text-[#0A0A0B] hover:opacity-95 transition-opacity whitespace-nowrap"
          >
            Copy code
          </button>
        </section>

        {/* Invite student */}
        <section className="rounded-2xl border border-[#E8E4DC] bg-[#FEFEFE] p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#0A0A0B] mb-1">Invite a student</h3>
          <p className="text-sm text-[#6E6E73] mb-4">
            Enter the email they signed up with. They&apos;ll show as pending until they accept.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@email.com"
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] text-sm text-[#151517] placeholder-[#AEAEB2] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleInvite();
              }}
            />
            <button
              type="button"
              onClick={handleInvite}
              disabled={inviteSubmitting}
              className="px-5 py-2.5 rounded-full text-sm font-semibold bg-[#D4AF37] text-[#0A0A0B] hover:opacity-95 disabled:opacity-60 transition-opacity whitespace-nowrap"
            >
              {inviteSubmitting ? "Sending…" : "Send invite"}
            </button>
          </div>
          {inviteMessage && (
            <p
              className={`text-sm mt-2 ${
                inviteMessage.type === "success" ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {inviteMessage.text}
            </p>
          )}
        </section>

        {/* Students */}
        <section className="rounded-2xl border border-[#E8E4DC] bg-[#FEFEFE] p-6 sm:p-8 shadow-sm">
          <h3 className="text-lg font-semibold text-[#0A0A0B] mb-4">Students in this classroom</h3>
          {students.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D4AF37]/40 bg-[#FFFDF8] px-4 py-5 text-center">
              <p className="text-sm text-[#6E6E73]">No students yet. Invite your first one above.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {students.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 border border-transparent hover:border-[#E8E4DC] hover:bg-[#F5F3EE] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#151517] truncate">{s.name}</p>
                    <p className="text-xs text-[#6E6E73] truncate">{s.email}</p>
                  </div>
                  <span
                    className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusStyles[s.status]}`}
                  >
                    {s.status === "active" ? "Active" : "Pending"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}