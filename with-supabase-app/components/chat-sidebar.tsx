"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Plus, MessageSquare, Trash2 } from "lucide-react";
import { getChatHistoryList, deleteChatHistory, saveChatHistory, type ChatHistoryItem } from "@/app/actions";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    onSelectChat: (chatId: string | null) => void;
    selectedChatId: string | null;
    refreshTrigger?: number;
}

export function ChatSidebar({ isOpen, onToggle, onSelectChat, selectedChatId, refreshTrigger }: ChatSidebarProps) {
    const [chatList, setChatList] = useState<ChatHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadChatList = async () => {
            setIsLoading(true);
            const list = await getChatHistoryList();
            // 최근 업데이트 순으로 정렬 (updated_at 기준 내림차순)
            const sortedList = [...list].sort((a, b) => {
                const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
                const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
                return dateB - dateA; // 내림차순 (최신이 위로)
            });
            setChatList(sortedList);
            setIsLoading(false);
        };
        loadChatList();
    }, [refreshTrigger]);

    const handleNewChat = async () => {
        // 새 채팅 생성
        const savedChatId = await saveChatHistory(null, [], "New Chat", null, true);
        if (savedChatId) {
            onSelectChat(savedChatId);
            // 목록 새로고침
            const list = await getChatHistoryList();
            const sortedList = [...list].sort((a, b) => {
                const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
                const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
                return dateB - dateA;
            });
            setChatList(sortedList);
        }
    };

    const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation(); // 버튼 클릭 시 채팅 선택 방지
        if (confirm("이 채팅을 삭제하시겠습니까?")) {
            const success = await deleteChatHistory(chatId);
            if (success) {
                // 삭제된 채팅이 현재 선택된 채팅이면 새 채팅으로 변경
                if (selectedChatId === chatId) {
                    onSelectChat(null);
                }
                // 목록 새로고침
                const list = await getChatHistoryList();
                // 최근 업데이트 순으로 정렬 (updated_at 기준 내림차순)
                const sortedList = [...list].sort((a, b) => {
                    const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
                    const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
                    return dateB - dateA; // 내림차순 (최신이 위로)
                });
                setChatList(sortedList);
            } else {
                alert("채팅 삭제에 실패했습니다. 콘솔을 확인해주세요.");
            }
        }
    };

    return (
        <div
            className={cn(
                "flex flex-col h-full border-r bg-background transition-all duration-300 shadow-lg",
                isOpen ? "w-64" : "w-12"
            )}
        >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-2 border-b">
                {isOpen && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleNewChat}
                        className="flex-1 justify-start gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        새 채팅
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    className="shrink-0"
                >
                    <Menu className="h-4 w-4" />
                </Button>
            </div>

            {/* 채팅 목록 */}
            {isOpen && (
                <div className="flex-1 overflow-y-auto p-2">
                    {isLoading ? (
                        <div className="text-sm text-muted-foreground text-center py-4">
                            로딩 중...
                        </div>
                    ) : chatList.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-4">
                            채팅 내역이 없습니다
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {chatList.map((chat) => (
                                <div
                                    key={chat.id}
                                    className="group flex items-center gap-1 hover:bg-muted rounded-md"
                                >
                                    <Button
                                        variant={selectedChatId === chat.id ? "secondary" : "ghost"}
                                        size="sm"
                                        onClick={() => onSelectChat(chat.id)}
                                        className="flex-1 justify-start gap-2 text-left h-auto py-2"
                                    >
                                        <MessageSquare className="h-4 w-4 shrink-0" />
                                        <span className="truncate flex-1">
                                          {chat.title.length > 12
                                            ? `${chat.title.substring(0, 12)}...`
                                            : chat.title}
                                        </span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => handleDeleteChat(e, chat.id)}
                                        className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive dark:text-red-400" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

