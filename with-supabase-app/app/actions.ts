"use server";
import { createClient  } from "@/lib/supabase/server";
import { fetchUserInfo } from '@qatadaazzeh/atcoder-api';

export async function updatAtcoderHandle(handle: string) {
    const supabase = await createClient();
    // getClaims() is faster than getUser() as it reads from JWT directly
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims;
    if (!claims) {
        console.log("User not authenticated");
        return;
    }
    const userId = claims.sub as string;
    try {
        const atcoderUser = await fetchUserInfo(handle);
        const userName = atcoderUser.userName;
        const userRating = atcoderUser.userRating;
        console.log(userName, userRating);
        const {error} = await supabase.
        from("user_info").update({atcoder_handle: userName, rating: userRating})
        .eq("id", userId);
        console.log("userid", userId);
        if (error) {
            console.log(error);
            return;
        }
    } catch (error) {
        console.log("Failed to fetch Atcoder user info:", error);
        return;
    }
}