"use client";

import { useState } from "react";
import { ChevronRight, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface Hint {
  step: number;
  content: string;
}

interface HintsCardProps {
  hints: Hint[];
}

export function HintsCard({ hints }: HintsCardProps) {
  const [revealedSteps, setRevealedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (step: number) => {
    setRevealedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(step)) {
        newSet.delete(step);
      } else {
        newSet.add(step);
      }
      return newSet;
    });
  };

  return (
    <div className="my-4 rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
        <Lightbulb className="h-4 w-4" />
        <span>힌트 ({hints.length}개)</span>
      </div>
      <div className="space-y-2">
        {hints.map((hint) => {
          const isRevealed = revealedSteps.has(hint.step);
          return (
            <div
              key={hint.step}
              className="rounded-md border bg-background overflow-hidden"
            >
              <button
                onClick={() => toggleStep(hint.step)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isRevealed && "rotate-90"
                  )}
                />
                <span className="text-sm font-medium">
                  힌트 {hint.step}
                </span>
                {!isRevealed && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    클릭해서 보기
                  </span>
                )}
              </button>
              {isRevealed && (
                <div className="px-3 pb-3 pl-10 text-sm text-foreground">
                  {hint.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 메시지에서 hints 블록 파싱
export function parseHintsFromMessage(text: string): {
  hints: Hint[] | null;
  textWithoutHints: string;
} {
  const hintsRegex = /```hints\n([\s\S]*?)\n```/;
  const match = text.match(hintsRegex);

  if (!match) {
    return { hints: null, textWithoutHints: text };
  }

  try {
    const hintsJson = JSON.parse(match[1]);
    if (hintsJson.hints && Array.isArray(hintsJson.hints)) {
      const textWithoutHints = text.replace(hintsRegex, "").trim();
      return { hints: hintsJson.hints, textWithoutHints };
    }
  } catch (e) {
    console.error("Failed to parse hints JSON:", e);
  }

  return { hints: null, textWithoutHints: text };
}
