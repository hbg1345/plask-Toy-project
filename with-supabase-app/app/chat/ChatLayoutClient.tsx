"use client";

import { useEffect, useCallback } from "react";
import { ChatSidebar } from "@/components/chat-sidebar";
import { getChatHistoryList } from "@/app/actions";
import { useChatLayout } from "./ChatLayoutContext";

interface ChatLayoutClientProps {
  children: React.ReactNode;
}

export function ChatLayoutClient({ children }: ChatLayoutClientProps) {
  const {
    selectedChatId,
    setSelectedChatId,
    refreshTrigger,
    setRefreshTrigger,
  } = useChatLayout();

  // 페이지 로드 시 항상 첫 번째 채팅 선택
  useEffect(() => {
    const initializeChat = async () => {
      // 항상 첫 번째 채팅 선택 (최신순으로 정렬되어 있음)
      const chatList = await getChatHistoryList();
      if (chatList.length > 0) {
        setSelectedChatId(chatList[0].id);
        setRefreshTrigger((prev) => prev + 1);
      }
    };
    initializeChat();
  }, [setSelectedChatId, setRefreshTrigger]);

  const handleChatIdChange = useCallback(
    (chatId: string | null) => {
      if (chatId !== selectedChatId) {
        setSelectedChatId(chatId);
        setRefreshTrigger((prev) => prev + 1);
      }
    },
    [selectedChatId, setSelectedChatId, setRefreshTrigger]
  );

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {children}
      {/* 사이드바 (전체 화면에 걸쳐 띄움) */}
      <div className="fixed left-0 top-16 bottom-0 z-10">
        <ChatSidebar
          isOpen={true}
          onToggle={() => {}}
          onSelectChat={handleChatIdChange}
          selectedChatId={selectedChatId}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </div>
  );
}
