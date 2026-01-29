"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  Clock,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  RotateCcw,
  Target,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PracticeSession, PracticeStats } from "@/app/actions";

interface PracticeHistoryProps {
  sessions: PracticeSession[];
  stats: PracticeStats;
}

/**
 * AtCoder 레이팅 색상 (난이도에 따라)
 */
function getDifficultyColor(difficulty: number | null): string {
  if (difficulty === null) return "text-gray-500 dark:text-gray-400";
  if (difficulty < 400) return "text-gray-500 dark:text-gray-400";
  if (difficulty < 800) return "text-amber-800 dark:text-amber-600";
  if (difficulty < 1200) return "text-green-600 dark:text-green-400";
  if (difficulty < 1600) return "text-cyan-600 dark:text-cyan-400";
  if (difficulty < 2000) return "text-blue-700 dark:text-blue-500";
  if (difficulty < 2400) return "text-yellow-500 dark:text-yellow-300";
  if (difficulty < 2800) return "text-orange-500 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

function getDifficultyBgColor(difficulty: number | null): string {
  if (difficulty === null) return "bg-gray-400";
  if (difficulty < 400) return "bg-gray-400";
  if (difficulty < 800) return "bg-amber-800";
  if (difficulty < 1200) return "bg-green-600";
  if (difficulty < 1600) return "bg-cyan-500";
  if (difficulty < 2000) return "bg-blue-700";
  if (difficulty < 2400) return "bg-yellow-400";
  if (difficulty < 2800) return "bg-orange-500";
  return "bg-red-600";
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTimeKorean(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) {
    return `${h}시간 ${m}분`;
  }
  if (m > 0) {
    return `${m}분`;
  }
  return `${seconds}초`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "오늘";
  } else if (diffDays === 1) {
    return "어제";
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    });
  }
}

function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PracticeHistory({ sessions, stats }: PracticeHistoryProps) {
  const [showAll, setShowAll] = useState(false);
  const displayedSessions = showAll ? sessions : sessions.slice(0, 5);

  if (sessions.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            연습 기록
          </CardTitle>
          <CardDescription>아직 연습 기록이 없습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            위에서 추천 문제를 선택해서 연습을 시작해보세요!
          </p>
        </CardContent>
      </Card>
    );
  }

  const successRate = stats.totalSessions > 0
    ? Math.round((stats.solvedCount / stats.totalSessions) * 100)
    : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          연습 기록
        </CardTitle>
        <CardDescription>
          총 {stats.totalSessions}회 연습 · {stats.solvedCount}개 해결 ({successRate}%)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 통계 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-2xl font-bold">{stats.totalSessions}</p>
            <p className="text-xs text-muted-foreground">총 세션</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className={cn(
                "h-5 w-5",
                successRate >= 50 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
              )} />
              <p className={cn(
                "text-2xl font-bold",
                successRate >= 50 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
              )}>
                {successRate}%
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              성공률 ({stats.solvedCount}/{stats.totalSessions})
            </p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-2xl font-bold font-mono">
              {formatTimeKorean(Math.round(stats.avgElapsedTime))}
            </p>
            <p className="text-xs text-muted-foreground">평균 소요 시간</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <p className="text-2xl font-bold">{stats.avgHintsUsed.toFixed(1)}</p>
            </div>
            <p className="text-xs text-muted-foreground">평균 힌트 사용</p>
          </div>
        </div>

        {/* 세션 목록 */}
        <div className="space-y-3">
          {displayedSessions.map((session) => {
            const timeUsagePercent = Math.round(
              (session.elapsed_time / session.time_limit) * 100
            );
            const isOverTime = session.elapsed_time >= session.time_limit;

            return (
              <div
                key={session.id}
                className={cn(
                  "p-4 border rounded-lg transition-colors",
                  session.solved
                    ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                    : "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* 왼쪽: 문제 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {session.solved ? (
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                      )}
                      {/* 난이도 바 */}
                      <div
                        className={cn(
                          "w-1.5 h-5 rounded-full flex-shrink-0",
                          getDifficultyBgColor(session.difficulty)
                        )}
                      />
                      <span
                        className={cn(
                          "font-semibold truncate",
                          getDifficultyColor(session.difficulty)
                        )}
                        title={session.problem_title || session.problem_id}
                      >
                        {session.problem_title || session.problem_id}
                      </span>
                      {session.difficulty && (
                        <Badge variant="outline" className={cn(
                          "text-xs flex-shrink-0",
                          getDifficultyColor(session.difficulty)
                        )}>
                          {session.difficulty}
                        </Badge>
                      )}
                    </div>

                    {/* 상세 정보 */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                      {/* 시간 */}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="font-mono">
                          {formatTime(session.elapsed_time)}
                        </span>
                        <span className="text-xs">
                          / {formatTime(session.time_limit)}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-medium",
                            isOverTime
                              ? "text-red-600 dark:text-red-400"
                              : timeUsagePercent > 80
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-green-600 dark:text-green-400"
                          )}
                        >
                          ({timeUsagePercent}%)
                        </span>
                      </div>

                      {/* 힌트 */}
                      <div className="flex items-center gap-1">
                        <Lightbulb className="h-3.5 w-3.5" />
                        <span>힌트 {session.hints_used}개</span>
                      </div>

                      {/* 날짜 */}
                      <span
                        className="text-xs"
                        title={formatFullDate(session.created_at)}
                      >
                        {formatDate(session.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* 오른쪽: 액션 버튼 */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!session.solved && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
                      >
                        <Link href={`/chat?problemId=${session.problem_id}`}>
                          <MessageSquare className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">질문</span>
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/practice/${session.problem_id}`}>
                        <RotateCcw className="h-4 w-4" />
                        <span className="hidden sm:inline ml-1">다시</span>
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* 시간 진행바 */}
                <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      session.solved
                        ? "bg-green-500"
                        : isOverTime
                          ? "bg-red-500"
                          : "bg-amber-500"
                    )}
                    style={{ width: `${Math.min(timeUsagePercent, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* 더보기/접기 버튼 */}
        {sessions.length > 5 && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                접기
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                더보기 ({sessions.length - 5}개 더)
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
