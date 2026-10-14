/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserclient";

/* ---------- icons (stroke follows text color) ---------- */

const iconProps = {
  width: 14,
  height: 14,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const MailIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg {...iconProps} {...p}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg {...iconProps} {...p}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg {...iconProps} {...p}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg {...iconProps} {...p}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

function LogoMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="3" width="20" height="18" rx="3" fill="#1A1A1A" />
      <rect x="6" y="3" width="3" height="10" rx="1" fill="#F6F4EE" />
      <rect x="10.5" y="3" width="3" height="10" rx="1" fill="#F6F4EE" />
      <rect x="15" y="3" width="3" height="10" rx="1" fill="#F6F4EE" />
    </svg>
  );
}

/* ---------- shared classes ---------- */

const labelClass = "mb-1.5 block text-[11px] font-semibold text-[#1a1a1a]";
const inputClass =
  "h-10 w-full rounded-lg border border-black/[0.06] bg-white pl-9 pr-9 text-[13px] text-[#151517] placeholder:text-[#9a9a9a] transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/[0.06]";
const iconLeft = "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]";
const eyeButton =
  "absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] transition-colors hover:text-black";
const checkboxClass = "h-3.5 w-3.5 shrink-0 cursor-pointer rounded accent-[#1a1a1a]";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [messageSuccess, setMessageSuccess] = useState<string | null>(null);

  useEffect(() => {
    getSupabaseBrowserClient()
      .auth.getSession()
      .then(({ data }: any) => {
        if (data.session) router.push("/");
      });
    const {
      data: { subscription },
    } = getSupabaseBrowserClient().auth.onAuthStateChange((_: any, session: any) => {
      if (session) router.push("/");
    });
    return () => subscription?.unsubscribe();
  }, [router]);

  // Measure how far down the page starts (i.e. the navbar height) so the login screen
  // fills exactly the rest of the viewport. No hardcoded navbar height needed.
  const rootRef = useRef<HTMLDivElement>(null);
  const [topOffset, setTopOffset] = useState(64); // fallback until measured

  useEffect(() => {
    const measure = () => {
      if (!rootRef.current) return;
      setTopOffset(Math.max(0, Math.round(rootRef.current.getBoundingClientRect().top + window.scrollY)));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const switchMode = (next: "login" | "signup") => {
    setMode(next);
    setError(null);
    setMessageSuccess(null);
    setConfirmPassword("");
    setAgreed(false);
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      if (mode === "login") {
        const { error } = await getSupabaseBrowserClient().auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        const { error } = await getSupabaseBrowserClient().auth.signUp({
          email,
          password,
          options: {
            // the new design has no username field, so use the part before the @
            data: { display_name: email.split("@")[0] },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setAgreed(false);
        setMode("login");
        setMessageSuccess("Signup successful! Please verify your email.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    await getSupabaseBrowserClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const isLogin = mode === "login";

  return (
    // height = viewport minus whatever sits above this page (the navbar), so navbar + login = one screen
    <div
      ref={rootRef}
      style={{ height: `calc(100dvh - ${topOffset}px)` }}
      className="w-full overflow-hidden bg-[#F6F4EE] p-4 md:p-5"
    >
      <div className="flex h-full gap-6 lg:gap-12">
        {/* ── LEFT: image ── */}
        <div className="relative hidden w-[46%] shrink-0 overflow-hidden rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.18)] md:block">
          <Image
            src="/assets/15a5e7aafc52e46763a404a497cba26edc0b7402.png"
            alt="Hands playing piano"
            fill
            priority
            sizes="(min-width: 768px) 46vw, 0px"
            className="object-cover"
          />
        </div>

        {/* ── RIGHT: form ── */}
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          {/* m-auto centers the form vertically; the panel only scrolls on very short screens */}
          <div className="m-auto w-full max-w-[400px] px-2 py-3">
            {/* brand */}
            <div className="flex items-center justify-center gap-1.5">
              <LogoMark />
              <span className="font-playfair text-[17px] font-bold leading-none text-[#1a1a1a]">
                Learn<span className="text-[#E8A621]">keys</span>
              </span>
            </div>

            {/* heading */}
            <div className="mt-4 text-center">
              <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[#1a1a1a]">
                {isLogin ? "Welcome Back!" : "Create an account"}
              </h1>
              <p className="mt-1 text-[12px] text-[#6E6E73]">
                {isLogin ? "Log in to continue your lessons." : "Start learning piano today."}
              </p>
            </div>

            <form onSubmit={handleAuthAction} className="mt-5 space-y-3">
              {/* email */}
              <div>
                <label htmlFor="email" className={labelClass}>
                  Email Address
                </label>
                <div className="relative">
                  <MailIcon className={iconLeft} />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              {/* password */}
              <div>
                <label htmlFor="password" className={labelClass}>
                  Password
                </label>
                <div className="relative">
                  <LockIcon className={iconLeft} />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className={eyeButton}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* confirm password (signup only) */}
              {!isLogin && (
                <div>
                  <label htmlFor="confirm" className={labelClass}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <LockIcon className={iconLeft} />
                    <input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className={eyeButton}
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
              )}

              {/* remember me / forgot (login) · terms (signup) */}
              {isLogin ? (
                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer select-none items-center gap-2 text-[11px] text-[#3c3c3c]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className={checkboxClass}
                    />
                    Remember me
                  </label>
                  <a href="#" className="text-[11px] font-bold text-[#1a1a1a] hover:underline">
                    Forgot password?
                  </a>
                </div>
              ) : (
                <label className="flex cursor-pointer select-none items-center gap-2 text-[11px] text-[#3c3c3c]">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    required
                    className={checkboxClass}
                  />
                  <span>
                    I agree to the{" "}
                    <a href="/terms" className="text-[#E8A621] hover:underline">
                      Terms of Use
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" className="text-[#E8A621] hover:underline">
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>
              )}

              {/* messages */}
              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {error}
                </p>
              )}
              {messageSuccess && (
                <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-[#3B6D11]">
                  {messageSuccess}
                </p>
              )}

              {/* submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-1 h-11 w-full rounded-full bg-black text-[13px] font-semibold text-white transition hover:bg-[#222] active:scale-[0.99] disabled:opacity-60"
              >
                {loading ? "Loading…" : isLogin ? "Login" : "Create account"}
              </button>

              {/* google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex h-11 w-full items-center justify-center gap-2.5 rounded-full bg-[#E9E7E2] text-[13px] font-medium text-[#1a1a1a] transition hover:bg-[#dfdcd5] active:scale-[0.99]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </button>
            </form>
          </div>

          {/* bottom switch link, pinned to the bottom of the panel */}
          <p className="shrink-0 pb-2 pt-2 text-center text-[12px] text-[#3c3c3c]">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => switchMode(isLogin ? "signup" : "login")}
              className="font-bold text-[#1a1a1a] hover:underline"
            >
              {isLogin ? "Sign Up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}