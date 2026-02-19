"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Play, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OngoingPracticeState {
  problemId: string;
  problemTitle: string | null;
  status: "running" | "paused";
  selectedTime: number;
  remainingTime: number;
  elapsedTime: number;
  startedAt: number;
}

const PRACTICE_STATE_KEY = "ongoing_practice";

export function OngoingSessionCard() {
  const [practiceState, setPracticeState] = useState<OngoingPracticeState | null>(null);
  const [currentRemainingTime, setCurrentRemainingTime] = useState<number>(0);

  // localStorage에서 상태 읽기
  useEffect(() => {
    const checkPracticeState = () => {
      try {
        const saved = localStorage.getItem(PRACTICE_STATE_KEY);
        if (saved) {
          const state = JSON.parse(saved) as OngoingPracticeState;
          setPracticeState(state);

          // 경과 시간 계산 (running 상태일 때만)
          if (state.status === "running") {
            const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
            const remaining = Math.max(0, state.selectedTime * 60 - elapsed);
            setCurrentRemainingTime(remaining);
          } else {
            setCurrentRemainingTime(state.remainingTime);
          }
        } else {
          setPracticeState(null);
        }
      } catch {
        setPracticeState(null);
      }
    };

    // 초기 체크
    checkPracticeState();

    // 주기적으로 체크
    const interval = setInterval(checkPracticeState, 1000);

    return () => clearInterval(interval);
  }, []);

  // 시간 포맷
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!practiceState) {
    return null;
  }

  const isUrgent = currentRemainingTime <= 60 && currentRemainingTime > 0;
  const isExpired = currentRemainingTime <= 0;

  return (
    <Card
      className={cn(
        "w-full border-2",
        isExpired
          ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30"
          : isUrgent
            ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30"
            : "border-primary/50 bg-primary/5"
      )}
    >
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* 상태 아이콘 */}
            <div
              className={cn(
                "flex items-center justify-center w-12 h-12 rounded-full",
                practiceState.status === "running"
                  ? "bg-green-100 dark:bg-green-900"
                  : "bg-yellow-100 dark:bg-yellow-900"
              )}
            >
              {practiceState.status === "running" ? (
                <Clock className="h-6 w-6 text-green-600 dark:text-green-400 animate-pulse" />
              ) : (
                <Play className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              )}
            </div>

            {/* 정보 */}
            <div>
              <p className="text-sm text-foreground">진행 중인 연습</p>
              <p className="font-semibold">
                {practiceState.problemTitle || practiceState.problemId}
              </p>
              <div className="flex items-center gap-2 text-sm text-foreground mt-1">
                <span>
                  {practiceState.status === "running" ? "진행 중" : "일시정지"}
                </span>
                <span>·</span>
                <span
                  className={cn(
                    "font-mono font-medium",
                    isExpired
                      ? "text-red-600 dark:text-red-400"
                      : isUrgent
                        ? "text-amber-600 dark:text-amber-400"
                        : ""
                  )}
                >
                  {isExpired ? "시간 초과" : `남은 시간: ${formatTime(currentRemainingTime)}`}
                </span>
              </div>
            </div>
          </div>

          {/* 이어하기 / 포기 버튼 */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950"
              onClick={() => {
                localStorage.removeItem(PRACTICE_STATE_KEY);
                setPracticeState(null);
              }}
            >
              포기
            </Button>
            <Button asChild>
              <Link href={`/practice/${practiceState.problemId}`}>
                이어하기
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 진행 중인 연습이 있는지 확인하는 유틸리티 함수
 */
export function hasOngoingPractice(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PRACTICE_STATE_KEY) !== null;
  } catch {
    return false;
  }
}
