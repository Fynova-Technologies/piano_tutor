/* eslint-disable @typescript-eslint/no-explicit-any */
// context/AuthContext.jsx
"use client"
import { createContext, useContext, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserclient";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

import type { User } from "@supabase/supabase-js";

import type { PropsWithChildren } from "react";

export function AuthProvider({ children }: PropsWithChildren<object>) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current session on mount
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getSupabaseBrowserClient().auth.getSession().then(({ data: { session } }:any) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Keep user in sync with auth state
    const { data: { subscription } } = getSupabaseBrowserClient().auth.onAuthStateChange(
      (_event: any, session: { user: any; }) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);