/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect, use } from "react";
import Image from "next/image";
import SASRReport from "@/features/components/sasrreport";
import { useRouter } from "next/navigation";
import SasrPopup from "@/features/components/sasrpopup";
import { PracticeSession } from "@/datastore/sessionstorage";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserclient";
import Footer from "@/features/home/footer";

const supabase = getSupabaseBrowserClient();

type LevelProgressRow = {
  level: string;
  high_score: number;
  high_points: number;
  last_score: number;
  last_points: number;
  unlocked: boolean;
  updated_at: string;
};

const RANK_TIERS = [
  { level: "Fundamental", score: 189, range: "0-189" },
  { level: "Elementary", score: 340, range: "190-340" },
  { level: "Intermediate", score: 473, range: "341-473" },
  { level: "Advance", score: 565, range: "474-565" },
  { level: "Assistant Instructor", score: 768, range: "566-768" },
  { level: "Certified Instructor", score: 1146, range: "769-1146" },
  { level: "Senior Instructor", score: 1252, range: "1147-1252" },
  { level: "Pro Pianist", score: 1436, range: "1253-1436" },
  { level: "Sight Reading Star", score: 1620, range: "1437-1620" },
  { level: "Top Performer", score: 1900, range: "1621-1900" },
];

// Ladder is already sorted ascending by score threshold above.
// Returns the lowest tier whose threshold the score hasn't exceeded,
// or the top tier if the score exceeds every threshold.
function getRankForScore(score: number): string {
  for (const tier of RANK_TIERS) {
    if (score <= tier.score) return tier.level;
  }
  return RANK_TIERS[RANK_TIERS.length - 1].level;
}

