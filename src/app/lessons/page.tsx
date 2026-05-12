/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LessonPracticeWorkspace } from "@/features/lessons/LessonPracticeWorkspace";

function OfficialLessonInner() {
  const searchparams = useSearchParams();
  const courseTitle = searchparams.get("title") || "Lesson";
  const fileName = searchparams.get("file") || "Wholenotes.mxl";
  const source = searchparams.get("source") || "Method-1A";
  const lessonId =
    searchparams.get("lessonid") || searchparams.get("lessonId") || "0";
  const fkid = searchparams.get("fkid") || "1";

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
      sessionCategory="method_lesson"
      fkid={fkid}
    />
  );
}

export default function LessonsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-black/60">Loading lesson…</div>}>
      <OfficialLessonInner />
    </Suspense>
  );
}
