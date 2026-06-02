import { createClient } from "@supabase/supabase-js";

export async function isSubscribed(userId: string): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from("user_usage")
    .select("subscribed")
    .eq("user_id", userId)
    .single();

  return data?.subscribed === true;
}