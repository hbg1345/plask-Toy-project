import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = claims.sub as string;

  const { data, error } = await supabase
    .from("user_info")
    .select("atcoder_handle")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return NextResponse.json({ handle: null });
  }

  return NextResponse.json({ handle: data.atcoder_handle });
}
