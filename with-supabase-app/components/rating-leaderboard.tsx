"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Trophy, User } from "lucide-react";
import type { RatingChangeEntry } from "@/lib/rating/leaderboard";
import Image from "next/image";

interface RatingLeaderboardProps {
  topGainers: RatingChangeEntry[];
  topLosers: RatingChangeEntry[];
  myRank: {
    rank: number;
    totalUsers: number;
    ratingChange: number;
    currentRating: number;
  } | null;
}

function RatingListItem({
  rank,
  entry,
  type,
}: {
  rank: number;
  entry: RatingChangeEntry;
  type: "gainer" | "loser";
}) {
  const changeColor = type === "gainer" ? "text-green-500" : "text-red-500";
  const changePrefix = type === "gainer" ? "+" : "";

  return (
    <div className="flex items-center gap-3 py-2 border-b last:border-0">
      <span className="w-6 text-sm font-medium text-foreground">
        {rank}
      </span>
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
        {entry.avatar_url ? (
          <Image
            src={entry.avatar_url}
            alt={entry.atcoder_handle}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <User className="h-4 w-4 text-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{entry.atcoder_handle}</p>
        <p className="text-xs text-foreground">
          {entry.previous_rating} → {entry.current_rating}
        </p>
      </div>
      <Badge
        variant={type === "gainer" ? "default" : "destructive"}
        className={changeColor}
      >
        {changePrefix}
        {entry.rating_change}
      </Badge>
    </div>
  );
}

function RatingList({
  entries,
  type,
}: {
  entries: RatingChangeEntry[];
  type: "gainer" | "loser";
}) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-foreground">
        데이터가 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {entries.map((entry, index) => (
        <RatingListItem
          key={entry.user_id}
          rank={index + 1}
          entry={entry}
          type={type}
        />
      ))}
    </div>
  );
}

export function RatingLeaderboard({
  topGainers,
  topLosers,
  myRank,
}: RatingLeaderboardProps) {
  const hasData = topGainers.length > 0 || topLosers.length > 0;

  if (!hasData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>이번 주 레이팅 변화</CardTitle>
          <CardDescription>
            아직 레이팅 데이터가 수집되지 않았습니다.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Gainers Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-green-500" />
              이번 주 상승 Top 10
            </CardTitle>
            <CardDescription>
              지난 일주일간 레이팅이 가장 많이 오른 사용자
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[320px] pr-4">
              <RatingList entries={topGainers} type="gainer" />
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Top Losers Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingDown className="h-5 w-5 text-red-500" />
              이번 주 하락 Top 10
            </CardTitle>
            <CardDescription>
              지난 일주일간 레이팅이 가장 많이 떨어진 사용자
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[320px] pr-4">
              <RatingList entries={topLosers} type="loser" />
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* My Rank Card */}
      {myRank && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-yellow-500" />
              나의 레이팅 변화
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-foreground">전체 순위</p>
                <p className="text-2xl font-bold">
                  {myRank.rank}
                  <span className="text-sm font-normal text-foreground">
                    {" "}
                    / {myRank.totalUsers}명
                  </span>
                </p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-sm text-foreground">레이팅 변화</p>
                <p
                  className={`text-2xl font-bold ${
                    myRank.ratingChange > 0
                      ? "text-green-500"
                      : myRank.ratingChange < 0
                        ? "text-red-500"
                        : ""
                  }`}
                >
                  {myRank.ratingChange > 0 ? "+" : ""}
                  {myRank.ratingChange}
                </p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-sm text-foreground">현재 레이팅</p>
                <p className="text-2xl font-bold">{myRank.currentRating}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
