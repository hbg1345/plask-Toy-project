import { createClient } from "@/lib/supabase/server";
import { extractContestId } from "@/lib/atcoder/problems";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  // 사용자 인증 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chatId, problemId } = await req.json();

  if (!chatId || !problemId) {
    return NextResponse.json(
      { error: "chatId and problemId are required" },
      { status: 400 }
    );
  }

  const contestId = extractContestId(problemId);
  const problemUrl = `https://atcoder.jp/contests/${contestId}/tasks/${problemId}`;

  // 문제 정보 가져오기
  const { data: problemData } = await supabase
    .from("problems")
    .select("title")
    .eq("id", problemId)
    .single();

  // chat_history 업데이트 (문제 전환 시 이전 힌트 삭제)
  const { error: updateError } = await supabase
    .from("chat_history")
    .update({
      problem_url: problemUrl,
      title: problemData?.title || problemId,
      hints: null,
    })
    .eq("id", chatId)
    .eq("user_id", user.id); // 보안: 본인 채팅만 수정 가능

  if (updateError) {
    console.error("Failed to link problem:", updateError);
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    problemUrl,
    problemId,
    title: problemData?.title || problemId,
  });
}
