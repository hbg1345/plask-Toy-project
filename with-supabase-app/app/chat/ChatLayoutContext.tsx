"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ChatLayoutContextType {
  selectedChatId: string | null;
  setSelectedChatId: (chatId: string | null) => void;
}

const ChatLayoutContext = createContext<ChatLayoutContextType | undefined>(undefined);

export function ChatLayoutProvider({ children }: { children: ReactNode }) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  return (
    <ChatLayoutContext.Provider value={{ selectedChatId, setSelectedChatId }}>
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

