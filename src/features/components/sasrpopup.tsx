'use client'
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserclient";

const tiers = [
  { Level: "Beginner",      Range: "Level 1",       src: "/sasrpiano.png"   },
  { Level: "Intermediate",  Range: "Level 2 - 6",   src: "/sasrpopup2.png"  },
  { Level: "Advanced",      Range: "Level 7 - 12",  src: "/sasrpopup3.png"  },
  { Level: "Professional",  Range: "Level 13 - 18", src: "/sasrpopup4.png"  },
];

// Order matters here — index 0 is always unlocked; each subsequent
// level unlocks only once the previous one has been recorded as unlocked.
const LEVEL_ORDER = tiers.map((t) => t.Level);

// Points pool per level, doubling each level starting at 200.
// Kept in sync with sasr_level_max_points() in the SQL migration.
const maxPointsForLevel = (level: string): number => {
  const idx = LEVEL_ORDER.indexOf(level);
  return 200 * Math.pow(2, idx < 0 ? 0 : idx);
};

type Lesson = {
  id: string;
  lessontitle: string;
  file?: string;
  source?: string;
  level?: string;
  unitId: string;
};

type LevelProgressRow = {
  level: string;
  high_score: number;
  high_points: number;
  unlocked: boolean;
};

export default function SasrPopup() {
  const router = useRouter();
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [levelProgress, setLevelProgress] = useState<LevelProgressRow[]>([]);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const supabase = getSupabaseBrowserClient();

  // Load the JSON once on mount
  useEffect(() => {
    fetch("/unitLessonsData2.json")          // ← adjust filename to match your actual file
      .then((res) => res.json())
      .then((data) => {
        // Flatten all unitlessons from all units into one array
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const flat = data.Lessons.flatMap((unit: { unitlessons: any[]; fkid: any; }) =>
          unit.unitlessons.map((lesson) => ({
            ...lesson,
            unitId: unit.fkid,
          }))
        );
        setAllLessons(flat);
      });
  }, []);

  // Load the user's level progress once on mount
  useEffect(() => {
    let active = true;

    async function loadProgress() {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Failed to get user for SASR level gating:", userError);
        if (active) setProgressLoaded(true);
        return;
      }

      const userId = userData.user?.id;
      if (!userId) {
        if (active) setProgressLoaded(true);
        return;
      }

      const { data, error } = await supabase
        .from("user_sasr_level_progress")
        .select("level, high_score, high_points, unlocked")
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to load SASR level progress:", error);
      } else if (active) {
        setLevelProgress(data ?? []);
      }

      if (active) setProgressLoaded(true);
    }

    loadProgress();
    return () => {
      active = false;
    };
  }, [supabase]);

  // A level is unlocked if it's the first tier, or if we have a row
  // saying it's unlocked. While progress is still loading, treat
  // everything past Beginner as locked to avoid a flash of unlocked state.
  const isUnlocked = (level: string): boolean => {
    if (level === LEVEL_ORDER[0]) return true;
    if (!progressLoaded) return false;
    return levelProgress.some((row) => row.level === level && row.unlocked);
  };

  const handleTierClick = (level: string) => {
    if (!isUnlocked(level)) {
      // Locked — do nothing (the UI also visually disables this,
      // this guard just protects against fast double-clicks etc.)
      return;
    }

    // Filter lessons that match this level (only lessons that have a `level` field)
    const matches = allLessons.filter(
      (l) => l.level && l.level.toLowerCase() === level.toLowerCase()
    );

    if (matches.length === 0) return; // nothing found yet or no match

    // Pick a random lesson from the matches
    const lesson = matches[Math.floor(Math.random() * matches.length)];

    const params = new URLSearchParams({
      id:       lesson.unitId,
      title:    lesson.lessontitle,
      file:     lesson.file     ?? "",
      unitId:   lesson.unitId,
      source:   lesson.source   ?? "",
      lessonid: lesson.id,
      level:    lesson.level    ?? level, // pass the level through so the score can be recorded against it
    });

    router.push(`/sasrlesson?${params.toString()}`);
  };

  return (
    <div className="sasr-popup bg-[#FFFFFFE5] p-6 w-[368px] rounded-[24px]">
      <h6 className="text-[20px] text-black font-normal text-center">
        Select a level to begin your piano sight-reading test
      </h6>
      <hr className="border-black border-t- my-4 w-[288px]" />

      {tiers.map((tier, index) => {
        const unlocked = isUnlocked(tier.Level);
        const progressRow = levelProgress.find((row) => row.level === tier.Level);

        return (
          <div
            key={index}
            onClick={() => handleTierClick(tier.Level)}
            className={`
              flex justify-between
              bg-[#FEFEFE]
              rounded-[16px]
              h-[107px]
              items-center
              px-5
              mt-4
              shadow-[0_6px_3px_rgba(0,0,0,0.5),inset_0_2px_0px_rgba(255,255,255,0.5),inset_0_-3px_1px_#00000033]
              transition-transform
              ${unlocked ? "cursor-pointer active:scale-[0.98]" : "cursor-not-allowed opacity-50 grayscale"}
            `}
          >
            <div className="flex flex-col">
              <Image src="/yellowstar.svg" alt="yellow star" width={30} height={30} />
              <span className="text-[#151517] text-[16px] font-medium">{tier.Level}</span>
              <span className="text-[#151517] text-[12px] font-normal">{tier.Range}</span>
              {progressRow && progressRow.high_score > 0 && (
                <span className="text-[#151517] text-[11px] font-normal mt-1">
                  {progressRow.high_points} / {maxPointsForLevel(tier.Level)} pts ({progressRow.high_score}%)
                </span>
              )}
            </div>
            <div className="-mr-5 relative">
              <Image src={tier.src} alt="piano" width={180} height={80} />
              {!unlocked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[28px]" role="img" aria-label="locked">🔒</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}