async function fetchAllSessionsFromSupabase(): Promise<PracticeSession[]> {
    const { data, error } = await supabase
      .from("practice_sessions")
      .select("*")
      .order("started_at", { ascending: false });

    if (error || !data) {
      console.error("Failed to fetch sessions:", error?.message);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((r: any) => ({
      id: r.id,
      startedAt: new Date(r.started_at).getTime(),
      endedAt: new Date(r.ended_at).getTime(),
      durationSec: r.duration_sec,
      lesson: {
        uid: r.lesson_uid,
        id: r.lesson_id,
        title: r.lesson_title,
        source: r.lesson_source,
      },
      performance: {
        attempts: r.attempts,
        score: r.score,
        accuracy: r.accuracy,
        correctNotes: r.correct_notes,
        incorrectNotes: r.incorrect_notes,
        totalScoreable: r.total_scoreable,
      },
      sessionCategory: r.session_category,
      lessonFile: r.lesson_file,
      tempoBpm: r.tempo_bpm,
      completionStatus: r.completion_status,
      weakAreas: r.weak_areas,
      mistakeEvents: r.mistake_events,
      aiFeedbackSnapshot: r.ai_feedback_snapshot,
      progressMetrics: r.progress_metrics,
    }));
  }


export default function Page() {
  const router = useRouter();
  const imagePath = "/piano.jpg";
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [levelProgress, setLevelProgress] = useState<LevelProgressRow[]>([]);
  const [progressLoaded, setProgressLoaded] = useState(false);



  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sasrRange, setSasrRange] = useState<"week" | "month">("month");

    useEffect(() => {
      fetchAllSessionsFromSupabase()
        .then(setSessions)
        .finally(() => setLoading(false));
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
        .select("level, high_score, high_points, last_score, last_points, unlocked, updated_at")
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to load SASR level progress:", error);
      } else if (active) {
        setLevelProgress(data ?? []);
        console.log("level progress", data);
      }

      if (active) setProgressLoaded(true);
    }

    loadProgress();
    return () => {
      active = false;
    };
  }, [supabase]);

  // High Score: the best points total across ALL levels — a later level's
  // percentage converts to more raw points, so comparing points directly
  // (not percentage) surfaces the true highest achievement.
  const highScore = levelProgress.length > 0
    ? Math.max(...levelProgress.map((row) => row.high_points))
    : 0;

  // Latest Score: points from whichever level was played most recently,
  // determined by updated_at (each level row updates its own last_* fields
  // every time that level is played).
  const mostRecentRow = levelProgress.reduce<LevelProgressRow | null>((latest, row) => {
    if (!latest) return row;
    return new Date(row.updated_at) > new Date(latest.updated_at) ? row : latest;
  }, null);
  const lastScore = mostRecentRow?.last_points ?? 0;

  // Rank/level on the 10-tier ladder — whichever tier the High Score has
  // crossed into. This ladder is independent of the 4 SASR practice levels
  // (Beginner/Intermediate/Advanced/Professional); it's a lifetime-points rank.
  const userRank = getRankForScore(highScore);

  const imagePathUtil = imagePath; // kept to avoid unused-var lint noise if imagePath usage changes later

  const tiers = RANK_TIERS;
  const [popupOpen, setPopupOpen] = useState(false);


  return (
    <>    
    <div className="min-h-screen bg-[#f8f5ef] flex flex-col items-center p-8 w-full">
      <div className="max-w-[90%] w-full flex flex-col md:flex-row gap-6">
        
        {/* Left Section */}
        <div className="flex-1 ">
          {/* Top bar - unchanged desktop, stack on mobile */}
<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 bg-white p-6 rounded-2xl shadow-md gap-4">
  <div className="flex items-center gap-6">
    <div className="text-gray-600">
      <div className="flex items-center">
        <Image src="assets/Star.svg" alt="star" width={24} height={24} className="inline-block mr-2"/>
        <p className="text-2xl font-bold text-[#FFA801] m-0 p-0">{lastScore}</p>
      </div>
      <p className="font-semibold text-[12px] text-[#0A0A0B]">Last Score</p>
    </div>
    <div className="text-gray-600">
      <div className="flex items-center">
        <Image src="Frame.svg" alt="star" width={24} height={24} className="inline-block mr-2"/>
        <p className="text-2xl font-bold text-[#FFA801] m-0 p-0">{highScore}</p>
      </div>
      <p className="font-semibold text-[12px] text-[#0A0A0B]">High Score</p>
    </div>
    <div className="text-gray-600">
      <div className="flex items-center">
        <Image src="Frame.svg" alt="level" width={24} height={24} className="inline-block mr-2"/>
        <p className="text-2xl font-bold text-[#FFA801] m-0 p-0">{userRank}</p>
      </div>
      <p className="font-semibold text-[12px] text-[#0A0A0B]">Level</p>
    </div>
  </div>
  {/* Button full width on mobile */}
  <button
    onClick={() => setPopupOpen(true)}
    className="bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFEC8B] text-[#151517] text-[16px] px-6 py-3 rounded-2xl transition w-full sm:w-auto"
  >
    Start new test
    <Image src="Union.svg" alt="arrow" width={20} height={12} className="inline-block ml-2"/>
  </button>
</div>

{/* Graph - fixed height only on desktop */}
<div className="mt-4 bg-white p-6 rounded-2xl shadow-md h-auto md:h-[686px]">
  <div className="flex justify-between items-center">
    <h2 className="mb-2 text-[#0A0A0B] text-2xl font-bold">Your SASR Scores</h2>
    <button
      onClick={() => router.push("/reports/sasr")}
      className="flex bg-[#581845] text-white text-[14px] px-[16px] py-[8px] font-medium rounded-[16px] items-center justify-center"
    >
      {/* Hide text on mobile, show on sm+ */}
      <span className="hidden sm:inline">View full history</span>
      <span className="sm:hidden">History</span>
      <Image src="frame2.svg" alt="arrow" width={30} height={30} className="inline-block ml-2"/>
    </button>
  </div>
  <div className="bg-[#FEFEFE] rounded-xl p-4 relative mt-4 border-4 border-[#BCBCBC] h-[300px] md:h-[90%]">
    <div className="h-full">
      <SASRReport sessions={sessions} loading={loading} range={sasrRange} />
    </div>
  </div>
</div>
        </div>

        {/* Right Section */}
        <div className={`w-full md:w-[30%] bg-[#3e3b34] text-white rounded-2xl shadow-md p-6 bg-cover relative`}   style={{ backgroundImage: `url('${imagePath}')` }}>
          <div className="absolute inset-0 bg-neutral-600/85 rounded-2xl" />
          <div className="relative">
            <div className= "relative z-10">
              <div className=" text-black text-center font-bold py-2 rounded-lg w-full">
                <Image src="/Ribbon.svg" alt="Trophy" width={300} height={200} className="object-cover h-[40%] z-100 w-full"/>
              </div>
            </div>
            <div className="relative -mt-[18%]">
              <div className="overflow-y-auto relative rounded-2xl">
                <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-white to-[#D4AF37]" />
                <div className="absolute inset-x-0 bottom-0 h-[2px] rounded-b-2xl bg-gradient-to-r from-white to-[#D4AF37]" />
                <div className="border-l-2 border-r-2 border-l-white border-r-[#D4AF37] rounded-2xl p-4 bg-gradient-to-r from-[#D4AF3766] to-[#D4AF3700]">
                <table className="w-full text-left text-sm mt-4">
                  <thead className="underline">
                    <tr className="border-b border-[#FEFEFE]">
                      <th className="py-1 text-2xl">Level</th>
                      <th className="py-1 text-center text-2xl">Score</th>
                    </tr>
                  </thead>
                  <tbody className="">
                    {tiers.map((tier) => (
                      <tr
                        key={tier.level}
                        className={tier.level === userRank ? "bg-[#D4AF3733] rounded-lg" : ""}
                      >
                        <td className="py-2 text-[16px] text-[#FEFEFE] font-medium flex flex-col space-y-3"><span>{tier.level}{tier.level === userRank ? " ⭐" : ""}</span><span className="text-[14px] text-[#C1C1C1] font-medium">Range : {tier.range}</span></td>
                        
                        <td className="py-2 text-center text-[16px] font-medium text-[#FEFEFE]">{tier.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
      <div>
       {/* Backdrop — clicking outside closes popup */}
{popupOpen && (
  <div
    className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
    onClick={() => setPopupOpen(false)} 
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="z-50"
    >
      <SasrPopup />
    </div>
  </div>
)}
      </div>  
    </div>
    <Footer />  
    </>
  );
}