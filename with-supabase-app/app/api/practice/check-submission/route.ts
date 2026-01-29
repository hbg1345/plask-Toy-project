import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const handle = request.nextUrl.searchParams.get("handle");
  const problemId = request.nextUrl.searchParams.get("problemId");

  if (!handle || !problemId) {
    return NextResponse.json(
      { error: "handle and problemId required" },
      { status: 400 }
    );
  }

  try {
    // Kenkoo API로 최근 제출 확인
    // from_second를 현재 시간 - 3시간으로 설정 (연습 세션 동안의 제출만 확인)
    const threeHoursAgo = Math.floor(Date.now() / 1000) - 3 * 60 * 60;

    const response = await fetch(
      `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${handle}&from_second=${threeHoursAgo}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch submissions" },
        { status: 500 }
      );
    }

    const submissions = await response.json();

    // 해당 문제에 대한 AC 제출이 있는지 확인
    const solved = submissions.some(
      (sub: { problem_id: string; result: string }) =>
        sub.problem_id === problemId && sub.result === "AC"
    );

    return NextResponse.json({ solved });
  } catch (error) {
    console.error("Failed to check submission:", error);
    return NextResponse.json(
      { error: "Failed to check submission" },
      { status: 500 }
    );
  }
}
