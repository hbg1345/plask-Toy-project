import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function ChatAuthCheck({
  children,
}: {
  children: React.ReactNode;
}) {
  // 인증 체크 (problems 페이지와 동일한 방식)
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims) {
    redirect("/auth/login");
  }

  return <>{children}</>;
}

