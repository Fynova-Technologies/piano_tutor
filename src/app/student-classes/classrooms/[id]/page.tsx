"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useStudentClassroomData } from "@/hooks/useStudentClassroomData";
import { useClassroomMaterials } from "@/hooks/useClassroomMaterial";

function formatDueDate(iso: string | null): string {
  if (!iso) return "No due date";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const statusStyles: Record<string, string> = {
  assigned: "bg-[#ECECEC] text-[#555]",
  in_progress: "bg-amber-100 text-amber-900",
  submitted: "bg-[#581845]/10 text-[#581845]",
  completed: "bg-emerald-100 text-emerald-900",
  overdue: "bg-red-100 text-red-900",
};

function AssignmentCard({
  assignment,
  onSubmit,
}: {
  assignment: ReturnType<typeof useStudentClassroomData>["assignments"][number];
  onSubmit: (assignmentId: string, notes: string, recordingUrl: string) => Promise<{ success: boolean; message: string }>;
}) {
  const [notes, setNotes] = useState("");
  const [recordingUrl, setRecordingUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage(null);
    const result = await onSubmit(assignment.id, notes, recordingUrl);
    setMessage({ type: result.success ? "success" : "error", text: result.message });
    setSubmitting(false);
  };

  return (
    <li className="rounded-xl border border-[#ECECEC] bg-[#FAFAF8] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-[#151517]">{assignment.lessonTitle}</p>
          {assignment.pdfUrl && (
            <a
              href={assignment.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-[#581845] hover:underline inline-block mt-1"
            >
              View sheet music →
            </a>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              statusStyles[assignment.status] ?? "bg-[#ECECEC] text-[#555]"
            }`}
          >
            {assignment.status.replace("_", " ")}
          </span>
          <span className="text-[11px] text-[#6E6E73]">{formatDueDate(assignment.dueDate)}</span>
        </div>
      </div>

      {assignment.submission ? (
        <div className="mt-4 rounded-lg border border-[#E8E4DC] bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6E6E73]">Your submission</p>
          {assignment.submission.notes && (
            <p className="text-sm text-[#151517] mt-1">{assignment.submission.notes}</p>
          )}
          {assignment.submission.recordingUrl && (
            <a
              href={assignment.submission.recordingUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[#581845] hover:underline block mt-1"
            >
              View your recording →
            </a>
          )}

          {assignment.submission.feedback ? (
            <div className="mt-3 rounded-lg bg-[#FFFDF5] border border-[#D4AF37]/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#581845]">
                Feedback from your teacher
              </p>
              {assignment.submission.feedback.rating != null && (
                <p className="text-sm font-semibold text-[#D4AF37] mt-1">
                  {"★".repeat(assignment.submission.feedback.rating)}
                  {"☆".repeat(Math.max(0, 5 - assignment.submission.feedback.rating))}
                </p>
              )}
              {assignment.submission.feedback.comments && (
                <p className="text-sm text-[#151517] mt-1">{assignment.submission.feedback.comments}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#AEAEB2] mt-2">Waiting on feedback from your teacher.</p>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes about your practice (optional)"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-[#E8E4DC] bg-white text-sm text-[#151517] placeholder-[#AEAEB2] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
          />
          <input
            type="url"
            value={recordingUrl}
            onChange={(e) => setRecordingUrl(e.target.value)}
            placeholder="Link to a recording (optional)"
            className="w-full px-3 py-2 rounded-lg border border-[#E8E4DC] bg-white text-sm text-[#151517] placeholder-[#AEAEB2] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 rounded-full text-sm font-semibold bg-[#581845] text-white hover:bg-[#4F163E] disabled:opacity-60 transition-colors"
          >
            {submitting ? "Submitting…" : "Submit work"}
          </button>
          {message && (
            <p className={`text-sm ${message.type === "success" ? "text-emerald-700" : "text-red-600"}`}>
              {message.text}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

export default function StudentClassroomDashboardPage() {
  const params = useParams<{ id: string }>();
  const classroomId = params.id;
  const { loading, error, classroomName, teacherName, assignments, submitWork } =
    useStudentClassroomData(classroomId);
  const { materials, getDownloadUrl } = useClassroomMaterials(classroomId);

  const handleDownload = async (storagePath: string) => {
    const url = await getDownloadUrl(storagePath);
    if (url) window.open(url, "_blank");
  };

  // Notes are sourced from the same lesson data as assignments, but shown as
  // their own section, deduplicated by lesson — a lesson assigned to this
  // student more than once (e.g. reassigned later) only shows its note once.
  const notes = useMemo(() => {
    const seen = new Map<string, { lessonId: string; lessonTitle: string; lessonDescription: string | null; pdfUrl: string | null }>();
    for (const a of assignments) {
      if (!seen.has(a.lessonId)) {
        seen.set(a.lessonId, {
          lessonId: a.lessonId,
          lessonTitle: a.lessonTitle,
          lessonDescription: a.lessonDescription,
          pdfUrl: a.pdfUrl,
        });
      }
    }
    return Array.from(seen.values());
  }, [assignments]);

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
          <Link href="/student-classes" className="text-sm font-medium text-[#581845] no-underline hover:underline">
            ← Back to dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#0A0A0B] mt-2 font-poppins">
            {classroomName}
          </h1>
          {teacherName && <p className="text-sm text-[#6E6E73] mt-1">Taught by {teacherName}</p>}
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Class materials */}
        <section className="rounded-2xl border border-[#E8E4DC] bg-[#FEFEFE] p-6 sm:p-8 shadow-sm">
          <h3 className="text-lg font-semibold text-[#0A0A0B] mb-1">Notes & syllabus</h3>
          <p className="text-sm text-[#6E6E73] mb-4">Files your teacher has shared for this classroom.</p>
          {materials.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D4AF37]/40 bg-[#FFFDF8] px-4 py-5 text-center">
              <p className="text-sm text-[#6E6E73]">Nothing uploaded yet.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {materials.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[#ECECEC] bg-[#FAFAF8] px-3 py-2.5"
                >
                  <p className="text-sm font-medium text-[#151517] truncate">{m.fileName}</p>
                  <button
                    type="button"
                    onClick={() => handleDownload(m.storagePath)}
                    className="shrink-0 text-xs font-semibold text-[#581845] hover:underline"
                  >
                    Download
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Notes */}
        <section className="rounded-2xl border border-[#E8E4DC] bg-[#FEFEFE] p-6 sm:p-8 shadow-sm">
          <h3 className="text-lg font-semibold text-[#0A0A0B] mb-4">Notes from your teacher</h3>
          {notes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D4AF37]/40 bg-[#FFFDF8] px-4 py-5 text-center">
              <p className="text-sm text-[#6E6E73]">No notes yet — they&apos;ll show up here once a lesson is assigned.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {notes.map((n) => (
                <li key={n.lessonId} className="rounded-xl border border-[#ECECEC] bg-[#FAFAF8] p-4">
                  <p className="font-medium text-[#151517]">{n.lessonTitle}</p>
                  <p className="text-sm text-[#6E6E73] mt-1">
                    {n.lessonDescription ?? "No notes added for this lesson yet."}
                  </p>
                  {n.pdfUrl && (
                    <a
                      href={n.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-[#581845] hover:underline inline-block mt-2"
                    >
                      View sheet music →
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Assignments */}
        <section className="rounded-2xl border border-[#E8E4DC] bg-[#FEFEFE] p-6 sm:p-8 shadow-sm">
          <h3 className="text-lg font-semibold text-[#0A0A0B] mb-4">Assignments</h3>
          {assignments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D4AF37]/40 bg-[#FFFDF8] px-4 py-5 text-center">
              <p className="text-sm text-[#6E6E73]">
                Nothing assigned yet. Your teacher will add exercises, songs, and notes here.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {assignments.map((a) => (
                <AssignmentCard key={a.id} assignment={a} onSubmit={submitWork} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}