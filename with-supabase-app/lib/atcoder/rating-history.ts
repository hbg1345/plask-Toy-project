// AtCoder 레이팅 히스토리 API

export interface RatingHistoryEntry {
  ContestScreenName: string;
  ContestName: string;
  NewRating: number;
  OldRating: number;
  Performance: number;
  Increment: number;
  EndTime: string;
  IsRated: boolean;
  Place: number;
}

interface AtCoderHistoryResponse {
  IsRated: boolean;
  Place: number;
  OldRating: number;
  NewRating: number;
  Performance: number;
  InnerPerformance: number;
  ContestScreenName: string;
  ContestName: string;
  ContestNameEn: string;
  EndTime: string;
}

/**
 * AtCoder 레이팅 히스토리를 가져옵니다.
 * @param username AtCoder 사용자명
 * @returns 레이팅 히스토리 배열 (시간순 정렬)
 */
export async function getRatingHistory(
  username: string
): Promise<RatingHistoryEntry[]> {
  try {
    const response = await fetch(
      `https://atcoder.jp/users/${username}/history/json`,
      { next: { revalidate: 3600 } } // 1시간 캐싱
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch rating history: ${response.status}`);
    }

    const data: AtCoderHistoryResponse[] = await response.json();

    return data
      .filter((entry) => entry.IsRated) // Rated 대회만 필터링
      .map((entry) => ({
        ContestScreenName: entry.ContestScreenName,
        ContestName: entry.ContestName || entry.ContestNameEn,
        NewRating: entry.NewRating,
        OldRating: entry.OldRating,
        Performance: entry.Performance,
        Increment: entry.NewRating - entry.OldRating,
        EndTime: entry.EndTime,
        IsRated: entry.IsRated,
        Place: entry.Place,
      }))
      .sort(
        (a, b) => new Date(a.EndTime).getTime() - new Date(b.EndTime).getTime()
      );
  } catch (error) {
    console.error("Failed to fetch rating history:", error);
    return [];
  }
}

/**
 * 레이팅에 해당하는 색상을 반환합니다.
 */
export function getRatingColor(rating: number): string {
  if (rating < 400) return "#6b7280"; // Gray
  if (rating < 800) return "#92400e"; // Brown
  if (rating < 1200) return "#16a34a"; // Green
  if (rating < 1600) return "#06b6d4"; // Cyan
  if (rating < 2000) return "#2563eb"; // Blue
  if (rating < 2400) return "#eab308"; // Yellow
  if (rating < 2800) return "#ea580c"; // Orange
  return "#dc2626"; // Red
}

/**
 * 레이팅 범위명을 반환합니다.
 */
export function getRatingRankName(rating: number): string {
  if (rating < 400) return "Gray";
  if (rating < 800) return "Brown";
  if (rating < 1200) return "Green";
  if (rating < 1600) return "Cyan";
  if (rating < 2000) return "Blue";
  if (rating < 2400) return "Yellow";
  if (rating < 2800) return "Orange";
  return "Red";
}
