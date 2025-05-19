"use client";
// import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

// Lesson units data
const unitLessonsData = [
  {
    fkid: "1",
    unitlessons: [
      { id: "1", lessontitle: "Introduction to C", link: "/musicsheet" },
      { id: "2", lessontitle: "Try C Music", link: "/musicsheet" },
      { id: "3", lessontitle: "Introduction To D Key", link: "/musicsheet" },
      { id: "4", lessontitle: "Introduction To D Key", link: "/musicsheet" },
    ],
  },
  {
    fkid: "2",
    unitlessons: [
      { id: "1", lessontitle: "Introduction to C 2", link: "/musicsheet" },
      { id: "2", lessontitle: "Try C Music 2", link: "/musicsheet" },
      { id: "3", lessontitle: "Introduction To D Key 2", link: "/musicsheet" },
      { id: "4", lessontitle: "Introduction To D Key 2", link: "/musicsheet" },
    ],
  },
  {
    fkid: "3",
    unitlessons: [
      { id: "1", lessontitle: "Introduction to C 3", link: "/musicsheet" },
      { id: "2", lessontitle: "Try C Music 3", link: "/musicsheet" },
      { id: "3", lessontitle: "Introduction To D Key 3", link: "/musicsheet" },
      { id: "4", lessontitle: "Introduction To D Key 3", link: "/musicsheet" },
    ],
  },
];

// Main component
export default function PianoLesson() {
  const [classId, setClassId] = useState("1");
  const router = useRouter();

  // Static lesson selectors (first row)
  const topLessons = [
    {id:"1",  title: "Lesson 1", description: "Introduction to keys", link: "/musicsheet" },
    {id:"2", title: "Lesson 2", description: "Basic Scales and Finger Exercises", link: "/scales" },
    {id:"3", title: "Lesson 3", description: "Reading Sheet Music", link: "/sheetmusic" },
    {id:"4", title: "Lesson 4", description: "Simple Songs for Beginners", link: "/beginnersongs" },
    {id:"5", title: "Lesson 5", description: "Chord Progressions", link: "/chords" },
    {id:"6", title: "Lesson 6", description: "New Excercises", link: "/scales" },
    {id:"7", title: "Lesson 7", description: "New Excercises 2", link: "/sheetmusic" },
    {id:"8", title: "Lesson 8", description: "New Excercises 3", link: "/beginnersongs" },
    {id:"9", title: "Lesson 9", description: "New Excercises 4", link: "/chords" },
  ];

  const handleClick = (id: string) => {
    setClassId(id);
  };

  const UnitLesson: React.FC<{ classId: string }> = ({ classId }) => {
    const unit = unitLessonsData.find((u) => u.fkid === classId);

    if (!unit) return null;

    return (
      <div className="  top-0 items-start justify-start w-full">
        <h3 className="text-xl font-bold text-yellow-900">Selected Unit Lessons:</h3>
        <ul className="space-y-2">
          {unit.unitlessons.map((lesson) => (
            <li
              key={lesson.id}
              onClick={() => router.push(lesson.link)}
              className="cursor-pointer text-yellow-800 bg-yellow-300 px-4 py-2 rounded-xl hover:bg-yellow-600 transition-all"
            >
              {lesson.lessontitle}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-200 to-yellow-100 py-16 px-6 md:px-12 lg:px-24">
      <h1 className="text-5xl font-extrabold text-yellow-800 text-center mb-4 drop-shadow-md">
        Piano Lessons
      </h1>
      <p className="text-center text-yellow-700 mb-12 max-w-3xl mx-auto text-lg">
        Start your musical journey with our carefully curated piano lessons. Click on any lesson to learn more.
      </p>

      <div className="flex flex-col lg:flex-row gap-12 max-w-[90%] mx-auto">
        {/* Lessons List */}
        <div className="w-full lg:w-1/2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {topLessons.map((lesson, index) => (
              <div
                key={index}
                onClick={() => handleClick(lesson.id)}
                className="cursor-pointer bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6 shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-yellow-400/40"
              >
                <h2 className="text-yellow-900 text-2xl font-semibold mb-2">{lesson.title}</h2>
                <p className="text-yellow-800 text-base">{lesson.description}</p>
              </div>
            ))}
          </div>

          {/* Render unit lessons based on classId */}
      </div>

        {/* Image */}
        <div className="w-full lg:w-1/2">
          <UnitLesson classId={classId} />

          {/* <Image
            height={500}
            width={500}
            src="/jordan-whitfield-eAYO8vKNeFQ-unsplash.jpg"
            alt="Piano"
            className="rounded-3xl shadow-2xl object-cover max-h-[500px]"
            priority
          /> */}
        </div>
      </div>
    </div>
  );
}
