const CDN = process.env.NEXT_PUBLIC_CDN_URL?? "";
const url = (path: string) => `${CDN}/${path}`;

export interface VideoItem {
  title: string;
  poster?: string;
  sources: { src: string; type: string }[];
}

export const VIDEOS = {
  "demo": {
    title: "Learnkeys Demo",
    poster: url("videos/demo/poster.jpg"),
    sources: [
      { src: url("videos/demo/demo-v1.webm"), type: "video/webm" },
      { src: url("videos/demo/demo-v1-1080p.mp4"), type: "video/mp4" },
    ],
  },
  "lesson-basics": {
    title: "Lesson Basics",
    poster: url("videos/lessons/lesson-basics/poster.jpg"),
    sources: [
      { src: url("videos/lessons/lesson-basics/lesson-basics-v1-720p.mp4"), type: "video/mp4" },
    ],
  },
} satisfies Record<string, VideoItem>;

export type VideoId = keyof typeof VIDEOS;