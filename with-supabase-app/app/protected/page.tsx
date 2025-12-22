import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { FetchDataSteps } from "@/components/tutorial/fetch-data-steps";
import { Suspense } from "react";

async function UserDetails() {
  const supabase = await createClient();

  const { data: auth_data, error: auth_error } = await supabase.auth.getUser();

  if (auth_error || !auth_data?.user) {
    redirect("/auth/login");
  }
  const user = auth_data.user;
  const { data, error } = await supabase
    .from("user_info")
    .select("rating, atcoder_handle")
    .eq("id", user.id)
    .single();
  if (error) {
    console.log(error.message);
    return;
  }
  if (data.rating === null) {
    return (
      <div>
        <p>Atcoder 계정을 연동해주세요.</p>
      </div>
    );
  }
  return (
    <div>
      <p> Atcoder handle: {data.atcoder_handle} </p>
      <p> rating: {data.rating} </p>
    </div>
  );
}

export default function ProtectedPage() {
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
