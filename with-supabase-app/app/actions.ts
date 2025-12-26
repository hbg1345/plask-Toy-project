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
  title: string
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
      console.log("Updating existing chat", { chatId });
      const { data, error } = await supabase
        .from("chat_history")
        .update({
          messages: messagesJson,
          title: title,
        })
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
      const { data, error } = await supabase
        .from("chat_history")
        .insert({
          user_id: userId,
          messages: messagesJson,
          title: title,
        })
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

export async function getChatHistory(
  chatId: string
): Promise<{ messages: Message[]; title: string } | null> {
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
      .select("messages, title")
      .eq("id", chatId)
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Failed to get chat history:", error);
      return null;
    }

    const messages = JSON.parse(data.messages) as Message[];
    return { messages, title: data.title };
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
    const { error } = await supabase
      .from("chat_history")
      .delete()
      .eq("id", chatId)
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to delete chat history:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Failed to delete chat history:", error);
    return false;
  }
}
