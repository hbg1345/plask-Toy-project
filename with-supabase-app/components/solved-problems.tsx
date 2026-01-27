"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { SolvedProblem } from "@/app/actions";

interface SolvedProblemsProps {
  problems: SolvedProblem[];
}

function getDifficultyColor(difficulty: number | null): string {
  if (difficulty === null) {
    return "text-gray-500 dark:text-gray-400";
  }
  if (difficulty < 400) {
    return "text-gray-500 dark:text-gray-400";
  }
  if (difficulty < 800) {
    return "text-amber-800 dark:text-amber-600";
  }
  if (difficulty < 1200) {
    return "text-green-600 dark:text-green-400";
  }
  if (difficulty < 1600) {
    return "text-cyan-600 dark:text-cyan-400";
  }
  if (difficulty < 2000) {
    return "text-blue-700 dark:text-blue-500";
  }
  if (difficulty < 2400) {
    return "text-yellow-500 dark:text-yellow-300";
  }
  if (difficulty < 2800) {
    return "text-orange-500 dark:text-orange-400";
  }
  if (difficulty < 3200) {
    return "text-red-600 dark:text-red-400";
  }
  // 3200+ (Gold)
  return "text-red-600 dark:text-red-400";
}

function ProblemTitle({ title, difficulty }: { title: string; difficulty: number | null }) {
  if (difficulty !== null && difficulty >= 3200 && title.length > 0) {
    return (
      <>
        <span className="text-black dark:text-white">{title[0]}</span>
        <span className="text-red-600 dark:text-red-400">{title.slice(1)}</span>
      </>
    );
  }
  return <>{title}</>;
}

export function SolvedProblemsList({ problems }: SolvedProblemsProps) {
  if (problems.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        아직 푼 문제가 없습니다.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {problems.map((problem) => {
        const displayTitle = problem.title || problem.problem_id;
        const url = `https://atcoder.jp/contests/${problem.contest_id}/tasks/${problem.problem_id}`;
        const colorClass = getDifficultyColor(problem.difficulty);

        return (
          <Link
            key={problem.problem_id}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "text-xs font-medium truncate max-w-[150px] hover:underline",
              problem.difficulty !== null && problem.difficulty >= 3200 ? "" : colorClass
            )}
            title={`${displayTitle} (${problem.difficulty ?? "?"})`}
          >
            <ProblemTitle title={displayTitle} difficulty={problem.difficulty} />
          </Link>
        );
      })}
    </div>
  );
}
