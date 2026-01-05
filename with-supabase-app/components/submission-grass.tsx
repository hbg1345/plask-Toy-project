"use client";

import { useEffect, useState } from "react";
import {
  getYearSubmissions,
  groupSubmissionsByDate,
} from "@/lib/atcoder/submissions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SubmissionGrassProps {
  userId: string;
}

interface DayData {
  date: Date;
  count: number;
}

/**
 * GitHub 잔디 스타일의 제출 기록 시각화 컴포넌트
 */
export function SubmissionGrass({ userId }: SubmissionGrassProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [data, setData] = useState<DayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSubmissions, setTotalSubmissions] = useState<number>(0);

  // 사용 가능한 년도 목록 생성 (2020년부터 현재 년도까지)
  const availableYears: number[] = [];
  const startYear = 2020;
  for (let year = currentYear; year >= startYear; year--) {
    availableYears.push(year);
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const submissions = await getYearSubmissions(userId, selectedYear);
        const grouped = groupSubmissionsByDate(submissions);

        // 해당 년도의 1월 1일부터 12월 31일까지 모든 날짜 생성
        const yearStart = new Date(selectedYear, 0, 1);
        yearStart.setHours(0, 0, 0, 0);

        const yearEnd = new Date(selectedYear, 11, 31);
        yearEnd.setHours(23, 59, 59, 999);

        const days: DayData[] = [];
        const currentDate = new Date(yearStart);

        while (currentDate <= yearEnd) {
          const dateKey = currentDate.toISOString().split("T")[0];
          days.push({
            date: new Date(currentDate),
            count: grouped[dateKey] || 0,
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }

        setData(days);
        setTotalSubmissions(submissions.length);
      } catch (err) {
        console.error("Error loading submission data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load submission data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId, selectedYear]);

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">
          제출 기록을 불러오는 중...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex items-center justify-center py-8">
        <div className="text-sm text-destructive">{error}</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">
          제출 기록이 없습니다.
        </div>
      </div>
    );
  }

  // 주(week) 단위로 그룹화
  const weeks: DayData[][] = [];
  let currentWeek: DayData[] = [];

  // 첫 번째 날짜의 요일 확인 (0=일요일, 6=토요일)
  const firstDayOfWeek = data[0].date.getDay();

  // 첫 주의 빈 날짜 추가 (일요일부터 시작)
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({
      date: new Date(
        data[0].date.getTime() - (firstDayOfWeek - i) * 24 * 60 * 60 * 1000
      ),
      count: 0,
    });
  }

  for (const day of data) {
    currentWeek.push(day);

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // 마지막 주가 채워지지 않은 경우 빈 날짜로 채우기
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      const lastDate = currentWeek[currentWeek.length - 1].date;
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + 1);
      currentWeek.push({
        date: nextDate,
        count: 0,
      });
    }
    weeks.push(currentWeek);
  }

  // 최대 제출 횟수 계산 (색상 단계 결정용)
  const maxCount = Math.max(...data.map((d) => d.count), 0);

  // 제출 횟수에 따른 색상 결정 (1개 단위로 색상 변경)
  const getColor = (count: number): string => {
    if (count === 0) {
      return "bg-gray-100 dark:bg-gray-800";
    } else if (maxCount === 0) {
      return "bg-gray-100 dark:bg-gray-800";
    } else {
      // 1개부터 최대값까지 5단계로 나눔
      // 단계: 1, 2, 3, 4, 5+
      const step = Math.max(1, Math.ceil(maxCount / 5));

      if (count <= step) {
        return "bg-green-200 dark:bg-green-900";
      } else if (count <= step * 2) {
        return "bg-green-300 dark:bg-green-800";
      } else if (count <= step * 3) {
        return "bg-green-400 dark:bg-green-700";
      } else if (count <= step * 4) {
        return "bg-green-600 dark:bg-green-600";
      } else {
        return "bg-green-800 dark:bg-green-500";
      }
    }
  };

  // 월 레이블 위치 계산 (각 주의 첫 번째 날짜로 월 판단)
  const monthLabels: { weekIndex: number; month: number }[] = [];
  const processedMonths = new Set<number>();

  weeks.forEach((week, weekIndex) => {
    if (week.length > 0) {
      const firstDay = week.find(
        (day) => day.date.getFullYear() === selectedYear
      );
      if (firstDay) {
        const month = firstDay.date.getMonth();
        if (!processedMonths.has(month)) {
          processedMonths.add(month);
          monthLabels.push({ weekIndex, month });
        }
      }
    }
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value, 10))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}년
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <h3 className="text-sm font-medium">{selectedYear}년 제출 기록</h3>
        </div>
        <div className="text-sm text-muted-foreground">
          총 {totalSubmissions}회 제출
        </div>
      </div>

      <div className="space-y-2">
        {/* 월 레이블 */}
        <div className="flex gap-1 pl-[26px] -mx-6 px-6">
          {weeks.map((week, weekIndex) => {
            const monthLabel = monthLabels.find(
              (label) => label.weekIndex === weekIndex
            );
            if (monthLabel) {
              return (
                <div
                  key={weekIndex}
                  className="text-xs text-muted-foreground whitespace-nowrap"
                  style={{ width: "13px" }}
                >
                  {monthLabel.month + 1}월
                </div>
              );
            }
            return <div key={weekIndex} style={{ width: "13px" }} />;
          })}
        </div>

        {/* 잔디 그래프 */}
        <div className="overflow-x-auto -mx-6 px-6">
          <div
            className="flex gap-1 min-w-max"
            style={{ paddingRight: "2rem", paddingBottom: "0.5rem" }}
          >
            {/* 요일 레이블 (세로) */}
            <div className="flex flex-col gap-1 pr-2">
              <div className="text-xs text-muted-foreground leading-3 h-3">
                일
              </div>
              <div className="text-xs text-muted-foreground leading-3 h-3">
                월
              </div>
              <div className="text-xs text-muted-foreground leading-3 h-3">
                화
              </div>
              <div className="text-xs text-muted-foreground leading-3 h-3">
                수
              </div>
              <div className="text-xs text-muted-foreground leading-3 h-3">
                목
              </div>
              <div className="text-xs text-muted-foreground leading-3 h-3">
                금
              </div>
              <div className="text-xs text-muted-foreground leading-3 h-3">
                토
              </div>
            </div>

            {/* 주별 데이터 */}
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => {
                  const dateKey = day.date.toISOString().split("T")[0];
                  const isCurrentYear = day.date.getFullYear() === selectedYear;
                  const tooltip = isCurrentYear
                    ? `${dateKey}\n제출 ${day.count}회`
                    : "";

                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`w-3 h-3 rounded-sm ${getColor(day.count)} ${
                        isCurrentYear
                          ? "hover:ring-2 hover:ring-primary cursor-pointer"
                          : "opacity-30"
                      } transition-colors`}
                      title={tooltip}
                      aria-label={tooltip}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>적음</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="w-3 h-3 rounded bg-green-200 dark:bg-green-900" />
          <div className="w-3 h-3 rounded bg-green-300 dark:bg-green-800" />
          <div className="w-3 h-3 rounded bg-green-400 dark:bg-green-700" />
          <div className="w-3 h-3 rounded bg-green-600 dark:bg-green-600" />
          <div className="w-3 h-3 rounded bg-green-800 dark:bg-green-500" />
        </div>
        <span>많음</span>
      </div>
    </div>
  );
}
