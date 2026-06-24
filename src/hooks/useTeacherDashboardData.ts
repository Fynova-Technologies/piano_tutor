"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

export interface ClassroomSummary {
  id: string;
  name: string;
  classCode: string;
  createdAt: string;
  studentCount: number;
  activeCount: number;
  pendingCount: number;
}

export interface PendingAssignmentSummary {
  id: string;
  studentId: string;
  studentName: string;
  lessonTitle: string;
  dueDate: string | null;
  status: string;
}

export interface RecentSubmissionSummary {
  id: string;
  assignmentId: string;
  studentName: string;
  lessonTitle: string;
  submittedAt: string;
  hasFeedback: boolean;
}

interface TeacherDashboardData {
  user: User | null;
  displayName: string;
  loading: boolean;
  error: string | null;

  // Counted across all of this teacher's classrooms. Note: if a student is
  // in more than one classroom, activeStudentsCount/pendingInvitesCount
  // count them once per classroom (row-based), while totalStudents is
  // deduplicated by student id.
  totalStudents: number;
  activeStudentsCount: number;
  pendingInvitesCount: number;
  pendingAssignmentsCount: number;

  classrooms: ClassroomSummary[];
  pendingAssignments: PendingAssignmentSummary[];
  recentSubmissions: RecentSubmissionSummary[];

  refresh: () => void;
}

