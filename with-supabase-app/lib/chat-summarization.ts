import type { SupabaseClient } from "@supabase/supabase-js";
import type { UIMessage } from "ai";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

const SUMMARIZATION_MODEL = "gemini-2.5-flash-lite";
// 이전 요청의 totalTokens가 이 값을 넘으면 다음 요청에서 요약 트리거
const TOKEN_THRESHOLD = 8000;
const KEEP_RECENT_COUNT = 6;

interface SummarizeResult {
  summary: string | null;
  messagesToSend: UIMessage[];
  summaryMessageCount: number | null;
}

/**
 * 이전 요청의 토큰 사용량이 임계치를 넘으면 오래된 메시지를 요약합니다.
 * DB에는 원본을 보존하고, AI에 보내는 것만 줄입니다.
 */
export async function summarizeIfNeeded(
  supabase: SupabaseClient,
  chatId: string | undefined,
  userId: string,
  allMessages: UIMessage[],
  existingSummary: string | null,
  existingSummaryCount: number | null,
  lastTotalTokens: number | null
): Promise<SummarizeResult> {
  const totalCount = allMessages.length;

  console.log("=== summarizeIfNeeded ===", {
    chatId,
    totalMessages: totalCount,
    lastTotalTokens,
    threshold: TOKEN_THRESHOLD,
    hasExistingSummary: !!existingSummary,
    existingSummaryCount,
  });

  // 이전 요청 토큰이 임계치 이하면 요약 불필요
  if (!lastTotalTokens || lastTotalTokens <= TOKEN_THRESHOLD) {
    console.log("[summarize] SKIP - tokens below threshold");
    return {
      summary: null,
      messagesToSend: allMessages,
      summaryMessageCount: null,
    };
  }

  const cutoffIndex = totalCount - KEEP_RECENT_COUNT;
  const recentMessages = allMessages.slice(cutoffIndex);

  console.log("[summarize] TRIGGERED - cutoffIndex:", cutoffIndex, "keeping recent:", KEEP_RECENT_COUNT);

  // 기존 요약이 cutoffIndex까지 커버하면 재사용
  if (existingSummary && existingSummaryCount !== null && existingSummaryCount >= cutoffIndex) {
    console.log("[summarize] REUSE existing summary (covers up to", existingSummaryCount, ", cutoff:", cutoffIndex, ")");
    return {
      summary: existingSummary,
      messagesToSend: recentMessages,
      summaryMessageCount: existingSummaryCount,
    };
  }

  // 새 요약 생성
  try {
    const messagesToSummarize = allMessages.slice(0, cutoffIndex);
    const conversationText = messagesToSummarize
      .map((m) => {
        const text = m.parts
          ?.map((p) => ("text" in p ? (p as { text: string }).text : ""))
          .join("") || "";
        return `${m.role}: ${text}`;
      })
      .join("\n");

    const basePrompt = "다음 대화를 간결하게 요약하세요. 핵심 논의 주제, 사용자가 겪는 문제, 제공된 힌트를 포함하세요. 한국어로 작성하세요.";
    const prompt = existingSummary
      ? `기존 요약:\n${existingSummary}\n\n추가된 대화:\n${conversationText}\n\n위 기존 요약과 추가된 대화를 합쳐서 하나의 요약으로 만드세요. ${basePrompt}`
      : `${basePrompt}\n\n대화:\n${conversationText}`;

    console.log("[summarize] GENERATING new summary for", messagesToSummarize.length, "messages");

    const result = await generateText({
      model: google(SUMMARIZATION_MODEL),
      prompt,
    });

    const newSummary = result.text;
    console.log("[summarize] Generated summary:", newSummary.substring(0, 200), "...");

    // DB에 요약 저장
    if (chatId) {
      const { error } = await supabase
        .from("chat_history")
        .update({
          summary: newSummary,
          summary_message_count: cutoffIndex,
        })
        .eq("id", chatId)
        .eq("user_id", userId);

      if (error) {
        console.error("[summarize] Failed to save summary to DB:", error);
      } else {
        console.log("[summarize] Summary saved to DB, summary_message_count:", cutoffIndex);
      }
    }

    console.log("[summarize] Sending", recentMessages.length, "recent messages (instead of", totalCount, ")");
    return {
      summary: newSummary,
      messagesToSend: recentMessages,
      summaryMessageCount: cutoffIndex,
    };
  } catch (error) {
    // 요약 실패 시 전체 메시지 fallback
    console.error("Summarization failed, falling back to full messages:", error);
    return {
      summary: null,
      messagesToSend: allMessages,
      summaryMessageCount: null,
    };
  }
}
