"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useClassroomDashboardData } from "@/hooks/useClassroomDashboard";
import { useClassroomMaterials } from "@/hooks/useClassroomMaterial";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-900",
  pending: "bg-amber-100 text-amber-900",
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MaterialRow({
  material,
  onRename,
  onReplace,
  onDelete,
  onDownload,
}: {
  material: ReturnType<typeof useClassroomMaterials>["materials"][number];
  onRename: (id: string, newName: string) => Promise<void>;
  onReplace: (id: string, file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDownload: (storagePath: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(material.fileName);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-[#ECECEC] bg-[#FAFAF8] px-3 py-2.5">
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  await onRename(material.id, nameInput);
                  setEditing(false);
                }
              }}
              className="flex-1 px-2 py-1 rounded-md border border-[#E8E4DC] bg-white text-sm text-[#151517] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
            />
            <button
              type="button"
              onClick={async () => {
                await onRename(material.id, nameInput);
                setEditing(false);
              }}
              className="text-xs font-semibold text-[#581845] hover:underline"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setNameInput(material.fileName);
                setEditing(false);
              }}
              className="text-xs text-[#6E6E73] hover:underline"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-[#151517] truncate">{material.fileName}</p>
            <p className="text-xs text-[#6E6E73]">{formatFileSize(material.fileSize)}</p>
          </>
        )}
      </div>

      {!editing && (
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onDownload(material.storagePath)}
            className="text-xs font-medium text-[#581845] hover:underline"
          >
            Download
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-[#6E6E73] hover:underline"
          >
            Rename
          </button>
          <button
            type="button"
            onClick={() => replaceInputRef.current?.click()}
            className="text-xs font-medium text-[#6E6E73] hover:underline"
          >
            Replace
          </button>
          <input
            ref={replaceInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) await onReplace(material.id, file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => onDelete(material.id)}
            className="text-xs font-medium text-red-600 hover:underline"
          >
            Delete
          </button>
        </div>
      )}
    </li>
  );
}

export default function ClassroomDashboardPage() {
  const params = useParams<{ id: string }>();
  const classroomId = params.id;
  const { loading, error, classroomName, classCode, students, inviteStudent } = useClassroomDashboardData(classroomId);

  const {
    materials,
    uploadMaterial,
    renameMaterial,
    replaceMaterial,
    deleteMaterial,
    getDownloadUrl,
  } = useClassroomMaterials(classroomId);

  const [email, setEmail] = useState("");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setInviteSubmitting(true);
    setInviteMessage(null);
    const result = await inviteStudent(email);
    setInviteMessage({ type: result.success ? "success" : "error", text: result.message });
    if (result.success) setEmail("");
    setInviteSubmitting(false);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadMessage(null);
    const result = await uploadMaterial(file);
    setUploadMessage({ type: result.success ? "success" : "error", text: result.message });
    setUploading(false);
  };

  const handleDownload = async (storagePath: string) => {
    const url = await getDownloadUrl(storagePath);
    if (url) window.open(url, "_blank");
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

        {/* Notes & syllabus */}
        <section className="rounded-2xl border border-[#E8E4DC] bg-[#FEFEFE] p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-[#0A0A0B]">Notes & syllabus</h3>
              <p className="text-sm text-[#6E6E73] mt-1">
                PDFs, Word docs, or slides for this classroom. Students can view and download, not edit.
              </p>
            </div>
            <button
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              disabled={uploading}
              className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold bg-[#D4AF37] text-[#0A0A0B] hover:opacity-95 disabled:opacity-60 transition-opacity whitespace-nowrap"
            >
              {uploading ? "Uploading…" : "Upload file"}
            </button>
            <input
              ref={uploadInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) await handleUpload(file);
                e.target.value = "";
              }}
            />
          </div>

          {uploadMessage && (
            <p
              className={`text-sm mb-3 ${
                uploadMessage.type === "success" ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {uploadMessage.text}
            </p>
          )}

          {materials.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D4AF37]/40 bg-[#FFFDF8] px-4 py-5 text-center">
              <p className="text-sm text-[#6E6E73]">No files yet. Upload a syllabus or notes to share with students.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {materials.map((m) => (
                <MaterialRow
                  key={m.id}
                  material={m}
                  onRename={async (id, newName) => {
                    await renameMaterial(id, newName);
                  }}
                  onReplace={async (id, file) => {
                    await replaceMaterial(id, file);
                  }}
                  onDelete={async (id) => {
                    await deleteMaterial(id);
                  }}
                  onDownload={handleDownload}
                />
              ))}
            </ul>
          )}
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