import { convertToModelMessages, streamText, UIMessage, tool, stepCountIs } from "ai";

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

const tools = {
  getRecentContests: tool({
    description: `Get list of recent AtCoder contests
    example: getRecentContests({})`,
    parameters: z.object({}),
    execute: getRecentContests,
  }),
  getUpcomingcontests: tool({
    description: `Get list of upcoming AtCoder contests
    example: getUpcomningcontests({})`,
    parameters: z.object({}),
    execute: getUpcomingcontests,
  }),

  getTaskLinkList: tool({
    description: `Get list of task links from an AtCoder contest URL.
    example: getTaskLinkList({contestUrl: "https://atcoder.jp/contests/abc314"})`,
    parameters: z.object({
      contestUrl: z.string().describe("The URL of the AtCoder contest"),
    }),
    execute: async ({ contestUrl }) => {
      return await getTaskLinkList(contestUrl);
    },
  }),
  getTaskMetadata: tool({
    description: `Get metadata for a specific AtCoder task
    example: getTaskMetadata({taskUrl: "https://atcoder.jp/contests/abc314/tasks/abc314_a"})`,
    parameters: z.object({
      taskUrl: z.string().describe("The URL of the AtCoder task"),
    }),
    execute: async ({ taskUrl }) => {
      return await getTaskMetadata(taskUrl);
    },
  }),
  getEditorial: tool({
    description: `Get the editorial for a specific AtCoder task
    example: getEditorial({taskUrl: "https://atcoder.jp/contests/abc314/tasks/abc314_a"})`,
    parameters: z.object({
      taskUrl: z.string().describe("The URL of the AtCoder task"),
    }),
    execute: async ({ taskUrl }) => {
      return await getEditorial(taskUrl);
    },
  }),
  // google_search: google.tools.googleSearch({}),
};

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: google("gemini-2.5-pro"),
    system: `You are a helpful assistant with access to AtCoder contest data.
You must provide the answer only if user explicitly asks for it. DO NOT SUGGEST SEEING EDITORIALS. 
Otherwise, you should try to give hints BASED ONLY ON the editorials, not on your own knowledge. You can use tools multiple times to get the data
what the user wants. For example, user asks what the problem is -> get task list -> get task metadata.`,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(10),
  });
  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });
}
