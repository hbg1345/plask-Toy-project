"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTodayTokenUsage, TokenUsage } from "@/app/actions";
import { Zap } from "lucide-react";

export function TokenUsageCard() {
  const [usage, setUsage] = useState<TokenUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const data = await getTodayTokenUsage();
        setUsage(data);
      } catch (error) {
        console.error("Failed to fetch token usage:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUsage();
  }, []);

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            오늘의 API 사용량
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          오늘의 API 사용량
        </CardTitle>
        <CardDescription>Gemini API 토큰 사용 현황</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">입력 토큰</p>
            <p className="text-2xl font-bold">
              {usage?.total_input_tokens.toLocaleString() || 0}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">출력 토큰</p>
            <p className="text-2xl font-bold">
              {usage?.total_output_tokens.toLocaleString() || 0}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">총 토큰</p>
            <p className="text-2xl font-bold text-primary">
              {usage?.total_tokens.toLocaleString() || 0}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">요청 수</p>
            <p className="text-2xl font-bold">
              {usage?.request_count.toLocaleString() || 0}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
