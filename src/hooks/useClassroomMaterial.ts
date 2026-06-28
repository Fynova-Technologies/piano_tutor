"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const BUCKET = "classroom-materials";

export interface ClassroomMaterial {
  id: string;
  fileName: string;
  storagePath: string;
  fileType: string | null;
  fileSize: number | null;
  createdAt: string;
  updatedAt: string;
}

interface ClassroomMaterialsData {
  loading: boolean;
  error: string | null;
  materials: ClassroomMaterial[];
  uploadMaterial: (file: File) => Promise<{ success: boolean; message: string }>;
  renameMaterial: (materialId: string, newName: string) => Promise<{ success: boolean; message: string }>;
  replaceMaterial: (materialId: string, file: File) => Promise<{ success: boolean; message: string }>;
  deleteMaterial: (materialId: string) => Promise<{ success: boolean; message: string }>;
  getDownloadUrl: (storagePath: string) => Promise<string | null>;
  refresh: () => void;
}

export function useClassroomMaterials(classroomId: string): ClassroomMaterialsData {
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
  const [materials, setMaterials] = useState<ClassroomMaterial[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!classroomId) return;
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from("classroom_materials")
          .select("id, file_name, storage_path, file_type, file_size, created_at, updated_at")
          .eq("classroom_id", classroomId)
          .order("created_at", { ascending: false });
        if (fetchError) throw fetchError;

        if (isMounted) {
          setMaterials(
            (data ?? []).map((m) => ({
              id: m.id,
              fileName: m.file_name,
              storagePath: m.storage_path,
              fileType: m.file_type,
              fileSize: m.file_size,
              createdAt: m.created_at,
              updatedAt: m.updated_at,
            }))
          );
        }
      } catch (err) {
        const e = err as { message?: string } | null;
        if (isMounted) setError(e?.message ?? "Failed to load materials");
        console.error("useClassroomMaterials error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [supabase, classroomId, reloadKey]);

  const uploadMaterial = useCallback(
    async (file: File) => {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        const teacherId = authData.user?.id;
        if (!teacherId) throw new Error("Not signed in");

        const storagePath = `${classroomId}/${crypto.randomUUID()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file);
        if (uploadError) throw uploadError;

        const { error: insertError } = await supabase.from("classroom_materials").insert({
          classroom_id: classroomId,
          teacher_id: teacherId,
          file_name: file.name,
          storage_path: storagePath,
          file_type: file.type || null,
          file_size: file.size,
        });
        if (insertError) throw insertError;

        refresh();
        return { success: true, message: "Uploaded." };
      } catch (err) {
        const e = err as { message?: string } | null;
        return { success: false, message: e?.message ?? "Couldn't upload that file" };
      }
    },
    [supabase, classroomId, refresh]
  );

  const renameMaterial = useCallback(
    async (materialId: string, newName: string) => {
      try {
        const { error: updateError } = await supabase
          .from("classroom_materials")
          .update({ file_name: newName, updated_at: new Date().toISOString() })
          .eq("id", materialId);
        if (updateError) throw updateError;
        refresh();
        return { success: true, message: "Renamed." };
      } catch (err) {
        const e = err as { message?: string } | null;
        return { success: false, message: e?.message ?? "Couldn't rename that file" };
      }
    },
    [supabase, refresh]
  );

  const replaceMaterial = useCallback(
    async (materialId: string, file: File) => {
      try {
        const existing = materials.find((m) => m.id === materialId);
        if (!existing) throw new Error("Material not found");

        // Overwrite the same storage path so the row's storage_path stays valid.
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(existing.storagePath, file, { upsert: true });
        if (uploadError) throw uploadError;

        const { error: updateError } = await supabase
          .from("classroom_materials")
          .update({
            file_name: file.name,
            file_type: file.type || null,
            file_size: file.size,
            updated_at: new Date().toISOString(),
          })
          .eq("id", materialId);
        if (updateError) throw updateError;

        refresh();
        return { success: true, message: "Replaced." };
      } catch (err) {
        const e = err as { message?: string } | null;
        return { success: false, message: e?.message ?? "Couldn't replace that file" };
      }
    },
    [supabase, materials, refresh]
  );

  const deleteMaterial = useCallback(
    async (materialId: string) => {
      try {
        const existing = materials.find((m) => m.id === materialId);
        if (!existing) throw new Error("Material not found");

        const { error: removeError } = await supabase.storage.from(BUCKET).remove([existing.storagePath]);
        if (removeError) throw removeError;

        const { error: deleteError } = await supabase
          .from("classroom_materials")
          .delete()
          .eq("id", materialId);
        if (deleteError) throw deleteError;

        refresh();
        return { success: true, message: "Deleted." };
      } catch (err) {
        const e = err as { message?: string } | null;
        return { success: false, message: e?.message ?? "Couldn't delete that file" };
      }
    },
    [supabase, materials, refresh]
  );

  const getDownloadUrl = useCallback(
    async (storagePath: string) => {
      const { data, error: signError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(storagePath, 60);
      if (signError || !data) {
        console.error("createSignedUrl error:", signError);
        return null;
      }
      return data.signedUrl;
    },
    [supabase]
  );

  return {
    loading,
    error,
    materials,
    uploadMaterial,
    renameMaterial,
    replaceMaterial,
    deleteMaterial,
    getDownloadUrl,
    refresh,
  };
}