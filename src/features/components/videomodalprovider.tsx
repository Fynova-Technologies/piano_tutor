"use client";
import { createContext, useCallback, useContext, useState } from "react";
import VideoModal from "./videomodal";
import { VIDEOS, type VideoId } from "@/lib/video";

const Ctx = createContext<{ openVideo: (id: VideoId) => void } | null>(null);

export function VideoModalProvider({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = useState<VideoId | null>(null);
  const close = useCallback(() => setActiveId(null), []);
  const openVideo = useCallback((id: VideoId) => setActiveId(id), []);

  return (
    <Ctx.Provider value={{ openVideo }}>
      {children}
      {activeId && (
        <VideoModal key={activeId} video={VIDEOS[activeId]} onClose={close} />
      )}
    </Ctx.Provider>
  );
}

export function useVideoModal() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useVideoModal must be used inside VideoModalProvider");
  return ctx;
}