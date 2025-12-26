"use client";

import { Suspense, useCallback } from "react";
import ChatComponent from "./ChatComponent";
import { useChatLayout } from "./ChatLayoutContext";

export default function Page() {
  const { selectedChatId, setSelectedChatId } = useChatLayout();

  // 채팅 ID 변경 핸들러 (저장 완료 후에만 호출)
  const handleChatIdChange = useCallback(
    (chatId: string | null) => {
      if (chatId !== selectedChatId) {
        setSelectedChatId(chatId);
      }
    },
    [selectedChatId, setSelectedChatId]
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden flex-1 min-h-0">
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            로딩 중...
          </div>
        }
      >
        <ChatComponent
          chatId={selectedChatId}
          onChatIdChange={handleChatIdChange}
        />
      </Suspense>
    </div>
  );
}
