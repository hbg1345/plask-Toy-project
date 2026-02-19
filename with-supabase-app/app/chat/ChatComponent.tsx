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
import { useState, useEffect, useRef, useMemo } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { CopyIcon, RefreshCcwIcon, AlertCircleIcon } from "lucide-react";
import {
  getChatHistory,
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
import { extractAllHints } from "@/lib/hints";
import {
  ProblemSelectCard,
  parseSearchResultsFromPart,
} from "@/components/problem-select-card";

interface ChatBotDemoProps {
  chatId?: string | null;
  onChatIdChange?: (chatId: string | null) => void;
  initialProblemId?: string | null;
}

// 마지막 메시지만 서버로 전송하는 transport (AI SDK 6 패턴)
const transport = new DefaultChatTransport({
  api: "/api/chat",
  prepareSendMessagesRequest: ({ messages, body }) => ({
    body: {
      message: messages[messages.length - 1],
      chatId: body?.chatId,
      problemUrl: body?.problemUrl,
    },
  }),
});

const ChatBotDemo = ({ chatId, onChatIdChange, initialProblemId }: ChatBotDemoProps) => {
  const [input, setInput] = useState("");
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [problemUrl, setProblemUrl] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState<string | null>(null);
  const [tokenLimitExceeded, setTokenLimitExceeded] = useState(false);
  const { messages, setMessages, sendMessage, status, regenerate } = useChat({
    transport,
    onError: (err) => {
      // 429 에러 (토큰 제한 초과) 감지
      if (err.message?.includes("429") || err.message?.includes("DAILY_LIMIT_EXCEEDED")) {
        setTokenLimitExceeded(true);
      }
    },
  });
  const { setRefreshTrigger, setProblemUrl: setContextProblemUrl } = useChatLayout();
  const prevChatIdRef = useRef<string | null>(null);
  const [initialMessage, setInitialMessage] = useState<string | null>(null);
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);

  // 메시지에서 힌트를 reactive하게 계산 (서버 저장은 별도로 처리)
  const computedHints = useMemo(() => extractAllHints(
    messages.map((m) => ({
      role: m.role,
      parts: m.parts?.map((p) => ({
        type: p.type,
        text: "text" in p ? (p as { text?: string }).text : undefined,
      })),
    }))
  ), [messages]);

  // 문제 선택 핸들러
  const handleProblemSelect = async (problemId: string) => {
    if (!chatId) {
      console.error("Cannot link problem: chatId is not set");
      return;
    }

    // 같은 문제면 아무 작업도 하지 않음
    if (selectedProblemId === problemId) {
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

      // 상태 업데이트 (문제 전환 시 이전 힌트 초기화)
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
          // parts가 있으면 그대로 사용, 없으면 content를 text로 변환
          const convertedMessages = chatData.messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            parts: msg.parts && msg.parts.length > 0
              ? msg.parts
              : [{ type: "text" as const, text: msg.content }],
          })) as UIMessage[];
          setMessages(convertedMessages);
          // problemUrl, title 저장
          setProblemUrl(chatData.problemUrl || null);
          setChatTitle(chatData.title || null);
          setSelectedProblemId(null); // 새 채팅 로드 시 선택 초기화
        } else {
          console.error("Failed to load chat data");
        }
        setIsLoadingChat(false);
      });
    } else if (!chatId) {
      // chatId가 null/undefined인 경우 - 상태 초기화만 (새 채팅은 사이드바에서 생성)
      setMessages([]);
      setProblemUrl(null);
      setChatTitle(null);
      setSelectedProblemId(null);
    }

    prevChatIdRef.current = chatId || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, setMessages]);

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
            output?: { success?: boolean; problemUrl?: string; title?: string };
          };
          if (toolPart.output?.success && toolPart.output?.problemUrl) {
            const detectedUrl = toolPart.output.problemUrl;
            if (detectedUrl !== problemUrl) {
              console.log("Detected problemUrl from tool output:", detectedUrl);
              setProblemUrl(detectedUrl);
              setContextProblemUrl(detectedUrl);
              setChatTitle(toolPart.output.title || null);
              setRefreshTrigger((prev) => prev + 1);
            }
            return;
          }
        }
      }
    }
  }, [messages, problemUrl, setRefreshTrigger, setContextProblemUrl]);

  // 서버에서 새 chatId가 metadata로 전달되면 감지
  useEffect(() => {
    if (chatId || messages.length === 0) return;

    // assistant 메시지의 metadata에서 newChatId 확인
    for (const msg of messages) {
      if (msg.role === "assistant" && msg.metadata) {
        const metadata = msg.metadata as { newChatId?: string };
        if (metadata.newChatId) {
          console.log("Received new chatId from server:", metadata.newChatId);
          onChatIdChange?.(metadata.newChatId);
          setRefreshTrigger((prev) => prev + 1);
          return;
        }
      }
    }
  }, [messages, chatId, onChatIdChange, setRefreshTrigger]);

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
          {computedHints && computedHints.length > 0 && (
            <div className="flex-shrink-0 px-4 py-3 border-b bg-muted/20">
              <HintsCard key={problemUrl ?? chatId} hints={computedHints} />
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
                        const { hintContents: parsedHints, textWithoutHints } = parseHintsFromMessage(part.text);

                        return (
                          <Message
                            key={`${message.id}-${i}`}
                            from={message.role}
                          >
                            <MessageContent>
                              {/* 힌트는 content만 텍스트로 표시 (번호는 HintsCard에서 표시) */}
                              {parsedHints && parsedHints.map((content, idx) => (
                                <MessageResponse key={idx}>
                                  {`**힌트**: ${content}`}
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
              {status === "submitted" && (
                <div className="flex items-center gap-1 py-4 text-foreground">
                  <span className="text-sm">생각 중</span>
                  <span className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse [animation-delay:0.4s]" />
                  </span>
                </div>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </>
      )}
      <div className="flex-shrink-0 p-4">
        {tokenLimitExceeded && (
          <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-sm">
            <AlertCircleIcon className="size-4 flex-shrink-0" />
            <span>일일 토큰 사용량을 초과했습니다. 내일 다시 시도해주세요.</span>
          </div>
        )}
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
              disabled={tokenLimitExceeded}
              placeholder={tokenLimitExceeded ? "일일 토큰 제한 초과" : undefined}
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
            <PromptInputSubmit disabled={tokenLimitExceeded || (!input && !status)} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
};
export default ChatBotDemo;
