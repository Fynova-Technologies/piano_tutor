"use client";

import { useState } from "react";
import Link from "next/link";
import { useTeacherDashboardData } from "@/hooks/useTeacherDashboardData";
import CreateClassroomModal from "@/features/components/createclassroommodal";

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 14) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatDueDate(iso: string | null): string {
  if (!iso) return "No due date";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function TeacherDashboardPage() {
  const {
    user,
    displayName,
    loading,
    error,
    totalStudents,
    activeStudentsCount,
    pendingInvitesCount,
    pendingAssignmentsCount,
    classrooms,
    pendingAssignments,
    recentSubmissions,
  } = useTeacherDashboardData();

  const [showCreateClassroom, setShowCreateClassroom] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
          <p className="text-[#6E6E73] text-sm font-medium">Loading your studio…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1] pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6E6E73]">
              Teacher studio
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#0A0A0B] mt-1 font-poppins">
              Welcome back, {displayName}
            </h1>
            <p className="text-[#6E6E73] text-sm mt-2 max-w-xl">
              Create classrooms, invite students, review submissions, and manage assignments — all in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowCreateClassroom(true)}
              className="inline-flex items-center justify-center rounded-full bg-[#D4AF37] text-[#0A0A0B] px-5 py-2.5 text-sm font-semibold hover:opacity-95 transition-opacity"
            >
              Create classroom
            </button>
            <Link
              href="/teacher/lessons"
              className="inline-flex items-center justify-center rounded-full border border-[#0A0A0B]/15 bg-white text-[#151517] px-5 py-2.5 text-sm font-medium no-underline hover:bg-[#f5f3ee] transition-colors"
            >
              Upload lesson
            </Link>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Couldn&apos;t load some dashboard data: {error}
          </div>
        )}

        {/* Stat cards */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Total students" value={String(totalStudents)} />
          <Stat
            label="Active students"
            value={String(activeStudentsCount)}
            hint={`${pendingInvitesCount} pending invite${pendingInvitesCount === 1 ? "" : "s"}`}
          />
          <Stat label="Pending assignments" value={String(pendingAssignmentsCount)} />
          <Stat label="Recent submissions" value={String(recentSubmissions.length)} hint="Last 6 received" />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent submissions */}
          <section className="rounded-2xl border border-[#E8E4DC] bg-[#FEFEFE] p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[#0A0A0B]">Recent submissions</h3>
                <p className="text-sm text-[#6E6E73] mt-1">Student work waiting on (or with) your feedback.</p>
              </div>
            </div>

            {recentSubmissions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#D4AF37]/40 bg-[#FFFDF8] px-4 py-5 text-center">
                <p className="text-sm text-[#6E6E73]">
                  No submissions yet. Once students submit assigned work, they&apos;ll show up here.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {recentSubmissions.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-[#ECECEC] bg-[#FAFAF8] p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[#151517] truncate">{s.studentName}</p>
                      <p className="text-xs text-[#6E6E73] mt-0.5 truncate">{s.lessonTitle}</p>
                      <p className="text-[10px] text-[#AEAEB2] mt-1 font-medium">
                        {formatRelativeTime(s.submittedAt)}
                      </p>
                    </div>
                    <Link
                      href={`/teacher/submissions/${s.id}`}
                      className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full no-underline ${
                        s.hasFeedback
                          ? "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                          : "bg-[#581845]/10 text-[#581845] hover:bg-[#581845]/15"
                      } transition-colors`}
                    >
                      {s.hasFeedback ? "Feedback given" : "Give feedback"}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Pending assignments */}
          <section className="rounded-2xl border border-[#E8E4DC] bg-[#FEFEFE] p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[#0A0A0B]">Pending assignments</h3>
                <p className="text-sm text-[#6E6E73] mt-1">Work assigned but not yet completed.</p>
              </div>
              <Link
                href="/teacher/assignments"
                className="text-sm font-medium text-[#581845] no-underline hover:underline shrink-0"
              >
                View all →
              </Link>
            </div>

            {pendingAssignments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#D4AF37]/40 bg-[#FFFDF8] px-4 py-5 text-center">
                <p className="text-sm text-[#6E6E73]">
                  Nothing pending. Assign a lesson to a student to see it tracked here.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {pendingAssignments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-[#ECECEC] bg-[#FAFAF8] p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[#151517] truncate">{a.lessonTitle}</p>
                      <p className="text-xs text-[#6E6E73] mt-0.5 truncate">{a.studentName}</p>
                    </div>
                    <span className="shrink-0 text-[11px] font-medium text-[#581845]">
                      {formatDueDate(a.dueDate)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Classrooms */}
        <section className="rounded-2xl border border-[#E8E4DC] bg-[#FEFEFE] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-[#0A0A0B]">Your classrooms</h3>
              <p className="text-sm text-[#6E6E73] mt-1">Each classroom is where you invite students and assign work.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateClassroom(true)}
              className="text-sm font-medium text-[#581845] hover:underline"
            >
              + New classroom
            </button>
          </div>

          {classrooms.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D4AF37]/40 bg-[#FFFDF8] px-4 py-5 text-center">
              <p className="text-sm text-[#6E6E73]">
                No classrooms yet. Create your first one to start inviting students.
              </p>
            </div>
          ) : (
            <ul className="grid sm:grid-cols-2 gap-3">
              {classrooms.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/teacher/classrooms/${c.id}`}
                    className="block rounded-xl border border-[#ECECEC] bg-[#FAFAF8] p-4 no-underline hover:border-[#D4AF37]/50 hover:bg-[#FFFDF8] transition-colors"
                  >
                    <p className="font-medium text-[#151517]">{c.name}</p>
                    <p className="text-xs text-[#6E6E73] mt-1">
                      {c.studentCount} student{c.studentCount === 1 ? "" : "s"}
                      {c.pendingCount > 0 && (
                        <span className="text-amber-700"> · {c.pendingCount} pending</span>
                      )}
                    </p>
                    <p className="text-[10px] font-mono text-[#AEAEB2] mt-1 tracking-widest">
                      Code: {c.classCode}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {showCreateClassroom && user && (
        <CreateClassroomModal teacherId={user.id} onClose={() => setShowCreateClassroom(false)} />
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-[#FAFAF8] border border-[#ECECEC] px-3 py-3">
      <p className="text-[11px] uppercase tracking-wide text-[#6E6E73] font-medium">{label}</p>
      <p className="text-2xl font-bold text-[#0A0A0B] mt-1 tabular-nums">{value}</p>
      {hint && <p className="text-[10px] text-[#AEAEB2] mt-1 leading-snug">{hint}</p>}
    </div>
  );
}