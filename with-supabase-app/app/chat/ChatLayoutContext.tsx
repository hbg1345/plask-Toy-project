"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type LayoutMode = "both" | "problem-only" | "chat-only";

interface ChatLayoutContextType {
  selectedChatId: string | null;
  setSelectedChatId: (chatId: string | null) => void;
  refreshTrigger: number;
  setRefreshTrigger: (trigger: number | ((prev: number) => number)) => void;
  problemUrl: string | null;
  setProblemUrl: (url: string | null) => void;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
}

const ChatLayoutContext = createContext<ChatLayoutContextType | undefined>(
  undefined
);

export function ChatLayoutProvider({ children }: { children: ReactNode }) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [problemUrl, setProblemUrl] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("both");

  return (
    <ChatLayoutContext.Provider
      value={{
        selectedChatId,
        setSelectedChatId,
        refreshTrigger,
        setRefreshTrigger,
        problemUrl,
        setProblemUrl,
        layoutMode,
        setLayoutMode,
      }}
    >
      {children}
    </ChatLayoutContext.Provider>
  );
}

export function useChatLayout() {
  const context = useContext(ChatLayoutContext);
  if (context === undefined) {
    throw new Error("useChatLayout must be used within ChatLayoutProvider");
  }
  return context;
}
