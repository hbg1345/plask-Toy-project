import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { ProfileWithGrass } from "@/components/profile-form";
import { UserInfoRow } from "@/types/supabase";
async function UserDetails() {
  const supabase = await createClient();

  // getClaims() is faster than getUser() as it reads from JWT directly
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims) {
    redirect("/auth/login");
  }
  
  const userId = claims.sub as string;
  console.log(userId);
  const { data, error } = await supabase
    .from("user_info")
    .select("rating, atcoder_handle")
    .eq("id", userId)
    .single();

  if (!data || error) {
    console.log(error.message);
    return;
  }

  const userData = data as UserInfoRow;
  return <ProfileWithGrass rating={userData.rating} atcoder_handle={userData.atcoder_handle} />;
}

export default function ProfilePage() {
  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col gap-8 items-start">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">
              프로필 정보를 확인하고 관리하세요
            </p>
          </div>
          <Suspense fallback={
            <div className="w-full max-w-md h-64 bg-muted animate-pulse rounded-xl" />
          }>
            <UserDetails />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
