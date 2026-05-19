"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useMediaQuery } from "@/components/MediaQuery/useMediaQueryHook";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Types ─────────────────────────────────────────────────────────────────────

type RawLesson = {
  id: string;
  lessontitle: string;
  link: string;
  file?: string;
  source?: string;
  level?: string;
  completed?: boolean; // from JSON (ignored — Supabase is source of truth)
};

type UnitLesson2 = {
  fkid: string;
  unitlessons: RawLesson[];
};

// Completion map: fkid → lessonId → boolean
type ProgressMap = Record<string, Record<string, boolean>>;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchProgress(userId: string): Promise<ProgressMap> {
  const { data, error } = await supabase
    .from("technique_progress")
    .select("fkid, lesson_id, completed")
    .eq("user_id", userId);

  if (error || !data) return {};

  const map: ProgressMap = {};
  data.forEach((row) => {
    if (!map[row.fkid]) map[row.fkid] = {};
    map[row.fkid][row.lesson_id] = row.completed;
  });
  return map;
}

async function markLessonComplete(
  userId: string,
  fkid: string,
  lessonId: string,
  completed: boolean
) {
  await supabase.from("technique_progress").upsert(
    {
      user_id: userId,
      fkid,
      lesson_id: lessonId,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,fkid,lesson_id" }
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Techniques() {
  const [classId, setClassId] = useState<string>("");
  const router = useRouter();
  const [methodName, setMethodName] = useState("1A");
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [unitLessonsData2, setUnitLessonsData2] = useState<UnitLesson2[]>([]);
  const [progressMap, setProgressMap] = useState<ProgressMap>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [progressLoading, setProgressLoading] = useState(true);

  // ── Auth + progress fetch ──────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    setProgressLoading(true);
    fetchProgress(userId).then((map) => {
      setProgressMap(map);
      setProgressLoading(false);
    });
  }, [userId]);

  // ── Load techniques.json ───────────────────────────────────────────────────
  useEffect(() => {
    fetch("/techniques.json")
      .then((res) => res.json())
      .then((data) => {
        setUnitLessonsData2(data.Techniques);
        setClassId(data.Techniques[0].fkid);
      });
  }, []);

  // ── Helper: is a lesson completed for current user ─────────────────────────
  const isCompleted = useCallback(
    (fkid: string, lessonId: string) =>
      progressMap[fkid]?.[lessonId] === true,
    [progressMap]
  );

  // ── Helper: are ALL lessons in a unit completed ────────────────────────────
  const isUnitComplete = useCallback(
    (unit: UnitLesson2) =>
      unit.unitlessons.length > 0 &&
      unit.unitlessons.every((l) => isCompleted(unit.fkid, l.id)),
    [isCompleted]
  );

  // ── Toggle completion (optimistic update) ─────────────────────────────────
  const toggleLesson = useCallback(
    async (fkid: string, lessonId: string, current: boolean) => {
      if (!userId) return;

      // Optimistic UI update
      setProgressMap((prev) => ({
        ...prev,
        [fkid]: {
          ...(prev[fkid] ?? {}),
          [lessonId]: !current,
        },
      }));

      await markLessonComplete(userId, fkid, lessonId, !current);
    },
    [userId]
  );

  const handleClick = useCallback((id: string) => {
  setClassId(id);
}, []);

  // ── Static method selectors ────────────────────────────────────────────────
  const topLessons = [
    { id: "1",  title: "1A", description: "Finding Middle C" },
    { id: "2",  title: "1B", description: "Basic Scales and Finger Exercises" },
    { id: "3",  title: "1C", description: "Reading Sheet Music" },
    { id: "4",  title: "1D", description: "Simple Songs for Beginners" },
    { id: "5",  title: "1E", description: "Chord Progressions" },
    { id: "6",  title: "2A", description: "New Exercises" },
    { id: "7",  title: "2B", description: "New Exercises 2" },
    { id: "8",  title: "2C", description: "New Exercises 3" },
    { id: "9",  title: "2D", description: "New Exercises 4" },
    { id: "10", title: "2E", description: "New Exercises 5" },
    { id: "11", title: "3A", description: "New Exercises 6" },
    { id: "12", title: "3B", description: "New Exercises 7" },
    { id: "13", title: "3C", description: "New Exercises 8" },
    { id: "14", title: "3D", description: "New Exercises 9" },
    { id: "15", title: "3E", description: "New Exercises 10" },
  ];

  // ── UnitLesson sub-component ───────────────────────────────────────────────
  const UnitLesson: React.FC<{ classId: string; methodName: string }> = ({
    classId,
  }) => {
    const [activeLesson, setActiveLesson] = useState<string | null>(null);
    const unit = unitLessonsData2.find((u) => u.fkid === classId);

    useEffect(() => {
      if (unit?.unitlessons.length) setActiveLesson(unit.unitlessons[0].id);
    }, [unit]);

    if (!unit) return null;

    return (
      <div>
        {/* Unit header */}
        <div className={`${isMobile
          ? "bg-[#FEFEFE] p-4 rounded-2xl shadow-md mt-8"
          : "bg-[#FEFEFE] p-4 rounded-2xl shadow-md flex w-full"
        }`}>
          <span className={`${isMobile
            ? "font-medium text-[40px] text-center primary-color-text w-full bg-[#FEFEFE]"
            : "text-xl text-[40px] text-center w-full bg-[#FEFEFE] primary-color-text"
          }`}>
            <span className="font-medium">Techniques </span>
            <span className="font-bold primary-color-text"> - {methodName}</span>
          </span>
        </div>

        {/* Lesson list */}
        <div className="bg-[#FEFEFE] p-4 rounded-2xl shadow-md mt-4 w-full">
          {progressLoading ? (
            <div className="py-8 text-center text-gray-400 text-sm">
              Loading progress…
            </div>
          ) : (
            <ul className="mt-5">
              {unit.unitlessons.map((lesson) => {
                const isActive = activeLesson === lesson.id;
                const completed = isCompleted(unit.fkid, lesson.id);

                return (
                  <li
                    key={lesson.id}
                    onClick={() => {
                      setActiveLesson(lesson.id);
                      const params = new URLSearchParams({
                        id: classId,
                        title: lesson.lessontitle,
                        file: lesson.file ?? "",
                        unitId: lesson.id ?? "",
                        source: lesson.source ?? "",
                        lessonid: lesson.id ?? "",
                      });
                      router.push(`${lesson.link}?${params.toString()}`);
                    }}
                    className={`group cursor-pointer flex px-4 py-1 items-center ${
                      completed
                        ? "flex"
                        : "hover:rounded-2xl hover:bg-[#D4AF37]"
                    } ${
                      isActive && !completed
                        ? "bg-[#D4AF37] mb-1 border-b-0 rounded-2xl"
                        : ""
                    }`}
                  >
                    {/* Icon */}
                    <div>
                      <Image
                        src="/Layer_1.png"
                        width={56}
                        height={56}
                        alt="icon"
                        className={`${isActive ? "visible" : "invisible"} group-hover:visible group-active:visible ${completed ? "hidden" : "flex"}`}
                      />
                      <Image
                        src="/star-3.svg"
                        width={65}
                        height={65}
                        alt="star"
                        className={completed ? "flex" : "hidden"}
                      />
                    </div>

                    {/* Lesson info + toggle button */}
                    <div className={`${isMobile
                      ? "flex flex-col w-full hover:border-0 border-[#0a0a0a] py-1"
                      : "flex items-center justify-between w-full hover:border-0 border-[#0a0a0a] py-1"
                    } ${isActive ? "border-0" : "border-b-1"}`}>
                      <span className="text-[16px] primary-color-text font-medium">
                        {lesson.id}. {lesson.lessontitle}
                      </span>

                      <button
                        onClick={(e) => {
                          // Prevent li click (navigation) when toggling
                          e.stopPropagation();
                          toggleLesson(unit.fkid, lesson.id, completed);
                        }}
                        className={`${isMobile
                          ? `rounded-2xl py-1 border-none mt-2 ${completed ? "bg-[#84FF10]" : "bg-[#0a0a0a]"}`
                          : `rounded-2xl py-2 px-6 border-none h-[36px] ${completed ? "bg-[#84FF10]" : "bg-[#0a0a0a]"}`
                        }`}
                      >
                        <span className={`${completed ? "text-[#151517]" : "text-white"} font-medium text-sm`}>
                          {completed ? "Completed" : "Incomplete"}
                        </span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F6F1] py-16 px-6 md:px-12 lg:px-24">
      <div className={isMobile ? "" : "flex"}>

        {/* Piano key selector */}
        <div className={isMobile ? "" : "flex-1 max-w-[437px]"}>
          <div className="w-full">
            <div className="flex-col border-2 bg-[#FEFEFE] p-6 rounded-2xl w-full">
              <div className="w-full flex">
                <span className="w-full text-2xl font-bold text-center mb-4 drop-shadow-md bg-gradient-to-r from-[#D4AF37] from-48% to-[#978448] to-60% bg-clip-text text-transparent">
                  Piano Methods
                </span>
              </div>

              <div className={`${isMobile
                ? "flex w-full bg-black overflow-x-auto scrollbar-hide"
                : "mt-[20px] max-h-[710px] max-w-[360px] mx-8 border-t-5 border-x-5 border-[#0a0a0a] rounded-x-2xl rounded-t-2xl py-10 overflow-hidden scrollbar-hide"
              }`}>
                {topLessons.map((lesson, index) => {
                  const whiteKeyInOctave = index % 7;
                  const showBlackKey = !(whiteKeyInOctave === 2 || whiteKeyInOctave === 6);

                  // Find matching unit to check if all lessons are complete
                  const matchingUnit = unitLessonsData2.find((u) => u.fkid === lesson.id);
                  const allComplete = matchingUnit ? isUnitComplete(matchingUnit) : false;

                  return (
                    <div key={index} className="relative">
                      <motion.div
                        initial={{ backgroundColor: "#fefefe" }}
                        whileHover={{ backgroundColor: ["#f1f1f1", "#e9e9ea", "#d2d2d4"] }}
                        transition={{ duration: 0.9, times: [0, 0.3, 0.5], ease: "easeInOut" }}
                        onClick={() => {
                          handleClick(lesson.id);
                          setMethodName(lesson.title);
                        }}
                        className={`${isMobile
                          ? "relative p-4 flex items-center justify-between cursor-pointer transition-colors duration-300 ease-out w-full min-w-[120px] h-[250px] bg-[#FEFEFE] shadow-[inset_0px_-2px_5px_#b9b9b9] hover:rounded-r-2xl"
                          : "relative cursor-pointer w-full flex flex-row-reverse p-4 transition-color duration-300 ease-out transform bg-[#FEFEFE] hover:rounded-r-2xl shadow-[inset_0px_-2px_5px_#b9b9b9]"
                        }`}
                      >
                        {showBlackKey && (
                          <div className={`${isMobile
                            ? "absolute left-0 top-0 z-10 w-[40px] h-[150px] bg-black rounded-b-lg"
                            : "absolute left-0 bottom-0 translate-y-1/2 z-10 w-[180px] h-[36px] bg-black rounded-r-lg"
                          }`} />
                        )}

                        <span className={`mt-auto bg-[#e9e9ea] shadow-[inset_0px_0px_4px_#0A254059] primary-color-text font-bold rounded ${
                          allComplete ? "w-[86px] h-[36px]" : "w-[49px] h-[36px]"
                        } text-center flex text-[20px] justify-center items-center text-sm`}>
                          <Image
                            src="/star-3.svg"
                            height={40}
                            width={40}
                            alt="star"
                            className={allComplete ? "flex" : "hidden"}
                          />
                          {lesson.title}
                        </span>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Lesson panel */}
        <div className="flex-2">
          <div className="flex flex-col lg:flex-row space-x-12 max-w-[843px] mx-auto">
            <div className="w-full">
              <UnitLesson classId={classId} methodName={methodName} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}