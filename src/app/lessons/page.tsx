/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LessonPracticeWorkspace } from "@/features/lessons/LessonPracticeWorkspace";
import { useLessons } from "@/utils/userprogress/lessonprogress";
import { useTechniqueCompletion } from "@/utils/userprogress/useTechniqueCompletion"; // new hook, see below

function OfficialLessonInner() {
  const searchparams = useSearchParams();
  const courseTitle = searchparams.get("title") || "Lesson";
  const fileName = searchparams.get("file") || "Wholenotes.mxl";
  const source = searchparams.get("source") || "Method-1A";
  const lessonId = searchparams.get("lessonid") || searchparams.get("lessonId") || "0";
  const fkid = searchparams.get("fkid") || "1";
  const category = searchparams.get("category") === "technique_lesson"
    ? "technique_lesson"
    : "method_lesson";

    // lessons?id=1&title=Finding+Middle+C&file=1A%2FWholenotes.mxl&unitId=1&source=&lessonid=1&fkid=1&category=method_lesson

  const { markComplete } = useLessons();
  const { completeTechnique } = useTechniqueCompletion();

  const onPerfectScore =
    category === "technique_lesson"
      ? completeTechnique
      : (lid: string, fk?: string) => markComplete(fk ?? "1", lid);



  return (
       <LessonPracticeWorkspace
      cdnFileName={fileName}
      externalXml={null}
      xmlRenderKey={0}
      courseTitle={courseTitle}
      lessonSource={source}
      lessonId={lessonId}
      displayFileName={fileName}
      lessonUid={`${source}-${lessonId}`}
      sessionCategory={category}
      fkid={fkid}
      onPerfectScore={onPerfectScore}
    />
  );
}

export default function LessonsPage() {
  return (
    <>
      <Suspense fallback={<div className="p-8 text-center text-black/60">Loading lesson…</div>}>
        <OfficialLessonInner />
      </Suspense>
    </>
  );
}
