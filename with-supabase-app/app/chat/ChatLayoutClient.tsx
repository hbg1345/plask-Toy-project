"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChatSidebar } from "@/components/chat-sidebar";
import {
  getChatHistoryList,
  saveChatHistory,
  getChatByProblemUrl,
} from "@/app/actions";
import { useSearchParams } from "next/navigation";
import { useChatLayout } from "./ChatLayoutContext";

interface ChatLayoutClientProps {
  children: React.ReactNode;
}

export function ChatLayoutClient({ children }: ChatLayoutClientProps) {
  const { selectedChatId, setSelectedChatId } = useChatLayout();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const searchParams = useSearchParams();
  const initializedRef = useRef(false);

  // 페이지 로드 시 문제 파라미터 확인 및 채팅 생성
  useEffect(() => {
    if (initializedRef.current) return;

    const initializeChat = async () => {
      const problemId = searchParams.get("problemId");
      const problemTitle = searchParams.get("problemTitle");
      const problemUrl = searchParams.get("problemUrl");

      if (problemId && problemTitle && problemUrl) {
        initializedRef.current = true;
        // 먼저 해당 문제에 대한 기존 채팅이 있는지 확인
        const existingChatId = await getChatByProblemUrl(problemUrl);
        if (existingChatId) {
          // 기존 채팅이 있으면 그 채팅으로 이동
          setSelectedChatId(existingChatId);
          setRefreshTrigger((prev) => prev + 1);
          window.history.replaceState({}, "", "/chat");
        } else {
          // 기존 채팅이 없으면 새로 생성
          const title = `${problemId}: ${problemTitle}`;
          const newChatId = await saveChatHistory(null, [], title, problemUrl);
          if (newChatId) {
            setSelectedChatId(newChatId);
            setRefreshTrigger((prev) => prev + 1);
            window.history.replaceState({}, "", "/chat");
          }
        }
      } else {
        initializedRef.current = true;
        const chatList = await getChatHistoryList();
        if (chatList.length > 0) {
          setSelectedChatId(chatList[0].id);
        }
      }
    };
    initializeChat();
  }, [searchParams, setSelectedChatId]);

  const handleChatIdChange = useCallback(
    (chatId: string | null) => {
      if (chatId !== selectedChatId) {
        setSelectedChatId(chatId);
        setRefreshTrigger((prev) => prev + 1);
      }
    },
    [selectedChatId, setSelectedChatId]
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
