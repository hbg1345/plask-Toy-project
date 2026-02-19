"use client";

import { useEffect, useCallback, useRef } from "react";
import { ChatSidebar } from "@/components/chat-sidebar";
import { getChatHistoryList, getChatHistory } from "@/app/actions";
import { useChatLayout, LayoutMode } from "./ChatLayoutContext";
import { ProblemPanel } from "@/components/problem-panel";
import {
  Panel,
  Group,
  Separator,
} from "react-resizable-panels";
import { GripVertical } from "lucide-react";

interface ChatLayoutClientProps {
  children: React.ReactNode;
}

export function ChatLayoutClient({ children }: ChatLayoutClientProps) {
  const {
    selectedChatId,
    setSelectedChatId,
    refreshTrigger,
    problemUrl,
    setProblemUrl,
    layoutMode,
    setLayoutMode,
    sidebarOpen,
    setSidebarOpen,
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

  // 선택된 채팅이 변경되거나 채팅이 업데이트되면 problemUrl 업데이트
  useEffect(() => {
    const loadProblemUrl = async () => {
      if (selectedChatId) {
        const chatData = await getChatHistory(selectedChatId);
        if (chatData?.problemUrl) {
          setProblemUrl(chatData.problemUrl);
        } else {
          setProblemUrl(null);
        }
      } else {
        setProblemUrl(null);
      }
    };
    loadProblemUrl();
  }, [selectedChatId, setProblemUrl, refreshTrigger]);

  const handleChatIdChange = useCallback(
    (chatId: string | null) => {
      setSelectedChatId(chatId);
      // refreshTrigger는 새 채팅 생성/삭제 시에만 ChatComponent에서 호출
    },
    [setSelectedChatId]
  );

  const handleLayoutChange = (mode: LayoutMode) => {
    setLayoutMode(mode);
  };

  // problemUrl이 있을 때만 레이아웃 토글 버튼 표시
  const showLayoutControls = problemUrl !== null;

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={`relative w-full h-full flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'pl-64' : 'pl-12'}`}>
      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 min-h-0">
        {problemUrl && layoutMode !== "chat-only" ? (
          layoutMode === "problem-only" ? (
            <ProblemPanel problemUrl={problemUrl} />
          ) : (
            <Group orientation="horizontal" className="h-full">
              <Panel id="problem-panel" defaultSize="50%" minSize="30%">
                <ProblemPanel problemUrl={problemUrl} />
              </Panel>
              <Separator className="w-2 bg-border hover:bg-primary/20 transition-colors flex items-center justify-center data-[resize-handle-active]:bg-primary/30">
                <GripVertical className="h-4 w-4 text-foreground" />
              </Separator>
              <Panel id="chat-panel" defaultSize="50%" minSize="30%">
                {children}
              </Panel>
            </Group>
          )
        ) : (
          children
        )}
      </div>

      {/* 사이드바 (전체 화면에 걸쳐 띄움) */}
      <div className="fixed left-0 top-14 bottom-0 z-10">
        <ChatSidebar
          isOpen={sidebarOpen}
          onToggle={handleSidebarToggle}
          onSelectChat={handleChatIdChange}
          selectedChatId={selectedChatId}
          refreshTrigger={refreshTrigger}
          layoutMode={layoutMode}
          onLayoutChange={handleLayoutChange}
          showLayoutControls={showLayoutControls}
        />
      </div>
    </div>
  );
}
