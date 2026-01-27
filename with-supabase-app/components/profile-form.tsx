"use client";
import { useState, useTransition } from "react";
import { AtcoderForm } from "./atcoder-form";
import { UserInfoRow } from "@/types/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SubmissionGrass } from "./submission-grass";
import { SolvedProblemsList } from "./solved-problems";
import { SolvedProblem, refreshAtcoderRating, getSolvedProblems } from "@/app/actions";
import { RefreshCw } from "lucide-react";

export function ProfileForm({ rating, atcoder_handle }: UserInfoRow) {
    const [modify, setModify] = useState(false);

    if (rating === null || modify) {
        return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Atcoder 연동</CardTitle>
          <CardDescription>
            Atcoder 핸들을 입력하여 프로필을 연동하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AtcoderForm onSuccess={() => setModify(false)} />
        </CardContent>
      </Card>
        );
    }
    return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>프로필 정보</CardTitle>
        <CardDescription>Atcoder 계정 정보를 확인하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Atcoder Handle
            </span>
            <Badge variant="outline" className="text-sm">
              {atcoder_handle}
            </Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Rating
            </span>
            <Badge variant="default" className="text-sm">
              {rating}
            </Badge>
          </div>
        </div>
        <Separator />
        <Button
          onClick={() => setModify(true)}
          variant="outline"
          className="w-full"
        >
          수정하기
        </Button>
      </CardContent>
    </Card>
    );
}

interface ProfileWithGrassProps extends UserInfoRow {
  solvedProblems?: SolvedProblem[];
}

export function ProfileWithGrass({ rating: initialRating, atcoder_handle, solvedProblems: initialSolvedProblems = [] }: ProfileWithGrassProps) {
  const [modify, setModify] = useState(false);
  const [rating, setRating] = useState(initialRating);
  const [solvedProblems, setSolvedProblems] = useState(initialSolvedProblems);
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    if (!atcoder_handle) return;

    startTransition(async () => {
      // 레이팅 갱신
      const newRating = await refreshAtcoderRating();
      if (newRating !== null) {
        setRating(newRating);
      }

      // 푼 문제 목록 갱신
      const newSolvedProblems = await getSolvedProblems(atcoder_handle);
      setSolvedProblems(newSolvedProblems);
    });
  };

  if (rating === null || modify) {
    return (
      <>
        <div className="flex flex-col gap-2 self-start w-full">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            프로필 정보를 확인하고 관리하세요
          </p>
        </div>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Atcoder 연동</CardTitle>
            <CardDescription>
              Atcoder 핸들을 입력하여 프로필을 연동하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AtcoderForm onSuccess={() => setModify(false)} />
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between self-start w-full">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            프로필 정보를 확인하고 관리하세요
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isPending}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          {isPending ? "갱신 중..." : "정보 갱신"}
        </Button>
      </div>
      <div className="w-full max-w-5xl space-y-6">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>프로필 정보</CardTitle>
            <CardDescription>Atcoder 계정 정보를 확인하세요</CardDescription>
          </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Atcoder Handle
              </span>
              <Badge variant="outline" className="text-sm">
                {atcoder_handle}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Rating
              </span>
              <Badge variant="default" className="text-sm">
                {rating}
              </Badge>
            </div>
          </div>
          <Separator />
          <Button
            onClick={() => setModify(true)}
            variant="outline"
            className="w-full"
          >
            수정하기
          </Button>
        </CardContent>
      </Card>

      {atcoder_handle && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>AC Table</CardTitle>
            <CardDescription>
              당신의 기록을 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubmissionGrass userId={atcoder_handle} />
          </CardContent>
        </Card>
      )}

      {solvedProblems.length > 0 && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Solved Problems</CardTitle>
            <CardDescription>
              총 {solvedProblems.length}개의 문제를 풀었습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SolvedProblemsList problems={solvedProblems} />
          </CardContent>
        </Card>
      )}
      </div>
    </>
  );
}
