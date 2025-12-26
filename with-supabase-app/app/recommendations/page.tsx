import {
  getRecommendedProblemsByRange,
  getRatingRanges,
  type RatingRange,
} from "@/lib/atcoder/recommendations";
import { ProblemLink } from "@/components/problem-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RefreshCw } from "lucide-react";
import Link from "next/link";

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
 * 난이도를 포맷팅합니다.
 */
function formatDifficulty(difficulty: number | null): string {
  if (difficulty === null) return "N/A";
  return difficulty.toLocaleString();
}

async function RecommendationsContent() {
  // 인증 체크 및 사용자 레이팅 가져오기
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims) {
    redirect("/auth/login");
  }

  const userId = claims.sub as string;
  const { data: userData, error: userError } = await supabase
    .from("user_info")
    .select("rating, atcoder_handle")
    .eq("id", userId)
    .single();

  if (userError || !userData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>문제 추천</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            AtCoder 핸들을 연동해주세요.{" "}
            <Link href="/profile" className="text-primary hover:underline">
              프로필 페이지
            </Link>
            에서 연동할 수 있습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (userData.rating === null) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>문제 추천</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            레이팅 정보가 없습니다. AtCoder 핸들을 연동해주세요.{" "}
            <Link href="/profile" className="text-primary hover:underline">
              프로필 페이지
            </Link>
            에서 연동할 수 있습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  // 추천 문제 가져오기 (범위별로 그룹화)
  const recommendedByRange = await getRecommendedProblemsByRange(
    userData.rating,
    10
  );
  const ranges = getRatingRanges(userData.rating);

  const totalProblems = Array.from(recommendedByRange.values()).reduce(
    (sum, { problems }) => sum + problems.length,
    0
  );

  if (totalProblems === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>문제 추천</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            현재 레이팅 ({userData.rating}) ±500 범위에 해당하는 문제를 찾을 수 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">문제 추천</h1>
            <p className="text-muted-foreground">
              현재 레이팅: <span className="font-semibold">{userData.rating}</span> (
              {userData.atcoder_handle || "Unknown"}) ±500 범위의 문제
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/recommendations">
              <RefreshCw className="h-4 w-4 mr-2" />
              새로고침
            </Link>
          </Button>
        </div>
      </div>

      {/* Recommended Problems Grid */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>추천 문제 ({totalProblems}개)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ranges.map((range, rangeIndex) => {
              const rangeData = recommendedByRange.get(range.label);
              const problems = rangeData?.problems || [];

              return (
                <div key={rangeIndex} className="flex flex-col">
                  <div className="mb-3 pb-2 border-b">
                    <h3 className="text-sm font-semibold">
                      {range.label}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {problems.length}개 문제
                    </p>
                  </div>
                  <div className="space-y-2 flex-1">
                    {problems.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        이 범위에 문제가 없습니다.
                      </p>
                    ) : (
                      problems.map((problem) => {
                        const colors = getDifficultyColor(problem.difficulty);

                        return (
                          <div
                            key={problem.id}
                            className="p-3 border rounded-lg hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className={cn("text-xs font-medium", colors.text)}>
                                {formatDifficulty(problem.difficulty)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {problem.contest_id}
                              </span>
                            </div>
                            <ProblemLink
                              problemId={problem.id}
                              problemTitle={problem.title}
                              problemUrl={problem.problem_url}
                              contestId={problem.contest_id}
                              difficulty={problem.difficulty}
                              className="group"
                            >
                              <div
                                className={cn(
                                  "text-sm font-bold group-hover:underline truncate",
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
                            </ProblemLink>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function RecommendationsLoading() {
  return (
    <>
      <div className="flex flex-col gap-2 w-full">
        <h1 className="text-3xl font-bold tracking-tight">문제 추천</h1>
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>추천 문제</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[600px] bg-muted/30 animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    </>
  );
}

export default function RecommendationsPage() {
  return (
    <div className="w-full">
      <div className="flex flex-col gap-8 items-start">
        <Suspense fallback={<RecommendationsLoading />}>
          <RecommendationsContent />
        </Suspense>
      </div>
    </div>
  );
}

