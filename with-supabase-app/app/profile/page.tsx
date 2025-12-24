import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { FetchDataSteps } from "@/components/tutorial/fetch-data-steps";
import { Suspense } from "react";
import { ProfileForm } from "@/components/profile-form";
import { UserInfoRow } from "@/types/supabase";
async function UserDetails() {
  const supabase = await createClient();

  const { data: auth_data, error: auth_error } = await supabase.auth.getUser();

  if (auth_error || !auth_data?.user) {
    redirect("/auth/login");
  }
  
  const user = auth_data.user;
  console.log(user.id);
  const { data, error } = await supabase
    .from("user_info")
    .select("rating, atcoder_handle")
    .eq("id", user.id)
    .single();

  if (!data || error) {
    console.log(error.message);
    return;
  }

  const userData = data as UserInfoRow;
  return <ProfileForm rating={userData.rating} atcoder_handle={userData.atcoder_handle} />;
}

export default function ProfilePage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Profile</h2>
        <div className="text-xs">
          <Suspense>
            <UserDetails />
          </Suspense>
        </div>
      </div>
      <div>
        <h2 className="font-bold text-2xl mb-4">Next steps</h2>
        <FetchDataSteps />
      </div>
    </div>
  );
}
