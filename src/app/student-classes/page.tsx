"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStudentDashboardData, type TeacherAssignment } from "@/hooks/useStudentDashboardData";
import type { RecentLesson } from "@/utils/userprogress/userrecentpost";
import JoinClassroomModal from "@/features/components/JoinClassroomModal";

const FALLBACK_THUMB = "/assets/C1.png";

/** Shown when no teacher data is in storage yet — illustrates the assignment types. */
const ASSIGNMENT_SAMPLES: TeacherAssignment[] = [
  {
    id: "sample-ex",
    kind: "exercise",
    title: "Hanon #1 — repetition",
    detail: "Slow and even; focus on finger independence.",
    due: "Example only",
  },
  {
    id: "sample-song",
    kind: "song",
    title: "Prepare: simple melody in C",
    detail: "Memorize the first 8 measures for next lesson.",
    due: "Example only",
  },
  {
    id: "sample-scale",
    kind: "scale",
    title: "C major scale, two octaves",
    detail: "Separate hands first, then hands together at ♩ = 72.",
    due: "Example only",
  },
  {
    id: "sample-tempo",
    kind: "tempo",
    title: "Metronome target",
    detail: "Bring last week’s étude up to ♩ = 88 without mistakes.",
    due: "Example only",
  },
];

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

function lessonHref(lesson: RecentLesson): string {
  const params = new URLSearchParams({
    id: lesson.fkid,
    title: lesson.lesson_title,
    file: lesson.file ?? "",
    unitId: lesson.unit_id,
    source: lesson.source,
    lessonid: lesson.lesson_id,
    fkid: lesson.fkid,
  });
  return `/lessons?${params.toString()}`;
}

const kindStyles: Record<string, string> = {
  exercise: "bg-[#581845]/10 text-[#581845] border-[#581845]/25",
  song: "bg-[#1E90FF]/10 text-[#1565b5] border-[#1E90FF]/30",
  scale: "bg-emerald-500/10 text-emerald-800 border-emerald-500/25",
  tempo: "bg-amber-500/12 text-amber-900 border-amber-600/25",
};

