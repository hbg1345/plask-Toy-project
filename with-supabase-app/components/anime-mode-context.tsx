"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AnimeModeContextType {
  isAnimeMode: boolean;
  setIsAnimeMode: (value: boolean) => void;
}

const AnimeModeContext = createContext<AnimeModeContextType | undefined>(undefined);

export function AnimeModeProvider({ children }: { children: ReactNode }) {
  const [isAnimeMode, setIsAnimeModeState] = useState(false);

  // 클라이언트에서만 localStorage 로드
  useEffect(() => {
    const stored = localStorage.getItem("animeMode");
    if (stored !== null) {
      setIsAnimeModeState(stored === "true");
    }
  }, []);

  const setIsAnimeMode = (value: boolean) => {
    console.log("[AnimeModeContext] Setting isAnimeMode to:", value);
    setIsAnimeModeState(value);
    localStorage.setItem("animeMode", String(value));
    console.log("[AnimeModeContext] Updated localStorage:", localStorage.getItem("animeMode"));
  };

  return (
    <AnimeModeContext.Provider value={{ isAnimeMode, setIsAnimeMode }}>
      {children}
    </AnimeModeContext.Provider>
  );
}

export function useAnimeMode() {
  const context = useContext(AnimeModeContext);
  if (context === undefined) {
    throw new Error("useAnimeMode must be used within AnimeModeProvider");
  }
  return context;
}
