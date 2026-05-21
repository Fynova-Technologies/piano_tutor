"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRecentLessons } from "@/utils/userprogress/userrecentpost";

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
          <h1 className="text-black text-2xl font-bold mb-3">Continue Learning</h1>

          {/* Dashed border container */}
          <div
            className="w-full rounded-2xl border-2 border-dashed flex items-center justify-center border-[#D6CFC0] bg-[#FDFCF8]"
            style={{ minHeight: "160px" }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-start gap-4 sm:gap-6 px-6 py-6 sm:px-10 sm:py-8">

              {/* Illustration */}
              <div className="flex-shrink-0 opacity-80 w-[90px] sm:w-[40%]">
                {/* Chair + book SVG illustration matching the warm beige style */}
                <Image
                  src={"/assets/e714d056aefcec618d35aa8e15bece97e6384878.png"}
                  alt="Chair + Book Illustration"
                  width={410}
                  height={410}
                  className="w-full h-auto"
                />
              </div>

              {/* Text + CTA */}
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2">
                <h2 className="text-[#1A1A1A] text-base sm:text-lg font-bold leading-snug">
                  No lessons in progress
                </h2>
                <p className="text-[#7A7A7A] text-sm leading-relaxed max-w-[260px] sm:max-w-xs">
                  Start your first lesson to continue learning here.
                </p>
                <button
                  onClick={() => router.push("/method")}
                  className="mt-2 flex items-center gap-1.5 bg-gradient-to-l from-[#FFD700] via-[#FFA500] to-[#FFEC8B] hover:bg-[#e8b800] active:bg-[#d4a800] transition-colors duration-200 text-[#151517] text-sm font-semibold px-5 py-2.5 rounded-full shadow-sm"
                >
                  Browse Lesson
                  <span className="text-base leading-none">›</span>
                </button>
              </div>
            </div>
          </div>
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
              router.push(`/lesson?${params.toString()}`);
            };

            return (
              <div
                key={lesson.id}
                className="w-full cursor-pointer"
                onClick={handleResume}
              >
                <div className="relative rounded-2xl overflow-hidden shadow-lg group w-full max-h-[290px]">
                  <Image
                    src={lesson.image_url ?? FALLBACK_IMAGE}
                    alt={lesson.lesson_title}
                    width={400}
                    height={400}
                    className="object-cover w-full h-[300px] transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black opacity-40 group-hover:opacity-50 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-2 right-2">
                    <h1 className="text-[8px] text-white">Method: {lesson.course_title}</h1>
                    <div className="flex text-[#D4AF37] font-bold text-lg mt-1">
                      {lesson.lesson_id}. {lesson.lesson_title}
                    </div>
                  </div>
                </div>
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