export default function StudentClassesPage() {
  const router = useRouter();
  const {
    user,
    displayName,
    loading,
    pianoLevel,
    overallPct,
    completedLessonCount,
    totalLessonCount,
    totalPracticeMin,
    accuracyPct,
    sightReadingScore,
    rhythmScore,
    lastPracticedAt,
    streakDays,
    xp,
    currentLevelNum,
    courseTracks,
    recentLessons,
    firstRecent,
    isLessonComplete,
    achievements,
    assignments,
  } = useStudentDashboardData();

  const [showJoinClassroom, setShowJoinClassroom] = useState(false);

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

  const openContinue = () => {
    if (firstRecent) router.push(lessonHref(firstRecent));
    else router.push("/method");
  };

  return (
    <div className="min-h-screen bg-[#F8F6F1] pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6E6E73]">
              Student & classes
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#0A0A0B] mt-1 font-poppins">
              Your dashboard
            </h1>
            <p className="text-[#6E6E73] text-sm mt-2 max-w-xl">
              Track practice, course progress, and anything your teacher assigns — all in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowJoinClassroom(true)}
              className="inline-flex items-center justify-center rounded-full bg-[#581845] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#4F163E] transition-colors"
            >
              Join a classroom
            </button>
            <Link
              href="/method"
              className="inline-flex items-center justify-center rounded-full bg-[#D4AF37] text-[#0A0A0B] px-5 py-2.5 text-sm font-semibold no-underline hover:opacity-95 transition-opacity"
            >
              Browse methods
            </Link>
            <Link
              href="/sasr"
              className="inline-flex items-center justify-center rounded-full border border-[#0A0A0B]/15 bg-white text-[#151517] px-5 py-2.5 text-sm font-medium no-underline hover:bg-[#f5f3ee] transition-colors"
            >
              Sight reading (SASR)
            </Link>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          {/* Profile + streak */}
          <section className="rounded-2xl bg-[#0A0A0B] text-white p-6 sm:p-8 shadow-lg relative overflow-hidden">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#D4AF37]/15 blur-2xl pointer-events-none" />
            <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-[#581845]/40 blur-2xl pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row gap-6 sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/10">
                <Image src="/assets/user.png" alt="" width={56} height={56} className="opacity-90" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold truncate">{displayName}</h2>
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border ${pianoLevel.tone}`}
                  >
                    {pianoLevel.label}
                  </span>
                </div>
                <p className="text-white/65 text-sm mt-1">
                  {user?.email ? user.email : "Sign in to sync progress across devices"}
                </p>
                <div className="mt-5 flex flex-wrap gap-4 sm:gap-8">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-white/50 font-medium">Level</p>
                    <p className="text-2xl font-bold text-[#D4AF37]">{currentLevelNum}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-white/50 font-medium">XP</p>
                    <p className="text-2xl font-bold">{xp.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-white/50 font-medium">Streak</p>
                    <p className="text-2xl font-bold">{streakDays}d</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-white/50 font-medium">Curriculum</p>
                    <p className="text-2xl font-bold">{overallPct}%</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative mt-6 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#f0d78c] transition-all duration-500"
                style={{ width: `${Math.min(100, overallPct)}%` }}
              />
            </div>
            <p className="relative text-[12px] text-white/55 mt-2">
              Overall lesson completion across your method units
            </p>
          </section>

          {/* Learning stats */}
          <section className="rounded-2xl border border-[#E8E4DC] bg-[#FEFEFE] p-6 sm:p-7 shadow-sm">
            <h3 className="text-lg font-semibold text-[#0A0A0B] mb-4">Learning stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Lessons done" value={`${completedLessonCount}/${totalLessonCount || "—"}`} />
              <Stat label="Practice time" value={totalPracticeMin ? `${totalPracticeMin} min` : "0 min"} />
              <Stat
                label="Accuracy"
                value={accuracyPct != null ? `${accuracyPct}%` : "—"}
                hint="From scored practice sessions"
              />
              <Stat
                label="Sight-reading"
                value={sightReadingScore != null ? `${sightReadingScore}%` : "—"}
                hint="SASR & reading-focused work"
              />
              <Stat
                label="Rhythm / flow"
                value={rhythmScore != null ? `${rhythmScore}%` : "—"}
                hint="Session score average"
              />
              <Stat label="Last practiced" value={formatRelativeTime(lastPracticedAt)} />
            </div>
          </section>
        </div>

        {/* Course progress */}
        <section className="rounded-2xl border border-[#E8E4DC] bg-[#FEFEFE] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h3 className="text-lg font-semibold text-[#0A0A0B]">Current course progress</h3>
            <Link href="/method" className="text-sm font-medium text-[#581845] no-underline hover:underline">
              Open method book →
            </Link>
          </div>
          <div className="space-y-5">
            {courseTracks.map((row) => (
              <div key={row.key}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-[#151517]">{row.label}</span>
                  <span className="text-[#6E6E73] tabular-nums">{row.percent}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-[#F0EBE3] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#581845] to-[#D4AF37] transition-all duration-500"
                    style={{ width: `${row.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Continue + recent */}
          <section className="rounded-2xl border border-[#E8E4DC] bg-[#FEFEFE] p-6 shadow-sm flex flex-col">
            <h3 className="text-lg font-semibold text-[#0A0A0B] mb-1">Pick up where you left off</h3>
            <p className="text-sm text-[#6E6E73] mb-5">Last opened lesson and your recent history</p>

            {firstRecent ? (
              <div className="flex gap-4 rounded-xl border border-[#ECECEC] bg-[#FAFAF8] p-4 mb-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={firstRecent.image_url ?? FALLBACK_THUMB}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <div className="min-w-0 flex-1 flex flex-col">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[#6E6E73] truncate">
                    {firstRecent.course_title}
                  </p>
                  <p className="font-semibold text-[#0A0A0B] leading-snug line-clamp-2">
                    {firstRecent.lesson_id}. {firstRecent.lesson_title}
                  </p>
                  <p className="text-xs text-[#6E6E73] mt-1">{formatRelativeTime(firstRecent.played_at)}</p>
                  <div className="mt-auto pt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        isLessonComplete(firstRecent.fkid, firstRecent.lesson_id)
                          ? "bg-emerald-100 text-emerald-900"
                          : firstRecent.progress >= 100
                            ? "bg-emerald-100 text-emerald-900"
                            : firstRecent.progress > 0
                              ? "bg-amber-100 text-amber-900"
                              : "bg-[#ECECEC] text-[#555]"
                      }`}
                    >
                      {isLessonComplete(firstRecent.fkid, firstRecent.lesson_id) || firstRecent.progress >= 100
                        ? "Completed"
                        : firstRecent.progress > 0
                          ? `In progress (${firstRecent.progress}%)`
                          : "Not started"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#6E6E73] mb-4 py-2">
                You have not opened a lesson yet. Start from your method book to see it here.
              </p>
            )}

            <button
              type="button"
              onClick={openContinue}
              className="w-full sm:w-auto rounded-full bg-[#581845] text-white px-6 py-3 text-sm font-semibold hover:bg-[#4F163E] transition-colors"
            >
              {firstRecent ? "Continue lesson" : "Start learning"}
            </button>

            <div className="mt-6 border-t border-[#ECECEC] pt-5 flex-1">
              <h4 className="text-sm font-semibold text-[#151517] mb-3">Recent lessons</h4>
              <ul className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {recentLessons.slice(0, 6).map((lesson) => {
                  const done = isLessonComplete(lesson.fkid, lesson.lesson_id) || lesson.progress >= 100;
                  return (
                    <li key={lesson.id}>
                      <Link
                        href={lessonHref(lesson)}
                        className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 no-underline text-[#151517] hover:bg-[#F5F3EE] border border-transparent hover:border-[#E8E4DC] transition-colors"
                      >
                        <span className="text-sm truncate min-w-0">
                          <span className="text-[#6E6E73]">{lesson.lesson_id}.</span> {lesson.lesson_title}
                        </span>
                        <span className="text-[11px] shrink-0 font-medium text-[#6E6E73]">
                          {done ? "Done" : lesson.progress > 0 ? `${lesson.progress}%` : "Open"}
                        </span>
                      </Link>
                    </li>
                  );
                })}
                {!recentLessons.length && (
                  <li className="text-sm text-[#6E6E73] py-2">No recent activity yet.</li>
                )}
              </ul>
            </div>
          </section>

          {/* Assignments + achievements */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-[#E8E4DC] bg-[#FEFEFE] p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#0A0A0B]">Assigned tasks</h3>
                  <p className="text-sm text-[#6E6E73] mt-1">
                    Exercises, songs, scales, and tempo goals from your teacher appear here.
                  </p>
                </div>
              </div>
              {assignments.length === 0 ? (
                <div className="space-y-5">
                  <div className="rounded-xl border border-dashed border-[#D4AF37]/40 bg-[#FFFDF8] px-4 py-5 text-center">
                    <p className="text-sm text-[#6E6E73] mb-3">
                      No active assignments yet. Joined a classroom but nothing&apos;s assigned? Check back soon.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowJoinClassroom(true)}
                      className="inline-flex items-center justify-center rounded-full bg-[#581845] text-white px-5 py-2 text-sm font-semibold hover:bg-[#4F163E] transition-colors"
                    >
                      Join a classroom
                    </button>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6E6E73] mb-3">
                      What assignments look like (examples)
                    </p>
                    <ul className="space-y-3 opacity-90">
                      {ASSIGNMENT_SAMPLES.map((a) => (
                        <li
                          key={a.id}
                          className="flex items-start gap-3 rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] p-3"
                        >
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md border shrink-0 ${kindStyles[a.kind] ?? "bg-gray-100 text-gray-700"}`}
                          >
                            {a.kind}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-[#151517]">{a.title}</p>
                            {a.detail && <p className="text-xs text-[#6E6E73] mt-0.5">{a.detail}</p>}
                            <p className="text-[10px] text-[#AEAEB2] mt-1 font-medium">{a.due}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <ul className="space-y-3">
                  {assignments.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-start gap-3 rounded-xl border border-[#ECECEC] bg-[#FAFAF8] p-3"
                    >
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md border shrink-0 ${kindStyles[a.kind] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {a.kind}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-[#151517]">{a.title}</p>
                        {a.detail && <p className="text-xs text-[#6E6E73] mt-0.5">{a.detail}</p>}
                        {a.due && (
                          <p className="text-[11px] text-[#581845] font-medium mt-1">Due {a.due}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-[#E8E4DC] bg-[#FEFEFE] p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#0A0A0B] mb-4">Achievements</h3>
              <ul className="grid sm:grid-cols-2 gap-3">
                {achievements.map((a) => (
                  <li
                    key={a.id}
                    className={`rounded-xl border px-4 py-3 ${
                      a.unlocked
                        ? "border-[#D4AF37]/50 bg-gradient-to-br from-[#FFFDF5] to-[#F8F6F1]"
                        : "border-[#ECECEC] bg-[#FAFAF8] opacity-70"
                    }`}
                  >
                    <p className="text-sm font-semibold text-[#151517] flex items-center gap-2">
                      {a.unlocked ? <span className="text-[#D4AF37]">★</span> : <span className="text-[#C4C4C4]">○</span>}
                      {a.title}
                    </p>
                    <p className="text-xs text-[#6E6E73] mt-1">{a.description}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <section className="rounded-2xl border border-[#E8E4DC] bg-[#FEFEFE] px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-[#0A0A0B]">Reports & SASR history</h3>
            <p className="text-sm text-[#6E6E73] mt-1">Dive deeper into accuracy trends and sight-reading attempts.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/reports"
              className="rounded-full border border-[#0A0A0B]/12 px-5 py-2 text-sm font-medium text-[#151517] no-underline hover:bg-[#F5F3EE]"
            >
              Reports
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-[#0A0A0B]/12 px-5 py-2 text-sm font-medium text-[#151517] no-underline hover:bg-[#F5F3EE]"
            >
              Home dashboard
            </Link>
          </div>
        </section>
      </div>

      {showJoinClassroom && <JoinClassroomModal onClose={() => setShowJoinClassroom(false)} />}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-[#FAFAF8] border border-[#ECECEC] px-3 py-3">
      <p className="text-[11px] uppercase tracking-wide text-[#6E6E73] font-medium">{label}</p>
      <p className="text-lg font-semibold text-[#0A0A0B] mt-1 tabular-nums">{value}</p>
      {hint && <p className="text-[10px] text-[#AEAEB2] mt-1 leading-snug">{hint}</p>}
    </div>
  );
}