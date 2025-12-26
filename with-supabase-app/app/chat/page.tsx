"use client";
import { Suspense, useState, useEffect, useCallback } from "react";
import ChatComponent from "./ChatComponent";
import { ChatSidebar } from "@/components/chat-sidebar";
import { getChatHistoryList } from "@/app/actions";

export default function Page() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 페이지 로드 시 가장 최근 채팅 로드
  useEffect(() => {
    const loadLatestChat = async () => {
      const chatList = await getChatHistoryList();
      if (chatList.length > 0) {
        setSelectedChatId(chatList[0].id);
      }
      setIsLoading(false);
    };
    loadLatestChat();
  }, []);

  // 채팅 ID 변경 핸들러 (저장 완료 후에만 호출)
  const handleChatIdChange = useCallback(
    (chatId: string | null) => {
      if (chatId && chatId !== selectedChatId) {
        setSelectedChatId(chatId);
        // 채팅이 저장되면 사이드바 새로고침
        setRefreshTrigger((prev) => prev + 1);
      }
    },
    [selectedChatId]
  );

  return (
    <div className="flex h-full overflow-hidden">
      {/* 사이드바 (항상 펼쳐진 상태) */}
      <ChatSidebar
        isOpen={true}
        onToggle={() => {}}
        onSelectChat={setSelectedChatId}
        selectedChatId={selectedChatId}
        refreshTrigger={refreshTrigger}
      />
      {/* 채팅창 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center">
              로딩 중...
            </div>
          }
        >
          {!isLoading && (
            <ChatComponent
              chatId={selectedChatId}
              onChatIdChange={handleChatIdChange}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
}
