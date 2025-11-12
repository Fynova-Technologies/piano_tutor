/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useMemo, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from "react";
import workoutsData from "./workouts.json";
import Image from "next/image";

export default function WorkoutsPage() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced" | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<any | null>(null);

  // Classify exercises by difficulty
  const difficultyGroups = useMemo(() => {
    type Level = "Beginner" | "Intermediate" | "Advanced";
    interface Exercise {
      id: string | number;
      animation?: string;
      workout_name: string;
      description?: string;
      instructions?: string[];
      primary_focus_area?: string[];
      difficulty_level: number;
      equipment_required?: string[];
      target_muscle_image?: string;
      category: string;
      [key: string]: unknown;
    }
    const groups: Record<Level, Exercise[]> = {
      Beginner: [],
      Intermediate: [],
      Advanced: [],
    };

    interface CategoryBlock {
      Ex_Category: string;
      exercise_lists: Array<Record<string, any>>;
      [key: string]: unknown;
    }

    (workoutsData as CategoryBlock[]).forEach((categoryBlock) => {
      categoryBlock.exercise_lists.forEach((exercise: any) => {
        const d = exercise.difficulty_level;
        const ex: Exercise = { ...(exercise as any), category: categoryBlock.Ex_Category };
        if (d <= 2) groups.Beginner.push(ex);
        else if (d <= 4) groups.Intermediate.push(ex);
        else groups.Advanced.push(ex);
      });
    });

    return groups;
  }, []);

  // Extract available categories for selected difficulty
  const availableCategories = useMemo(() => {
    if (!selectedDifficulty) return [];
    const group = difficultyGroups[selectedDifficulty] || [];
    return [...new Set(group.map((ex) => ex.category))];
  }, [selectedDifficulty, difficultyGroups]);

  // Filter exercises based on selected difficulty + category
  const filteredExercises = useMemo(() => {
    if (!selectedDifficulty || !selectedCategory) return [];
    return difficultyGroups[selectedDifficulty].filter(
      (ex) => ex.category === selectedCategory
    );
  }, [selectedDifficulty, selectedCategory, difficultyGroups]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold text-center mb-8">🏋️‍♂️ Workout Visualizer</h1>

      {/* Step 1: Choose Difficulty */}
      <div className="flex justify-center gap-6 mb-10">
        {(["Beginner", "Intermediate", "Advanced"] as const).map((level) => (
          <button
            key={level}
            onClick={() => {
              setSelectedDifficulty(level);
              setSelectedCategory(null);
              setSelectedExercise(null);
            }}
            className={`px-6 py-3 rounded-full font-semibold text-lg transition-all ${
              selectedDifficulty === level
                ? "bg-yellow-500 text-black"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Step 2: Choose Category */}
      {selectedDifficulty && availableCategories.length > 0 && (
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedExercise(null);
              }}
              className={`px-5 py-2 rounded-full text-md font-semibold transition ${
                selectedCategory === cat
                  ? "bg-yellow-500 text-black"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Step 3: Show exercises */}
      {selectedCategory && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((exercise) => (
            <div
              key={exercise.id}
              onClick={() => setSelectedExercise(exercise)}
              className="bg-gray-800 p-5 rounded-xl cursor-pointer hover:bg-gray-700 transition"
            >
              {exercise.animation ? (
                <Image
                  src={exercise.animation}
                  alt={exercise.workout_name}
                  className="w-full h-40 object-contain mb-3"
                />
              ) : (
                <div className="w-full h-40 bg-gray-700 mb-3 flex items-center justify-center text-gray-400">
                  No preview
                </div>
              )}
              <h2 className="text-xl font-bold">{exercise.workout_name}</h2>
              <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                {exercise.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Step 4: Exercise Detail Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-6 z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-lg w-full relative">
            <button
              onClick={() => setSelectedExercise(null)}
              className="absolute top-3 right-4 text-2xl font-bold text-gray-400 hover:text-white"
            >
              ×
            </button>

            <h2 className="text-2xl font-bold mb-4">{selectedExercise.workout_name}</h2>
            <p className="mb-3 text-gray-300">{selectedExercise.description}</p>

            <h3 className="font-semibold text-yellow-400 mb-2">Instructions:</h3>
            <ul className="list-disc list-inside text-gray-300 mb-3">
              {selectedExercise.instructions.map((step: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined, i: Key | null | undefined) => (
                <li key={i}>{step}</li>
              ))}
            </ul>

            <div className="text-sm text-gray-400 space-y-1">
              <p>🎯 Focus: {selectedExercise.primary_focus_area.join(", ")}</p>
              <p>🔥 Difficulty: {selectedExercise.difficulty_level}</p>
              <p>🧠 Equipment: {selectedExercise.equipment_required.join(", ")}</p>
              <p>🏷️ Category: {selectedExercise.category}</p>
            </div>

            <Image
              src={selectedExercise.target_muscle_image}
              alt="Target Muscles"
              className="w-full h-48 object-contain mt-4"
            />
          </div>
        </div>
      )}
    </div>
  );
}
