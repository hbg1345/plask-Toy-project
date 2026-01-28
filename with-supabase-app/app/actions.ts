"use server";
import { createClient } from "@/lib/supabase/server";
import { fetchUserInfo } from "@qatadaazzeh/atcoder-api";

export type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

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
    const { error } = await supabase
      .from("user_info")
      .update({ atcoder_handle: userName, rating: userRating })
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

/**
 * 기존 AtCoder 핸들로 최신 레이팅을 갱신합니다.
 * 프로필 페이지 로드 시 호출됩니다.
 */
export interface SolvedProblem {
  problem_id: string;
  contest_id: string;
  title: string | null;
  difficulty: number | null;
}

/**
 * 사용자가 푼 문제 목록을 가져옵니다.
 * AtCoder API에서 AC 제출을 조회하고, DB에서 난이도 정보를 매칭합니다.
 */
export async function getSolvedProblems(atcoderHandle: string): Promise<SolvedProblem[]> {
  try {
    // 모든 제출 기록 가져오기 (페이지네이션)
    const allSubmissions: { problem_id: string; contest_id: string; result: string; epoch_second: number }[] = [];
    let fromSecond = 0;
    const maxCalls = 20; // 최대 20번 호출 (10000개 제한)

    for (let i = 0; i < maxCalls; i++) {
      const response = await fetch(
        `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${atcoderHandle}&from_second=${fromSecond}`,
        { next: { revalidate: 3600 } }
      );

      if (!response.ok) {
        console.error("Failed to fetch submissions");
        break;
      }

      const submissions = await response.json();
      if (submissions.length === 0) break;

      allSubmissions.push(...submissions);

      // 500개 미만이면 더 이상 데이터가 없음
      if (submissions.length < 500) break;

      // 다음 페이지를 위해 마지막 제출의 시간 + 1
      const lastEpoch = Math.max(...submissions.map((s: { epoch_second: number }) => s.epoch_second));
      fromSecond = lastEpoch + 1;
    }

    // AC인 제출에서 고유 문제 ID 추출
    const solvedProblemIds = new Set<string>();
    const problemContestMap = new Map<string, string>();

    for (const sub of allSubmissions) {
      if (sub.result === "AC") {
        solvedProblemIds.add(sub.problem_id);
        problemContestMap.set(sub.problem_id, sub.contest_id);
      }
    }

    if (solvedProblemIds.size === 0) {
      return [];
    }

    // DB에서 문제 정보 조회 (배치로 나눠서 조회)
    const supabase = await createClient();
    const problemIds = Array.from(solvedProblemIds);
    const problemInfoMap = new Map<string, { title: string; difficulty: number | null }>();

    // 100개씩 배치로 조회 (Supabase IN 쿼리 제한)
    const batchSize = 100;
    for (let i = 0; i < problemIds.length; i += batchSize) {
      const batch = problemIds.slice(i, i + batchSize);

      const { data: problemsData } = await supabase
        .from("problems")
        .select("id, title, difficulty")
        .in("id", batch);

      if (problemsData) {
        for (const p of problemsData) {
          problemInfoMap.set(p.id, { title: p.title, difficulty: p.difficulty });
        }
      }
    }

    // 결과 생성
    const result: SolvedProblem[] = [];
    for (const problemId of problemIds) {
      const info = problemInfoMap.get(problemId);
      result.push({
        problem_id: problemId,
        contest_id: problemContestMap.get(problemId) || "",
        title: info?.title || null,
        difficulty: info?.difficulty ?? null,
      });
    }

    // 난이도 내림차순 정렬 (높은 난이도가 먼저)
    result.sort((a, b) => (b.difficulty ?? -1) - (a.difficulty ?? -1));

    return result;
  } catch (error) {
    console.error("Failed to get solved problems:", error);
    return [];
  }
}

