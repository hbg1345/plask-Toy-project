"use client";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { CopyIcon, RefreshCcwIcon } from "lucide-react";
import {
  saveChatHistory,
  getChatHistory,
  type Message as ChatMessage,
  type Hint,
} from "@/app/actions";
import { useChatLayout } from "./ChatLayoutContext";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Loader } from "@/components/ai-elements/loader";
import { HintsCard, parseHintsFromMessage } from "@/components/hints-card";
import {
  ProblemSelectCard,
  parseSearchResultsFromPart,
} from "@/components/problem-select-card";

interface ChatBotDemoProps {
  chatId?: string | null;
  onChatIdChange?: (chatId: string | null) => void;
  initialProblemId?: string | null;
}

const ChatBotDemo = ({ chatId, onChatIdChange, initialProblemId }: ChatBotDemoProps) => {
  const [input, setInput] = useState("");
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [problemUrl, setProblemUrl] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState<string | null>(null);
  const [hints, setHints] = useState<Hint[] | null>(null);
  const { messages, setMessages, sendMessage, status, regenerate } = useChat();
  const { setRefreshTrigger, setProblemUrl: setContextProblemUrl } = useChatLayout();
  const prevChatIdRef = useRef<string | null>(null);
  const lastSavedMessageCountRef = useRef<number>(0);
  const isSavingRef = useRef<boolean>(false);
  const [initialMessage, setInitialMessage] = useState<string | null>(null);
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);

  // 문제 선택 핸들러
  const handleProblemSelect = async (problemId: string) => {
    if (!chatId) {
      console.error("Cannot link problem: chatId is not set");
      return;
    }

    try {
      const response = await fetch("/api/link-problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, problemId }),
      });

      if (!response.ok) {
        throw new Error("Failed to link problem");
      }

      const data = await response.json();

      // 상태 업데이트
      setSelectedProblemId(problemId);
      setProblemUrl(data.problemUrl);
      setChatTitle(data.title);
      setContextProblemUrl(data.problemUrl);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to select problem:", error);
    }
  };

  // initialProblemId가 있으면 문제 정보 가져와서 컨텍스트 설정
  useEffect(() => {
    if (!initialProblemId) return;

    const fetchProblemInfo = async () => {
      try {
        // 문제 정보 가져오기
        const response = await fetch(`/api/problem?problemId=${initialProblemId}`);
        if (response.ok) {
          const data = await response.json();
          const contestId = initialProblemId.split("_")[0];
          const url = `https://atcoder.jp/contests/${contestId}/tasks/${initialProblemId}`;

          setProblemUrl(url);
          setChatTitle(data.title || initialProblemId);

          // 초기 메시지 설정
          setInitialMessage(
            `${data.title || initialProblemId} 문제에 대해 질문이 있습니다.\n\n이 문제를 어떻게 접근해야 할지 알려주세요.`
          );
          setInput(
            `${data.title || initialProblemId} 문제에 대해 질문이 있습니다.\n\n이 문제를 어떻게 접근해야 할지 알려주세요.`
          );
        } else {
          // API 실패해도 기본 컨텍스트 설정
          const contestId = initialProblemId.split("_")[0];
          const url = `https://atcoder.jp/contests/${contestId}/tasks/${initialProblemId}`;

          setProblemUrl(url);
          setChatTitle(initialProblemId);
          setInitialMessage(`${initialProblemId} 문제에 대해 질문이 있습니다.\n\n이 문제를 어떻게 접근해야 할지 알려주세요.`);
          setInput(`${initialProblemId} 문제에 대해 질문이 있습니다.\n\n이 문제를 어떻게 접근해야 할지 알려주세요.`);
        }
      } catch (error) {
        console.error("Failed to fetch problem info:", error);
        // 실패해도 기본 컨텍스트 설정
        const contestId = initialProblemId.split("_")[0];
        const url = `https://atcoder.jp/contests/${contestId}/tasks/${initialProblemId}`;

        setProblemUrl(url);
        setChatTitle(initialProblemId);
        setInitialMessage(`${initialProblemId} 문제에 대해 질문이 있습니다.\n\n이 문제를 어떻게 접근해야 할지 알려주세요.`);
        setInput(`${initialProblemId} 문제에 대해 질문이 있습니다.\n\n이 문제를 어떻게 접근해야 할지 알려주세요.`);
      }
    };

    fetchProblemInfo();
  }, [initialProblemId]);

  // chatId가 변경되면 해당 채팅 로드
  useEffect(() => {
    const prevChatId = prevChatIdRef.current;
    
    // chatId가 변경되지 않았으면 무시
    if (chatId === prevChatId) {
      return;
    }
    
    if (chatId) {
      setIsLoadingChat(true);
      getChatHistory(chatId).then((chatData) => {
        if (chatData) {
          // Message 타입을 useChat이 사용하는 형식으로 변환
          const convertedMessages = chatData.messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            parts: [{ type: "text" as const, text: msg.content }],
          }));
          setMessages(convertedMessages);
          lastSavedMessageCountRef.current = convertedMessages.length;
          // problemUrl, title, hints 저장
          setProblemUrl(chatData.problemUrl || null);
          setChatTitle(chatData.title || null);
          setHints(chatData.hints || null);
          setSelectedProblemId(null); // 새 채팅 로드 시 선택 초기화
        } else {
          console.error("Failed to load chat data");
        }
        setIsLoadingChat(false);
      });
    } else if (!chatId) {
      // chatId가 null/undefined인 경우 - 상태 초기화만 (새 채팅은 사이드바에서 생성)
      setMessages([]);
      lastSavedMessageCountRef.current = 0;
      isSavingRef.current = false;
      setProblemUrl(null);
      setChatTitle(null);
      setHints(null);
      setSelectedProblemId(null);
    }
    
    prevChatIdRef.current = chatId || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, setMessages]);

  // chatId 변경 시 부모에게 알림은 저장 완료 후에만 수행 (saveHistory 함수 내에서)

  // 메시지에서 linkProblemToChat tool output 감지 (실시간)
  useEffect(() => {
    if (messages.length === 0) return;

    for (const message of messages) {
      if (message.role !== "assistant") continue;

      for (const part of message.parts) {
        // tool-linkProblemToChat part에서 output.problemUrl 확인
        if (part.type === "tool-linkProblemToChat") {
          const toolPart = part as {
            type: string;
            output?: { success?: boolean; problemUrl?: string };
          };
          if (toolPart.output?.success && toolPart.output?.problemUrl) {
            const detectedUrl = toolPart.output.problemUrl;
            if (detectedUrl !== problemUrl) {
              console.log("Detected problemUrl from tool output:", detectedUrl);
              setProblemUrl(detectedUrl);
              setContextProblemUrl(detectedUrl);
              setRefreshTrigger((prev) => prev + 1);
            }
            return;
          }
        }
      }
    }
  }, [messages, problemUrl, setRefreshTrigger, setContextProblemUrl]);

  // 메시지가 추가되고 status가 ready일 때 저장
  useEffect(() => {
    // 저장 중이면 무시
    if (isSavingRef.current) {
      return;
    }

    // 조건: status가 ready이고, 메시지가 있고, 새 메시지가 추가된 경우
    const hasNewMessages = messages.length > lastSavedMessageCountRef.current;
    const lastMessage = messages[messages.length - 1];
    const shouldSave =
      status === "ready" &&
      messages.length > 0 &&
      hasNewMessages &&
      lastMessage?.role === "assistant";

    // 디버그: 저장 조건 확인
    console.log("=== Save check ===", {
      status,
      messagesLength: messages.length,
      lastSavedCount: lastSavedMessageCountRef.current,
      hasNewMessages,
      lastMessageRole: lastMessage?.role,
      shouldSave,
    });

    if (shouldSave) {
      // 저장 시작 전에 플래그 설정 및 카운트 업데이트
      isSavingRef.current = true;
      lastSavedMessageCountRef.current = messages.length;

      const saveHistory = async () => {
        try {
          // 문제 링크로 생성된 채팅인 경우 제목을 업데이트하지 않음
          let title: string | undefined = undefined;
          let shouldUpdateTitle = true;

          if (chatId && problemUrl) {
            // problemUrl이 있으면 절대 제목을 업데이트하지 않음
            shouldUpdateTitle = false;
            // 기존 제목을 가져옴 (없어도 업데이트 안 함)
            const existingChat = await getChatHistory(chatId);
            if (existingChat?.title) {
              title = existingChat.title;
            } else {
              // 제목이 없어도 problemUrl이 있으면 업데이트하지 않음
              title = chatTitle || "New Chat";
            }
          } else {
            // problemUrl이 없으면 첫 번째 사용자 메시지로 제목 생성
            const firstUserMessage = messages.find((m) => m.role === "user");
            title = "New Chat";
            if (firstUserMessage) {
              const textPart = firstUserMessage.parts?.find(
                (part) => part.type === "text"
              );
              if (textPart && "text" in textPart) {
                title = textPart.text.substring(0, 50);
              }
            }
          }

          const messagesToSave: ChatMessage[] = messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content:
              msg.parts
                ?.map((part) => {
                  if (part.type === "text" && "text" in part) return part.text;
                  return "";
                })
                .join("") || "",
          }));

          // 모든 assistant 메시지에서 hints 추출하여 누적
          let allHints: Hint[] = [];
          let detectedProblemUrl: string | null = null;
          for (const msg of messagesToSave) {
            if (msg.role === "assistant") {
              const parsed = parseHintsFromMessage(msg.content);
              if (parsed.hints) {
                for (const hint of parsed.hints) {
                  // 같은 step이 있으면 대체, 없으면 추가
                  const existingIndex = allHints.findIndex(h => h.step === hint.step);
                  if (existingIndex >= 0) {
                    allHints[existingIndex] = hint;
                  } else {
                    allHints.push(hint);
                  }
                }
              }
            }
          }


          // step 순으로 정렬
          allHints.sort((a, b) => a.step - b.step);
          const newHints = allHints.length > 0 ? allHints : null;
          if (newHints) {
            setHints(newHints);
          }

          // linkProblemToChat에서 problemUrl이 감지되면 state 업데이트
          if (detectedProblemUrl && detectedProblemUrl !== problemUrl) {
            setProblemUrl(detectedProblemUrl);
          }

          // problemUrl이 있으면 제목을 업데이트하지 않음
          const savedChatId = await saveChatHistory(
            chatId ?? null,
            messagesToSave,
            title,
            problemUrl || undefined, // null이면 undefined로 전달해서 DB 덮어쓰기 방지
            shouldUpdateTitle, // 제목 업데이트 여부
            newHints ?? hints // 새 hints 또는 기존 hints
          );

          // 제목이 실제로 변경되었는지 확인
          const titleChanged = shouldUpdateTitle && title !== chatTitle;

          // 제목 state 업데이트 (problemUrl이 있으면 기존 제목 유지)
          if (shouldUpdateTitle || !chatTitle) {
            setChatTitle(title);
          }

          // 저장이 완료된 후 부모에게 알림 (새로 생성된 경우만)
          if (savedChatId && savedChatId !== chatId && onChatIdChange) {
            onChatIdChange(savedChatId);
          }

          // 사이드바 새로고침 (제목 변경 또는 problemUrl 감지 시)
          if (titleChanged || detectedProblemUrl) {
            setRefreshTrigger((prev) => prev + 1);
          }
        } catch (error) {
          console.error("Error saving chat history:", error);
        } finally {
          // 저장 완료 후 플래그 해제
          isSavingRef.current = false;
        }
      };

      saveHistory();
    }
  }, [messages, status, chatId, problemUrl, onChatIdChange]);

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) {
      return;
    }
    sendMessage(
      {
        text: message.text || "Sent with attachments",
        files: message.files,
      },
      {
        body: {
          chatId: chatId || undefined,
          problemUrl: problemUrl || undefined,
        },
      }
    );
    setInput("");
  };
  return (
    <div className="w-full h-full flex flex-col overflow-hidden max-w-4xl mx-auto">
      {isLoadingChat ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader />
        </div>
      ) : (
        <>
          {/* 힌트 패널 - hints가 있을 때만 표시 */}
          {hints && hints.length > 0 && (
            <div className="flex-shrink-0 px-4 py-1.5 border-b bg-muted/30 relative">
              <HintsCard hints={hints} />
            </div>
          )}
          <Conversation className="flex-1 min-h-0">
            <ConversationContent>
              {messages.map((message, messageIndex) => (
                <div key={`${message.id}-${messageIndex}`}>
                  {message.role === "assistant" &&
                    message.parts.filter((part) => part.type === "source-url")
                      .length > 0 && (
                      <Sources>
                        <SourcesTrigger
                          count={
                            message.parts.filter(
                              (part) => part.type === "source-url"
                            ).length
                          }
                        />
                        {message.parts
                          .filter((part) => part.type === "source-url")
                          .map((part, i) => (
                            <SourcesContent key={`${message.id}-${i}`}>
                              <Source
                                key={`${message.id}-${i}`}
                                href={part.url}
                                title={part.url}
                              />
                            </SourcesContent>
                          ))}
                      </Sources>
                    )}
                  {message.parts.map((part, i) => {
                    // searchProblems 도구 결과 파싱 (null이 아니면 렌더링 - 빈 배열도 포함)
                    const searchResults = parseSearchResultsFromPart(part);
                    if (searchResults !== null) {
                      return (
                        <div key={`${message.id}-${i}`} className="my-2">
                          <ProblemSelectCard
                            problems={searchResults}
                            onSelect={handleProblemSelect}
                            selectedProblemId={selectedProblemId}
                          />
                        </div>
                      );
                    }

                    switch (part.type) {
                      case "text":
                        // hints 블록 파싱
                        const { hints: parsedHints, textWithoutHints } = parseHintsFromMessage(part.text);

                        return (
                          <Message
                            key={`${message.id}-${i}`}
                            from={message.role}
                          >
                            <MessageContent>
                              {/* 힌트는 content만 텍스트로 표시 */}
                              {parsedHints && parsedHints.map((hint) => (
                                <MessageResponse key={hint.step}>
                                  {`**힌트 ${hint.step}**: ${hint.content}`}
                                </MessageResponse>
                              ))}
                              {/* 나머지 텍스트 표시 */}
                              {textWithoutHints && (
                                <MessageResponse>{textWithoutHints}</MessageResponse>
                              )}
                            </MessageContent>
                            {message.role === "assistant" &&
                              i === messages.length - 1 && (
                                <MessageActions>
                                  <MessageAction
                                    onClick={() => regenerate()}
                                    label="Retry"
                                  >
                                    <RefreshCcwIcon className="size-3" />
                                  </MessageAction>
                                  <MessageAction
                                    onClick={() =>
                                      navigator.clipboard.writeText(part.text)
                                    }
                                    label="Copy"
                                  >
                                    <CopyIcon className="size-3" />
                                  </MessageAction>
                                </MessageActions>
                              )}
                          </Message>
                        );
                      case "reasoning":
                        return (
                          <Reasoning
                            key={`${message.id}-${i}`}
                            className="w-full"
                            isStreaming={
                              status === "streaming" &&
                              i === message.parts.length - 1 &&
                              message.id === messages.at(-1)?.id
                            }
                          >
                            <ReasoningTrigger />
                            <ReasoningContent>{part.text}</ReasoningContent>
                          </Reasoning>
                        );
                      default:
                        return null;
                    }
                  })}
                </div>
              ))}
              {status === "submitted" && <Loader />}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </>
      )}
      <div className="flex-shrink-0 p-4 border-t">
        <PromptInput onSubmit={handleSubmit} globalDrop={true} multiple={true}>
          <PromptInputHeader>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
          </PromptInputHeader>
          <PromptInputBody>
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
            </PromptInputTools>
            <PromptInputSubmit disabled={!input && !status} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
};
export default ChatBotDemo;
