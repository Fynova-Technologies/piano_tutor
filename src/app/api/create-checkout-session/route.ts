/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/create-checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabase } from "@/lib/supabase/server";
import { getUserSubscription } from "@/lib/stripe/subscription";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});


export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ loggedIn: false, plan: null });
    }

    const { plan } = await getUserSubscription(user.id);
    return NextResponse.json({ loggedIn: true, plan });
  } catch (err) {
    console.error("subscription-status route error:", err);
    // Distinguish "we errored" from "you're logged out" so the client can react differently
    return NextResponse.json({ loggedIn: null, plan: null, error: true }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabase();

    // ✅ Use getUser() instead of getSessio
    const { data: { user }, error } = await (await supabase).auth.getUser();

    console.log("👤 Authenticated user:", user?.id);
    console.log("🔑 Auth error:", error?.message);

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { priceId, planName } = await req.json();

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      metadata: {
        userId: user.id,          // ✅ This must be here for webhook to work
        planName: planName ?? "pro",
      },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
    });

    console.log("✅ Checkout session created:", checkoutSession.id);
    console.log("📦 Metadata set:", checkoutSession.metadata);

    return NextResponse.json({ url: checkoutSession.url });

  } catch (err: any) {
    console.error("❌ Checkout error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}