export async function refreshAtcoderRating(): Promise<number | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) {
    return null;
  }
  const userId = claims.sub as string;

  // 현재 저장된 핸들 조회
  const { data: userData, error: fetchError } = await supabase
    .from("user_info")
    .select("atcoder_handle")
    .eq("id", userId)
    .single();

  if (fetchError || !userData?.atcoder_handle) {
    return null;
  }

  try {
    // AtCoder API에서 최신 레이팅 조회
    const atcoderUser = await fetchUserInfo(userData.atcoder_handle);
    const userRating = atcoderUser.userRating;

    // DB 업데이트
    const { error: updateError } = await supabase
      .from("user_info")
      .update({ rating: userRating })
      .eq("id", userId);

    if (updateError) {
      console.log("Failed to update rating:", updateError);
      return null;
    }

    return userRating;
  } catch (error) {
    console.log("Failed to refresh AtCoder rating:", error);
    return null;
  }
}

export async function saveChatHistory(
  chatId: string | null,
  messages: Message[],
  title: string,
  problemUrl?: string | null,
  updateTitle: boolean = true
) {
  console.log("saveChatHistory called", {
    chatId,
    title,
    messagesCount: messages.length,
  });
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) {
    console.log("User not authenticated");
    return null;
  }
  const userId = claims.sub as string;
  console.log("User authenticated", { userId });

  try {
    const messagesJson = JSON.stringify(messages);
    console.log("Messages JSON length:", messagesJson.length);

    if (chatId) {
      // 기존 채팅 업데이트
      console.log("Updating existing chat", { chatId, updateTitle });
      const updateData: {
        messages: string;
        title?: string;
        problem_url?: string | null;
      } = {
        messages: messagesJson,
      };
      // 제목 업데이트가 허용된 경우에만 제목 업데이트
      if (updateTitle) {
        updateData.title = title;
      }
      if (problemUrl !== undefined) {
        updateData.problem_url = problemUrl;
      }
      const { data, error } = await supabase
        .from("chat_history")
        .update(updateData)
        .eq("id", chatId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.error("Failed to update chat history:", error);
        return null;
      }
      console.log("Chat updated successfully", { id: data.id });
      return data.id;
    } else {
      // 새 채팅 생성
      console.log("Creating new chat", { userId, title });
      const insertData: {
        user_id: string;
        messages: string;
        title: string;
        problem_url?: string | null;
      } = {
        user_id: userId,
        messages: messagesJson,
        title: title,
      };
      if (problemUrl !== undefined) {
        insertData.problem_url = problemUrl;
      }
      const { data, error } = await supabase
        .from("chat_history")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("Failed to create chat history:", error);
        return null;
      }
      console.log("Chat created successfully", { id: data.id });
      return data.id;
    }
  } catch (error) {
    console.error("Failed to save chat history:", error);
    return null;
  }
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  updated_at: string;
}

export async function getChatHistoryList(): Promise<ChatHistoryItem[]> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) {
    console.log("User not authenticated");
    return [];
  }
  const userId = claims.sub as string;

  try {
    const { data, error } = await supabase
      .from("chat_history")
      .select("id, title, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Failed to get chat history list:", error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("Failed to get chat history list:", error);
    return [];
  }
}

export async function getChatByProblemUrl(
  problemUrl: string
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) {
    console.log("User not authenticated");
    return null;
  }
  const userId = claims.sub as string;

  try {
    const { data, error } = await supabase
      .from("chat_history")
      .select("id")
      .eq("user_id", userId)
      .eq("problem_url", problemUrl)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // 채팅이 없으면 null 반환 (에러가 아닌 정상적인 경우)
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Failed to get chat by problem URL:", error);
      return null;
    }
    return data?.id || null;
  } catch (error) {
    console.error("Failed to get chat by problem URL:", error);
    return null;
  }
}

export async function getChatHistory(
  chatId: string
): Promise<{ messages: Message[]; title: string; problemUrl?: string | null } | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) {
    console.log("User not authenticated");
    return null;
  }
  const userId = claims.sub as string;

  try {
    const { data, error } = await supabase
      .from("chat_history")
      .select("messages, title, problem_url")
      .eq("id", chatId)
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Failed to get chat history:", error);
      return null;
    }

    const messages = JSON.parse(data.messages) as Message[];
    return { messages, title: data.title, problemUrl: data.problem_url };
  } catch (error) {
    console.error("Failed to get chat history:", error);
    return null;
  }
}

