import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";

export async function ChatLink() {
  const supabase = await createClient();

  // getClaims() is faster than getUser() as it reads from JWT directly
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims) {
    return null;
  }

  return (
    <Button asChild size="default" variant={"outline"}>
      <Link href="/chat">Chat</Link>
    </Button>
  );
}

