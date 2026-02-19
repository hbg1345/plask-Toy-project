"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Search, Check, Loader2 } from "lucide-react";

interface Problem {
  id: string;
  title: string;
  difficulty: number | null;
  url: string;
}

interface ProblemSelectCardProps {
  problems: Problem[];
  onSelect: (problemId: string) => Promise<void>;
  selectedProblemId?: string | null;
}

export function ProblemSelectCard({
  problems,
  onSelect,
  selectedProblemId,
}: ProblemSelectCardProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleSelect = async (problemId: string) => {
    if (loadingId) return; // 로딩 중일 때만 막음

    setLoadingId(problemId);
    try {
      await onSelect(problemId);
    } finally {
      setLoadingId(null);
    }
  };

  const getDifficultyColor = (difficulty: number | null) => {
    if (difficulty === null) return "text-foreground";
    if (difficulty < 400) return "text-gray-500";
    if (difficulty < 800) return "text-green-600 dark:text-green-400";
    if (difficulty < 1200) return "text-cyan-600 dark:text-cyan-400";
    if (difficulty < 1600) return "text-blue-600 dark:text-blue-400";
    if (difficulty < 2000) return "text-yellow-600 dark:text-yellow-400";
    if (difficulty < 2400) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  if (problems.length === 0) {
    return (
      <div className="border rounded-lg p-3 bg-muted/30">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Search className="h-4 w-4" />
          <span>검색 결과가 없습니다. 다른 키워드로 검색해주세요.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
      <div className="flex items-center gap-2 text-sm text-foreground mb-2">
        <Search className="h-4 w-4" />
        <span>문제를 선택하세요</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {problems.map((problem) => {
          const isSelected = selectedProblemId === problem.id;
          const isLoading = loadingId === problem.id;
          const isDisabled = loadingId !== null; // 로딩 중일 때만 비활성화

          return (
            <button
              key={problem.id}
              onClick={() => handleSelect(problem.id)}
              disabled={isDisabled}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted border-border",
                isDisabled && !isSelected && "opacity-50 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSelected ? (
                <Check className="h-4 w-4" />
              ) : null}
              <span className="font-medium">{problem.title}</span>
              {problem.difficulty !== null && (
                <span className={cn("text-xs", getDifficultyColor(problem.difficulty))}>
                  ({problem.difficulty})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// tool output에서 searchProblems 결과 파싱
// null: searchProblems 도구가 아님
// []: 검색 결과 없음
// [...]: 검색 결과 있음
export function parseSearchResultsFromPart(part: unknown): Problem[] | null {
  if (!part || typeof part !== "object") return null;

  const typedPart = part as { type?: string; output?: { results?: Problem[]; count?: number } };

  // tool-searchProblems 타입인지 확인
  if (typedPart.type !== "tool-searchProblems") return null;

  const output = typedPart.output;
  if (!output || !output.results) return [];

  return output.results;
}
