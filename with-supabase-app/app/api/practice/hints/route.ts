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

type HintItem = { step: number; content: string };

const HINTS_COLUMNS: Record<string, string> = {
  ko: "hints",
  en: "hints_en",
  ja: "hints_ja",
};

function buildPrompt(
  langLabel: string,
  metadata: { title: string; problem_statement: string; constraint: string | null },
  editorial: string | null
) {
  return `You are creating step-by-step hints for an AtCoder problem.
Create exactly 5 hints that guide the solver through the problem-solving process.

Problem Title: ${metadata.title}
Problem Statement: ${metadata.problem_statement}
Constraints: ${metadata.constraint}
${editorial ? `Editorial: ${editorial}` : ""}

Rules:
- Each hint should be a MINIMAL, independent logical insight
- Hints should NOT overlap - each reveals new information
- Order by logical problem-solving flow (observation → approach → key insight → implementation → optimization)
- Use ${langLabel} language
- Each hint should be 1-2 sentences max
- Do NOT reveal the full solution
- Progressive difficulty: hint 1 is a gentle nudge, hint 5 is almost the answer

Generate exactly 5 hints.`;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const problemId = request.nextUrl.searchParams.get("problemId");
  const generate = request.nextUrl.searchParams.get("generate") !== "false";
  const lang = request.nextUrl.searchParams.get("lang") || "ko";

  if (!problemId) {
    return NextResponse.json({ error: "problemId required" }, { status: 400 });
  }

  try {
    // 1. DB에서 기존 힌트 및 문제 정보 확인
    const { data: problemData } = await supabase
      .from("problems")
      .select("editorial, hints, hints_en, hints_ja, title, difficulty")
      .eq("id", problemId)
      .single();

    const { data: cpData } = await supabase
      .from("contest_problems")
      .select("contest_id")
      .eq("problem_id", problemId)
      .single();
    const contestId = cpData?.contest_id || problemId.split("_")[0];

    // 현재 언어의 캐시된 힌트 확인
    const col = HINTS_COLUMNS[lang] || "hints";
    const cachedHints = problemData?.[col as keyof typeof problemData] as HintItem[] | null;
    if (cachedHints && Array.isArray(cachedHints) && cachedHints.length > 0) {
      return NextResponse.json({
        hints: cachedHints,
        problemTitle: problemData?.title,
        difficulty: problemData?.difficulty,
        contestId,
      });
    }

    // generate=false면 AI 생성 안 함
    if (!generate) {
      return NextResponse.json({
        hints: [],
        problemTitle: problemData?.title,
        difficulty: problemData?.difficulty,
        contestId,
      });
    }

    // 2. Editorial 가져오기
    let editorial = problemData?.editorial;
    const problemUrl = `https://atcoder.jp/contests/${contestId}/tasks/${problemId}`;

    if (!editorial) {
      const fetchedEditorial = await getEditorial(problemUrl);
      if (typeof fetchedEditorial === "string" && !fetchedEditorial.startsWith("에러") && !fetchedEditorial.startsWith("오류")) {
        editorial = fetchedEditorial;
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

    // 4. 3개 언어 힌트를 병렬 생성
    const langs = [
      { key: "ko", label: "Korean" },
      { key: "en", label: "English" },
      { key: "ja", label: "Japanese" },
    ];

    const results = await Promise.allSettled(
      langs.map((l) =>
        generateObject({
          model: google("gemini-2.0-flash"),
          schema: HintsSchema,
          prompt: buildPrompt(l.label, metadata, editorial ?? null),
        }).then((r) => ({ key: l.key, hints: r.object.hints }))
      )
    );

    // 결과 수집
    const hintsMap: Record<string, HintItem[]> = {};
    for (const r of results) {
      if (r.status === "fulfilled") {
        hintsMap[r.value.key] = r.value.hints;
      }
    }

    // 5. DB에 3개 언어 힌트 한번에 저장
    const updateData: Record<string, HintItem[]> = {};
    if (hintsMap.ko) updateData.hints = hintsMap.ko;
    if (hintsMap.en) updateData.hints_en = hintsMap.en;
    if (hintsMap.ja) updateData.hints_ja = hintsMap.ja;

    if (Object.keys(updateData).length > 0) {
      await supabase
        .from("problems")
        .update(updateData)
        .eq("id", problemId);
    }

    // 요청 언어의 힌트 반환
    const responseHints = hintsMap[lang] || hintsMap.ko || [];

    return NextResponse.json({
      hints: responseHints,
      problemTitle: metadata.title,
      difficulty: problemData?.difficulty,
      contestId,
    });
  } catch (error) {
    console.error("Failed to generate hints:", error);
    return NextResponse.json({ hints: [], error: "Failed to generate hints" });
  }
}
