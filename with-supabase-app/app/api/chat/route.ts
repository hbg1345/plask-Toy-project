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
        const contestId = extractContestId(problemId);
        const problemUrl = `https://atcoder.jp/contests/${contestId}/tasks/${problemId}`;

        // chatId가 있으면 DB에 problem_url 저장
        if (chatId) {
          const { error } = await supabase
            .from("chat_history")
            .update({ problem_url: problemUrl })
            .eq("id", chatId);

          if (error) {
            console.error("Failed to link problem to chat:", error);
            return { success: false, error: error.message };
          }
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

  const {
    messages,
    problemUrl,
    chatId,
  }: { messages: UIMessage[]; problemUrl?: string; chatId?: string } =
    await req.json();

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

  // 문제 URL이 있으면 문제 정보를 미리 가져와서 시스템 메시지에 포함
  let problemMetadata: Awaited<ReturnType<typeof getTaskMetadata>> | null = null;
  let editorial: string | null = null;

  if (detectedProblemUrl) {
    try {
      problemMetadata = await getTaskMetadata(detectedProblemUrl);

      // editorial 체크 및 lazy loading
      const problemId = detectedProblemUrl.match(/\/tasks\/([^\/]+)$/)?.[1];
      if (problemId) {
        const { data: problemData } = await supabase
          .from("problems")
          .select("editorial")
          .eq("id", problemId)
          .single();

        if (problemData?.editorial) {
          // DB에 있으면 사용
          editorial = problemData.editorial;
        } else {
          // 없으면 가져와서 저장
          const fetchedEditorial = await getEditorial(detectedProblemUrl);
          if (typeof fetchedEditorial === 'string' && !fetchedEditorial.startsWith('에러') && !fetchedEditorial.startsWith('오류')) {
            editorial = fetchedEditorial;
            // DB에 저장
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

  let systemMessage = `You are a HINT assistant for AtCoder problems. Answer ONLY what the user asks. Be CONCISE and BRIEF.

CRITICAL: Keep responses SHORT. Answer only the user's question directly. Do not add unnecessary explanations, introductions, or lengthy context unless specifically asked.

TOOL USAGE - VERY IMPORTANT:
When user mentions a problem WITHOUT a URL, you MUST use tools to find it:
1. Use searchProblems to search the database first
2. Show results and ask user to confirm which problem
3. Once confirmed, use linkProblemToChat to link it
4. Then use fetchTaskMetadata to get full problem details

Examples when to use searchProblems:
- "ABC 314 A번 문제" → searchProblems({query: "abc314_a"})
- "이 문제 어려워" (no URL context) → Ask what problem, then search
- "저번에 푼 Two Sum 같은 문제" → searchProblems({query: "sum"})
- "난이도 1000쯤 되는 문제" → searchProblems({query: "", minDifficulty: 900, maxDifficulty: 1100})

NEVER say "URL이 없어서 못 찾겠어요" - ALWAYS use searchProblems tool first!

IMPORTANT - Be CONSERVATIVE and MINIMAL:
- Give the MINIMUM information needed to answer the question
- Users may want to think for themselves, so don't over-explain
- After giving a brief answer, ask if they want to know more (e.g., "Want more details?" or "Need more hints?")
- Let users guide the conversation - don't dump all information at once
- Stop after answering and wait for user's next question

CRITICAL RULES FOR PROBLEM QUESTIONS:
- If user asks "what is this problem?" or "이 문제요" (just showing the problem), ONLY summarize what the problem is asking. Do NOT provide:
  * Equation solving steps
  * Mathematical derivations
  * Solution approaches
  * How to solve it
  * Any hints about the solution method
- Only provide hints when user EXPLICITLY asks for hints or help solving
- When user just asks about the problem, give ONLY a brief problem summary

Rules:
- Provide hints, NOT solutions or complete code
- Answer in User's language
- Use LaTeX for math: $...$ for inline, $$...$$ for block
- Be brief, direct, and to the point
- No long explanations unless the user explicitly asks for them`;

  if (detectedProblemUrl && problemMetadata && typeof problemMetadata === 'object' && 'title' in problemMetadata) {
    // 문제 정보가 성공적으로 가져와진 경우, 시스템 메시지에 포함
    const { title, problem_statement, constraint, input, output, samples } = problemMetadata;
    systemMessage += `\n\nThe user is asking about a specific AtCoder problem. Here is the problem information:

Problem Title: ${title}
Problem URL: ${detectedProblemUrl}

Problem Statement:
${problem_statement || 'Not available'}

Constraints:
${constraint || 'Not available'}

Input Format:
${input || 'Not available'}

Output Format:
${output || 'Not available'}

Sample Cases:
${samples && samples.length > 0 ? samples.map((sample, idx) =>
  `Sample ${idx + 1}:\nInput:\n${sample.input}\nOutput:\n${sample.output}`
).join('\n\n') : 'Not available'}

${editorial ? `
Editorial (USE THIS FOR HINTS - DO NOT SHOW DIRECTLY):
${editorial}

HINT FORMAT - VERY IMPORTANT:
When user asks for hints (e.g., "힌트 줘", "어떻게 풀어?", "도와줘"), respond with structured hints in this EXACT JSON format:

\`\`\`hints
{"hints":[{"step":1,"content":"첫 번째 논리적 단계"},{"step":2,"content":"두 번째 논리적 단계"},{"step":3,"content":"세 번째 논리적 단계"}]}
\`\`\`

Rules for hints:
- Each step should be a MINIMAL, independent logical insight
- Steps should NOT overlap - each reveals new information
- Order by logical problem-solving flow (observation → approach → implementation)
- 3-5 steps is ideal
- Use user's language (Korean if they speak Korean)
- DO NOT reveal the full solution - each hint should be a small nudge
- After the JSON block, you can add a brief message like "힌트를 클릭해서 확인하세요!"
` : 'Editorial: Not available'}

You already have the problem information, so you don't need to ask the user for the URL.

REMEMBER: Answer BRIEFLY and CONCISELY. Provide hints only, not solutions. Answer only what the user asks. Be MINIMAL - give the least information needed, then ask if they want more details.`;
  } else if (detectedProblemUrl) {
    // 문제 정보를 가져오지 못한 경우, 도구 사용을 안내
    systemMessage += `\n\nThe user is asking about a specific problem at "${detectedProblemUrl}". Use the fetchTaskMetadata tool with the taskUrl "${detectedProblemUrl}" to get the problem metadata first, then provide brief HINTS (not solutions).`;
  }

  // 동적 tool 생성 (chatId 캡처)
  const dynamicTools = createDynamicTools(supabase, chatId);
  const allTools: ToolSet = { ...tools, ...dynamicTools };

  const result = streamText({
    model: google(MODEL_NAME),
    system: systemMessage,
    messages: await convertToModelMessages(messages),
    tools: allTools,
    stopWhen: stepCountIs(10),
    onFinish: async ({ usage }) => {
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
  });
}
