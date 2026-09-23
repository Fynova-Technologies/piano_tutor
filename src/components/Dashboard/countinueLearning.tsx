"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRecentLessons } from "@/utils/userprogress/userrecentpost";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FALLBACK_IMAGE = "/assets/C1.png";

// ✅ Add/replace with your actual image paths from the public folder, in rotation order
const COVER_IMAGES = [
  "/assets/C1.png",
  "/assets/c2.jpg",
  "/assets/c3.jpg",
  "/assets/c4.jpg",
  "/assets/c5.jpg",

];

export default function ContinueLearning() {
  const router = useRouter();
  const { recentLessons, loading } = useRecentLessons();

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className=" bg-[#F8F6F1] px-1 pb-4">
        <div className="max-w-[90%] w-full">
          <h1 className="text-black text-2xl font-bold">Continue Learning</h1>
          <div className="flex flex-wrap gap-6 py-4">
  {Array.from({ length: 8 }).map((_, i) => (
    <div
      key={i}
      className="w-[calc(50%-0.75rem)] sm:w-[200px] aspect-[5/6] rounded-2xl bg-gray-200 animate-pulse"
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
            className="w-full rounded-2xl border-2 border-dashed flex items-center justify-center border-[#D6CFC0]"
            style={{ minHeight: "160px" }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-start gap-4 sm:gap-6 px-6 py-6 sm:px-10 sm:py-8">

              {/* Illustration */}
              <div className="flex-shrink-0 opacity-80 w-[90px] sm:w-[40%]">
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
                <p className="text-[#6B6B6B] text-[16px] leading-relaxed max-w-[260px] sm:max-w-xs">
                  Start your first lesson to continue learning here.
                </p>
                <button
                  onClick={() => router.push("/method")}
                  className="mt-2 flex items-center gap-2 bg-gradient-to-l from-[#FFD700] via-[#FFA500] to-[#FFEC8B] hover:bg-[#e8b800] active:bg-[#d4a800] transition-colors duration-200 text-[#151517] text-sm font-semibold px-4 py-2 rounded-2xl shadow-sm"
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
    <div className="flex justify-center bg-[#F8F6F1] px-4 pb-4">
  <div className="w-full max-w-[90%]">
    <h1 className="text-black text-2xl font-bold">Continue Learning</h1>

    <div className="flex flex-wrap gap-11 py-4">
      {recentLessons.slice(0, 7).map((lesson, index) => {
        const coverImage = COVER_IMAGES[index % COVER_IMAGES.length];
        const handleResume = () => { /* unchanged */ };

        return (
          <div
            key={lesson.id}
            onClick={handleResume}
            className="group w-[calc(50%-0.75rem)] sm:w-[200px] cursor-pointer"
          >
            <div className="relative aspect-[5/6] overflow-hidden rounded-2xl shadow-lg">
              <Image
                src={coverImage}
                alt={lesson.lesson_title}
                fill
                sizes="(max-width: 640px) 50vw, 200px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 transition-opacity duration-300 group-hover:bg-black/50" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <h1 className="line-clamp-1 text-[10px] text-white">
                  Method: {lesson.course_title}
                </h1>
                <div className="mt-1 line-clamp-2 break-words text-base font-bold leading-tight text-[#D4AF37]">
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