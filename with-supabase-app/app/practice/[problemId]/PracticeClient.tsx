"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProblemPanel } from "@/components/problem-panel";
import { HintsCard } from "@/components/hints-card";
import {
  Clock,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Lightbulb,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// 시간 옵션 (분 단위)
const TIME_OPTIONS = [
  { label: "15분", value: 15 },
  { label: "30분", value: 30 },
  { label: "45분", value: 45 },
  { label: "1시간", value: 60 },
  { label: "1시간 30분", value: 90 },
  { label: "2시간", value: 120 },
];

type PracticeStatus = "setup" | "running" | "paused" | "completed";

interface Hint {
  step: number;
  content: string;
}

interface PracticeClientProps {
  problemId: string;
}

export default function PracticeClient({ problemId }: PracticeClientProps) {
  // 상태
  const [status, setStatus] = useState<PracticeStatus>("setup");
  const [selectedTime, setSelectedTime] = useState<number>(30); // 분
  const [remainingTime, setRemainingTime] = useState<number>(0); // 초
  const [elapsedTime, setElapsedTime] = useState<number>(0); // 초
  const [hints, setHints] = useState<Hint[]>([]);
  const [unlockedHints, setUnlockedHints] = useState<number>(0);
  const [isSolved, setIsSolved] = useState<boolean | null>(null);
  const [isCheckingSubmission, setIsCheckingSubmission] = useState(false);
  const [atcoderHandle, setAtcoderHandle] = useState<string | null>(null);
  const [isLoadingHints, setIsLoadingHints] = useState(false);
  const [problemTitle, setProblemTitle] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [sessionSaved, setSessionSaved] = useState(false);

  // 문제 URL 생성
  const contestId = problemId.split("_")[0];
  const problemUrl = `https://atcoder.jp/contests/${contestId}/tasks/${problemId}`;

  // AtCoder 핸들 가져오기
  useEffect(() => {
    const fetchHandle = async () => {
      try {
        const response = await fetch("/api/user/handle");
        if (response.ok) {
          const data = await response.json();
          setAtcoderHandle(data.handle);
        }
      } catch (error) {
        console.error("Failed to fetch handle:", error);
      }
    };
    fetchHandle();
  }, []);

  // 힌트 가져오기
  useEffect(() => {
    const fetchHints = async () => {
      if (status !== "setup") return;

      setIsLoadingHints(true);
      try {
        const response = await fetch(`/api/practice/hints?problemId=${problemId}`);
        if (response.ok) {
          const data = await response.json();
          setHints(data.hints || []);
          if (data.problemTitle) setProblemTitle(data.problemTitle);
          if (data.difficulty) setDifficulty(data.difficulty);
        }
      } catch (error) {
        console.error("Failed to fetch hints:", error);
      } finally {
        setIsLoadingHints(false);
      }
    };
    fetchHints();
  }, [problemId, status]);

  // 세션 저장
  useEffect(() => {
    const saveSession = async () => {
      if (status !== "completed" || sessionSaved) return;

      try {
        await fetch("/api/practice/save-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            problemId,
            problemTitle,
            difficulty,
            timeLimit: selectedTime * 60,
            elapsedTime,
            hintsUsed: unlockedHints,
            solved: isSolved === true,
          }),
        });
        setSessionSaved(true);
      } catch (error) {
        console.error("Failed to save session:", error);
      }
    };
    saveSession();
  }, [status, sessionSaved, problemId, problemTitle, difficulty, selectedTime, elapsedTime, unlockedHints, isSolved]);

  // 타이머 로직
  useEffect(() => {
    if (status !== "running") return;

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          setStatus("completed");
          return 0;
        }
        return prev - 1;
      });
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  // 힌트 unlock 로직 (시간 경과에 따라)
  useEffect(() => {
    if (status !== "running" || hints.length === 0) return;

    const totalTime = selectedTime * 60;
    const hintIntervals = [0.2, 0.4, 0.6, 0.8, 1.0]; // 20%, 40%, 60%, 80%, 100%
    const progress = elapsedTime / totalTime;

    let newUnlocked = 0;
    for (let i = 0; i < Math.min(5, hints.length); i++) {
      if (progress >= hintIntervals[i]) {
        newUnlocked = i + 1;
      }
    }

    if (newUnlocked > unlockedHints) {
      setUnlockedHints(newUnlocked);
    }
  }, [elapsedTime, selectedTime, hints.length, status, unlockedHints]);

  // Submission 체크
  const checkSubmission = useCallback(async () => {
    if (!atcoderHandle) return;

    setIsCheckingSubmission(true);
    try {
      const response = await fetch(
        `/api/practice/check-submission?handle=${atcoderHandle}&problemId=${problemId}`
      );
      if (response.ok) {
        const data = await response.json();
        setIsSolved(data.solved);
        if (data.solved) {
          setStatus("completed");
        }
      }
    } catch (error) {
      console.error("Failed to check submission:", error);
    } finally {
      setIsCheckingSubmission(false);
    }
  }, [atcoderHandle, problemId]);

  // 완료 버튼 클릭 시 submission 체크
  const handleComplete = async () => {
    await checkSubmission();
  };

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

  // 시작
  const handleStart = () => {
    setRemainingTime(selectedTime * 60);
    setElapsedTime(0);
    setUnlockedHints(0);
    setIsSolved(null);
    setStatus("running");
  };

  // 일시정지
  const handlePause = () => {
    setStatus("paused");
  };

  // 재개
  const handleResume = () => {
    setStatus("running");
  };

  // 포기
  const handleGiveUp = () => {
    setStatus("completed");
    setIsSolved(false);
  };

  // 다시 시작
  const handleRestart = () => {
    setStatus("setup");
    setRemainingTime(0);
    setElapsedTime(0);
    setUnlockedHints(0);
    setIsSolved(null);
    setSessionSaved(false);
  };

  // 진행률 계산
  const progress = selectedTime * 60 > 0 ? (elapsedTime / (selectedTime * 60)) * 100 : 0;

  return (
    <div className="w-full h-full flex flex-col">
      {/* 헤더 */}
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/recommendations">
                <ArrowLeft className="h-4 w-4 mr-2" />
                돌아가기
              </Link>
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{problemId}</h1>
              <p className="text-sm text-muted-foreground">연습 모드</p>
            </div>
          </div>

          {/* 타이머 */}
          {status !== "setup" && (
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xl",
                  remainingTime <= 60
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-muted"
                )}
              >
                <Clock className="h-5 w-5" />
                {formatTime(remainingTime)}
              </div>

              {status === "running" && (
                <Button variant="outline" size="sm" onClick={handlePause}>
                  <Pause className="h-4 w-4 mr-2" />
                  일시정지
                </Button>
              )}
              {status === "paused" && (
                <Button variant="outline" size="sm" onClick={handleResume}>
                  <Play className="h-4 w-4 mr-2" />
                  재개
                </Button>
              )}
            </div>
          )}
        </div>

        {/* 진행바 */}
        {status !== "setup" && (
          <div className="max-w-7xl mx-auto mt-2">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-1000"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-auto">
        {status === "setup" ? (
          /* 시간 설정 화면 */
          <div className="max-w-2xl mx-auto p-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  시간 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">
                  문제를 풀 시간을 선택하세요. 시간이 경과할수록 힌트가 하나씩
                  해금됩니다.
                </p>

                <div className="grid grid-cols-3 gap-3">
                  {TIME_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      variant={selectedTime === option.value ? "default" : "outline"}
                      onClick={() => setSelectedTime(option.value)}
                      className="h-16 text-lg"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Lightbulb className="h-4 w-4" />
                    <span>
                      {isLoadingHints
                        ? "힌트 로딩 중..."
                        : hints.length > 0
                          ? `${Math.min(5, hints.length)}개의 힌트가 준비되었습니다`
                          : "힌트를 불러올 수 없습니다"}
                    </span>
                  </div>

                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleStart}
                    disabled={isLoadingHints}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    연습 시작
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : status === "completed" ? (
          /* 완료 화면 */
          <div className="max-w-2xl mx-auto p-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isSolved ? (
                    <>
                      <CheckCircle className="h-6 w-6 text-green-500" />
                      문제를 풀었습니다!
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 text-red-500" />
                      시간 초과 / 포기
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">소요 시간</p>
                    <p className="text-2xl font-mono font-bold">
                      {formatTime(elapsedTime)}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">사용한 힌트</p>
                    <p className="text-2xl font-bold">{unlockedHints}개</p>
                  </div>
                </div>

                {/* 모든 힌트 표시 */}
                {hints.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">전체 힌트</h3>
                    <HintsCard hints={hints.slice(0, 5)} />
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={handleRestart}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    다시 도전
                  </Button>
                  <Button className="flex-1" asChild>
                    <Link href="/recommendations">다른 문제 풀기</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* 문제 풀이 화면 */
          <div className="h-full flex">
            {/* 문제 패널 */}
            <div className="flex-1 border-r overflow-auto">
              <ProblemPanel problemUrl={problemUrl} />
            </div>

            {/* 힌트 & 제출 패널 */}
            <div className="w-80 flex-shrink-0 p-4 overflow-auto">
              <div className="space-y-4">
                {/* 완료 버튼 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">문제 풀이 완료</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleComplete}
                      disabled={isCheckingSubmission || !atcoderHandle}
                    >
                      {isCheckingSubmission ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          확인 중...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          풀었어요!
                        </>
                      )}
                    </Button>
                    {!atcoderHandle && (
                      <p className="text-xs text-muted-foreground">
                        AtCoder 핸들을 연동해주세요
                      </p>
                    )}
                    {isSolved === false && (
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        아직 AC를 받지 못했습니다. 다시 시도해보세요!
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      AtCoder에서 AC를 받은 후 버튼을 눌러주세요
                    </p>
                  </CardContent>
                </Card>

                {/* 힌트 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      힌트 ({unlockedHints}/{Math.min(5, hints.length)})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {hints.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        힌트를 불러올 수 없습니다
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {hints.slice(0, 5).map((hint, index) => {
                          const isUnlocked = index < unlockedHints;
                          const unlockProgress =
                            (index + 1) * 20; // 20%, 40%, 60%, 80%, 100%

                          return (
                            <div
                              key={hint.step}
                              className={cn(
                                "p-3 rounded-lg border text-sm",
                                isUnlocked
                                  ? "bg-background"
                                  : "bg-muted/50 text-muted-foreground"
                              )}
                            >
                              <div className="font-medium mb-1">
                                힌트 {index + 1}
                              </div>
                              {isUnlocked ? (
                                <p>{hint.content}</p>
                              ) : (
                                <p className="text-xs">
                                  {unlockProgress}% 경과 시 해금
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 포기 버튼 */}
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleGiveUp}
                >
                  포기하기
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
