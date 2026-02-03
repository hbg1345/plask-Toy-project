import { createClient } from "@/lib/supabase/server";
import { HeroLanding } from "./hero-landing";

export async function HeroLandingWrapper() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const isLoggedIn = !!claimsData?.claims?.sub;

  return <HeroLanding isLoggedIn={isLoggedIn} />;
}
