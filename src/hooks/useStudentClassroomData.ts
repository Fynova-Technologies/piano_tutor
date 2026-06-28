/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export interface StudentAssignmentDetail {
  lessonId: string;
  id: string;
  lessonTitle: string;
  lessonDescription: string | null;
  pdfUrl: string |null;
  dueDate: string | null;
  status: string;
  submission: {
    id: string;
    recordingUrl: string | null;
    notes: string | null;
    submittedAt: string;
    feedback: {
      comments: string | null;
      rating: number | null;
    } | null;
  } | null;
}

interface StudentClassroomData {
  loading: boolean;
  error: string | null;
  classroomName: string;
  teacherName: string;
  assignments: StudentAssignmentDetail[];
  submitWork: (
    assignmentId: string,
    notes: string,
    recordingUrl: string
  ) => Promise<{ success: boolean; message: string }>;
  refresh: () => void;
}

export function useStudentClassroomData(classroomId: string): StudentClassroomData {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classroomName, setClassroomName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [assignments, setAssignments] = useState<StudentAssignmentDetail[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!classroomId) return;
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        const studentId = authData.user?.id;
        if (!studentId) {
          setLoading(false);
          return;
        }

        const { data: classroom, error: classroomError } = await supabase
          .from("classrooms")
          .select("name, teacher_id")
          .eq("id", classroomId)
          .single();
        if (classroomError) throw classroomError;
        if (isMounted) setClassroomName(classroom?.name ?? "Classroom");

        if (classroom?.teacher_id) {
          const { data: teacherProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", classroom.teacher_id)
            .single();
          if (isMounted) setTeacherName(teacherProfile?.full_name ?? "Your teacher");
        }

        const { data: assignmentRows, error: assignmentsError } = await supabase
          .from("assignments")
          .select("id, lesson_id, due_date, status")
          .eq("classroom_id", classroomId)
          .eq("student_id", studentId)
          .order("due_date", { ascending: true });
        if (assignmentsError) throw assignmentsError;

        const lessonIds = Array.from(new Set((assignmentRows ?? []).map((a) => a.lesson_id)));
        let lessons: Record<string, { title: string; description: string | null; pdfUrl: string | null }> = {};
        if (lessonIds.length) {
          const { data: lessonsData, error: lessonsError } = await supabase
            .from("teacher_lessons")
            .select("id, title, description, pdf_url")
            .in("id", lessonIds);
          if (lessonsError) throw lessonsError;
          lessons = Object.fromEntries(
            (lessonsData ?? []).map((l) => [
              l.id,
              { title: l.title, description: l.description, pdfUrl: l.pdf_url },
            ])
          );
        }

        const assignmentIds = (assignmentRows ?? []).map((a) => a.id);
        let submissionsByAssignment: Record<
          string,
          { id: string; recordingUrl: string | null; notes: string | null; submittedAt: string }
        > = {};
        if (assignmentIds.length) {
          const { data: submissionRows, error: submissionsError } = await supabase
            .from("submissions")
            .select("id, assignment_id, recording_url, notes, submitted_at")
            .in("assignment_id", assignmentIds)
            .eq("student_id", studentId);
          if (submissionsError) throw submissionsError;

          submissionsByAssignment = Object.fromEntries(
            (submissionRows ?? []).map((s) => [
              s.assignment_id,
              {
                id: s.id,
                recordingUrl: s.recording_url,
                notes: s.notes,
                submittedAt: s.submitted_at,
              },
            ])
          );

          const submissionIds = (submissionRows ?? []).map((s) => s.id);
          let feedbackBySubmission: Record<string, { comments: string | null; rating: number | null }> = {};
          if (submissionIds.length) {
            const { data: feedbackRows, error: feedbackError } = await supabase
              .from("feedback")
              .select("submission_id, comments, rating")
              .in("submission_id", submissionIds);
            if (feedbackError) throw feedbackError;
            feedbackBySubmission = Object.fromEntries(
              (feedbackRows ?? []).map((f) => [f.submission_id, { comments: f.comments, rating: f.rating }])
            );
          }

          // attach feedback onto the submission records
          Object.keys(submissionsByAssignment).forEach((assignmentId) => {
            const sub = submissionsByAssignment[assignmentId];
            (sub as any).feedback = feedbackBySubmission[sub.id] ?? null;
          });
        }

        const detailed: StudentAssignmentDetail[] = (assignmentRows ?? []).map((a) => {
  const sub = submissionsByAssignment[a.id];

  return {
    id: a.id,
    lessonId: a.lesson_id,
    lessonTitle: lessons[a.lesson_id]?.title ?? "Untitled lesson",
    lessonDescription: lessons[a.lesson_id]?.description ?? null,
    pdfUrl: lessons[a.lesson_id]?.pdfUrl ?? null,
    dueDate: a.due_date,
    status: a.status,
    submission: sub
      ? {
          id: sub.id,
          recordingUrl: sub.recordingUrl,
          notes: sub.notes,
          submittedAt: sub.submittedAt,
          feedback: (sub as any).feedback ?? null,
        }
      : null,
  };
});

        if (isMounted) setAssignments(detailed);
      } catch (err) {
        const e = err as { message?: string } | null;
        if (isMounted) setError(e?.message ?? "Failed to load classroom");
        console.error("useStudentClassroomData error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [supabase, classroomId, reloadKey]);

  const submitWork = useCallback(
    async (assignmentId: string, notes: string, recordingUrl: string) => {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        const studentId = authData.user?.id;
        if (!studentId) throw new Error("Not signed in");

        const { error: insertError } = await supabase.from("submissions").insert({
          assignment_id: assignmentId,
          student_id: studentId,
          notes: notes || null,
          recording_url: recordingUrl || null,
        });
        if (insertError) throw insertError;

        await supabase
          .from("assignments")
          .update({ status: "submitted" })
          .eq("id", assignmentId)
          .eq("student_id", studentId);

        refresh();
        return { success: true, message: "Submitted! Your teacher will review it." };
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error ? err.message : "Couldn't submit your work",
        };
      }
    },
    [supabase, refresh]
  );

  return { loading, error, classroomName, teacherName, assignments, submitWork, refresh };
}