import { RatingLeaderboard } from "./rating-leaderboard";
import { getRatingLeaderboard } from "@/lib/rating/leaderboard";
import { createClient } from "@/lib/supabase/server";

export async function Hero() {
  // 서버에서 레이팅 데이터 조회
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;

  const leaderboardData = await getRatingLeaderboard(userId);

  return (
    <div className="flex flex-col gap-8 items-center w-full max-w-5xl px-4">
      <h1 className="text-2xl lg:text-4xl !leading-tight mx-auto max-w-xl text-center font-bold">
        가장 효율적으로 문제 해결 능력을 향상 시키세요
      </h1>

      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />

      {/* Rating Leaderboard */}
      <RatingLeaderboard
        topGainers={leaderboardData.topGainers}
        topLosers={leaderboardData.topLosers}
        myRank={leaderboardData.myRank}
      />
    </div>
  );
}
