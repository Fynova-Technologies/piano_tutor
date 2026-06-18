"use client";
import { useEffect, useState } from "react";
// import { createClient } from "@supabase/supabase-js";
import Navbar from "@/components/navbar";
import UnauthUserNavbar from "@/components/navbar2";
import { supabase } from "@/lib/supabaseClient";

// // Create client ONCE outside component (module-level singleton)
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// );

export default function NavbarSwitcher() {
  // ✅ Default to true if a token exists in localStorage — instant hint
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    // Supabase stores session under this key pattern
    const hasSession = Object.keys(localStorage).some((key) =>
      key.startsWith("sb-") && key.endsWith("-auth-token")
    );
    return hasSession;
  });

  useEffect(() => {
    // Confirm real session state (validates/refreshes token)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ✅ No more null — always renders something immediately
  return isAuthenticated ? <Navbar /> : <UnauthUserNavbar />;
}