"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTodayTokenUsage, getTotalTokenUsage, TokenUsage } from "@/app/actions";
import { Zap } from "lucide-react";

type UsageTab = "today" | "total";

export function TokenUsageCard() {
  const [todayUsage, setTodayUsage] = useState<TokenUsage | null>(null);
  const [totalUsage, setTotalUsage] = useState<TokenUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<UsageTab>("today");

  useEffect(() => {
    async function fetchUsage() {
      try {
        const [today, total] = await Promise.all([
          getTodayTokenUsage(),
          getTotalTokenUsage(),
        ]);
        setTodayUsage(today);
        setTotalUsage(total);
      } catch (error) {
        console.error("Failed to fetch token usage:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUsage();
  }, []);

  const usage = activeTab === "today" ? todayUsage : totalUsage;

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            API 사용량
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            API 사용량
          </CardTitle>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as UsageTab)}>
            <TabsList className="h-8">
              <TabsTrigger value="today" className="text-xs px-3">
                오늘
              </TabsTrigger>
              <TabsTrigger value="total" className="text-xs px-3">
                전체
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <CardDescription>
          {activeTab === "today" ? "오늘의" : "전체"} Gemini API 토큰 사용 현황
        </CardDescription>
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
