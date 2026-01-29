"use client";

import { PracticeSession, PracticeStats } from "@/app/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Lightbulb, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PracticeHistoryProps {
  sessions: PracticeSession[];
  stats: PracticeStats;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}시간 ${m}분`;
  }
  if (m > 0) {
    return `${m}분 ${s}초`;
  }
  return `${s}초`;
}

function getDifficultyColor(difficulty: number | null): string {
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
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
          <p className="text-sm text-muted-foreground">
            문제를 풀어보세요! 연습 기록이 여기에 표시됩니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  const solveRate = stats.totalSessions > 0
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
          총 {stats.totalSessions}회 연습 · {stats.solvedCount}개 해결 ({solveRate}%)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 통계 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-muted rounded-lg text-center">
            <p className="text-2xl font-bold">{stats.totalSessions}</p>
            <p className="text-xs text-muted-foreground">총 연습</p>
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">{stats.solvedCount}</p>
            <p className="text-xs text-muted-foreground">해결</p>
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <p className="text-2xl font-bold">{formatTime(Math.round(stats.avgElapsedTime))}</p>
            <p className="text-xs text-muted-foreground">평균 시간</p>
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <p className="text-2xl font-bold">{stats.avgHintsUsed.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">평균 힌트</p>
          </div>
        </div>

        {/* 세션 목록 */}
        <div className="space-y-2">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/practice/${session.problem_id}`}
              className="block"
            >
              <div
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors",
                  session.solved
                    ? "border-green-200 dark:border-green-900"
                    : "border-border"
                )}
              >
                {/* 결과 아이콘 */}
                {session.solved ? (
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                )}

                {/* 난이도 표시 */}
                <div
                  className={cn(
                    "w-2 h-8 rounded-full flex-shrink-0",
                    getDifficultyColor(session.difficulty)
                  )}
                />

                {/* 문제 정보 */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {session.problem_title || session.problem_id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.problem_id}
                  </p>
                </div>

                {/* 힌트 수 */}
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Lightbulb className="h-4 w-4" />
                  <span className="text-sm">{session.hints_used}</span>
                </div>

                {/* 소요 시간 */}
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{formatTime(session.elapsed_time)}</span>
                </div>

                {/* 날짜 */}
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {formatDate(session.created_at)}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
