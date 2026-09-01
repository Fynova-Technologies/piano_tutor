import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { first_name, last_name, phone } = await req.json();

  const full_name = [first_name, last_name].filter(Boolean).join(" ").trim();

  const { data, error: updateError } = await supabase
    .from("profiles")
    .update({ first_name, last_name, full_name, phone })
    .eq("id", user.id)
    .select()
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}