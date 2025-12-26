import {
  getProblemsGroupedByContest,
  extractProblemIndex,
} from "@/lib/atcoder/problems";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Suspense } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

/**
 * AtCoder 레이팅 색상 (난이도에 따라)
 */
function getDifficultyColor(difficulty: number | null): {
  bg: string;
  text: string;
  border: string;
} {
  if (difficulty === null) {
    return {
      bg: "bg-gray-400 dark:bg-gray-600",
      text: "text-gray-700 dark:text-gray-300",
      border: "border-gray-400 dark:border-gray-600",
    };
  }

  // Gray: < 400
  if (difficulty < 400) {
    return {
      bg: "bg-gray-400 dark:bg-gray-600",
      text: "text-gray-700 dark:text-gray-300",
      border: "border-gray-400 dark:border-gray-600",
    };
  }
  // Brown: 400-799
  if (difficulty < 800) {
    return {
      bg: "bg-amber-600 dark:bg-amber-700",
      text: "text-amber-900 dark:text-amber-100",
      border: "border-amber-600 dark:border-amber-700",
    };
  }
  // Green: 800-1199
  if (difficulty < 1200) {
    return {
      bg: "bg-green-500 dark:bg-green-600",
      text: "text-green-900 dark:text-green-100",
      border: "border-green-500 dark:border-green-600",
    };
  }
  // Cyan: 1200-1599
  if (difficulty < 1600) {
    return {
      bg: "bg-cyan-400 dark:bg-cyan-500",
      text: "text-cyan-900 dark:text-cyan-100",
      border: "border-cyan-400 dark:border-cyan-500",
    };
  }
  // Blue: 1600-1999
  if (difficulty < 2000) {
    return {
      bg: "bg-blue-500 dark:bg-blue-600",
      text: "text-blue-900 dark:text-blue-100",
      border: "border-blue-500 dark:border-blue-600",
    };
  }
  // Yellow: 2000-2399
  if (difficulty < 2400) {
    return {
      bg: "bg-yellow-400 dark:bg-yellow-500",
      text: "text-yellow-900 dark:text-yellow-100",
      border: "border-yellow-400 dark:border-yellow-500",
    };
  }
  // Orange: 2400-2799
  if (difficulty < 2800) {
    return {
      bg: "bg-orange-500 dark:bg-orange-600",
      text: "text-orange-900 dark:text-orange-100",
      border: "border-orange-500 dark:border-orange-600",
    };
  }
  // Red: 2800-3199
  if (difficulty < 3200) {
    return {
      bg: "bg-red-500 dark:bg-red-600",
      text: "text-red-900 dark:text-red-100",
      border: "border-red-500 dark:border-red-600",
    };
  }
  // Rainbow: 3200+ (gradient)
  return {
    bg: "bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 dark:from-purple-600 dark:via-pink-600 dark:to-red-600",
    text: "text-white dark:text-white",
    border: "border-purple-500 dark:border-purple-600",
  };
}

/**
 * 난이도를 바의 채워진 정도로 변환 (0-100%)
 * 난이도 범위: 0 ~ 4000 정도로 가정
 */
function getDifficultyPercentage(difficulty: number | null): number {
  if (difficulty === null) return 0;
  // 최대 난이도를 4000으로 가정 (필요시 조정)
  return Math.min((difficulty / 4000) * 100, 100);
}

