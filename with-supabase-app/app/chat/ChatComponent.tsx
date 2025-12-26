'use client';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { Fragment, useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { CopyIcon, GlobeIcon, RefreshCcwIcon } from 'lucide-react';
import { saveChatHistory, getChatHistory, type Message } from '@/app/actions';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import { Loader } from '@/components/ai-elements/loader';
const models = [
  {
    name: 'GPT 4o',
    value: 'openai/gpt-4o',
  },
  {
    name: 'Deepseek R1',
    value: 'deepseek/deepseek-r1',
  },
];
interface ChatBotDemoProps {
  chatId?: string | null;
  onChatIdChange?: (chatId: string | null) => void;
}

const ChatBotDemo = ({ chatId, onChatIdChange }: ChatBotDemoProps) => {
  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const { messages, setMessages, sendMessage, status, regenerate } = useChat();
  const prevChatIdRef = useRef<string | null>(chatId || null);
  const lastSavedMessageCountRef = useRef<number>(0);
  const isSavingRef = useRef<boolean>(false);

  // chatId가 변경되면 해당 채팅 로드
  useEffect(() => {
    if (chatId !== prevChatIdRef.current) {
      prevChatIdRef.current = chatId || null;
      
      if (chatId) {
        setIsLoadingChat(true);
        getChatHistory(chatId).then((chatData) => {
          if (chatData) {
            // Message 타입을 useChat이 사용하는 형식으로 변환
            const convertedMessages = chatData.messages.map((msg) => ({
              id: msg.id,
              role: msg.role,
              parts: [{ type: 'text' as const, text: msg.content }],
            }));
            setMessages(convertedMessages);
            lastSavedMessageCountRef.current = convertedMessages.length;
          }
          setIsLoadingChat(false);
        });
      } else {
        // 새 채팅 - 메시지와 저장 카운트 초기화
        setMessages([]);
        lastSavedMessageCountRef.current = 0;
        isSavingRef.current = false;
      }
    }
  }, [chatId, setMessages]);

  // chatId 변경 시 부모에게 알림은 저장 완료 후에만 수행 (saveHistory 함수 내에서)

  // 메시지가 추가되고 status가 ready일 때 저장
  useEffect(() => {
    // 저장 중이면 무시
    if (isSavingRef.current) {
      return;
    }

    // 조건: status가 ready 또는 idle이고, 메시지가 있고, 새 메시지가 추가된 경우
    const hasNewMessages = messages.length > lastSavedMessageCountRef.current;
    const lastMessage = messages[messages.length - 1];
    const shouldSave = 
      (status === 'ready' || status === 'idle') && 
      messages.length > 0 &&
      hasNewMessages &&
      lastMessage?.role === 'assistant';

    if (shouldSave) {
      // 저장 시작 전에 플래그 설정 및 카운트 업데이트
      isSavingRef.current = true;
      lastSavedMessageCountRef.current = messages.length;
      
      console.log('Saving chat history...', { 
        messagesCount: messages.length, 
        chatId, 
        status,
        lastMessageRole: lastMessage?.role 
      });
      
      const saveHistory = async () => {
        try {
          const firstUserMessage = messages.find(m => m.role === 'user');
          let title = 'New Chat';
          if (firstUserMessage) {
            const textPart = firstUserMessage.parts?.find((part: any) => part.type === 'text');
            if (textPart?.text) {
              title = textPart.text.substring(0, 50);
            }
          }
          
          const messagesToSave: Message[] = messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.parts?.map((part: any) => {
              if (part.type === 'text') return part.text;
              return '';
            }).join('') || '',
          }));
          
          console.log('Calling saveChatHistory...', { chatId, title, messagesCount: messagesToSave.length });
          const savedChatId = await saveChatHistory(chatId, messagesToSave, title);
          console.log('saveChatHistory result:', savedChatId);
          
          // 저장이 완료된 후 부모에게 알림 (새로 생성된 경우만)
          if (savedChatId && savedChatId !== chatId && onChatIdChange) {
            onChatIdChange(savedChatId);
          }
        } catch (error) {
          console.error('Error saving chat history:', error);
        } finally {
          // 저장 완료 후 플래그 해제
          isSavingRef.current = false;
        }
      };
      
      saveHistory();
    }
  }, [messages, status]);

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) {
      return;
    }
    sendMessage(
      { 
        text: message.text || 'Sent with attachments',
        files: message.files 
      },
      {
        body: {
          model: model,
          webSearch: webSearch,
        },
      },
    );
    setInput('');
  };
  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full h-screen">
      <div className="flex flex-col h-full">
        {isLoadingChat ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader />
          </div>
        ) : (
          <Conversation className="h-full">
            <ConversationContent>
              {messages.map((message) => (
              <div key={message.id}>
                {message.role === 'assistant' && message.parts.filter((part) => part.type === 'source-url').length > 0 && (
                  <Sources>
                    <SourcesTrigger
                      count={
                        message.parts.filter(
                          (part) => part.type === 'source-url',
                        ).length
                      }
                    />
                    {message.parts.filter((part) => part.type === 'source-url').map((part, i) => (
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
                  switch (part.type) {
                    case 'text':
                      return (
                        <Message key={`${message.id}-${i}`} from={message.role}>
                          <MessageContent>
                            <MessageResponse>
                              {part.text}
                            </MessageResponse>
                          </MessageContent>
                          {message.role === 'assistant' && i === messages.length - 1 && (
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
                    case 'reasoning':
                      return (
                        <Reasoning
                          key={`${message.id}-${i}`}
                          className="w-full"
                          isStreaming={status === 'streaming' && i === message.parts.length - 1 && message.id === messages.at(-1)?.id}
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
            {status === 'submitted' && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        )}
        <PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop={true} multiple={true}>
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
              <PromptInputButton
                variant={webSearch ? 'default' : 'ghost'}
                onClick={() => setWebSearch(!webSearch)}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
              <PromptInputSelect
                onValueChange={(value) => {
                  setModel(value);
                }}
                value={model}
              >
                <PromptInputSelectTrigger>
                  <PromptInputSelectValue />
                </PromptInputSelectTrigger>
                <PromptInputSelectContent>
                  {models.map((model) => (
                    <PromptInputSelectItem key={model.value} value={model.value}>
                      {model.name}
                    </PromptInputSelectItem>
                  ))}
                </PromptInputSelectContent>
              </PromptInputSelect>
            </PromptInputTools>
            <PromptInputSubmit disabled={!input && !status} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
};
export default ChatBotDemo;