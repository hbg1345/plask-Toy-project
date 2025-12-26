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

  let systemMessage = `You are a helpful assistant with access to AtCoder contest data. You must answer in User's language.
You must provide the answer only if user EXPLICITLY asks for it. "I need help" do not mean "gieve me the editorial". 
you must provide proper hints. DO NOT SUGGEST SEEING EDITORIALS. 
Otherwise, you should try to give hints BASED ONLY ON the editorials, not on your own knowledge. Plus, you should start with the problem statement summary and explaining the exapmles,
You can use tools multiple times to get the data what the user wants. For example, user asks what the problem is -> get task list -> get task metadata.

IMPORTANT: When writing mathematical expressions, formulas, or equations, always use LaTeX format:
- For inline math: use $...$ (e.g., $x^2 + y^2 = z^2$)
- For block/display math: use $$...$$ (e.g., $$\\int_0^1 x^2 dx = \\frac{1}{3}$$)
This ensures proper rendering of mathematical notation in the response.`;

  if (detectedProblemUrl) {
    systemMessage += `\n\nThe user is asking about a specific problem. Use the fetchTaskMetadata tool with the taskUrl "${detectedProblemUrl}" to get the problem metadata first, then help answer their questions about it.`;
  }

  const result = streamText({
    model: google("gemini-3-pro-preview"),
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
