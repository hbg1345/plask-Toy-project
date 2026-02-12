import { createAgent, tool, toolStrategy } from "langchain";
import { toBaseMessages, toUIMessageStream } from "@ai-sdk/langchain";
import { createUIMessageStreamResponse, UIMessage } from "ai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SupabaseSaver } from "@skroyc/langgraph-supabase-checkpointer";
import { z } from "zod";
import {
  getRecentContests,
  getUpcomingcontests,
  getTaskLinkList,
  getTaskMetadata,
  getEditorial,
} from "@/lib/atcoder/contest";
import { createClient } from "@/lib/supabase/server";
import { extractContestId } from "@/lib/atcoder/problems";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-3-flash-preview",
  temperature: 0,
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// 응답 스키마 정의
const responseSchema = z.object({
  type: z.enum(["hint", "response"]).describe("hint: 새로운 힌트, response: 일반 응답"),
  content: z.string().describe("응답 내용 (hint는 40자 이내, response는 100자 이내)"),
});

// Checkpointer는 user.id가 필요해서 POST 함수 안에서 생성

// Static tools
const fetchRecentContests = tool(
  async () => {
    console.log("=== fetchRecentContests called ===");
    return await getRecentContests();
  },
  {
    name: "fetchRecentContests",
    description: "Get list of recent AtCoder contests",
    schema: z.object({}),
  }
);

const fetchUpcomingContests = tool(
  async () => {
    return await getUpcomingcontests();
  },
  {
    name: "fetchUpcomingContests",
    description: "Get list of upcoming AtCoder contests",
    schema: z.object({}),
  }
);

const fetchTaskLinkList = tool(
  async ({ contestUrl }) => {
    return await getTaskLinkList(contestUrl);
  },
  {
    name: "fetchTaskLinkList",
    description: "Get list of task links from an AtCoder contest URL",
    schema: z.object({
      contestUrl: z.string().describe("The URL of the AtCoder contest"),
    }),
  }
);

const fetchTaskMetadata = tool(
  async ({ taskUrl }) => {
    return await getTaskMetadata(taskUrl);
  },
  {
    name: "fetchTaskMetadata",
    description: "Get metadata for a specific AtCoder task",
    schema: z.object({
      taskUrl: z.string().describe("The URL of the AtCoder task"),
    }),
  }
);

// Dynamic tools factory
function createDynamicTools(
  supabase: Awaited<ReturnType<typeof createClient>>,
  chatId: string | undefined
) {
  const searchProblems = tool(
    async ({ query, minDifficulty, maxDifficulty, limit = 10 }) => {
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
        results:
          data?.map((p) => ({
            id: p.id,
            title: p.title,
            difficulty: p.difficulty,
            url: `https://atcoder.jp/contests/${extractContestId(p.id)}/tasks/${p.id}`,
          })) || [],
        count: data?.length || 0,
      };
    },
    {
      name: "searchProblems",
      description: `Search for AtCoder problems in the database by keyword or difficulty.
IMPORTANT: Use this tool when:
- User mentions a problem by name (e.g., "ABC 314 A", "그 Two Sum 문제")
- User describes a problem vaguely without URL`,
      schema: z.object({
        query: z.string().describe("Search keyword"),
        minDifficulty: z.number().optional().describe("Minimum difficulty"),
        maxDifficulty: z.number().optional().describe("Maximum difficulty"),
        limit: z.number().optional().describe("Max results (default: 10)"),
      }),
    }
  );

  const linkProblemToChat = tool(
    async ({ problemId }) => {
      console.log("=== linkProblemToChat called ===");
      console.log("chatId:", chatId, "problemId:", problemId);

      const contestId = extractContestId(problemId);
      const problemUrl = `https://atcoder.jp/contests/${contestId}/tasks/${problemId}`;

      const { data: problemData } = await supabase
        .from("problems")
        .select("title")
        .eq("id", problemId)
        .single();

      const title = problemData?.title || problemId;

      if (chatId) {
        const { error } = await supabase
          .from("chat_history")
          .update({
            problem_url: problemUrl,
            title,
            hints: null,
          })
          .eq("id", chatId);

        if (error) {
          console.error("Failed to link problem:", error);
          return { success: false, error: error.message };
        }
      }

      try {
        const metadata = await getTaskMetadata(problemUrl);
        return { success: true, problemUrl, problemId, title, metadata };
      } catch {
        return {
          success: true,
          problemUrl,
          problemId,
          title,
          metadata: null,
          note: "Problem linked but metadata fetch failed.",
        };
      }
    },
    {
      name: "linkProblemToChat",
      description: "Link a problem to the current chat session",
      schema: z.object({
        problemId: z.string().describe("The problem ID (e.g., 'abc314_a')"),
      }),
    }
  );

  return [searchProblems, linkProblemToChat];
}

