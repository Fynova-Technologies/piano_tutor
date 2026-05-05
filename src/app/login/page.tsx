"use client"
import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

const MailIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aa8c2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
);
const LockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aa8c2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);
const ProfileIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aa8c2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-3-3.87"/><path d="M4 21v-2a4 4 0 0 1 3-3.87"/><circle cx="12" cy="7" r="4"/></svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push("/")
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session) router.push("/")
    })
    return () => subscription?.unsubscribe()
  }, [router])

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { display_name: username } }
        });
        if (error) throw error;
        setEmail(''); setPassword(''); setUsername('');
        setMode("login");
        setMessageSuccess("Signup successful! Please verify your email.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL }
    })
  }

  const inputClass = "w-full pl-10 pr-4 py-2.5 bg-[#faf8f2] border border-[#d4af3760] focus:border-[#D4AF37] focus:outline-none rounded-xl text-[#151517] placeholder-[#aa8c2c80] transition duration-200 text-sm"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f2e6c1] via-[#FEFEFE] to-[#f2e6c1]">
      <div className="w-full max-w-md">
        <div className="bg-[#FEFEFE] rounded-2xl p-8 md:p-10 border border-[#d4af3730] shadow-[0_8px_32px_#d4af3720]">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#aa8c2c] flex items-center justify-center mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#5f4f19] to-[#aa8c2c] bg-clip-text text-transparent">
              Piano Master
            </h1>
            <p className="text-sm text-[#6E6E73] mt-1">Your musical journey continues</p>
          </div>

          {/* Mode Tabs */}
          <div className="flex bg-[#f2e6c1] rounded-xl p-1 mb-6">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                mode === "login"
                  ? "bg-[#FEFEFE] text-[#5f4f19] shadow-sm"
                  : "text-[#aa8c2c]"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                mode === "signup"
                  ? "bg-[#FEFEFE] text-[#5f4f19] shadow-sm"
                  : "text-[#aa8c2c]"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuthAction} className="space-y-4">
            {/* Username — signup only */}
            {mode === "signup" && (
              <div className="relative">
                <ProfileIcon className="absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {messageSuccess && <p className="text-[#3B6D11] text-sm">{messageSuccess}</p>}

            {mode === "login" && (
              <div className="text-right">
                <a href="#" className="text-sm text-[#aa8c2c] hover:text-[#5f4f19] transition duration-150">
                  Forgot password?
                </a>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-medium bg-gradient-to-r from-[#D4AF37] to-[#aa8c2c] hover:opacity-90 transition duration-200 shadow-[0_4px_14px_#d4af3740] disabled:opacity-60"
            >
              {loading ? "Loading..." : mode === "login" ? "Login" : "Create Account"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#d4af3740]" />
              <span className="text-xs text-[#6E6E73]">or continue with</span>
              <div className="flex-1 h-px bg-[#d4af3740]" />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-2.5 rounded-xl bg-[#faf8f2] border border-[#d4af3760] text-[#5f4f19] text-sm font-medium hover:bg-[#f2e6c1] transition duration-200 flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}