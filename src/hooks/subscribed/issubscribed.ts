/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserclient"; // ← your path

export function useSubscription() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient(); // ← singleton, reuses same instance

    async function checkUser(userId: string | undefined) {
      if (!userId) {
        setIsAuthenticated(false);
        setIsSubscribed(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      const { data, error } = await supabase
        .from("user_usage")
        .select("is_subscribed")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Subscription fetch error:", error);
      }

      setIsSubscribed(data?.is_subscribed ?? false);
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data: { session } }:any) => {
      console.log("SESSION:", session?.user?.id); // should now show your user id
      checkUser(session?.user?.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: any, session: { user: { id: string | undefined; }; }) => {
        checkUser(session?.user?.id);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return {
    loading,
    isReady: loading === false,
    isAuthenticated,
    isSubscribed,
  };
}