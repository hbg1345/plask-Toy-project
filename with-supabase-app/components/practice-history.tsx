"use client";

import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  Clock,
  Lightbulb,
  Target,
  TrendingUp,
  Circle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

        {/* 세션 목록 - 그리드 (최대 3행, 내부 스크롤) */}
        <div className="max-h-[420px] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pr-1">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/practice/${session.problem_id}`}
                className={cn(
                  "block p-3 border rounded-lg transition-colors hover:shadow-md",
                  session.solved
                    ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800 hover:border-green-400"
                    : "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800 hover:border-red-400"
                )}
              >
                {/* 상단: 결과 아이콘 + 제목 + 난이도 */}
                <div className="flex items-center gap-2 mb-2">
                  {session.solved ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  )}
                  <span
                    className={cn(
                      "font-semibold text-sm truncate flex-1",
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

                {/* 하단: 시간 + 힌트 + 날짜 */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    {/* 시간 정보 */}
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className="font-mono">
                        {formatTime(session.elapsed_time)}
                      </span>
                    </div>

                    {/* 힌트 사용 - 동그라미 5개 */}
                    <div className="flex items-center gap-0.5">
                      <Lightbulb className="h-3 w-3 text-amber-500" />
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Circle
                          key={i}
                          className={cn(
                            "h-2.5 w-2.5",
                            i < session.hints_used
                              ? "fill-amber-500 text-amber-500"
                              : "text-muted-foreground/30"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 날짜 */}
                  <span title={formatFullDate(session.created_at)}>
                    {formatDate(session.created_at)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 스크롤 안내 (9개 이상일 때만) */}
        {sessions.length > 9 && (
          <p className="text-xs text-center text-muted-foreground">
            ↕ 스크롤하여 더 보기 ({sessions.length}개 기록)
          </p>
        )}
      </CardContent>
    </Card>
  );
}
