/* eslint-disable react-hooks/rules-of-hooks */
"use client"
import React, { useState,useEffect } from 'react';
// import { Auth } from "@supabase/auth-ui-react"
// import { ThemeSupa } from "@supabase/auth-ui-shared"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

const Mail = (props: React.JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
);
const Lock = (props: React.JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);
const Zap = (props: React.JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
);
const Profile = (props: React.JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-3-3.87"/><path d="M4 21v-2a4 4 0 0 1 3-3.87"/><circle cx="12" cy="7" r="4"/></svg>
)

// Main Application Component
export default function loginPage () {
    const router = useRouter();
    useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) router.push("/") // redirect to homepage after login
    })
    return () => subscription?.unsubscribe()
  }, [router])
  const [username, setuserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [messageSucess, setMessageSuccess] = useState<string | null>(null)

  // This is a static page, so the handleLogin function is a placeholder
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push("/")
    })
  }, [router])

  const hangleAuthAction = async(username:string,email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password,options: {
    data: { display_name: username }, // extra metadata
  }, })
        setEmail('')
        setPassword('')
        setuserName("")
        setMode("login")
        setMessageSuccess("Signup successful! Verify your email First.")
        if (error) throw error
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError(String(error))
      }
    } finally {
      setLoading(false)
    }
  }

   const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL,
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center font-inter text-white">
      {/* Background Gradient Effect - Subtle and modern */}
      {/* <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div> */}

      {/* Login Card Container */}
      <div className="relative z-10 w-full max-w-md">
        <div className="p-8 md:p-10 bg-gray-900 bg-opacity-80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700/50 transition-all duration-300 hover:shadow-indigo-500/20">

          {/* Header/Branding */}
          <div className="flex flex-col items-center mb-8">
            <Zap className="w-12 h-12 text-indigo-400" />
            <h1 className="text-4xl font-extrabold mt-3 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Piano Master
            </h1>
            <p className="text-sm text-gray-400 mt-1">Access your Musical platform</p>
          </div>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); hangleAuthAction(username,email, password); }} className="space-y-6">
            {/* Email Input */}
            
            {mode === "signup" && (
                            <><Profile className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" /><input
                type="name"
                placeholder="Username"
                value={username}
                onChange={(e) => setuserName(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-white placeholder-gray-500 transition duration-200 shadow-inner" /></>
)}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-white placeholder-gray-500 transition duration-200 shadow-inner"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-white placeholder-gray-500 transition duration-200 shadow-inner"
              />
            </div>
                      {error && <p className="text-red-500 text-sm">{error}</p>}
                      {messageSucess && <p className="text-green-500 text-sm">{messageSucess}</p>}

            {/* Options/Forgot Password */}
            <div className="flex justify-between items-center text-sm">
              {/* <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-indigo-500 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500" />
                <span className="text-gray-400 hover:text-white transition duration-150">Remember Me</span>
              </label> */}
              <a href="#" className="text-indigo-400 hover:text-indigo-300 transition duration-150 font-medium">
                Forgot Password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 mt-4 text-lg font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 transition duration-300 shadow-lg shadow-indigo-500/40 transform hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-indigo-500/50"
            >
               {loading
              ? "Loading..."
              : mode === "login"
              ? "Login"
              : "Create Account"}
            </button>
            {/* <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={["google", "apple"]}
          redirectTo={process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL}
        /> */}
        <div className="mt-6">
          <p className="text-center mb-2 text-gray-500">or continue with</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleGoogleLogin}
              className="border p-2 rounded-lg cursor-pointer hover:shadow-lg hover:shadow-indigo-500/40 transition duration-200"
            >
              Sign in with Google
            </button>
          </div>
        </div>
          </form>

          {/* Footer Link */}
          <div className="mt-4 text-center">
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-blue-500 hover:underline"
          >
            {mode === "login"
              ? "Don't have an account? Sign up"
              : "Already have an account? Login"}
          </button>
        </div>
        </div>
      </div>

      {/* Custom Styles for Animation (Simulating a Tailwind config addition) */}
      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};
