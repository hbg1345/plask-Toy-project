import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getTaskMetadata, getEditorial } from "@/lib/atcoder/contest";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const HintsSchema = z.object({
  hints: z.array(
    z.object({
      step: z.number(),
      content: z.string(),
    })
  ),
});

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const problemId = request.nextUrl.searchParams.get("problemId");
  const generate = request.nextUrl.searchParams.get("generate") !== "false"; // 기본값 true

  if (!problemId) {
    return NextResponse.json({ error: "problemId required" }, { status: 400 });
  }

  try {
    // 1. DB에서 기존 힌트 및 문제 정보 확인
    const { data: problemData } = await supabase
      .from("problems")
      .select("editorial, hints, title, difficulty")
      .eq("id", problemId)
      .single();

    // 이미 힌트가 있으면 반환
    if (problemData?.hints && Array.isArray(problemData.hints) && problemData.hints.length > 0) {
      return NextResponse.json({
        hints: problemData.hints,
        problemTitle: problemData.title,
        difficulty: problemData.difficulty,
      });
    }

    // generate=false면 DB에 없어도 AI 생성 안 함
    if (!generate) {
      return NextResponse.json({
        hints: [],
        problemTitle: problemData?.title,
        difficulty: problemData?.difficulty,
      });
    }

    // 2. Editorial 가져오기 (없으면 크롤링)
    let editorial = problemData?.editorial;
    const contestId = problemId.split("_")[0];
    const problemUrl = `https://atcoder.jp/contests/${contestId}/tasks/${problemId}`;

    if (!editorial) {
      const fetchedEditorial = await getEditorial(problemUrl);
      if (typeof fetchedEditorial === "string" && !fetchedEditorial.startsWith("에러") && !fetchedEditorial.startsWith("오류")) {
        editorial = fetchedEditorial;
        // DB에 저장
        await supabase
          .from("problems")
          .update({ editorial: fetchedEditorial })
          .eq("id", problemId);
      }
    }

    // 3. 문제 메타데이터 가져오기
    const metadata = await getTaskMetadata(problemUrl);
    if (typeof metadata === "string") {
      return NextResponse.json({ hints: [], error: "Failed to fetch problem" });
    }

    // 4. AI로 힌트 생성
    const prompt = `You are creating step-by-step hints for an AtCoder problem.
Create exactly 5 hints that guide the solver through the problem-solving process.

Problem Title: ${metadata.title}
Problem Statement: ${metadata.problem_statement}
Constraints: ${metadata.constraint}
${editorial ? `Editorial: ${editorial}` : ""}

Rules:
- Each hint should be a MINIMAL, independent logical insight
- Hints should NOT overlap - each reveals new information
- Order by logical problem-solving flow (observation → approach → key insight → implementation → optimization)
- Use Korean language
- Each hint should be 1-2 sentences max
- Do NOT reveal the full solution
- Progressive difficulty: hint 1 is a gentle nudge, hint 5 is almost the answer

Generate exactly 5 hints.`;

    const result = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: HintsSchema,
      prompt,
    });

    const hints = result.object.hints;

    // 5. DB에 힌트 저장
    await supabase
      .from("problems")
      .update({ hints })
      .eq("id", problemId);

    return NextResponse.json({
      hints,
      problemTitle: metadata.title,
      difficulty: problemData?.difficulty,
    });
  } catch (error) {
    console.error("Failed to generate hints:", error);
    return NextResponse.json({ hints: [], error: "Failed to generate hints" });
  }
}
