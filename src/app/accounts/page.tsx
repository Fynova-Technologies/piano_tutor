import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import AccountPageUI from "@/components/account/accountpageui";

export default async function AccountPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  console.log("USER:", user);
  console.log("ERROR:", error);

  if (!user) return <div>Not logged in</div>;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <>
      <AccountPageUI
        user={user}
        profile={profile}
        subscription={subscription}
      />
    </>
  );
}