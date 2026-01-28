"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  startProblemCollection,
  startProblemCollectionFromKenkoo,
  collectAllUserRatings,
} from "@/app/actions";
import { RefreshCw } from "lucide-react";

export default function CollectProblemsPage() {
  const [limit, setLimit] = useState<string>("5");
  const [startFrom, setStartFrom] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);
  const [useKenkoo, setUseKenkoo] = useState(true); // 기본값: Kenkoo 사용
  const [result, setResult] = useState<{
    success: boolean;
    processed?: number;
    saved?: number;
    error?: string;
  } | null>(null);

  // 레이팅 수집 상태
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const [ratingResult, setRatingResult] = useState<{
    success: boolean;
    processed: number;
    saved: number;
    errors: string[];
  } | null>(null);

  const handleCollect = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      if (useKenkoo) {
        // Kenkoo API 사용 (권장)
        const result = await startProblemCollectionFromKenkoo();
        setResult(result);
      } else {
        // 기존 방식 (AtCoder 크롤링)
        const limitNum = limit ? parseInt(limit) : undefined;
        const startFromNum = parseInt(startFrom) || 0;
        const result = await startProblemCollection(limitNum, startFromNum);
        setResult(result);
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatingCollect = async () => {
    setIsRatingLoading(true);
    setRatingResult(null);

    try {
      const result = await collectAllUserRatings();
      setRatingResult(result);
    } catch (error) {
      setRatingResult({
        success: false,
        processed: 0,
        saved: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      });
    } finally {
      setIsRatingLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      {/* 레이팅 수집 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>레이팅 수집</CardTitle>
          <CardDescription>
            모든 사용자의 AtCoder 레이팅을 수집하여 기록합니다.
            <br />
            <strong>일주일에 한 번</strong> 실행해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleRatingCollect}
            disabled={isRatingLoading}
            className="w-full"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRatingLoading ? "animate-spin" : ""}`}
            />
            {isRatingLoading ? "수집 중..." : "레이팅 수집 시작"}
          </Button>

          {ratingResult && (
            <div
              className={`p-4 rounded-md ${
                ratingResult.success
                  ? "bg-green-50 border border-green-200 dark:bg-green-950 dark:border-green-800"
                  : "bg-red-50 border border-red-200 dark:bg-red-950 dark:border-red-800"
              }`}
            >
              {ratingResult.success ? (
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-200">
                    수집 완료!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    처리된 사용자: {ratingResult.processed}명
                    <br />
                    저장 성공: {ratingResult.saved}명
                  </p>
                  {ratingResult.errors.length > 0 && (
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                      에러: {ratingResult.errors.length}건
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-200">
                    오류 발생
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {ratingResult.errors.join(", ")}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 문제 수집 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>문제 수집</CardTitle>
          <CardDescription>
            AtCoder 문제 아카이브를 수집하여 데이터베이스에 저장합니다.
            <br />
            <strong>주의:</strong> 이 작업은 매우 오래 걸릴 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="useKenkoo">수집 방식</Label>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="kenkoo"
                name="method"
                checked={useKenkoo}
                onChange={() => setUseKenkoo(true)}
                className="w-4 h-4"
              />
              <Label htmlFor="kenkoo" className="font-normal cursor-pointer">
                Kenkoo API 사용 (권장, 빠름)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="crawl"
                name="method"
                checked={!useKenkoo}
                onChange={() => setUseKenkoo(false)}
                className="w-4 h-4"
              />
              <Label htmlFor="crawl" className="font-normal cursor-pointer">
                AtCoder 크롤링 (느림, 테스트용)
              </Label>
            </div>
          </div>

          {!useKenkoo && (
            <>
              <div className="space-y-2">
                <Label htmlFor="limit">
                  처리할 최대 콘테스트 수 (테스트용, 비워두면 전체)
                </Label>
                <Input
                  id="limit"
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="예: 5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startFrom">
                  시작할 콘테스트 인덱스 (재개용)
                </Label>
                <Input
                  id="startFrom"
                  type="number"
                  value={startFrom}
                  onChange={(e) => setStartFrom(e.target.value)}
                  placeholder="0"
                />
              </div>
            </>
          )}

          <Button
            onClick={handleCollect}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading
              ? "수집 중..."
              : useKenkoo
              ? "Kenkoo API로 문제 수집 시작"
              : "문제 수집 시작"}
          </Button>

          {result && (
            <div
              className={`p-4 rounded-md ${
                result.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              {result.success ? (
                <div>
                  <p className="font-semibold text-green-800">수집 완료!</p>
                  <p className="text-sm text-green-700">
                    처리된 콘테스트: {result.processed}개
                    <br />
                    저장된 문제: {result.saved}개
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-red-800">오류 발생</p>
                  <p className="text-sm text-red-700">{result.error}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
