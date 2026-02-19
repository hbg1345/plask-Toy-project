"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  AlertTriangle,
  MessageSquare,
  Minus,
  Plus,
  Eye,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveChatHistory, getChatByProblemUrl } from "@/app/actions";

// 최소 시간 (분 단위)
const MIN_TIME = 1;

/**
 * 사용자 레이팅과 문제 난이도 차이에 따라 추천 시간 계산
 * @param userRating 사용자 레이팅
 * @param problemDifficulty 문제 난이도
 * @returns 추천 시간 (분)
 */
function calculateRecommendedTime(userRating: number, problemDifficulty: number): number {
  const diff = problemDifficulty - userRating;

  // 난이도 차이에 따른 시간 계산
  // 기준: 레이팅 동일 = 30분
  // 200점 차이마다 ±10분 조정
  let baseTime = 30;

  if (diff >= 400) {
    // 매우 어려운 문제: 90분 ~ 120분
    baseTime = 90 + Math.min(30, Math.floor((diff - 400) / 200) * 15);
  } else if (diff >= 200) {
    // 어려운 문제: 60분 ~ 90분
    baseTime = 60 + Math.floor((diff - 200) / 100) * 15;
  } else if (diff >= 0) {
    // 적정 난이도: 30분 ~ 60분
    baseTime = 30 + Math.floor(diff / 100) * 15;
  } else if (diff >= -200) {
    // 쉬운 문제: 20분 ~ 30분
    baseTime = 30 + Math.floor(diff / 100) * 5;
  } else {
    // 매우 쉬운 문제: 15분 ~ 20분
    baseTime = 15;
  }

  // 5분 단위로 반올림
  const rounded = Math.round(baseTime / 5) * 5;
  return Math.max(MIN_TIME, rounded);
}

type PracticeStatus = "setup" | "running" | "paused" | "completed";

interface Hint {
  step: number;
  content: string;
}

interface PracticeClientProps {
  problemId: string;
}

interface OngoingSession {
  problemId: string;
  problemTitle: string | null;
}

function getMaxHints(userRating: number | null, difficulty: number | null): number {
  if (userRating === null || difficulty === null) return 3;
  const diff = difficulty - userRating;
  if (diff < -100) return 1;      // Easy
  if (diff <= 100) return 2;      // Normal
  if (diff <= 300) return 4;      // Hard
  return 5;                        // Very Hard
}

