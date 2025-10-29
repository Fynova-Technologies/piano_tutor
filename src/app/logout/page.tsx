"use client"

import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login") // redirect to login page
  }

  return (
    <button
      onClick={handleLogout}
      className="bg-gray-200 text-black px-4 py-2 rounded-lg hover:bg-gray-300"
    >
      Logout
    </button>
  )
}