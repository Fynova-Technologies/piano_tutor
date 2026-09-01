// lib/subscription.ts
import { createClient } from "@supabase/supabase-js";

export type PlanTier = "prelude" | "sonata" | "concerto";

export async function getUserSubscription(
  userId: string
): Promise<{ isSubscribed: boolean; plan: PlanTier | null }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("user_usage")
    .select("is_subscribed, plan_name") // ✅ must match your real columns
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("getUserSubscription error:", error.message);
    return { isSubscribed: false, plan: null };
  }

  return {
    isSubscribed: data?.is_subscribed === true,
    plan: data?.is_subscribed ? (data?.plan_name as PlanTier) ?? null : null,
  };
}