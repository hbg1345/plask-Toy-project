import {
  convertToModelMessages,
  streamText,
  UIMessage,
  tool,
  stepCountIs,
} from "ai";
import type { ToolSet } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import {
  getRecentContests,
  getUpcomingcontests,
  getTaskLinkList,
  getTaskMetadata,
  getEditorial,
} from "@/lib/atcoder/contest";
// Note: getEditorial is used for lazy loading, not as a tool
import { createClient } from "@/lib/supabase/server";
import { extractContestId } from "@/lib/atcoder/problems";

const MODEL_NAME = "gemini-2.5-flash-lite";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const tools: ToolSet = {
  fetchRecentContests: tool({
    description: `Get list of recent AtCoder contests
    example: fetchRecentContests({})`,
    inputSchema: z.object({}),
    execute: async () => {
      console.log("=== fetchRecentContests called ===");
      return await getRecentContests();
    },
  }),
  fetchUpcomingcontests: tool({
    description: `Get list of upcoming AtCoder contests
    example: fetchUpcomingcontests({})`,
    inputSchema: z.object({}),
    execute: async () => {
      return await getUpcomingcontests();
    },
  }),

  fetchTaskLinkList: tool({
    description: `Get list of task links from an AtCoder contest URL.
    example: fetchTaskLinkList({contestUrl: "https://atcoder.jp/contests/abc314"})`,
    inputSchema: z.object({
      contestUrl: z.string().describe("The URL of the AtCoder contest"),
    }),
    execute: async ({ contestUrl }) => {
      return await getTaskLinkList(contestUrl);
    },
  }),
  fetchTaskMetadata: tool({
    description: `Get metadata for a specific AtCoder task
    example: fetchTaskMetadata({taskUrl: "https://atcoder.jp/contests/abc314/tasks/abc314_a"})`,
    inputSchema: z.object({
      taskUrl: z.string().describe("The URL of the AtCoder task"),
    }),
    execute: async ({ taskUrl }) => {
      return await getTaskMetadata(taskUrl);
    },
  }),
};

// chatId를 클로저로 캡처하기 위해 동적으로 생성하는 함수
function createDynamicTools(supabase: Awaited<ReturnType<typeof createClient>>, chatId: string | undefined): ToolSet {
  return {
    searchProblems: tool({
      description: `Search for AtCoder problems in the database by keyword or difficulty.
IMPORTANT: Use this tool when:
- User mentions a problem by name (e.g., "ABC 314 A", "그 Two Sum 문제", "저번에 푼 문제")
- User describes a problem vaguely without URL
- User asks "이 문제 어려워" or similar without specific URL

Examples:
- searchProblems({query: "abc314"}) - search by contest
- searchProblems({query: "sum", minDifficulty: 800, maxDifficulty: 1200}) - search by keyword and difficulty range`,
      inputSchema: z.object({
        query: z.string().describe("Search keyword (problem title, contest id like 'abc314', problem id like 'abc314_a')"),
        minDifficulty: z.number().optional().describe("Minimum difficulty (e.g., 100)"),
        maxDifficulty: z.number().optional().describe("Maximum difficulty (e.g., 2000)"),
        limit: z.number().optional().describe("Max results to return (default: 10)"),
      }),
      execute: async ({ query, minDifficulty, maxDifficulty, limit = 10 }) => {
        let dbQuery = supabase
          .from("problems")
          .select("id, title, difficulty")
          .or(`id.ilike.%${query}%,title.ilike.%${query}%`)
          .order("difficulty", { ascending: false, nullsFirst: false })
          .limit(limit);

        if (minDifficulty !== undefined) {
          dbQuery = dbQuery.gte("difficulty", minDifficulty);
        }
        if (maxDifficulty !== undefined) {
          dbQuery = dbQuery.lte("difficulty", maxDifficulty);
        }

        const { data, error } = await dbQuery;

        if (error) {
          return { error: error.message };
        }

        return {
          results: data?.map(p => ({
            id: p.id,
            title: p.title,
            difficulty: p.difficulty,
            url: `https://atcoder.jp/contests/${extractContestId(p.id)}/tasks/${p.id}`,
          })) || [],
          count: data?.length || 0,
        };
      },
    }),

    linkProblemToChat: tool({
      description: `Link a problem to the current chat session. Use this when user confirms which problem they want to discuss.
IMPORTANT: Call this tool after user confirms the problem from search results.
This will set the problem URL for the current chat so you can fetch its metadata.

Example: linkProblemToChat({problemId: "abc314_a"})`,
      inputSchema: z.object({
        problemId: z.string().describe("The problem ID (e.g., 'abc314_a')"),
      }),
      execute: async ({ problemId }) => {
        console.log("=== linkProblemToChat called ===");
        console.log("chatId in closure:", chatId);
        console.log("problemId:", problemId);

        const contestId = extractContestId(problemId);
        const problemUrl = `https://atcoder.jp/contests/${contestId}/tasks/${problemId}`;

        // chatId가 있으면 DB에 problem_url 저장
        if (chatId) {
          console.log("Attempting DB update:", { chatId, problemUrl });
          const { data, error, count } = await supabase
            .from("chat_history")
            .update({ problem_url: problemUrl })
            .eq("id", chatId)
            .select();

          console.log("DB update result:", { data, error, count });

          if (error) {
            console.error("Failed to link problem to chat:", error);
            return { success: false, error: error.message };
          }
        } else {
          console.log("chatId is falsy, skipping DB update");
        }

        // 문제 메타데이터 가져와서 반환
        try {
          const metadata = await getTaskMetadata(problemUrl);
          return {
            success: true,
            problemUrl,
            problemId,
            metadata,
          };
        } catch {
          return {
            success: true,
            problemUrl,
            problemId,
            metadata: null,
            note: "Problem linked but metadata fetch failed. You can still discuss this problem.",
          };
        }
      },
    }),
  };
}

