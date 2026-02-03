import { RatingLeaderboard } from "./rating-leaderboard";
import { getRatingLeaderboard } from "@/lib/rating/leaderboard";
import { createClient } from "@/lib/supabase/server";

export async function Hero() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;

  const leaderboardData = await getRatingLeaderboard(userId);

  return (
    <div className="flex flex-col gap-8 items-center w-full max-w-5xl px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Rating Leaderboard</h2>
        <p className="text-muted-foreground">최근 레이팅 변화 순위</p>
      </div>

      <RatingLeaderboard
        topGainers={leaderboardData.topGainers}
        topLosers={leaderboardData.topLosers}
        myRank={leaderboardData.myRank}
      />
    </div>
  );
}
