import { getRecommendedProblems } from "@/lib/atcoder/recommendations";
import { getServerTr } from "@/lib/lang-server";
import { Loader } from "@/components/ai-elements/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { OngoingSessionCard } from "@/components/ongoing-session-card";
import { GachaReveal } from "@/components/gacha-reveal";

async function PracticeContent({
  searchParams,
}: {
  searchParams: Promise<{ fromYear?: string; fromMonth?: string; contestType?: string }>;
}) {
  const params = await searchParams;
  const tr = await getServerTr();
  const defaultYear = new Date().getFullYear() - 2;
  const fromYear = params.fromYear ? parseInt(params.fromYear) : defaultYear;
  const fromMonth = params.fromMonth ? parseInt(params.fromMonth) : null;
  const contestType = params.contestType || "abc";
  const fromEpoch = Math.floor(new Date(fromYear, (fromMonth ?? 1) - 1, 1).getTime() / 1000);

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims) redirect("/auth/login");

  const userId = claims.sub as string;
  const { data: userData, error: userError } = await supabase
    .from("user_info")
    .select("rating, atcoder_handle")
    .eq("id", userId)
    .single();

  if (userError || !userData) {
    return (
      <Card className="w-full">
        <CardHeader><CardTitle>{tr.practice.title}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-foreground">
            {tr.practice.noHandle}{" "}
            <Link href="/profile" className="text-primary hover:underline">{tr.practice.profilePage}</Link>
            {tr.practice.linkHere}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (userData.rating === null) {
    return (
      <Card className="w-full">
        <CardHeader><CardTitle>{tr.practice.title}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-foreground">
            {tr.practice.noRating}{" "}
            <Link href="/profile" className="text-primary hover:underline">{tr.practice.profilePage}</Link>
            {tr.practice.linkHere}
          </p>
        </CardContent>
      </Card>
    );
  }

  const [problems] = await Promise.all([
    getRecommendedProblems(userData.rating, fromEpoch, contestType),
  ]);

  if (problems.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader><CardTitle>{tr.practice.title}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-foreground">{tr.practice.noProblems(userData.rating)}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <OngoingSessionCard />

      {/* 날짜 필터 */}
      <div className="w-full rounded-lg bg-pixel-dark px-4 py-3">
        <form action="/practice" method="GET" className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium shrink-0 text-pixel-white">{tr.practice.contestType}</span>
          <div className="flex items-center gap-1">
            {[
              { value: "", label: tr.practice.contestAll },
              { value: "abc", label: "ABC" },
              { value: "arc", label: "ARC" },
              { value: "agc", label: "AGC" },
            ].map((opt) => {
              const linkParams = new URLSearchParams();
              if (opt.value) linkParams.set("contestType", opt.value);
              if (fromYear) linkParams.set("fromYear", String(fromYear));
              if (fromMonth) linkParams.set("fromMonth", String(fromMonth));
              const href = linkParams.toString() ? `/practice?${linkParams}` : "/practice";
              return (
                <Link
                  key={opt.value}
                  href={href}
                  scroll={true}
                  className={`px-2.5 py-1 rounded-md text-sm border transition-colors ${
                    (contestType ?? "") === opt.value
                      ? "bg-pixel-yellow text-pixel-dark border-pixel-yellow font-bold"
                      : "border-pixel-darkgray text-pixel-white hover:text-pixel-cyan hover:border-pixel-cyan"
                  }`}
                >
                  {opt.label}
                </Link>
              );
            })}
          </div>
          {contestType && <input type="hidden" name="contestType" value={contestType} />}
          <span className="text-sm font-medium shrink-0 text-pixel-white">{tr.practice.period}</span>
          <div className="flex items-center gap-1.5">
            <select
              name="fromYear"
              defaultValue={fromYear}
              className="h-8 rounded-md border border-pixel-black bg-pixel-dark px-2 text-sm text-pixel-white focus:outline-none focus:ring-1 focus:ring-pixel-cyan"
            >
              {Array.from({ length: new Date().getFullYear() - 2010 + 1 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            {tr.practice.yearSuffix && <span className="text-sm text-pixel-white">{tr.practice.yearSuffix}</span>}
            <select
              name="fromMonth"
              defaultValue={fromMonth ?? ""}
              className="h-8 rounded-md border border-pixel-black bg-pixel-dark px-2 text-sm text-pixel-white focus:outline-none focus:ring-1 focus:ring-pixel-cyan"
            >
              <option value="">{tr.practice.allMonths}</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m}{tr.practice.month}</option>
              ))}
            </select>
            <span className="text-sm text-pixel-white">{tr.practice.after}</span>
          </div>
          <Button type="submit" size="sm" className="bg-pixel-black text-pixel-white hover:bg-pixel-darkgray border-0">{tr.practice.apply}</Button>
          <span className="text-xs text-pixel-gray">
            {tr.practice.afterPeriod(fromYear, fromMonth ?? 1)}
          </span>
        </form>
      </div>

      {/* 가챠 추천 */}
      <div className="flex-1 flex flex-col w-full">
        <GachaReveal
          initialProblems={problems}
          userRating={userData.rating}
          fromEpoch={fromEpoch}
          contestType={contestType}
        />
      </div>
    </>
  );
}

function PracticeLoading() {
  return (
    <>
      <div className="flex flex-col gap-2 w-full">
        <h1 className="text-3xl font-bold tracking-tight">Challenge</h1>
        <Loader />
      </div>
      <Card className="w-full">
        <CardContent>
          <div className="w-full h-64 bg-muted/30 animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    </>
  );
}

export default function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ fromYear?: string; fromMonth?: string; contestType?: string }>;
}) {
  return (
    <div className="w-full flex flex-col min-h-[calc(100dvh-5.5rem)]">
      <div className="flex-1 flex flex-col gap-8 items-start">
        <Suspense fallback={<PracticeLoading />}>
          <PracticeContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
