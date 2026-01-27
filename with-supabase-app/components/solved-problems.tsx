"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { SolvedProblem } from "@/app/actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMemo } from "react";

interface SolvedProblemsProps {
  problems: SolvedProblem[];
}

// 난이도별 색상 (hex 값)
function getDifficultyColor(difficulty: number | null): string {
  if (difficulty === null || difficulty < 400) return "#6b7280"; // gray
  if (difficulty < 800) return "#92400e"; // brown/amber
  if (difficulty < 1200) return "#16a34a"; // green
  if (difficulty < 1600) return "#0891b2"; // cyan
  if (difficulty < 2000) return "#2563eb"; // blue
  if (difficulty < 2400) return "#ca8a04"; // yellow
  if (difficulty < 2800) return "#ea580c"; // orange
  if (difficulty < 3200) return "#dc2626"; // red
  return "#dc2626"; // gold (red for text)
}

function ProblemBadge({ problem }: { problem: SolvedProblem }) {
  const displayTitle = problem.title || problem.problem_id;
  const url = `https://atcoder.jp/contests/${problem.contest_id}/tasks/${problem.problem_id}`;
  const color = getDifficultyColor(problem.difficulty);
  const isGold = problem.difficulty !== null && problem.difficulty >= 3200;

  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border transition-all hover:scale-105 hover:shadow-sm bg-card"
      style={{
        borderColor: color,
        color: color
      }}
      title={`${displayTitle} (${problem.difficulty ?? "?"})`}
    >
      {isGold ? (
        <>
          <span style={{ color: "#000" }} className="font-bold">{displayTitle[0]}</span>
          <span style={{ color: "#dc2626" }}>{displayTitle.slice(1)}</span>
        </>
      ) : (
        <span className="truncate max-w-[120px]">{displayTitle}</span>
      )}
      <span className="ml-1.5 text-[10px] opacity-70">
        {problem.difficulty ?? "?"}
      </span>
    </Link>
  );
}

export function SolvedProblemsList({ problems }: SolvedProblemsProps) {
  // 난이도 순 오름차순 정렬 (null은 맨 뒤로)
  const sortedProblems = useMemo(() => {
    return [...problems].sort((a, b) => {
      if (a.difficulty === null && b.difficulty === null) return 0;
      if (a.difficulty === null) return 1;
      if (b.difficulty === null) return -1;
      return a.difficulty - b.difficulty;
    });
  }, [problems]);

  if (problems.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        아직 푼 문제가 없습니다.
      </p>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="flex flex-wrap gap-2">
        {sortedProblems.map((problem) => (
          <ProblemBadge key={problem.problem_id} problem={problem} />
        ))}
      </div>
    </ScrollArea>
  );
}
