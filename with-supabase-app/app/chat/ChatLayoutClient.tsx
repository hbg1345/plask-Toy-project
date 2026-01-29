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
import { GripVertical, PanelLeft, PanelRight, Columns2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  // 선택된 채팅이 변경되면 problemUrl 업데이트
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
  }, [selectedChatId, setProblemUrl]);

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
      {/* 레이아웃 컨트롤 버튼 */}
      {showLayoutControls && (
        <div className="flex-shrink-0 px-4 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-end gap-1">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={layoutMode === "problem-only" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handleLayoutChange("problem-only")}
                  className="h-8 px-2"
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>문제만 보기</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={layoutMode === "both" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handleLayoutChange("both")}
                  className="h-8 px-2"
                >
                  <Columns2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>둘 다 보기</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={layoutMode === "chat-only" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handleLayoutChange("chat-only")}
                  className="h-8 px-2"
                >
                  <PanelRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>채팅만 보기</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

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
                <GripVertical className="h-4 w-4 text-muted-foreground" />
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
      <div className="fixed left-0 top-16 bottom-0 z-10">
        <ChatSidebar
          isOpen={sidebarOpen}
          onToggle={handleSidebarToggle}
          onSelectChat={handleChatIdChange}
          selectedChatId={selectedChatId}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </div>
  );
}
