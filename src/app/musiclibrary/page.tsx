"use client";
import { useRouter } from "next/navigation";
import { BookOpen, Piano, Library, Brain } from "lucide-react"; // optional icon library
import React from "react";

export default function ComingSoon() {
  const router = useRouter();
  const cardcontent = [
    { title: "Music Library", icon: <Library />, linkurl: "/musiclibrary" },
    { title: "Piano Theory", icon: <Piano />, linkurl: "/musiclibrary" },
    { title: "Piano Lesson", icon: <BookOpen />, linkurl: "/pianolesson" },
    { title: "Music Theory", icon: <Brain />, linkurl: "/musictheory" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 via-yellow-200 to-yellow-100 px-6 py-16">
      <div className="max-w-7xl w-full text-center">
        <h2 className="text-5xl font-bold text-yellow-800 mb-8 drop-shadow-lg">🚀 Explore & Learn</h2>
        <p className="text-yellow-700 text-lg max-w-2xl mx-auto mb-12">
          Stay tuned! These features are on the way. Meanwhile, explore what&aposs already available!
        </p>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 px-4">
          {cardcontent.map((card, index) => (
            <div
              key={index}
              onClick={() => router.push(card.linkurl)}
              className="bg-white border-2 border-yellow-200 rounded-2xl shadow-md hover:shadow-yellow-300 transition duration-300 p-6 cursor-pointer group hover:scale-[1.03]"
            >
              <div className="flex flex-col items-center">
                <div className="text-yellow-600 bg-yellow-100 border border-yellow-300 p-4 rounded-full mb-4 shadow-sm group-hover:bg-yellow-200">
                  {card.icon}
                </div>
                <h3 className="text-xl font-semibold text-yellow-800 mb-2">{card.title}</h3>
                <p className="text-sm text-yellow-700 mb-4">
                  Coming soon! This feature is under development.
                </p>
                <button className="bg-yellow-300 hover:bg-yellow-400 text-yellow-900 font-semibold py-2 px-4 rounded-lg transition-all">
                  Learn More
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
