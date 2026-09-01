import { createServerSupabase } from "@/lib/supabase/server";
import AccountPageUI from "@/components/account/accountpageui";

export default async function AccountPage() {
  const supabase = await createServerSupabase();

  const {
    data: { user }, // ✅ destructure user directly
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return <div>Not logged in</div>;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id) // ✅ use user.id, not userData.id
    .maybeSingle();

  const { data: usage } = await supabase
    .from("user_usage")
    .select("is_subscribed, plan_name, subscription_end_date, stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: billingRows } = await supabase
    .from("billing_history")
    .select("created_at, plan_name, amount, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const subscription = {
    plan: usage?.is_subscribed ? usage.plan_name : "Free Trial",
    status: usage?.is_subscribed ? "Active" : "Inactive",
    renew_date: usage?.subscription_end_date
      ? new Date(usage.subscription_end_date).toLocaleDateString()
      : "N/A",
    planName: usage?.plan_name ?? null,
    isSubscribed: usage?.is_subscribed ?? false,
  };

  const invoices = (billingRows ?? []).map(
    (row: { created_at: string; amount: number; status: string }) => ({
      date: new Date(row.created_at).toLocaleDateString(),
      invoice_no: row.created_at ? `INV-${new Date(row.created_at).getTime()}` : "—",
      amount: row.amount,
      status: row.status,
    })
  );
  console.log("Invoices:", billingRows);
  console.log("Subscription:", subscription);
  

  return (
    <AccountPageUI
      user={user} // ✅ pass user, not userData
      profile={profile}
      subscription={subscription}
      invoices={invoices}
    />
  );
}