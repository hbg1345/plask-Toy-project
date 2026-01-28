import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { ProfileDropdown } from "./profile-dropdown";

export async function AuthButton() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex gap-2">
        <Button asChild size="sm" variant={"outline"}>
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button asChild size="sm" variant={"default"}>
          <Link href="/auth/sign-up">Sign up</Link>
        </Button>
      </div>
    );
  }

  // 사용자 프로필 정보 가져오기
  const { data: userInfo } = await supabase
    .from("user_info")
    .select("avatar_url, atcoder_handle")
    .eq("id", user.id)
    .single();

  return (
    <ProfileDropdown
      avatarUrl={userInfo?.avatar_url ?? null}
      handle={userInfo?.atcoder_handle ?? null}
      email={user.email ?? null}
    />
  );
}
