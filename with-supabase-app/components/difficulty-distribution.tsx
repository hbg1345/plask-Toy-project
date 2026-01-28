"use client";

import { useMemo } from "react";
import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SolvedProblem } from "@/app/actions";

interface DifficultyDistributionProps {
  problems: SolvedProblem[];
}

// AtCoder 난이도 분류 (더 부드러운 색상 + 그라데이션용 밝은 색상)
const DIFFICULTY_LEVELS = [
  { name: "Gray", min: 0, max: 399, color: "#6b7280", lightColor: "#9ca3af" },
  { name: "Brown", min: 400, max: 799, color: "#92400e", lightColor: "#b45309" },
  { name: "Green", min: 800, max: 1199, color: "#16a34a", lightColor: "#22c55e" },
  { name: "Cyan", min: 1200, max: 1599, color: "#0891b2", lightColor: "#22d3ee" },
  { name: "Blue", min: 1600, max: 1999, color: "#2563eb", lightColor: "#60a5fa" },
  { name: "Yellow", min: 2000, max: 2399, color: "#ca8a04", lightColor: "#facc15" },
  { name: "Orange", min: 2400, max: 2799, color: "#ea580c", lightColor: "#fb923c" },
  { name: "Red", min: 2800, max: Infinity, color: "#dc2626", lightColor: "#f87171" },
] as const;

function getDifficultyLevel(difficulty: number | null): string {
  if (difficulty === null) return "Unknown";
  for (const level of DIFFICULTY_LEVELS) {
    if (difficulty >= level.min && difficulty <= level.max) {
      return level.name;
    }
  }
  return "Unknown";
}

function getLevelColor(levelName: string): string {
  const level = DIFFICULTY_LEVELS.find((l) => l.name === levelName);
  return level?.color ?? "#6b7280";
}

export function DifficultyDistribution({ problems }: DifficultyDistributionProps) {
  const distribution = useMemo(() => {
    const counts: Record<string, number> = {};

    // 초기화
    for (const level of DIFFICULTY_LEVELS) {
      counts[level.name] = 0;
    }
    counts["Unknown"] = 0;

    // 카운트
    for (const problem of problems) {
      const level = getDifficultyLevel(problem.difficulty);
      counts[level] = (counts[level] || 0) + 1;
    }

    // 차트 데이터 생성 (0인 항목 제외)
    return DIFFICULTY_LEVELS
      .map((level) => ({
        name: level.name,
        value: counts[level.name],
        color: level.color,
        lightColor: level.lightColor,
        range: level.max === Infinity ? `${level.min}+` : `${level.min}-${level.max}`,
      }))
      .filter((item) => item.value > 0);
  }, [problems]);

  const total = problems.length;

  const chartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    for (const item of distribution) {
      config[item.name] = {
        label: item.name,
        color: item.color,
      };
    }
    return config;
  }, [distribution]);

  if (problems.length === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm font-normal">난이도 분포</span>
        </CardTitle>
        <CardDescription className="text-2xl font-bold text-foreground">
          {total.toLocaleString()}문제 해결
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-8 items-center">
          {/* 도넛 차트 */}
          <div className="w-full lg:w-1/2">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
              <PieChart>
                {/* 그라데이션 정의 */}
                <defs>
                  {distribution.map((entry) => (
                    <linearGradient
                      key={`gradient-${entry.name}`}
                      id={`gradient-${entry.name}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor={entry.lightColor} stopOpacity={1} />
                      <stop offset="100%" stopColor={entry.color} stopOpacity={1} />
                    </linearGradient>
                  ))}
                  {/* 글로우 필터 */}
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => (
                        <div className="flex items-center gap-2">
                          <span>{name}</span>
                          <span className="font-bold">{value}문제</span>
                          <span className="text-muted-foreground">
                            ({((Number(value) / total) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Pie
                  data={distribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={100}
                  paddingAngle={2}
                  strokeWidth={1}
                  stroke="rgba(255,255,255,0.2)"
                  style={{ filter: "url(#glow)" }}
                >
                  {distribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`url(#gradient-${entry.name})`}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>

          {/* 테이블 */}
          <div className="w-full lg:w-1/2">
            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium">레벨</th>
                    <th className="px-4 py-2 text-right font-medium">문제</th>
                    <th className="px-4 py-2 text-right font-medium">비율</th>
                  </tr>
                </thead>
                <tbody>
                  {DIFFICULTY_LEVELS.map((level) => {
                    const item = distribution.find((d) => d.name === level.name);
                    const count = item?.value ?? 0;
                    const percent = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";

                    return (
                      <tr key={level.name} className="border-b last:border-b-0">
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                background: `linear-gradient(135deg, ${level.lightColor}, ${level.color})`,
                                boxShadow: `0 0 6px ${level.color}40`,
                              }}
                            />
                            <span style={{ color: level.color }} className="font-medium">
                              {level.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right font-medium">
                          {count.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-right text-muted-foreground">
                          {percent}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
