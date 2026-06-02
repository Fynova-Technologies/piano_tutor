/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/stripe-webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("❌ Signature failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("✅ Webhook event:", event.type);

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;

      console.log("👤 userId:", userId);
      console.log("📦 Full metadata:", session.metadata);

      if (!userId) {
        // ⚠️ This means userId wasn't passed during checkout creation
        console.error("❌ No userId in session metadata");
        return NextResponse.json({ error: "No userId in metadata" }, { status: 400 });
      }

      const { data, error: updateError } = await supabase
  .from("user_usage")
  .update({
    is_subscribed: true,        // ✅ was: subscribed
    stripe_customer_id: session.customer as string,
    stripe_subscription_id: session.subscription as string,
    plan_name: session.metadata?.planName ?? "pro",
  })
  .eq("user_id", userId)
  .select(); // ✅ Returns what was updated so we can confirm

      if (updateError) {
        console.error("❌ Supabase error:", updateError.message);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      console.log("✅ Rows updated:", data);

      await supabase.from("billing_history").insert({
        user_id: userId,
        plan_name: session.metadata?.planName ?? "pro",
        amount: (session.amount_total ?? 0) / 100,
        status: "paid",
      });

    } else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from("user_usage")
        .update({ is_subscribed: false, plan_name: "free" })
        .eq("stripe_customer_id", subscription.customer as string);
    }

    return NextResponse.json({ received: true });

  } catch (err: any) {
    console.error("❌ Handler crashed:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}