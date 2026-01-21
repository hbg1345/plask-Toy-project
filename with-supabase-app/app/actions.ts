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
