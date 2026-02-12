"use client";

import { useState } from "react";
import { Lightbulb, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { Hint } from "@/lib/hints";

// re-export for backward compatibility
export { parseHintsFromMessage } from "@/lib/hints";
export type { Hint } from "@/lib/hints";

interface HintsCardProps {
  hints: Hint[];
}

export function HintsCard({ hints }: HintsCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < hints.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const currentHint = hints[currentIndex];

  return (
    <div className="w-full">
      {/* 헤더 - 클릭으로 토글 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors w-full"
      >
        <Lightbulb className="h-4 w-4" />
        <span className="font-medium text-sm">힌트</span>
        <ChevronRight
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isExpanded && "rotate-90"
          )}
        />
      </button>

      {/* 펼쳐진 내용 */}
      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* 스텝 인디케이터 + 좌우 화살표 */}
          <div className="flex items-center gap-2">
            {/* 왼쪽 화살표 */}
            <button
              onClick={goToPrev}
              disabled={currentIndex === 0}
              className={cn(
                "p-1 rounded-md hover:bg-muted transition-colors",
                currentIndex === 0 && "opacity-30 cursor-not-allowed"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* 스텝 인디케이터 - 최대 5개만 표시 */}
            <div className="flex items-center gap-1">
              {(() => {
                const maxVisible = 5;
                let start = Math.max(0, currentIndex - Math.floor(maxVisible / 2));
                let end = start + maxVisible;

                if (end > hints.length) {
                  end = hints.length;
                  start = Math.max(0, end - maxVisible);
                }

                return hints.slice(start, end).map((_, idx) => {
                  const index = start + idx;
                  const isCurrent = index === currentIndex;

                  return (
                    <div key={index} className="flex items-center">
                      {/* 스텝 원 - 클릭 가능 */}
                      <button
                        onClick={() => setCurrentIndex(index)}
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                          isCurrent
                            ? "bg-amber-500 text-white"
                            : "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800"
                        )}
                      >
                        {index + 1}
                      </button>
                      {/* 연결선 */}
                      {idx < Math.min(maxVisible, hints.length - start) - 1 && (
                        <div className="w-4 h-0.5 mx-0.5 bg-amber-200 dark:bg-amber-800" />
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* 오른쪽 화살표 */}
            <button
              onClick={goToNext}
              disabled={currentIndex === hints.length - 1}
              className={cn(
                "p-1 rounded-md hover:bg-muted transition-colors",
                currentIndex === hints.length - 1 && "opacity-30 cursor-not-allowed"
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 현재 힌트 내용 */}
          {currentHint && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg">
              <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-2">
                힌트 {currentIndex + 1}
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {currentHint.content}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 메시지에서 JSON 응답 파싱
// 힌트: {"type": "hint", "content": "..."}
// 일반 응답: {"type": "response", "content": "..."}
