"use client";
import { useState } from "react";
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

export function ProfileWithGrass({ rating, atcoder_handle }: UserInfoRow) {
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
    <div className="w-full max-w-4xl space-y-6">
      <Card className="w-full">
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
            <CardTitle>제출 기록</CardTitle>
            <CardDescription>
              GitHub 잔디 스타일로 표시되는 최근 1년간의 제출 기록
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubmissionGrass userId={atcoder_handle} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