export function useTeacherDashboardData(): TeacherDashboardData {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("Teacher");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [classrooms, setClassrooms] = useState<ClassroomSummary[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [activeStudentsCount, setActiveStudentsCount] = useState(0);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);

  const [pendingAssignments, setPendingAssignments] = useState<PendingAssignmentSummary[]>([]);
  const [pendingAssignmentsCount, setPendingAssignmentsCount] = useState(0);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmissionSummary[]>([]);

  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        const authUser = authData.user;
        if (!isMounted) return;
        setUser(authUser);

        if (!authUser) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", authUser.id)
          .single();
        if (isMounted && profile?.full_name) setDisplayName(profile.full_name);

        // Classrooms owned by this teacher
        const { data: classroomRows, error: classroomsError } = await supabase
          .from("classrooms")
          .select("id, name, class_code, created_at")
          .eq("teacher_id", authUser.id)
          .order("created_at", { ascending: false });
        if (classroomsError) throw classroomsError;

        const classroomIds = (classroomRows ?? []).map((c) => c.id);

        // All student links across this teacher's classrooms
        let csRows: { classroom_id: string; student_id: string; status: string }[] = [];
        if (classroomIds.length) {
          const { data, error: csError } = await supabase
            .from("classroom_students")
            .select("classroom_id, student_id, status")
            .in("classroom_id", classroomIds);
          if (csError) throw csError;
          csRows = data ?? [];
        }

        const classroomSummaries: ClassroomSummary[] = (classroomRows ?? []).map((c) => {
          const rows = csRows.filter((r) => r.classroom_id === c.id);
          return {
            id: c.id,
            name: c.name,
            classCode: c.class_code,
            createdAt: c.created_at,
            studentCount: rows.length,
            activeCount: rows.filter((r) => r.status === "active").length,
            pendingCount: rows.filter((r) => r.status === "pending").length,
          };
        });
        if (isMounted) setClassrooms(classroomSummaries);

        const distinctStudentIds = new Set(csRows.map((r) => r.student_id));
        if (isMounted) {
          setTotalStudents(distinctStudentIds.size);
          setActiveStudentsCount(csRows.filter((r) => r.status === "active").length);
          setPendingInvitesCount(csRows.filter((r) => r.status === "pending").length);
        }

        // Names/emails for everyone across all classrooms — used to label
        // assignments and submissions below. Wrapped on its own so a schema
        // mismatch here (e.g. missing email column) degrades to "no email"
        // instead of crashing the whole dashboard.
        const studentIds = Array.from(distinctStudentIds);
        let studentProfiles: Record<string, { name: string; email: string }> = {};
        if (studentIds.length) {
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", studentIds);

          if (profilesError) {
            console.warn(
              "Could not select profiles.email (column may not exist yet) — falling back to full_name only.",
              profilesError.message,
              profilesError.details,
              profilesError.hint
            );
            const { data: fallbackData, error: fallbackError } = await supabase
              .from("profiles")
              .select("id, full_name")
              .in("id", studentIds);
            if (fallbackError) throw fallbackError;
            studentProfiles = Object.fromEntries(
              (fallbackData ?? []).map((p) => [p.id, { name: p.full_name, email: "" }])
            );
          } else {
            studentProfiles = Object.fromEntries(
              (profilesData ?? []).map((p) => [p.id, { name: p.full_name, email: p.email }])
            );
          }
        }

        // This teacher's assignments
        const { data: allAssignmentRows, error: allAssignmentsError } = await supabase
          .from("assignments")
          .select("id, student_id, lesson_id, due_date, status")
          .eq("teacher_id", authUser.id);
        if (allAssignmentsError) throw allAssignmentsError;

        const lessonIds = Array.from(new Set((allAssignmentRows ?? []).map((a) => a.lesson_id)));
        let lessonTitles: Record<string, string> = {};
        if (lessonIds.length) {
          const { data: lessonsData, error: lessonsError } = await supabase
            .from("teacher_lessons")
            .select("id, title")
            .in("id", lessonIds);
          if (lessonsError) throw lessonsError;
          lessonTitles = Object.fromEntries((lessonsData ?? []).map((l) => [l.id, l.title]));
        }

        const pendingRows = (allAssignmentRows ?? [])
          .filter((a) => a.status === "assigned" || a.status === "in_progress")
          .sort((a, b) => {
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return a.due_date.localeCompare(b.due_date);
          });

        if (isMounted) setPendingAssignmentsCount(pendingRows.length);

        const pendingAssignmentSummaries: PendingAssignmentSummary[] = pendingRows
          .slice(0, 6)
          .map((a) => ({
            id: a.id,
            studentId: a.student_id,
            studentName: studentProfiles[a.student_id]?.name ?? "Unnamed student",
            lessonTitle: lessonTitles[a.lesson_id] ?? "Untitled lesson",
            dueDate: a.due_date,
            status: a.status,
          }));
        if (isMounted) setPendingAssignments(pendingAssignmentSummaries);

        // Recent submissions across this teacher's assignments
        const assignmentIds = (allAssignmentRows ?? []).map((a) => a.id);
        const assignmentMap = Object.fromEntries((allAssignmentRows ?? []).map((a) => [a.id, a]));

        let submissionSummaries: RecentSubmissionSummary[] = [];
        if (assignmentIds.length) {
          const { data: submissionRows, error: submissionsError } = await supabase
            .from("submissions")
            .select("id, assignment_id, submitted_at")
            .in("assignment_id", assignmentIds)
            .order("submitted_at", { ascending: false })
            .limit(6);
          if (submissionsError) throw submissionsError;

          const submissionIds = (submissionRows ?? []).map((s) => s.id);
          let feedbackedIds = new Set<string>();
          if (submissionIds.length) {
            const { data: feedbackRows, error: feedbackError } = await supabase
              .from("feedback")
              .select("submission_id")
              .in("submission_id", submissionIds);
            if (feedbackError) throw feedbackError;
            feedbackedIds = new Set((feedbackRows ?? []).map((f) => f.submission_id));
          }

          submissionSummaries = (submissionRows ?? []).map((s) => {
            const assignment = assignmentMap[s.assignment_id];
            return {
              id: s.id,
              assignmentId: s.assignment_id,
              studentName: assignment
                ? studentProfiles[assignment.student_id]?.name ?? "Unnamed student"
                : "Unknown student",
              lessonTitle: assignment
                ? lessonTitles[assignment.lesson_id] ?? "Untitled lesson"
                : "Untitled lesson",
              submittedAt: s.submitted_at,
              hasFeedback: feedbackedIds.has(s.id),
            };
          });
        }
        if (isMounted) setRecentSubmissions(submissionSummaries);
      } catch (err) {
        const supabaseStyleError = err as {
          message?: string;
          details?: string;
          hint?: string;
          code?: string;
        } | null;
        const readableMessage =
          supabaseStyleError?.message ||
          (err instanceof Error ? err.message : null) ||
          "Failed to load dashboard";

        console.error("useTeacherDashboardData error:", {
          message: readableMessage,
          details: supabaseStyleError?.details ?? null,
          hint: supabaseStyleError?.hint ?? null,
          code: supabaseStyleError?.code ?? null,
        });

        if (isMounted) setError(readableMessage);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [supabase, reloadKey]);

  return {
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
    refresh,
  };
}