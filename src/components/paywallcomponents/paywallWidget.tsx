import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PaywallButton() {
  const handleUpgrade = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in first!");
      return;
    }

    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, email: user.email }),
    });

    const { url, error } = await res.json();
    if (error) {
      alert(error);
      return;
    }

    window.location.href = url; // redirect to Stripe checkout
  };

  return (
    <button
      onClick={handleUpgrade}
      className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-5 py-3 rounded-lg mt-4"
    >
      Upgrade to Premium 🎹
    </button>
  );
}
