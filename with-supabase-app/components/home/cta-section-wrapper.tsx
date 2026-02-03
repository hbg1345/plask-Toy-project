import { createClient } from "@/lib/supabase/server";
import { CTASection } from "./cta-section";

export async function CTASectionWrapper() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const isLoggedIn = !!claimsData?.claims?.sub;

  return <CTASection isLoggedIn={isLoggedIn} />;
}