export default function PracticeClient({ problemId }: PracticeClientProps) {
  // localStorage key
  const PRACTICE_STATE_KEY = "ongoing_practice";

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
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isLoadingHints, setIsLoadingHints] = useState(false);
  const [problemTitle, setProblemTitle] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [otherOngoingSession, setOtherOngoingSession] = useState<OngoingSession | null>(null);
  const [recommendedTime, setRecommendedTime] = useState<number | null>(null);
  const [selectedHintIndex, setSelectedHintIndex] = useState<number | null>(null);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

  // 문제 URL 생성 (contest_id는 DB에서 가져온 후 설정)
  const [contestId, setContestId] = useState<string | null>(null);
  const problemUrl = contestId ? `https://atcoder.jp/contests/${contestId}/tasks/${problemId}` : null;

  // 세션 복원 + 다른 문제 세션 확인 (마운트 시 1회)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PRACTICE_STATE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        if (state.problemId && state.problemId !== problemId) {
          setOtherOngoingSession({
            problemId: state.problemId,
            problemTitle: state.problemTitle,
          });
        } else if (state.problemId === problemId && (state.status === "running" || state.status === "paused")) {
          const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
          const remaining = Math.max(0, state.selectedTime * 60 - elapsed);
          setSelectedTime(state.selectedTime);
          setElapsedTime(elapsed);
          setRemainingTime(remaining);
          setStatus(state.status);
          if (state.problemTitle) setProblemTitle(state.problemTitle);
        }
      }
    } catch {
      // ignore
    }
    setInitialized(true);
  }, [problemId]);

  // 진행 중인 연습 상태 저장 (초기화 완료 후에만)
  useEffect(() => {
    if (!initialized) return;

    if (status === "running" || status === "paused") {
      const practiceState = {
        problemId,
        problemTitle,
        status,
        selectedTime,
        remainingTime,
        elapsedTime,
        startedAt: Date.now() - elapsedTime * 1000,
      };
      localStorage.setItem(PRACTICE_STATE_KEY, JSON.stringify(practiceState));
    } else if (status === "completed" || status === "setup") {
      localStorage.removeItem(PRACTICE_STATE_KEY);
    }
  }, [initialized, status, problemId, problemTitle, selectedTime, remainingTime, elapsedTime]);

  // AtCoder 핸들 및 레이팅 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch("/api/user/handle");
        if (response.ok) {
          const data = await response.json();
          setAtcoderHandle(data.handle);
          setUserRating(data.rating);
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      }
    };
    fetchUserInfo();
  }, []);

  // 문제 정보 가져오기 (setup 단계에서는 AI 생성 없이 DB에서만)
  useEffect(() => {
    const fetchProblemInfo = async () => {
      if (status !== "setup") return;

      try {
        // generate=false로 DB에서만 가져오기 (AI 생성 X)
        const response = await fetch(`/api/practice/hints?problemId=${problemId}&generate=false`);
        if (response.ok) {
          const data = await response.json();
          setHints(data.hints || []);
          if (data.problemTitle) setProblemTitle(data.problemTitle);
          if (data.difficulty) setDifficulty(data.difficulty);
          if (data.contestId) setContestId(data.contestId);
        }
      } catch (error) {
        console.error("Failed to fetch problem info:", error);
      }
    };
    fetchProblemInfo();
  }, [problemId, status]);

  // 추천 시간 계산 (사용자 레이팅 & 문제 난이도 기반)
  useEffect(() => {
    if (userRating !== null && difficulty !== null && status === "setup") {
      const recommended = calculateRecommendedTime(userRating, difficulty);
      setRecommendedTime(recommended);
      setSelectedTime(recommended); // 자동 선택
    }
  }, [userRating, difficulty, status]);

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

  const maxHints = getMaxHints(userRating, difficulty);

  // 힌트가 로드되면 난이도에 맞게 해금
  useEffect(() => {
    if (hints.length > 0) {
      setUnlockedHints(Math.min(maxHints, hints.length));
    }
  }, [hints.length, maxHints]);

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
  const handleStart = async () => {
    setRemainingTime(selectedTime * 60);
    setElapsedTime(0);
    // 힌트는 처음부터 모두 해금 상태 (useEffect에서 설정됨)
    setIsSolved(null);
    setStatus("running");

    // 힌트가 없으면 AI로 생성 (백그라운드에서)
    if (hints.length === 0) {
      setIsLoadingHints(true);
      try {
        const response = await fetch(`/api/practice/hints?problemId=${problemId}&generate=true`);
        if (response.ok) {
          const data = await response.json();
          setHints(data.hints || []);
          if (data.contestId) setContestId(data.contestId);
        }
      } catch (error) {
        console.error("Failed to generate hints:", error);
      } finally {
        setIsLoadingHints(false);
      }
    }
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
    // 힌트는 계속 해금 상태 유지
    setIsSolved(null);
    setSessionSaved(false);
  };

  // 다른 세션 포기하고 새로 시작
  const handleAbandonOtherSession = () => {
    localStorage.removeItem(PRACTICE_STATE_KEY);
    setOtherOngoingSession(null);
  };

  // 채팅으로 질문하기
  const handleAskQuestion = async () => {
    if (!problemUrl) return;
    // 기존 채팅이 있는지 확인
    let chatId = await getChatByProblemUrl(problemUrl);

    if (!chatId) {
      // 기존 채팅이 없으면 새로 생성
      const title = `${problemId}: ${problemTitle || problemId}`;
      chatId = await saveChatHistory(null, [], title, problemUrl);
    }

    // 해당 채팅으로 이동
    if (chatId) {
      router.push(`/chat?chatId=${chatId}`);
    } else {
      router.push("/chat");
    }
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
              <Link href="/practice">
                <ArrowLeft className="h-4 w-4 mr-2" />
                돌아가기
              </Link>
            </Button>
            <h1 className="text-lg font-semibold">{problemId}</h1>
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
                {/* 다른 문제 진행 중 경고 */}
                {otherOngoingSession && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-amber-800 dark:text-amber-200">
                          다른 문제 연습이 진행 중입니다
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                          {otherOngoingSession.problemTitle || otherOngoingSession.problemId}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/practice/${otherOngoingSession.problemId}`}>
                              이어하기
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleAbandonOtherSession}
                            className="text-amber-700 dark:text-amber-300"
                          >
                            포기하고 새로 시작
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 레이팅 정보 표시 */}
                {userRating !== null && difficulty !== null && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">내 레이팅</span>
                      <span className="font-semibold">{userRating}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-foreground">문제 난이도</span>
                      <span className={cn(
                        "font-semibold",
                        difficulty > userRating + 200 ? "text-red-500" :
                        difficulty > userRating ? "text-amber-500" :
                        difficulty > userRating - 200 ? "text-green-500" :
                        "text-blue-500"
                      )}>
                        {difficulty}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1 pt-1 border-t">
                      <span className="text-foreground">난이도 차이</span>
                      <span className={cn(
                        "font-semibold",
                        difficulty - userRating > 200 ? "text-red-500" :
                        difficulty - userRating > 0 ? "text-amber-500" :
                        difficulty - userRating > -200 ? "text-green-500" :
                        "text-blue-500"
                      )}>
                        {difficulty - userRating > 0 ? "+" : ""}{difficulty - userRating}
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-foreground">
                  문제를 풀 시간을 설정하세요. 시간이 경과할수록 힌트가 하나씩
                  해금됩니다.
                </p>

                {/* 시간 조절 UI */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12"
                    onClick={() => setSelectedTime(Math.max(MIN_TIME, selectedTime - 5))}
                    disabled={selectedTime <= MIN_TIME}
                  >
                    <Minus className="h-5 w-5" />
                  </Button>

                  <div className="flex flex-col items-center">
                    <div className="flex items-baseline gap-1">
                      <input
                        type="number"
                        value={selectedTime}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || MIN_TIME;
                          setSelectedTime(Math.max(MIN_TIME, value));
                        }}
                        className="w-20 text-4xl font-bold tabular-nums text-center bg-transparent border-b-2 border-transparent hover:border-muted focus:border-primary focus:outline-none"
                        min={MIN_TIME}
                      />
                      <span className="text-2xl font-bold text-foreground">분</span>
                    </div>
                    {recommendedTime && (
                      <span className="text-xs text-foreground mt-1">
                        추천: {recommendedTime}분
                      </span>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12"
                    onClick={() => setSelectedTime(selectedTime + 5)}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>

                {/* 추천 시간으로 리셋 버튼 */}
                {recommendedTime && selectedTime !== recommendedTime && (
                  <div className="flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTime(recommendedTime)}
                      className="text-xs"
                    >
                      {recommendedTime}분으로 설정
                    </Button>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleStart}
                    disabled={!!otherOngoingSession}
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
                    <p className="text-sm text-foreground">소요 시간</p>
                    <p className="text-2xl font-mono font-bold">
                      {formatTime(elapsedTime)}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-foreground">사용한 힌트</p>
                    <p className="text-2xl font-bold">{unlockedHints}개</p>
                  </div>
                </div>

                {/* 모든 힌트 표시 */}
                {hints.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">전체 힌트</h3>
                    <HintsCard hints={hints.slice(0, maxHints)} />
                  </div>
                )}

                {/* 못 풀었을 때 채팅 안내 */}
                {!isSolved && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-blue-800 dark:text-blue-200">
                          문제가 어려우셨나요?
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          AI 채팅에서 이 문제에 대해 질문하고 풀이 방법을 배워보세요.
                        </p>
                        <Button
                          size="sm"
                          className="mt-3 bg-blue-600 hover:bg-blue-700"
                          onClick={handleAskQuestion}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          이 문제에 대해 질문하기
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={handleRestart}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    다시 도전
                  </Button>
                  <Button className="flex-1" asChild>
                    <Link href="/practice">다른 문제 풀기</Link>
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
                      <p className="text-xs text-foreground">
                        AtCoder 핸들을 연동해주세요
                      </p>
                    )}
                    {isSolved === false && (
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        아직 AC를 받지 못했습니다. 다시 시도해보세요!
                      </p>
                    )}
                    <p className="text-xs text-foreground">
                      AtCoder에서 AC를 받은 후 버튼을 눌러주세요
                    </p>
                  </CardContent>
                </Card>

                {/* 힌트 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      힌트 ({Math.min(maxHints, hints.length)}개)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {hints.length === 0 ? (
                      <p className="text-sm text-foreground">
                        힌트를 불러올 수 없습니다
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {hints.slice(0, maxHints).map((hint, index) => (
                          <button
                            key={hint.step}
                            onClick={() => setSelectedHintIndex(index)}
                            className="w-full p-3 rounded-lg border text-sm bg-background hover:bg-muted/50 transition-colors flex items-center justify-between"
                          >
                            <span className="font-medium">힌트 {index + 1}</span>
                            <Eye className="h-4 w-4 text-foreground" />
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 힌트 모달 */}
                <Dialog
                  open={selectedHintIndex !== null}
                  onOpenChange={(open) => !open && setSelectedHintIndex(null)}
                >
                  <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-amber-500" />
                        힌트 {selectedHintIndex !== null ? selectedHintIndex + 1 : ""}
                      </DialogTitle>
                    </DialogHeader>
                    {selectedHintIndex !== null && hints[selectedHintIndex] && (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {hints[selectedHintIndex].content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

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