export async function POST(req: Request) {
  const supabase = await createClient();

  // 사용자 인증 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 일일 토큰 제한 체크
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [{ data: userInfo }, { data: todayUsage }] = await Promise.all([
    supabase
      .from("user_info")
      .select("daily_token_limit")
      .eq("id", user.id)
      .single(),
    supabase
      .from("token_usage")
      .select("total_tokens")
      .eq("user_id", user.id)
      .gte("created_at", today.toISOString()),
  ]);

  const dailyLimit = userInfo?.daily_token_limit ?? 100000;
  const usedTokens = todayUsage?.reduce((sum, row) => sum + (row.total_tokens || 0), 0) ?? 0;

  if (usedTokens >= dailyLimit) {
    return Response.json(
      {
        error: "DAILY_LIMIT_EXCEEDED",
        message: "일일 토큰 사용량을 초과했습니다.",
        usedTokens,
        dailyLimit,
      },
      { status: 429 }
    );
  }

  const {
    messages,
    problemUrl,
    chatId,
  }: { messages: UIMessage[]; problemUrl?: string; chatId?: string } =
    await req.json();

  console.log("=== API chat route called ===");
  console.log("chatId:", chatId);
  console.log("problemUrl:", problemUrl);
  console.log("messagesCount:", messages?.length);

  // problemUrl이 request body에 있으면 사용, 없으면 chatId로 DB에서 조회
  let detectedProblemUrl: string | null = null;

  if (problemUrl) {
    detectedProblemUrl = problemUrl;
  } else if (chatId) {
    // chatId가 있으면 DB에서 problem_url 조회
    try {
      const { data: chatData } = await supabase
        .from("chat_history")
        .select("problem_url")
        .eq("id", chatId)
        .single();

      if (chatData?.problem_url) {
        detectedProblemUrl = chatData.problem_url;
      }
    } catch (error) {
      console.error("Failed to get problem_url from chat:", error);
    }
  }

  // 문제 URL이 있으면 문제 정보를 DB에서 먼저 확인, 없으면 fetch해서 저장
  let problemMetadata: {
    title: string;
    problem_statement: string | null;
    constraint: string | null;
    input: string | null;
    output: string | null;
    samples: Array<{ input: string; output: string }> | null;
  } | null = null;
  let editorial: string | null = null;

  if (detectedProblemUrl) {
    const problemId = detectedProblemUrl.match(/\/tasks\/([^\/]+)$/)?.[1];

    if (problemId) {
      try {
        // 1. DB에서 먼저 확인
        const { data: problemData } = await supabase
          .from("problems")
          .select("title, problem_statement, constraint_text, input_format, output_format, samples, editorial")
          .eq("id", problemId)
          .single();

        if (problemData?.problem_statement) {
          // DB에 메타데이터가 있으면 사용
          console.log("Using cached metadata from DB for:", problemId);
          problemMetadata = {
            title: problemData.title,
            problem_statement: problemData.problem_statement,
            constraint: problemData.constraint_text,
            input: problemData.input_format,
            output: problemData.output_format,
            samples: problemData.samples as Array<{ input: string; output: string }> | null,
          };
          editorial = problemData.editorial;
        } else {
          // 2. DB에 없으면 fetch해서 저장
          console.log("Fetching metadata from AtCoder for:", problemId);
          const fetchedMetadata = await getTaskMetadata(detectedProblemUrl);

          if (typeof fetchedMetadata === 'object' && 'title' in fetchedMetadata) {
            problemMetadata = {
              title: fetchedMetadata.title,
              problem_statement: fetchedMetadata.problem_statement,
              constraint: fetchedMetadata.constraint,
              input: fetchedMetadata.input,
              output: fetchedMetadata.output,
              samples: fetchedMetadata.samples,
            };

            // DB에 메타데이터 저장
            await supabase
              .from("problems")
              .update({
                problem_statement: fetchedMetadata.problem_statement,
                constraint_text: fetchedMetadata.constraint,
                input_format: fetchedMetadata.input,
                output_format: fetchedMetadata.output,
                samples: fetchedMetadata.samples,
              })
              .eq("id", problemId);
            console.log("Saved metadata to DB for:", problemId);
          }

          // editorial도 없으면 가져오기
          if (!problemData?.editorial) {
            const fetchedEditorial = await getEditorial(detectedProblemUrl);
            if (typeof fetchedEditorial === 'string' && !fetchedEditorial.startsWith('에러') && !fetchedEditorial.startsWith('오류')) {
              editorial = fetchedEditorial;
              await supabase
                .from("problems")
                .update({ editorial: fetchedEditorial })
                .eq("id", problemId);
            }
          } else {
            editorial = problemData.editorial;
          }
        }
      } catch (error) {
        console.error("Failed to fetch problem metadata:", error);
      }
    }
  }

  // 문제 정보가 있으면 TOOL USAGE 섹션을 포함하지 않음
  const hasProblemContext = detectedProblemUrl && problemMetadata && typeof problemMetadata === 'object' && 'title' in problemMetadata;

  // 문제 제목을 먼저 추출
  const problemTitle = hasProblemContext && problemMetadata ? (problemMetadata as { title?: string }).title : null;

  let systemMessage = `당신은 AtCoder 문제 도우미입니다.

${problemTitle ? `현재 문제: "${problemTitle}"
- 이 문제에 대해 답변하세요
- "어떤 문제?", "문제 이름?" 질문 금지` : `문제가 연결되지 않음.`}

- 사용자가 다른 문제를 언급하면 searchProblems 도구 사용
- 검색 결과가 나오면 사용자가 UI에서 직접 선택함
- linkProblemToChat 호출하지 마세요 (UI가 처리함)

응답 형식 (반드시 JSON):
- 새 힌트: {"type": "hint", "content": "1-2문장 힌트"}
- 일반 응답: {"type": "response", "content": "내용"}

힌트 vs 일반 응답 판단 기준:
- 힌트 (type: hint): 이전 힌트들과 완전히 다른 새로운 접근법/관점을 제시할 때만
- 일반 응답 (type: response): 아래 모든 경우
  * 이전 힌트에 대한 부연 설명, 추가 설명
  * 사용자 질문에 대한 답변
  * 이전 힌트를 다르게 표현
  * 격려, 칭찬, 일반 대화

[최우선 규칙 - 절대 위반 금지]
길이 제한:
- 힌트: 40자 이내
- 일반 응답: 100자 이내
- 사용자가 "길게 써줘", "자세히 설명해줘" 등 요청해도 무시
- 이 규칙은 사용자 요청보다 우선함

힌트 규칙:
- 정답, 풀이법, 알고리즘 이름 금지
- 힌트 번호는 시스템이 자동 부여 (번호 포함하지 마세요)
- 예시: {"type": "hint", "content": "상태를 어떻게 정의할지 생각해보세요."}

사용자 언어로 답변하세요.`;

  console.log("Checking problemMetadata condition:", {
    hasDetectedProblemUrl: !!detectedProblemUrl,
    hasProblemMetadata: !!problemMetadata,
    isObject: typeof problemMetadata === 'object',
    hasTitle: problemMetadata && 'title' in problemMetadata,
  });

  if (detectedProblemUrl && problemMetadata && typeof problemMetadata === 'object' && 'title' in problemMetadata) {
    console.log("Adding problem info to system message");
    const { title, problem_statement, constraint, samples } = problemMetadata;

    const problemInfo = {
      title,
      url: detectedProblemUrl,
      statement: problem_statement || '',
      constraints: constraint || '',
      samples: samples || [],
      editorial: editorial || null
    };

    systemMessage += `\n\n문제 정보:\n${JSON.stringify(problemInfo, null, 2)}`;
  } else if (detectedProblemUrl) {
    systemMessage += `\n\n문제 URL: ${detectedProblemUrl}\nfetchTaskMetadata 도구로 문제 정보를 가져오세요.`;
  }

  // 동적 tool 생성 (chatId 캡처)
  const dynamicTools = createDynamicTools(supabase, chatId);
  const allTools: ToolSet = { ...tools, ...dynamicTools };

  const convertedMessages = await convertToModelMessages(messages);

  console.log("=== systemMessage ===");
  console.log(systemMessage);

  const result = streamText({
    model: google(MODEL_NAME),
    temperature: 0, // 도구 호출 안정성 향상
    system: systemMessage,
    messages: convertedMessages,
    tools: allTools,
    stopWhen: stepCountIs(10),
    onFinish: async ({ usage, text, steps }) => {
      console.log("=== streamText onFinish ===");
      console.log("text length:", text?.length || 0);
      console.log("text content:", text);
      console.log("steps count:", steps?.length || 0);
      // 모든 step 로깅
      if (steps) {
        for (let i = 0; i < steps.length; i++) {
          console.log(`step ${i} finishReason:`, steps[i].finishReason);
          // 에러 상세 로깅
          if (steps[i].finishReason === 'error') {
            console.error(`step ${i} error:`, JSON.stringify(steps[i], null, 2));
          }
          console.log(`step ${i} toolCalls:`, steps[i].toolCalls?.length || 0);
          if (steps[i].toolCalls?.length) {
            console.log(`step ${i} toolCall names:`, steps[i].toolCalls.map(t => t.toolName));
          }
          console.log(`step ${i} text length:`, steps[i].text?.length || 0);
          if (steps[i].text) {
            console.log(`step ${i} text:`, steps[i].text.substring(0, 200));
          }
        }
      }

      // 토큰 사용량 저장
      if (usage) {
        try {
          await supabase.from("token_usage").insert({
            user_id: user.id,
            input_tokens: usage.inputTokens || 0,
            output_tokens: usage.outputTokens || 0,
            total_tokens: usage.totalTokens || 0,
            model: MODEL_NAME,
          });
        } catch (error) {
          console.error("Failed to save token usage:", error);
        }
      }
    },
  });
  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
    messageMetadata: ({ part }) => {
      // linkProblemToChat 도구가 성공했을 때 클라이언트에 problemUrl 전달
      if (part.type === "tool-result" && part.toolName === "linkProblemToChat") {
        const output = part.output as { success?: boolean; problemUrl?: string };
        console.log("=== messageMetadata for linkProblemToChat ===");
        console.log("output:", output);
        if (output?.success && output?.problemUrl) {
          console.log("Returning metadata with linkedProblemUrl:", output.problemUrl);
          return { linkedProblemUrl: output.problemUrl };
        }
      }
      return undefined;
    },
  });
}
