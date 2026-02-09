"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface Hint {
  step: number;
  content: string;
}

interface HintsCardProps {
  hints: Hint[];
}

export function HintsCard({ hints }: HintsCardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const goToNext = () => {
    if (currentStep < hints.length - 1) {
      setCurrentStep(currentStep + 1);
      setIsExpanded(false);
    }
  };

  const goToPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setIsExpanded(false);
    }
  };

  const currentHint = hints[currentStep];

  return (
    <div className="flex items-center gap-2 text-xs relative">
      {/* 아이콘 클릭으로 힌트 토글 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors",
          isExpanded && "text-amber-700 dark:text-amber-300"
        )}
      >
        <Lightbulb className="h-3 w-3" />
        <span className="font-medium">힌트</span>
      </button>

      {/* 이전 버튼 */}
      <button
        onClick={goToPrev}
        disabled={currentStep === 0}
        className={cn(
          "p-0.5 rounded hover:bg-muted transition-colors",
          currentStep === 0 && "opacity-30 cursor-not-allowed"
        )}
      >
        <ChevronLeft className="h-3 w-3" />
      </button>

      {/* 현재 힌트 번호 */}
      <span className="px-2 py-0.5 text-xs">{currentStep + 1}/{hints.length}</span>

      {/* 다음 버튼 */}
      <button
        onClick={goToNext}
        disabled={currentStep >= hints.length - 1}
        className={cn(
          "p-0.5 rounded hover:bg-muted transition-colors",
          currentStep >= hints.length - 1 && "opacity-30 cursor-not-allowed"
        )}
      >
        <ChevronRight className="h-3 w-3" />
      </button>

      {/* 힌트 내용 (펼쳤을 때) */}
      {isExpanded && currentHint && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded text-sm text-foreground z-10 prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {currentHint.content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

// 메시지에서 JSON 응답 파싱
// 힌트: {"type": "hint", "content": "..."}
// 일반 응답: {"type": "response", "content": "..."}
export function parseHintsFromMessage(text: string): {
  hintContents: string[] | null;  // 힌트 content만 반환 (번호는 시스템에서 부여)
  textWithoutHints: string;
} {
  let resultText = text;
  const hintContents: string[] = [];

  // JSON 파싱 헬퍼 - 멀티라인 허용
  const tryParseJson = (jsonStr: string) => {
    try {
      // 먼저 그대로 파싱 시도
      return JSON.parse(jsonStr);
    } catch {
      try {
        // 실패하면 줄바꿈을 \n으로 이스케이프하고 다시 시도
        const fixed = jsonStr.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
        return JSON.parse(fixed);
      } catch {
        return null;
      }
    }
  };

  // 힌트 형식: {"type": "hint", "content": "..."} - 멀티라인 지원
  const hintRegex = /\{"type"\s*:\s*"hint"\s*,\s*"content"\s*:\s*"([\s\S]*?)"\s*\}/g;
  let hintMatch;
  while ((hintMatch = hintRegex.exec(text)) !== null) {
    const parsed = tryParseJson(hintMatch[0]);
    if (parsed?.type === "hint" && parsed?.content) {
      hintContents.push(parsed.content);
      resultText = resultText.replace(hintMatch[0], "").trim();
    }
  }

  // 일반 응답 형식: {"type": "response", "content": "..."} - 멀티라인 지원
  const responseRegex = /\{"type"\s*:\s*"response"\s*,\s*"content"\s*:\s*"([\s\S]*?)"\s*\}/g;
  let responseMatch;
  while ((responseMatch = responseRegex.exec(text)) !== null) {
    const parsed = tryParseJson(responseMatch[0]);
    if (parsed?.type === "response" && parsed?.content) {
      // JSON을 content 텍스트로 대체
      resultText = resultText.replace(responseMatch[0], parsed.content).trim();
    }
  }

  if (hintContents.length > 0) {
    return { hintContents, textWithoutHints: resultText };
  }

  return { hintContents: null, textWithoutHints: resultText };
}
