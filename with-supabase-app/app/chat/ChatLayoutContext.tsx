"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ChatLayoutContextType {
  selectedChatId: string | null;
  setSelectedChatId: (chatId: string | null) => void;
  refreshTrigger: number;
  setRefreshTrigger: (trigger: number | ((prev: number) => number)) => void;
}

const ChatLayoutContext = createContext<ChatLayoutContextType | undefined>(
  undefined
);

export function ChatLayoutProvider({ children }: { children: ReactNode }) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <ChatLayoutContext.Provider
      value={{
        selectedChatId,
        setSelectedChatId,
        refreshTrigger,
        setRefreshTrigger,
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