export async function POST(req: Request) {
  const supabase = await createClient();

  // 사용자 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  const usedTokens =
    todayUsage?.reduce((sum, row) => sum + (row.total_tokens || 0), 0) ?? 0;

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
  console.log("chatId:", chatId, "problemUrl:", problemUrl);

  // problemUrl 감지
  let detectedProblemUrl: string | null = problemUrl || null;

  if (!detectedProblemUrl && chatId) {
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
      console.error("Failed to get problem_url:", error);
    }
  }

  // 문제 메타데이터 로드
  let problemMetadata: {
    title: string;
    problem_statement: string | null;
    constraint: string | null;
    samples: Array<{ input: string; output: string }> | null;
  } | null = null;
  let editorial: string | null = null;

  if (detectedProblemUrl) {
    const problemId = detectedProblemUrl.match(/\/tasks\/([^\/]+)$/)?.[1];

    if (problemId) {
      try {
        const { data: problemData } = await supabase
          .from("problems")
          .select(
            "title, problem_statement, constraint_text, samples, editorial"
          )
          .eq("id", problemId)
          .single();

        if (problemData?.problem_statement) {
          problemMetadata = {
            title: problemData.title,
            problem_statement: problemData.problem_statement,
            constraint: problemData.constraint_text,
            samples: problemData.samples as Array<{
              input: string;
              output: string;
            }> | null,
          };
          editorial = problemData.editorial;
        } else {
          const fetchedMetadata = await getTaskMetadata(detectedProblemUrl);
          if (
            typeof fetchedMetadata === "object" &&
            "title" in fetchedMetadata
          ) {
            problemMetadata = {
              title: fetchedMetadata.title,
              problem_statement: fetchedMetadata.problem_statement,
              constraint: fetchedMetadata.constraint,
              samples: fetchedMetadata.samples,
            };

            await supabase
              .from("problems")
              .update({
                problem_statement: fetchedMetadata.problem_statement,
                constraint_text: fetchedMetadata.constraint,
                samples: fetchedMetadata.samples,
              })
              .eq("id", problemId);
          }

          if (!problemData?.editorial) {
            const fetchedEditorial = await getEditorial(detectedProblemUrl);
            if (
              typeof fetchedEditorial === "string" &&
              !fetchedEditorial.startsWith("에러")
            ) {
              editorial = fetchedEditorial;
              await supabase
                .from("problems")
                .update({ editorial: fetchedEditorial })
                .eq("id", problemId);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch problem metadata:", error);
      }
    }
  }

  // 시스템 프롬프트 생성
  const problemTitle = problemMetadata?.title || null;
  let systemPrompt = `당신은 AtCoder 문제 도우미입니다.

${problemTitle ? `현재 문제: "${problemTitle}"` : `문제가 연결되지 않음.`}

## 규칙
- 수학 표기: $A_i$, $10^k$ 형식으로 $ 감싸기
- hint: 40자 이내, 새로운 접근법/관점 제시
- response: 100자 이내, 질문 답변/부연 설명/격려
- 힌트에 정답, 풀이법, 알고리즘 이름 금지
- 사용자가 다른 문제 언급하면 searchProblems 도구 사용
- 사용자 언어로 답변`;

  if (problemMetadata) {
    const problemInfo = {
      title: problemMetadata.title,
      url: detectedProblemUrl,
      statement: problemMetadata.problem_statement || "",
      constraints: problemMetadata.constraint || "",
      samples: problemMetadata.samples || [],
      editorial: editorial || null,
    };
    systemPrompt += `\n\n문제 정보:\n${JSON.stringify(problemInfo, null, 2)}`;
  }

  // Supabase checkpointer 생성 (user.id 기반)
  console.log("[AGENT] Creating Supabase checkpointer for user:", user.id);
  const checkpointer = new SupabaseSaver(supabase, undefined, user.id);

  // 동적 도구 생성
  console.log("[AGENT] Creating tools...");
  const dynamicTools = createDynamicTools(supabase, chatId);
  const allTools = [
    fetchRecentContests,
    fetchUpcomingContests,
    fetchTaskLinkList,
    fetchTaskMetadata,
    ...dynamicTools,
  ];
  console.log("[AGENT] Tools:", allTools.map((t) => t.name));

  // Agent 생성 (toolStrategy로 structured output)
  console.log("[AGENT] Creating agent with toolStrategy...");
  const agent = createAgent({
    model,
    tools: allTools,
    systemPrompt,
    responseFormat: toolStrategy(responseSchema),
    checkpointer,
  });

  // 메시지 변환
  console.log("[AGENT] Converting messages:", messages.length);
  const langchainMessages = await toBaseMessages(messages);
  console.log("[AGENT] Converted:", langchainMessages.length);

  // Agent 실행 (invoke 사용)
  // threadId는 UUID여야 함 (SupabaseSaver 요구사항)
  const threadId = chatId || crypto.randomUUID();
  console.log("[AGENT] Starting invoke, threadId:", threadId);

  const result = await agent.invoke(
    { messages: langchainMessages },
    { configurable: { thread_id: threadId } }
  );

  console.log("[AGENT] Result structuredResponse:", result.structuredResponse);

  return Response.json(result.structuredResponse);
}
