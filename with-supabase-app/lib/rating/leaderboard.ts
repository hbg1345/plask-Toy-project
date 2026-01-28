import { createClient } from "@/lib/supabase/server";

export interface RatingChangeEntry {
  user_id: string;
  atcoder_handle: string;
  avatar_url: string | null;
  current_rating: number;
  previous_rating: number;
  rating_change: number;
}

export interface LeaderboardData {
  topGainers: RatingChangeEntry[];
  topLosers: RatingChangeEntry[];
  myRank: {
    rank: number;
    totalUsers: number;
    ratingChange: number;
    currentRating: number;
  } | null;
}

/**
 * 일주일간 레이팅 변화 Top 10 및 본인 순위 조회
 */
export async function getRatingLeaderboard(
  userId?: string
): Promise<LeaderboardData> {
  const supabase = await createClient();

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 모든 rating_history 레코드 조회 (일주일 내)
  const { data: allHistory, error } = await supabase
    .from("rating_history")
    .select("user_id, atcoder_handle, rating, recorded_at")
    .order("recorded_at", { ascending: true });

  if (error || !allHistory || allHistory.length === 0) {
    return { topGainers: [], topLosers: [], myRank: null };
  }

  // 사용자별로 가장 오래된 기록과 가장 최신 기록 찾기
  const userFirstRecord = new Map<
    string,
    { rating: number; atcoder_handle: string; recorded_at: string }
  >();
  const userLastRecord = new Map<
    string,
    { rating: number; atcoder_handle: string; recorded_at: string }
  >();

  for (const record of allHistory) {
    const recordDate = new Date(record.recorded_at);

    // 일주일 전 기준으로 가장 가까운 이전 기록 찾기
    if (recordDate <= oneWeekAgo) {
      const existing = userFirstRecord.get(record.user_id);
      if (
        !existing ||
        new Date(existing.recorded_at) < new Date(record.recorded_at)
      ) {
        userFirstRecord.set(record.user_id, {
          rating: record.rating,
          atcoder_handle: record.atcoder_handle,
          recorded_at: record.recorded_at,
        });
      }
    }

    // 가장 최신 기록 찾기
    const existingLast = userLastRecord.get(record.user_id);
    if (
      !existingLast ||
      new Date(existingLast.recorded_at) < new Date(record.recorded_at)
    ) {
      userLastRecord.set(record.user_id, {
        rating: record.rating,
        atcoder_handle: record.atcoder_handle,
        recorded_at: record.recorded_at,
      });
    }
  }

  // 레이팅 변화가 있는 사용자들만 필터링
  const userIds = Array.from(
    new Set([...userFirstRecord.keys(), ...userLastRecord.keys()])
  ).filter((id) => userFirstRecord.has(id) && userLastRecord.has(id));

  if (userIds.length === 0) {
    return { topGainers: [], topLosers: [], myRank: null };
  }

  // user_info에서 avatar_url 조회
  const { data: userInfos } = await supabase
    .from("user_info")
    .select("id, avatar_url")
    .in("id", userIds);

  const avatarMap = new Map<string, string | null>();
  userInfos?.forEach((u) => avatarMap.set(u.id, u.avatar_url));

  // 레이팅 변화 계산
  const changes: RatingChangeEntry[] = [];

  for (const userId of userIds) {
    const first = userFirstRecord.get(userId);
    const last = userLastRecord.get(userId);

    if (first && last) {
      changes.push({
        user_id: userId,
        atcoder_handle: last.atcoder_handle,
        avatar_url: avatarMap.get(userId) || null,
        current_rating: last.rating,
        previous_rating: first.rating,
        rating_change: last.rating - first.rating,
      });
    }
  }

  // 레이팅 변화로 정렬
  const sorted = [...changes].sort(
    (a, b) => b.rating_change - a.rating_change
  );

  // 상승 Top 10 (변화량 > 0)
  const topGainers = sorted.filter((c) => c.rating_change > 0).slice(0, 10);

  // 하락 Top 10 (변화량 < 0, 가장 많이 떨어진 순)
  const topLosers = sorted
    .filter((c) => c.rating_change < 0)
    .sort((a, b) => a.rating_change - b.rating_change)
    .slice(0, 10);

  // 본인 순위 계산
  let myRank = null;
  if (userId) {
    const myIndex = sorted.findIndex((c) => c.user_id === userId);
    if (myIndex !== -1) {
      myRank = {
        rank: myIndex + 1,
        totalUsers: sorted.length,
        ratingChange: sorted[myIndex].rating_change,
        currentRating: sorted[myIndex].current_rating,
      };
    }
  }

  return { topGainers, topLosers, myRank };
}
