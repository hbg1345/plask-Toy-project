import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * ⚠️ PAGE-LEVEL AUTHENTICATION CHECK
 * Authentication is handled at the page level, NOT in middleware.
 * See lib/supabase/proxy.ts for architecture details.
 */
export async function ChatAuthCheck({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims) {
    redirect("/auth/login");
  }

  return <>{children}</>;
}

