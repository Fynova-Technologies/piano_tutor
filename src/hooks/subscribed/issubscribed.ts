import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useSubscription() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);

      // 1. Get session first (more reliable)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (!user) {
        setIsAuthenticated(false);
        setIsSubscribed(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // 2. Fetch subscription status
      const { data, error } = await supabase
        .from("user_usage")
        .select("is_subscribed")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Subscription fetch error:", error);
      }

      setIsSubscribed(data?.is_subscribed ?? false);
      setLoading(false);
    }

    load();
  }, []);

  return {
    loading,
    isAuthenticated,
    isSubscribed,
  };
}