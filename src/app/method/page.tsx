"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMediaQuery } from "@/components/MediaQuery/useMediaQueryHook";
import { useLessons } from "@/utils/userprogress/lessonprogress";
import { useRecentLessons } from "@/utils/userprogress/userrecentpost"; // ← new

// ─── Types ────────────────────────────────────────────────────────────────
type UniteLesson2 = {
  fkid: string;
  unitlessons: {
    id: string;
    lessontitle: string;
    link: string;
    file?: string;
    source: string;
    completed?: boolean;
  }[];
};

interface UnitLessonProps {
  classId: string;
  methodName: string;
  methodImageUrl?: string; // passed down so we can store it
  unitLessonsData2: UniteLesson2[];
  loading: boolean;
  isMobile: boolean;
  onNavigate: (url: string) => void;
  onLessonClick: (params: {
    lesson_id: string;
    lesson_title: string;
    file?: string;
    unit_id: string;
    fkid: string;
    source?: string;
    course_title: string;
    image_url?: string;
  }) => void;
}

// ─── Unit lesson list ────────────────────────────────────────────────────
const UnitLesson: React.FC<UnitLessonProps> = ({
  classId,
  methodName,
  methodImageUrl,
  unitLessonsData2,
  loading,
  isMobile,
  onNavigate,
  onLessonClick,
}) => {
  const [activeLesson, setActiveLesson] = useState<string | null>(null);

  const unit = unitLessonsData2.find(
    (u) => String(u.fkid) === String(classId)
  );

  useEffect(() => {
    if (unit?.unitlessons?.length) {
      setActiveLesson(unit.unitlessons[0].id);
    }
  }, [classId]);

  if (loading) {
    return (
      <div className="bg-[#FEFEFE] p-8 rounded-2xl shadow-md mt-4 flex items-center justify-center">
        <span className="text-[#D4AF37] font-medium animate-pulse">
          Loading lessons…
        </span>
      </div>
    );
  }

  if (!unit) return null;

  return (
    <div>
      <div
        className={`bg-[#FEFEFE] p-4 rounded-2xl shadow-md mt-8 ${
          isMobile ? "" : "flex w-full"
        }`}
      >
        <span className="text-[40px] text-center w-full bg-[#FEFEFE] primary-color-text font-medium">
          Methods
          <span className="font-bold primary-color-text"> - {methodName}</span>
        </span>
      </div>

      <div className="bg-[#FEFEFE] p-4 rounded-2xl shadow-md mt-4 w-full">
        <ul className="mt-5">
          {unit.unitlessons.map((lesson) => {
            const isActive = activeLesson === lesson.id;
            const isDone = lesson.completed === true;

            return (
              <li
                key={lesson.id}
                onClick={() => {
                  setActiveLesson(lesson.id);

                  // ── 1. Save to recent_lessons ─────────────────────────
                  onLessonClick({
                    lesson_id: lesson.id,
                    lesson_title: lesson.lessontitle,
                    file: lesson.file,
                    unit_id: lesson.id,
                    fkid: classId,
                    source: lesson.source,
                    course_title: methodName,
                    image_url: methodImageUrl,
                  });

                  // ── 2. Navigate ───────────────────────────────────────
                  const params = new URLSearchParams({
                    id: classId,
                    title: lesson.lessontitle,
                    file: lesson.file ?? "",
                    unitId: lesson.id ?? "",
                    source: lesson.source ?? "",
                    lessonid: lesson.id ?? "",
                    fkid: classId,
                  });
                  onNavigate(`${lesson.link}?${params.toString()}`);
                }}
                className={`group cursor-pointer flex px-4 py-1 items-center hover:rounded-2xl hover:bg-[#D4AF37] ${
                  isActive ? "bg-[#D4AF37] mb-1 border-b-0 rounded-2xl" : ""
                }`}
              >
                <div>
                  <Image
                    src="/Layer_1.png"
                    width={56}
                    height={56}
                    alt="icon"
                    className={`${
                      isActive ? "visible" : "invisible"
                    } group-hover:visible`}
                  />
                </div>

                <div
                  className={`${
                    isMobile
                      ? `flex flex-col w-full hover:border-0 border-[#0a0a0a] py-1 ${
                          isActive ? "border-0" : "border-b-1"
                        }`
                      : `flex items-center justify-between w-full hover:border-0 border-[#0a0a0a] py-1 ${
                          isActive ? "border-0" : "border-b-1"
                        }`
                  }`}
                >
                  <span className="text-[16px] primary-color-text font-medium">
                    {lesson.id}. {lesson.lessontitle}
                  </span>

                  {isDone ? (
                    <div
                      className={`${
                        isMobile
                          ? "bg-[#0a0a0a] rounded-2xl py-1 px-3 border-none mt-2"
                          : "bg-[#0a0a0a] rounded-2xl py-2 px-6 border-none h-[36px]"
                      }`}
                    >
                      <span className="text-[#FEFEFE] text-[13px]">
                        Complete
                      </span>
                    </div>
                  ) : (
                    <button
                      className={`${
                        isMobile
                          ? "bg-[#0a0a0a] rounded-2xl py-1 px-3 border-none mt-2"
                          : "bg-[#0a0a0a] rounded-2xl py-2 px-6 border-none h-[36px]"
                      }`}
                    >
                      <span className="text-[#FEFEFE] text-[13px]">
                        Incomplete
                      </span>
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
// ── End of UnitLesson ─────────────────────────────────────────────────────


// ── PianoLesson ───────────────────────────────────────────────────────────
export default function PianoLesson() {
  const [classId, setClassId] = useState<string>("");
  const [methodImageUrl, setMethodImageUrl] = useState<string | undefined>();
  const router = useRouter();
  const [methodName, setMethodName] = useState("1A");
  const isMobile = useMediaQuery("(max-width: 768px)");

  const { lessons, topLessons, loading, accessUnit } = useLessons();
  const unitLessonsData2 = lessons as UniteLesson2[];

  // ── Recent lessons hook ───────────────────────────────────────────────
  const { saveRecentLesson } = useRecentLessons();

  useEffect(() => {
    if (topLessons.length > 0 && !classId) {
      setClassId(String(topLessons[0].fkid));
      setMethodName(topLessons[0].title);
      setMethodImageUrl(topLessons[0].imageUrl);
    }
  }, [topLessons.length]);

  const handleClick = (fkid: string, title: string, imageUrl?: string) => {
    setClassId(fkid);
    setMethodName(title);
    setMethodImageUrl(imageUrl);
    accessUnit(fkid);
  };

  return (
    <>
    <div className="min-h-screen bg-[#F8F6F1] py-16 px-6 md:px-12 lg:px-24">
      <div className={`${isMobile ? "" : "flex"}`}>
        {/* ── Piano key sidebar ──────────────────────────────────────── */}
        <div className={`${isMobile ? "" : "flex-1 max-w-[437px]"}`}>
          <div className="w-full">
            <div className="flex-col border-2 bg-[#FEFEFE] p-6 rounded-2xl w-full">
              <div className="w-full flex">
                <span className="w-full text-2xl font-bold text-center mb-4 drop-shadow-md bg-gradient-to-r from-[#D4AF37] from-48% to-[#978448] to-60% bg-clip-text text-transparent">
                  Piano Methods
                </span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <span className="text-[#D4AF37] animate-pulse font-medium">
                    Loading…
                  </span>
                </div>
              ) : (
                <div
                  className={`${
                    isMobile
                      ? "flex w-full bg-black overflow-x-auto scrollbar-hide"
                      : "mt-[20px] max-h-[710px] max-w-[360px] mx-8 border-t-5 border-x-5 border-[#0a0a0a] rounded-x-2xl rounded-t-2xl py-10 overflow-hidden scrollbar-hide"
                  }`}
                >
                  {topLessons.map((lesson, index) => {
                    const whiteKeyInOctave = index % 7;
                    const showBlackKey = !(
                      whiteKeyInOctave === 2 || whiteKeyInOctave === 6
                    );
                    const isSelected =
                      String(classId) === String(lesson.fkid);

                    return (
                      <div key={lesson.id} className="relative">
                        <motion.div
                          initial={{ backgroundColor: "#fefefe" }}
                          whileHover={{
                            backgroundColor: [
                              "#f1f1f1",
                              "#e9e9ea",
                              "#d2d2d4",
                            ],
                          }}
                          transition={{
                            duration: 0.9,
                            times: [0, 0.3, 0.5],
                            ease: "easeInOut",
                          }}
                          onClick={() =>
                            handleClick(
                              String(lesson.fkid),
                              lesson.title,
                              lesson.imageUrl
                            )
                          }
                          className={`${
                            isMobile
                              ? "relative p-4 flex flex-col items-center justify-between cursor-pointer w-full min-w-[120px] h-[250px] bg-[#FEFEFE] shadow-[inset_0px_-2px_5px_#b9b9b9] hover:rounded-r-2xl"
                              : "relative cursor-pointer w-full flex flex-row-reverse p-4 bg-[#FEFEFE] hover:rounded-r-2xl shadow-[inset_0px_-2px_5px_#b9b9b9]"
                          } ${isSelected ? "bg-[#f5f0e0]" : ""}`}
                        >
                          {showBlackKey && (
                            <div
                              className={`${
                                isMobile
                                  ? "absolute left-0 top-0 z-10 w-[40px] h-[150px] bg-black rounded-b-lg"
                                  : "absolute left-0 bottom-0 translate-y-1/2 z-10 w-[180px] h-[36px] bg-black rounded-r-lg"
                              }`}
                            />
                          )}

                          <div className="mt-auto flex flex-col items-center gap-1">
                            <span className="bg-[#e9e9ea] shadow-[inset_0px_0px_4px_#0A254059] primary-color-text font-bold rounded w-[49px] h-[36px] flex justify-center items-center text-sm">
                              {lesson.title}
                            </span>
                            {lesson.completed && (
                              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                            )}
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Lesson list ───────────────────────────────────────────── */}
        <div className="flex-2">
          <div className="flex flex-col lg:flex-row space-x-12 max-w-[843px] mx-auto">
            <div className="w-full">
              <UnitLesson
                classId={classId}
                methodName={methodName}
                methodImageUrl={methodImageUrl}
                unitLessonsData2={unitLessonsData2}
                loading={loading}
                isMobile={isMobile}
                onNavigate={(url) => router.push(url)}
                onLessonClick={saveRecentLesson} // ← wires save to click
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}