async function ProblemsContent({ page = 1 }: { page: number }) {
  const CONTESTS_PER_PAGE = 30;
  const { grouped: problemsByContest, totalContests } =
    await getProblemsGroupedByContest(page, CONTESTS_PER_PAGE);

  // 이미 DB에서 날짜 기준 내림차순으로 정렬되어 있으므로 그대로 사용
  const paginatedContests = Array.from(problemsByContest.entries());
  const totalPages = Math.ceil(totalContests / CONTESTS_PER_PAGE);
  const currentPage = Math.max(1, Math.min(page, totalPages));

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-2 w-full">
        <h1 className="text-3xl font-bold tracking-tight">Problems Archive</h1>
        <p className="text-muted-foreground">
          Data provided by{" "}
          <Link
            href="https://kenkoooo.com/atcoder/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Kenkoo API
          </Link>
        </p>
      </div>

      {/* Pagination */}
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="text-sm text-muted-foreground">
              페이지 {currentPage} / {totalPages} (총 {totalContests}개
              콘테스트)
            </div>
            <div className="flex items-center gap-1">
              {/* 더블 왼쪽 화살표: 10페이지 뒤로 */}
              {currentPage > 10 && (
                <Button variant="outline" size="icon" asChild>
                  <Link href={`/problems?page=${currentPage - 10}`}>
                    <ChevronsLeft className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              {/* 왼쪽 화살표: 1페이지 뒤로 */}
              {currentPage > 1 && (
                <Button variant="outline" size="icon" asChild>
                  <Link href={`/problems?page=${currentPage - 1}`}>
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              {/* 페이지 번호들 */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((pageNum) => {
                  // 현재 페이지 기준으로 앞뒤 4개씩 표시
                  return (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 4 && pageNum <= currentPage + 4)
                  );
                })
                .map((pageNum, idx, array) => {
                  // 연속되지 않는 페이지 사이에 ... 표시
                  const showEllipsis = idx > 0 && pageNum - array[idx - 1] > 1;
                  return (
                    <div key={pageNum} className="flex items-center gap-1">
                      {showEllipsis && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                      <Button
                        variant={
                          pageNum === currentPage ? "default" : "outline"
                        }
                        size="sm"
                        asChild
                      >
                        <Link href={`/problems?page=${pageNum}`}>
                          {pageNum}
                        </Link>
                      </Button>
                    </div>
                  );
                })}
              {/* 오른쪽 화살표: 1페이지 앞으로 */}
              {currentPage < totalPages && (
                <Button variant="outline" size="icon" asChild>
                  <Link href={`/problems?page=${currentPage + 1}`}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              {/* 더블 오른쪽 화살표: 10페이지 앞으로 */}
              {currentPage < totalPages - 9 && (
                <Button variant="outline" size="icon" asChild>
                  <Link href={`/problems?page=${currentPage + 10}`}>
                    <ChevronsRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Problems Table */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Contests & Problems</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <div className="min-w-[800px]">
              <div className="border rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-[200px_repeat(26,minmax(120px,1fr))] gap-0 bg-muted/50 dark:bg-muted/30 border-b border-border">
                  <div className="p-3 font-semibold text-sm sticky left-0 bg-muted/50 dark:bg-muted/30 z-10 border-r border-border">
                    Contest
                  </div>
                  {Array.from({ length: 26 }, (_, i) => (
                    <div
                      key={i}
                      className="p-2 text-center text-sm font-medium border-r last:border-r-0 border-border"
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>

                {/* Table Body */}
                <div className="divide-y">
                  {paginatedContests.map(([contestId, problems]) => {
                    // 문제를 인덱스별로 맵핑
                    const problemMap = new Map<string, (typeof problems)[0]>();
                    problems.forEach((p) => {
                      const idx = extractProblemIndex(p.id);
                      problemMap.set(idx.toLowerCase(), p);
                    });

                    return (
                      <div
                        key={contestId}
                        className="grid grid-cols-[200px_repeat(26,minmax(120px,1fr))] gap-0 hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors border-b border-border last:border-b-0"
                      >
                        {/* Contest Name */}
                        <div className="p-3 font-medium text-sm sticky left-0 bg-card dark:bg-card border-r border-border z-10">
                          <Link
                            href={`https://atcoder.jp/contests/${contestId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {contestId}
                          </Link>
                        </div>

                        {/* Problems */}
                        {Array.from({ length: 26 }, (_, i) => {
                          const letter = String.fromCharCode(65 + i);
                          const problem = problemMap.get(letter.toLowerCase());

                          if (!problem) {
                            return (
                              <div
                                key={i}
                                className="p-2 border-r last:border-r-0 border-border"
                              >
                                <span className="text-muted-foreground/30 text-xs">
                                  -
                                </span>
                              </div>
                            );
                          }

                          const colors = getDifficultyColor(problem.difficulty);
                          const percentage = getDifficultyPercentage(
                            problem.difficulty
                          );

                          return (
                            <div
                              key={i}
                              className="p-2 border-r last:border-r-0 border-border flex flex-col gap-1 min-w-[120px]"
                            >
                              <Link
                                href={`/chat?problemId=${problem.id}&problemTitle=${encodeURIComponent(problem.title)}&problemUrl=${encodeURIComponent(`https://atcoder.jp/contests/${contestId}/tasks/${problem.id}`)}`}
                                className="group"
                              >
                                {/* Progress Bar */}
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border">
                                  <div
                                    className={cn(
                                      "h-full transition-all",
                                      colors.bg
                                    )}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                {/* Problem Title */}
                                <div
                                  className={cn(
                                    "text-xs font-bold mt-1 truncate group-hover:underline",
                                    problem.difficulty && problem.difficulty >= 3200
                                      ? ""
                                      : colors.text
                                  )}
                                  title={problem.title}
                                >
                                  {problem.difficulty && problem.difficulty >= 3200 ? (
                                    problem.title.length > 0 ? (
                                      <>
                                        <span className="text-black dark:text-white">
                                          {problem.title[0]}
                                        </span>
                                        <span className="text-red-600 dark:text-red-400">
                                          {problem.title.slice(1)}
                                        </span>
                                      </>
                                    ) : (
                                      problem.title
                                    )
                                  ) : (
                                    problem.title
                                  )}
                                </div>
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Difficulty Legend */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Difficulty Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {[
              { range: "< 400", difficulty: 300, label: "Gray" },
              { range: "400-799", difficulty: 600, label: "Brown" },
              { range: "800-1199", difficulty: 1000, label: "Green" },
              { range: "1200-1599", difficulty: 1400, label: "Cyan" },
              { range: "1600-1999", difficulty: 1800, label: "Blue" },
              { range: "2000-2399", difficulty: 2200, label: "Yellow" },
              { range: "2400-2799", difficulty: 2600, label: "Orange" },
              { range: "2800-3199", difficulty: 3000, label: "Red" },
              { range: "3200+", difficulty: 3400, label: "Rainbow" },
            ].map(({ range, difficulty, label }) => {
              const colors = getDifficultyColor(difficulty);
              const percentage = getDifficultyPercentage(difficulty);
              return (
                <div key={range} className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden border border-border">
                    <div
                      className={cn("h-full", colors.bg)}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className={cn("text-sm font-medium", colors.text)}>
                    {label}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({range})
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function ProblemsLoading() {
  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-2 w-full">
        <h1 className="text-3xl font-bold tracking-tight">Problems Archive</h1>
        <p className="text-muted-foreground">로딩 중...</p>
      </div>

      {/* Loading Table */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Contests & Problems</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[600px] bg-muted/30 animate-pulse rounded-lg" />
        </CardContent>
      </Card>

      {/* Loading Legend */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Difficulty Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-6 w-24 bg-muted/30 animate-pulse rounded-full"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-8 items-start">
          <Suspense fallback={<ProblemsLoading />}>
            <ProblemsContentWrapper searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function ProblemsContentWrapper({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  return <ProblemsContent page={page} />;
}
