"use client";

import { Button } from "@/components/ui/button";
import { useAnimeMode } from "./anime-mode-context";
import { Sparkles, User } from "lucide-react";

export function AnimeModeToggle() {
  const { isAnimeMode, setIsAnimeMode } = useAnimeMode();

  const handleToggle = () => {
    const newMode = !isAnimeMode;
    console.log("[AnimeModeToggle] Switching mode:", isAnimeMode, "->", newMode);
    setIsAnimeMode(newMode);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label={isAnimeMode ? "일반인 모드로 전환" : "애니 모드로 전환"}
      className={`relative ${isAnimeMode ? "text-pixel-cyan hover:text-pixel-yellow" : "text-pixel-yellow hover:text-pixel-cyan"}`}
    >
      {isAnimeMode ? (
        <Sparkles className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <User className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">
        {isAnimeMode ? "일반인 모드로 전환" : "애니 모드로 전환"}
      </span>
    </Button>
  );
}