export async function deleteChatHistory(chatId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) {
    console.log("User not authenticated");
    return false;
  }
  const userId = claims.sub as string;

  try {
    // 먼저 해당 채팅이 존재하는지 확인
    const { data: chatData, error: fetchError } = await supabase
      .from("chat_history")
      .select("id, user_id")
      .eq("id", chatId)
      .single();

    if (fetchError) {
      console.error("Failed to fetch chat before deletion:", fetchError);
      return false;
    }

    if (!chatData) {
      console.error("Chat not found:", chatId);
      return false;
    }

    if (chatData.user_id !== userId) {
      console.error("User does not own this chat:", { chatId, userId, chatUserId: chatData.user_id });
      return false;
    }

    // 삭제 실행
    const { error } = await supabase
      .from("chat_history")
      .delete()
      .eq("id", chatId)
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to delete chat history:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return false;
    }

    console.log("Chat deleted successfully:", { chatId });
    return true;
  } catch (error) {
    console.error("Failed to delete chat history:", error);
    console.error("Error details:", error instanceof Error ? error.stack : String(error));
    return false;
  }
}

/**
 * Kenkoo API를 사용하여 문제 수집을 시작하는 Server Action
 * 이 방법이 훨씬 빠르고 효율적입니다.
 */
export async function startProblemCollectionFromKenkoo() {
  // 인증 확인
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) {
    console.log("User not authenticated");
    return { success: false, error: "Not authenticated" };
  }

  try {
    const {
      collectAllProblemsFromKenkoo,
      populateContestsFromKenkooAPI,
      populateContestProblemsFromKenkooAPI,
    } = await import("@/lib/atcoder/problems");

    // 1. contests 수집 (먼저 실행)
    console.log("Starting contests collection...");
    const contestsResult = await populateContestsFromKenkooAPI();
    console.log(
      `Contests collection completed: Processed ${contestsResult.processed}, Saved ${contestsResult.saved}`
    );

    // 2. 문제 수집
    console.log("Starting problems collection...");
    const problemResult = await collectAllProblemsFromKenkoo();
    console.log(
      `Problems collection completed: Processed ${problemResult.processed}, Saved ${problemResult.saved}`
    );

    // 3. contest_problems 관계 수집
    console.log("Starting contest_problems collection...");
    const contestProblemResult = await populateContestProblemsFromKenkooAPI();
    console.log(
      `Contest_problems collection completed: Processed ${contestProblemResult.processed}, Saved ${contestProblemResult.saved}`
    );

    return {
      success: true,
      contests: contestsResult,
      problems: problemResult,
      contestProblems: contestProblemResult,
    };
  } catch (error) {
    console.error("Failed to collect problems from Kenkoo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 문제 수집을 시작하는 Server Action (기존 방식 - AtCoder 크롤링)
 * 주의: 이 작업은 매우 오래 걸릴 수 있습니다.
 */
export async function startProblemCollection(
  limit?: number,
  startFrom: number = 0
) {
  // 인증 확인 (관리자만 실행 가능하도록 할 수도 있음)
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) {
    console.log("User not authenticated");
    return { success: false, error: "Not authenticated" };
  }

  try {
    // 동적 import로 문제 수집 함수 가져오기
    const { collectAllProblems } = await import("@/lib/atcoder/problems");
    const result = await collectAllProblems(limit, startFrom);
    return { success: true, ...result };
  } catch (error) {
    console.error("Failed to collect problems:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 토큰 사용량 관련 타입 및 함수
 */
export interface TokenUsage {
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  request_count: number;
}

export interface TokenUsageHistory {
  id: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  model: string;
  created_at: string;
}

/**
 * 오늘의 토큰 사용량 조회
 */
export async function getTodayTokenUsage(): Promise<TokenUsage> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims) {
    return {
      total_input_tokens: 0,
      total_output_tokens: 0,
      total_tokens: 0,
      request_count: 0,
    };
  }

  const userId = claims.sub as string;
  const today = new Date().toISOString().split("T")[0];

  try {
    const { data, error } = await supabase
      .from("token_usage")
      .select("input_tokens, output_tokens, total_tokens")
      .eq("user_id", userId)
      .gte("created_at", `${today}T00:00:00`)
      .lt("created_at", `${today}T23:59:59.999`);

    if (error) {
      console.error("Failed to get token usage:", error);
      return {
        total_input_tokens: 0,
        total_output_tokens: 0,
        total_tokens: 0,
        request_count: 0,
      };
    }

    const result = (data || []).reduce(
      (acc, row) => ({
        total_input_tokens: acc.total_input_tokens + (row.input_tokens || 0),
        total_output_tokens: acc.total_output_tokens + (row.output_tokens || 0),
        total_tokens: acc.total_tokens + (row.total_tokens || 0),
        request_count: acc.request_count + 1,
      }),
      {
        total_input_tokens: 0,
        total_output_tokens: 0,
        total_tokens: 0,
        request_count: 0,
      }
    );

    return result;
  } catch (error) {
    console.error("Failed to get token usage:", error);
    return {
      total_input_tokens: 0,
      total_output_tokens: 0,
      total_tokens: 0,
      request_count: 0,
    };
  }
}

/**
 * 최근 7일간 토큰 사용량 조회
 */
export async function getWeeklyTokenUsage(): Promise<
  { date: string; total_tokens: number; request_count: number }[]
> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims) {
    return [];
  }

  const userId = claims.sub as string;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    const { data, error } = await supabase
      .from("token_usage")
      .select("total_tokens, created_at")
      .eq("user_id", userId)
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to get weekly token usage:", error);
      return [];
    }

    // 날짜별로 그룹화
    const grouped = (data || []).reduce(
      (acc, row) => {
        const date = new Date(row.created_at).toISOString().split("T")[0];
        if (!acc[date]) {
          acc[date] = { total_tokens: 0, request_count: 0 };
        }
        acc[date].total_tokens += row.total_tokens || 0;
        acc[date].request_count += 1;
        return acc;
      },
      {} as Record<string, { total_tokens: number; request_count: number }>
    );

    return Object.entries(grouped).map(([date, stats]) => ({
      date,
      ...stats,
    }));
  } catch (error) {
    console.error("Failed to get weekly token usage:", error);
    return [];
  }
}

