"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveChatHistory, getChatByProblemUrl } from "@/app/actions";
import { cn } from "@/lib/utils";

interface ProblemLinkProps {
  problemId: string;
  problemTitle: string;
  problemUrl: string;
  contestId: string;
  difficulty: number | null;
  className?: string;
  children?: React.ReactNode;
}

export function ProblemLink({
  problemId,
  problemTitle,
  problemUrl,
  contestId,
  difficulty,
  className,
  children,
}: ProblemLinkProps) {
  const router = useRouter();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // 기존 채팅이 있는지 확인
    const existingChatId = await getChatByProblemUrl(problemUrl);
    
    if (!existingChatId) {
      // 기존 채팅이 없으면 새로 생성
      const title = `${problemId}: ${problemTitle}`;
      await saveChatHistory(null, [], title, problemUrl);
    }
    
    // /chat으로 이동 (ChatLayoutClient가 첫 번째 채팅을 자동으로 선택함)
    router.push("/chat");
  };

  const colors = getDifficultyColor(difficulty);

  return (
    <Link href="/chat" onClick={handleClick} className={className}>
      {children || (
        <div
          className={cn(
            "text-xs font-bold truncate group-hover:underline",
            difficulty && difficulty >= 3200 ? "" : colors.text
          )}
          title={problemTitle}
        >
          {difficulty && difficulty >= 3200 ? (
            problemTitle.length > 0 ? (
              <>
                <span className="text-black dark:text-white">
                  {problemTitle[0]}
                </span>
                <span className="text-red-600 dark:text-red-400">
                  {problemTitle.slice(1)}
                </span>
              </>
            ) : (
              problemTitle
            )
          ) : (
            problemTitle
          )}
        </div>
      )}
    </Link>
  );
}

function getDifficultyColor(difficulty: number | null): {
  bg: string;
  text: string;
  border: string;
} {
  if (difficulty === null) {
    return {
      bg: "bg-gray-400 dark:bg-gray-600",
      text: "text-gray-700 dark:text-gray-300",
      border: "border-gray-400 dark:border-gray-600",
    };
  }

  // Gray: < 400
  if (difficulty < 400) {
    return {
      bg: "bg-gray-400 dark:bg-gray-600",
      text: "text-gray-700 dark:text-gray-300",
      border: "border-gray-400 dark:border-gray-600",
    };
  }
  // Brown: 400-799
  if (difficulty < 800) {
    return {
      bg: "bg-amber-600 dark:bg-amber-700",
      text: "text-amber-900 dark:text-amber-100",
      border: "border-amber-600 dark:border-amber-700",
    };
  }
  // Green: 800-1199
  if (difficulty < 1200) {
    return {
      bg: "bg-green-500 dark:bg-green-600",
      text: "text-green-900 dark:text-green-100",
      border: "border-green-500 dark:border-green-600",
    };
  }
  // Cyan: 1200-1599
  if (difficulty < 1600) {
    return {
      bg: "bg-cyan-400 dark:bg-cyan-500",
      text: "text-cyan-900 dark:text-cyan-100",
      border: "border-cyan-400 dark:border-cyan-500",
    };
  }
  // Blue: 1600-1999
  if (difficulty < 2000) {
    return {
      bg: "bg-blue-500 dark:bg-blue-600",
      text: "text-blue-900 dark:text-blue-100",
      border: "border-blue-500 dark:border-blue-600",
    };
  }
  // Yellow: 2000-2399
  if (difficulty < 2400) {
    return {
      bg: "bg-yellow-400 dark:bg-yellow-500",
      text: "text-yellow-900 dark:text-yellow-100",
      border: "border-yellow-400 dark:border-yellow-500",
    };
  }
  // Orange: 2400-2799
  if (difficulty < 2800) {
    return {
      bg: "bg-orange-500 dark:bg-orange-600",
      text: "text-orange-900 dark:text-orange-100",
      border: "border-orange-500 dark:border-orange-600",
    };
  }
  // Red: 2800-3199
  if (difficulty < 3200) {
    return {
      bg: "bg-red-500 dark:bg-red-600",
      text: "text-red-900 dark:text-red-100",
      border: "border-red-500 dark:border-red-600",
    };
  }
  // Rainbow gradient for 3200+
  return {
    bg: "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 dark:from-red-600 dark:via-yellow-600 dark:via-green-600 dark:via-blue-600 dark:to-purple-600",
    text: "text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-yellow-600 via-green-600 via-blue-600 to-purple-600 dark:from-red-400 dark:via-yellow-400 dark:via-green-400 dark:via-blue-400 dark:to-purple-400",
    border: "border-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500",
  };
}

