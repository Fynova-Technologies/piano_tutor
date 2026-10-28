"use client";
import { useEffect } from "react";
import type { VideoItem } from "@/lib/video";

export default function VideoModal({
  video,
  onClose,
}: {
  video: VideoItem;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl"
      >
        <button
          onClick={onClose}
          aria-label="Close video"
          className="absolute -top-10 right-0 text-white/80 hover:text-white text-sm tracking-[0.2em] uppercase"
        >
          Close ✕
        </button>

        <div className="aspect-video w-full overflow-hidden rounded-xl border border-[#C49A3C]/30 bg-black shadow-[0_0_60px_rgba(196,154,60,0.2)]">
          <video
            className="h-full w-full"
            controls
            autoPlay
            playsInline
            preload="metadata"
            poster={video.poster}
            controlsList="nodownload"
          >
            {video.sources.map((s) => (
                console.log("video source:", s.src, s.type),
              <source key={s.src} src={s.src} type={s.type} />
            ))}
            Your browser doesn&apos;t support video playback.
          </video>
        </div>
      </div>
    </div>
  );
}