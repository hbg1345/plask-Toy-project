"use client";

import { useEffect, useCallback, useRef } from "react";
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
  } = useChatLayout();
  const isInitializedRef = useRef(false);

  // 페이지 로드 시에만 첫 번째 채팅 선택 (한 번만 실행)
  useEffect(() => {
    if (isInitializedRef.current) {
      return;
    }
    const initializeChat = async () => {
      // selectedChatId가 이미 설정되어 있으면 초기화하지 않음
      if (selectedChatId !== null) {
        isInitializedRef.current = true;
        return;
      }
      // 첫 번째 채팅 선택 (최신순으로 정렬되어 있음)
      const chatList = await getChatHistoryList();
      if (chatList.length > 0) {
        setSelectedChatId(chatList[0].id);
      }
      isInitializedRef.current = true;
    };
    initializeChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 마운트 시에만 실행

  const handleChatIdChange = useCallback(
    (chatId: string | null) => {
      setSelectedChatId(chatId);
      // refreshTrigger는 새 채팅 생성/삭제 시에만 ChatComponent에서 호출
    },
    [setSelectedChatId]
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
