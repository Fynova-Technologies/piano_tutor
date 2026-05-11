"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRecentLessons } from "@/utils/userprogress/userrecentpost"; // ← new

// Fallback image when no image_url is stored
const FALLBACK_IMAGE = "/assets/C1.png";

export default function ContinueLearning() {
  const router = useRouter();
  const { recentLessons, loading } = useRecentLessons();

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center bg-[#F8F6F1] px-1 pb-4">
        <div className="max-w-[90%] w-full">
          <h1 className="text-black text-2xl font-bold">Continue Learning</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-full rounded-2xl bg-gray-200 animate-pulse h-[290px]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────
  if (!recentLessons.length) {
    return (
      <div className="flex justify-center bg-[#F8F6F1] px-1 pb-4">
        <div className="max-w-[90%] w-full">
          <h1 className="text-black text-2xl font-bold">Continue Learning</h1>
          <p className="text-[#6E6E73] mt-4 py-4">
            No lessons started yet — pick a method above to begin!
          </p>
        </div>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────
  return (
    <div className="flex justify-center bg-[#F8F6F1] px-1 pb-4">
      <div className="max-w-[90%] w-full">
        <h1 className="text-black text-2xl font-bold">Continue Learning</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 py-4">
          {recentLessons.map((lesson) => {
            // Build the same URL shape PianoLesson uses
            const handleResume = () => {
              const params = new URLSearchParams({
                id: lesson.fkid,
                title: lesson.lesson_title,
                file: lesson.file ?? "",
                unitId: lesson.unit_id,
                source: lesson.source,
                lessonid: lesson.lesson_id,
                fkid: lesson.fkid,
              });
              // We navigate to the lesson's own link stored in source, or fall
              // back to a generic lesson route — adjust the path to match your app.
              router.push(`/lesson?${params.toString()}`);
            };

            return (
              <div
                key={lesson.id}
                className="w-full cursor-pointer"
                onClick={handleResume}
              >
                {/* Card */}
                <div className="relative rounded-2xl overflow-hidden shadow-lg group w-full max-h-[290px]">
                  {/* Thumbnail */}
                  <Image
                    src={lesson.image_url ?? FALLBACK_IMAGE}
                    alt={lesson.lesson_title}
                    width={400}
                    height={400}
                    className="object-cover w-full h-[300px] transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-black opacity-40 group-hover:opacity-50 transition-opacity duration-300" />

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-2 right-2">
                    <h1 className="text-[8px] text-white">Method: {lesson.course_title}</h1>

                    <div className="flex text-[#D4AF37] font-bold text-lg mt-1">
                      {/* {lesson.progress}% to Complete */}
                      {lesson.lesson_id}. {lesson.lesson_title}
                      {/* Last-played timestamp */}
                      {/* <div className="text-white text-[8px] mx-auto bg-black bg-opacity-50 px-2 mt-2 rounded self-center">
                        {formatRelativeTime(lesson.played_at)}
                      </div> */}
                    </div>

                    {/* Progress bar */}
                    {/* <div className="w-full max-w-xl bg-gray-200 rounded-full h-3 mb-6 shadow-inner">
                      <div
                        className="bg-gradient-to-r from-yellow-300 to-yellow-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${lesson.progress}%` }}
                      />
                    </div> */}
                  </div>
                </div>

                {/* Title + subtitle below card */}
                {/* <div className="mb-2 mt-4">
                  <h2 className="text-[16px] font-medium text-[#151517]">
                    {lesson.course_title}
                  </h2>
                  <p className="text-[16px] font-medium text-[#6E6E73]">
                    {lesson.lesson_id}. {lesson.lesson_title}
                  </p>
                </div> */}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}