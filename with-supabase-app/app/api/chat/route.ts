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
  fetchEditorial: tool({
    description: `Get the editorial for a specific AtCoder task
    example: fetchEditorial({taskUrl: "https://atcoder.jp/contests/abc314/tasks/abc314_a"})`,
    inputSchema: z.object({
      taskUrl: z.string().describe("The URL of the AtCoder task"),
    }),
    execute: async ({ taskUrl }) => {
      return await getEditorial(taskUrl);
    },
  }),
  // google_search: google.tools.googleSearch({}),
};

export async function POST(req: Request) {
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
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
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
  if (detectedProblemUrl) {
    try {
      problemMetadata = await getTaskMetadata(detectedProblemUrl);
    } catch (error) {
      console.error("Failed to fetch problem metadata:", error);
    }
  }

  let systemMessage = `You are a HINT assistant for AtCoder problems. Answer ONLY what the user asks. Be CONCISE and BRIEF.

CRITICAL: Keep responses SHORT. Answer only the user's question directly. Do not add unnecessary explanations, introductions, or lengthy context unless specifically asked.

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

You already have the problem information, so you don't need to ask the user for the URL. 

REMEMBER: Answer BRIEFLY and CONCISELY. Provide hints only, not solutions. Answer only what the user asks. Be MINIMAL - give the least information needed, then ask if they want more details.`;
  } else if (detectedProblemUrl) {
    // 문제 정보를 가져오지 못한 경우, 도구 사용을 안내
    systemMessage += `\n\nThe user is asking about a specific problem at "${detectedProblemUrl}". Use the fetchTaskMetadata tool with the taskUrl "${detectedProblemUrl}" to get the problem metadata first, then provide brief HINTS (not solutions).`;
  }

  const result = streamText({
    model: google("gemini-2.5-flash-lite"),
    system: systemMessage,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(10),
  });
  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });
}
