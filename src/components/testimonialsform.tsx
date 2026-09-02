"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserclient";

const CATEGORIES = [
  "Library",
  "Method Lessons",
  "Sight Reading",
  "Technique Lessons",
  "AI Analysis",
] as const;

type Category = (typeof CATEGORIES)[number];

export default function TestimonialForm({
  onSubmitted,
}: {
  onSubmitted?: () => void;
}) {
  const [category, setCategory] = useState<Category>("Method Lessons");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setStatus("error");
      setErrorMsg("Pick a star rating before submitting.");
      return;
    }
    if (!comment.trim()) {
      setStatus("error");
      setErrorMsg("Add a short note about your experience.");
      return;
    }

    setStatus("saving");
    setErrorMsg("");

    const supabase = getSupabaseBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setStatus("error");
      setErrorMsg("Please sign in to leave a testimonial.");
      return;
    }

    const userName =
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      user.email?.split("@")[0] ||
      "Learnkeys student";

    const { error } = await supabase.from("testimonials").upsert(
      {
        user_id: user.id,
        user_name: userName,
        category,
        rating,
        comment: comment.trim(),
      },
      { onConflict: "user_id,category" }
    );

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }

    setStatus("saved");
    setComment("");
    setRating(0);
    onSubmitted?.();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#0F0D0B] rounded-2xl p-8 flex flex-col gap-6"
    >
      <div>
        <h3 className="text-white font-bold text-lg font-serif mb-1">
          Share your experience
        </h3>
        <p className="text-white text-xs leading-relaxed">
          Rate the part of Learnkeys that made the biggest difference for you.
        </p>
      </div>

      {/* Category picker */}
      <div className="flex flex-col gap-2">
        <label className="text-white text-xs">What are you rating?</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`text-xs rounded-full px-4 py-2 border transition-colors ${
                category === c
                  ? "bg-[#C9A84C] border-[#C9A84C] text-[#0F0D0B] font-bold"
                  : "border-[#2A2A2A] text-[#8A8078] hover:border-[#C9A84C]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Star rating */}
      <div className="flex flex-col gap-2">
        <label className="text-white text-xs">Your rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = star <= (hoverRating || rating);
            return (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
                className="w-7 h-7"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill={filled ? "#C9A84C" : "none"}
                  stroke={filled ? "#C9A84C" : "#4A4A4A"}
                  strokeWidth="1.5"
                >
                  <path d="M12 3.5l2.6 5.3 5.9.8-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.8L12 3.5Z" />
                </svg>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comment */}
      <div className="flex flex-col gap-2">
        <label htmlFor="testimonial-comment" className="text-white text-xs">
          Your note
        </label>
        <textarea
          id="testimonial-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="What changed after you started using this feature?"
          className="bg-transparent border border-[#2A2A2A] rounded-lg px-4 py-3 text-white text-sm placeholder:text-[#4A4A4A] focus:outline-none focus:border-[#C9A84C] transition-colors resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={status === "saving"}
        className="bg-[#C9A84C] hover:bg-[#EFC264] disabled:opacity-60 disabled:cursor-not-allowed text-[#0F0D0B] font-bold text-sm rounded-lg px-6 py-3 transition-colors self-start"
      >
        {status === "saving" ? "Saving..." : "Submit testimonial"}
      </button>

      {status === "saved" && (
        <p className="text-[#8FC97A] text-xs">Thanks — your testimonial is live.</p>
      )}
      {status === "error" && <p className="text-[#E38B8B] text-xs">{errorMsg}</p>}
    </form>
  );
}