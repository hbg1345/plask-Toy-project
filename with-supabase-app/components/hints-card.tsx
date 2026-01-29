"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Lightbulb } from "lucide-react";
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
      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
        <Lightbulb className="h-3 w-3" />
        <span className="font-medium">힌트</span>
      </div>

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

      {/* 현재 힌트 버튼 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded border text-xs transition-colors",
          isExpanded
            ? "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700"
            : "bg-muted/50 border-border hover:bg-muted"
        )}
      >
        <span>{currentStep + 1}/{hints.length}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            isExpanded && "rotate-180"
          )}
        />
      </button>

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

// 메시지에서 hint/hints 블록 파싱
export function parseHintsFromMessage(text: string): {
  hints: Hint[] | null;
  textWithoutHints: string;
} {
  let resultText = text;
  const allHints: Hint[] = [];

  // 복수 힌트 형식: ```hints {"hints":[...]}```
  const hintsRegex = /```hints\n([\s\S]*?)\n```/g;
  let hintsMatch;
  while ((hintsMatch = hintsRegex.exec(text)) !== null) {
    try {
      const hintsJson = JSON.parse(hintsMatch[1]);
      if (hintsJson.hints && Array.isArray(hintsJson.hints)) {
        allHints.push(...hintsJson.hints);
      }
    } catch (e) {
      console.error("Failed to parse hints JSON:", e);
    }
    resultText = resultText.replace(hintsMatch[0], "").trim();
  }

  // 단일 힌트 형식: ```hint {"step":1,"content":"..."}```
  const hintRegex = /```hint\n([\s\S]*?)\n```/g;
  let hintMatch;
  while ((hintMatch = hintRegex.exec(text)) !== null) {
    try {
      const hintJson = JSON.parse(hintMatch[1]);
      if (hintJson.step && hintJson.content) {
        allHints.push(hintJson);
      }
    } catch (e) {
      console.error("Failed to parse hint JSON:", e);
    }
    resultText = resultText.replace(hintMatch[0], "").trim();
  }

  // Fallback: 코드 블록 없이 JSON만 있는 경우 {"step":...,"content":"..."}
  if (allHints.length === 0) {
    const rawJsonRegex = /\{"step"\s*:\s*(\d+)\s*,\s*"content"\s*:\s*"((?:[^"\\]|\\.)*)"\}/g;
    let rawMatch;
    while ((rawMatch = rawJsonRegex.exec(text)) !== null) {
      try {
        const hintJson = JSON.parse(rawMatch[0]);
        if (hintJson.step && hintJson.content) {
          allHints.push(hintJson);
          resultText = resultText.replace(rawMatch[0], "").trim();
        }
      } catch (e) {
        // 파싱 실패하면 무시
      }
    }
  }

  if (allHints.length > 0) {
    // step 순으로 정렬
    allHints.sort((a, b) => a.step - b.step);
    return { hints: allHints, textWithoutHints: resultText };
  }

  return { hints: null, textWithoutHints: text };
}
