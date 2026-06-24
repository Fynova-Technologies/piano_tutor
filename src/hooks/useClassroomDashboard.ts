"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export interface ClassroomStudent {
  id: string; // classroom_students.id
  studentId: string;
  name: string;
  email: string;
  status: "active" | "pending";
  joinedAt: string;
}

interface ClassroomDashboardData {
  loading: boolean;
  error: string | null;
  classroomName: string;
  classCode: string;
  students: ClassroomStudent[];
  inviteStudent: (email: string) => Promise<{ success: boolean; message: string }>;
  refresh: () => void;
}

export function useClassroomDashboardData(classroomId: string): ClassroomDashboardData {
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
  const [classCode, setClassCode] = useState("");
  const [students, setStudents] = useState<ClassroomStudent[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!classroomId) return;
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data: classroom, error: classroomError } = await supabase
          .from("classrooms")
          .select("name, class_code")
          .eq("id", classroomId)
          .single();
        if (classroomError) throw classroomError;
        if (isMounted) {
          setClassroomName(classroom?.name ?? "Classroom");
          setClassCode(classroom?.class_code ?? "");
        }

        const { data: csRows, error: csError } = await supabase
          .from("classroom_students")
          .select("id, student_id, status, created_at")
          .eq("classroom_id", classroomId)
          .order("created_at", { ascending: false });
        if (csError) throw csError;

        const studentIds = (csRows ?? []).map((r) => r.student_id);
        let profilesMap: Record<string, { name: string; email: string }> = {};
        if (studentIds.length) {
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", studentIds);
          if (profilesError) throw profilesError;
          profilesMap = Object.fromEntries(
            (profilesData ?? []).map((p) => [p.id, { name: p.full_name, email: p.email }])
          );
        }

        const studentSummaries: ClassroomStudent[] = (csRows ?? []).map((r) => ({
          id: r.id,
          studentId: r.student_id,
          name: profilesMap[r.student_id]?.name ?? "Unnamed student",
          email: profilesMap[r.student_id]?.email ?? "",
          status: r.status,
          joinedAt: r.created_at,
        }));
        if (isMounted) setStudents(studentSummaries);
      } catch (err) {
        console.error("useClassroomDashboardData error:", err);
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to load classroom");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [supabase, classroomId, reloadKey]);

  const inviteStudent = useCallback(
    async (email: string) => {
      try {
        const { error: rpcError } = await supabase.rpc("invite_student_to_classroom", {
          p_classroom_id: classroomId,
          p_student_email: email.trim(),
        });
        if (rpcError) throw rpcError;
        refresh();
        return { success: true, message: "Invite sent." };
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error ? err.message : "Couldn't send invite",
        };
      }
    },
    [supabase, classroomId, refresh]
  );

  return { loading, error, classroomName, classCode, students, inviteStudent, refresh };
}