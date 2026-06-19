/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { useState, useEffect } from 'react';
import Image from "next/image";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserclient"
import { useRouter } from "next/navigation"

const MailIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aa8c2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const LockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aa8c2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const ProfileIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aa8c2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M4 21v-2a4 4 0 0 1 3-3.87"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null);

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(({ data }: any) => {
      if (data.session) router.push("/")
    })
    const { data: { subscription } } = getSupabaseBrowserClient().auth.onAuthStateChange((_: any, session: any) => {
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
        const { error } = await getSupabaseBrowserClient().auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await getSupabaseBrowserClient().auth.signUp({
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
    await getSupabaseBrowserClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL }
    })
  }

  const inputClass =
    "w-full pl-10 pr-4 py-3 bg-[#faf8f2] border border-[#d4af3750] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF3720] rounded-xl text-[#151517] placeholder-[#aa8c2c70] transition duration-200 text-sm";

  return (
    /* ── Full-screen background ── */
    <div className="min-h-screen flex  bg-[#F8F6F1]  p-4">

      {/*
        ── Outer card ──
        Two columns on md+, stacked on mobile.
        The left panel is hidden on mobile to keep the form accessible.
      */}
      <div className="w-full gap-4 min-h-screen  rounded-3xl overflow-hidden shadow-[0_20px_60px_#d4af3730] border border-[#d4af3720] flex flex-col md:flex-row ">

        {/* ── LEFT PANEL — piano image ── */}
        <div className="hidden md:block md:w-[45%] relative flex-shrink-0">
          {/* Replace the src with your actual piano image path */}
          <Image
            src="/assets/15a5e7aafc52e46763a404a497cba26edc0b7402.png"
            alt="Hands playing piano"
            className="absolute inset-0 w-full h-full object-cover rounded-3xl"
            height={600}
            width={400}
          />
          {/* Subtle overlay so text remains legible if you ever add it */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#FEFEFE10]" />

          {/* Floating brand badge at top-left */}
          <div className="absolute top-6 left-6 flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#aa8c2c] flex items-center justify-center shadow-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <span className="text-white text-sm font-semibold drop-shadow-md">Piano Master</span>
          </div>
        </div>

        {/* ── RIGHT PANEL — form ── */}
        <div className="flex-1 flex flex-col justify-center px-8 py-10 md:px-10">

          {/* Mobile-only logo */}
          <div className="flex flex-col items-center mb-6 md:hidden">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#aa8c2c] flex items-center justify-center mb-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-[#5f4f19] to-[#aa8c2c] bg-clip-text text-transparent">Piano Master</span>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-[#d4af3730] mb-8">
            <button
              onClick={() => { setMode("login"); setError(null); setMessageSuccess(null); }}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors duration-200 relative ${
                mode === "login" ? "text-[#5f4f19]" : "text-[#aa8c2c80] hover:text-[#aa8c2c]"
              }`}
            >
              Log In
              {mode === "login" && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#aa8c2c]" />
              )}
            </button>
            <button
              onClick={() => { setMode("signup"); setError(null); setMessageSuccess(null); }}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors duration-200 relative ${
                mode === "signup" ? "text-[#5f4f19]" : "text-[#aa8c2c80] hover:text-[#aa8c2c]"
              }`}
            >
              Sign Up
              {mode === "signup" && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#aa8c2c]" />
              )}
            </button>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#1a1a1a]">
              {mode === "login" ? "Welcome back!" : "Create an account"}
            </h1>
            <p className="text-sm text-[#6E6E73] mt-1">
              {mode === "login"
                ? "Log in to continue your musical journey."
                : "Sign up and start your musical journey today."}
            </p>
          </div>

          <form onSubmit={handleAuthAction} className="space-y-4">

            {/* Username (signup only) */}
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-[#5f4f19] mb-1.5 uppercase tracking-wide">
                  Username
                </label>
                <div className="relative">
                  <ProfileIcon className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Your display name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#5f4f19] mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-[#5f4f19] mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aa8c2c80] hover:text-[#aa8c2c] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password (login only) */}
            {mode === "login" && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                      rememberMe
                        ? "bg-[#D4AF37] border-[#D4AF37]"
                        : "border-[#d4af3760] bg-[#faf8f2]"
                    }`}
                  >
                    {rememberMe && (
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#6E6E73]">Remember me</span>
                </label>
                <a href="#" className="text-sm font-medium text-[#aa8c2c] hover:text-[#5f4f19] transition-colors">
                  Forgot password?
                </a>
              </div>
            )}

            {/* Error / Success messages */}
            {error && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {messageSuccess && (
              <p className="text-[#3B6D11] text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                {messageSuccess}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-[#D4AF37] to-[#aa8c2c] hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-[0_4px_14px_#d4af3740] disabled:opacity-60 text-sm mt-2"
            >
              {loading ? "Loading…" : mode === "login" ? "Login" : "Create Account"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-[#d4af3730]" />
              <span className="text-xs text-[#6E6E73]">Or</span>
              <div className="flex-1 h-px bg-[#d4af3730]" />
            </div>

            {/* Social buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-2.5 rounded-xl bg-[#faf8f2] border border-[#d4af3750] text-[#3c3c3c] text-sm font-medium hover:bg-[#f2e6c1] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5"
              >
                <svg width="17" height="17" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>

              {/* Facebook — add handler as needed */}
              <button
                type="button"
                className="w-full py-2.5 rounded-xl bg-[#faf8f2] border border-[#d4af3750] text-[#3c3c3c] text-sm font-medium hover:bg-[#f2e6c1] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Sign in with Facebook
              </button>
            </div>

            {/* Bottom switch link */}
            <p className="text-center text-sm text-[#6E6E73] pt-2">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
                className="text-[#aa8c2c] font-semibold hover:text-[#5f4f19] transition-colors"
              >
                {mode === "login" ? "Sign up" : "Log in"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}