/**
 * 모든 사용자의 AtCoder 레이팅을 수집하여 rating_history에 저장합니다.
 * 관리자가 일주일에 한 번 수동으로 실행합니다.
 */
export async function collectAllUserRatings(): Promise<{
  success: boolean;
  processed: number;
  saved: number;
  errors: string[];
}> {
  const supabase = await createClient();

  // 인증 확인
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) {
    return { success: false, processed: 0, saved: 0, errors: ["Not authenticated"] };
  }

  // atcoder_handle이 있는 모든 사용자 조회
  const { data: users, error } = await supabase
    .from("user_info")
    .select("id, atcoder_handle, rating")
    .not("atcoder_handle", "is", null);

  if (error || !users) {
    return {
      success: false,
      processed: 0,
      saved: 0,
      errors: [error?.message || "Failed to fetch users"],
    };
  }

  let savedCount = 0;
  const errors: string[] = [];

  for (const user of users) {
    try {
      // AtCoder API에서 최신 레이팅 조회
      const atcoderUser = await fetchUserInfo(user.atcoder_handle);
      const currentRating = atcoderUser.userRating;

      // user_info 테이블 업데이트
      await supabase
        .from("user_info")
        .update({ rating: currentRating })
        .eq("id", user.id);

      // rating_history에 기록
      const { error: insertError } = await supabase.from("rating_history").insert({
        user_id: user.id,
        atcoder_handle: user.atcoder_handle,
        rating: currentRating,
      });

      if (insertError) {
        errors.push(`Failed to save history for ${user.atcoder_handle}: ${insertError.message}`);
      } else {
        savedCount++;
      }

      // Rate limiting (AtCoder API 보호)
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      errors.push(`Failed for ${user.atcoder_handle}: ${err}`);
    }
  }

  return {
    success: true,
    processed: users.length,
    saved: savedCount,
    errors,
  };
}
