/**
 * AtCoder API를 사용하여 사용자의 제출 기록을 가져옵니다.
 * https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions
 */

export interface Submission {
  id: number;
  epoch_second: number;
  problem_id: string;
  contest_id: string;
  user_id: string;
  language: string;
  point: number;
  length: number;
  result: string;
  execution_time: number | null;
}

/**
 * 사용자의 제출 기록을 가져옵니다.
 * @param userId AtCoder 사용자 ID
 * @param fromSecond 시작 시각 (Unix timestamp, 초 단위)
 * @returns 제출 기록 배열 (최대 500개)
 */
export async function getUserSubmissions(
  userId: string,
  fromSecond: number
): Promise<Submission[]> {
  try {
    const url = `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${userId}&from_second=${fromSecond}`;
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // 1시간마다 재검증
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch submissions: ${response.statusText}`);
    }

    const data: Submission[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching submissions:", error);
    throw error;
  }
}

/**
 * 특정 년도의 제출 기록을 가져옵니다.
 * API는 최대 500개만 반환하므로, 여러 번 호출하여 모든 기록을 가져옵니다.
 * @param userId AtCoder 사용자 ID
 * @param year 년도 (예: 2024)
 * @returns 제출 기록 배열
 */
export async function getYearSubmissions(
  userId: string,
  year: number
): Promise<Submission[]> {
  // 해당 년도의 1월 1일 00:00:00
  const yearStart = new Date(year, 0, 1);
  const fromSecond = Math.floor(yearStart.getTime() / 1000);

  // 해당 년도의 12월 31일 23:59:59
  const yearEnd = new Date(year, 11, 31, 23, 59, 59);
  const toSecond = Math.floor(yearEnd.getTime() / 1000);

  const allSubmissions: Submission[] = [];
  let currentFromSecond = fromSecond;
  const maxCalls = 10; // 최대 10번 호출 (5000개 제한)
  let callCount = 0;

  while (callCount < maxCalls && currentFromSecond <= toSecond) {
    const submissions = await getUserSubmissions(userId, currentFromSecond);

    if (submissions.length === 0) {
      break;
    }

    // 해당 년도 내의 제출만 필터링
    const yearSubmissions = submissions.filter(
      (sub) => sub.epoch_second >= fromSecond && sub.epoch_second <= toSecond
    );

    // 중복 제거 (이전 호출과 겹칠 수 있음)
    const newSubmissions = yearSubmissions.filter(
      (sub) => !allSubmissions.some((existing) => existing.id === sub.id)
    );

    if (newSubmissions.length === 0) {
      break; // 더 이상 새로운 데이터가 없음
    }

    allSubmissions.push(...newSubmissions);

    // 가장 최근 제출의 시각을 다음 시작점으로 설정
    const latestSecond = Math.max(
      ...submissions.map((sub) => sub.epoch_second)
    );

    // 해당 년도를 벗어나면 종료
    if (latestSecond > toSecond || submissions.length < 500) {
      break;
    }

    currentFromSecond = latestSecond + 1;
    callCount++;

    // API 호출 간 딜레이 (Rate limiting 방지)
    if (callCount < maxCalls) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // 날짜순 정렬 (오래된 것부터)
  return allSubmissions.sort((a, b) => a.epoch_second - b.epoch_second);
}

/**
 * 최근 1년간의 제출 기록을 가져옵니다. (하위 호환성 유지)
 * @param userId AtCoder 사용자 ID
 * @returns 제출 기록 배열
 */
export async function getRecentYearSubmissions(
  userId: string
): Promise<Submission[]> {
  const currentYear = new Date().getFullYear();
  return getYearSubmissions(userId, currentYear);
}

/**
 * 제출 기록을 날짜별로 그룹화합니다. (AC만 카운트)
 * @param submissions 제출 기록 배열
 * @returns 날짜별 AC 횟수 객체 (YYYY-MM-DD 형식의 키)
 */
export function groupSubmissionsByDate(
  submissions: Submission[]
): Record<string, number> {
  const grouped: Record<string, number> = {};

  for (const submission of submissions) {
    // AC(정답)인 제출만 카운트
    if (submission.result !== "AC") {
      continue;
    }

    const date = new Date(submission.epoch_second * 1000);
    const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD

    grouped[dateKey] = (grouped[dateKey] || 0) + 1;
  }

  return grouped;
}

