"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { DesktopNav } from "./desktop-nav";
import { MobileNav } from "./mobile-nav";
import { ThemeSwitcher } from "./theme-switcher";
import { cn } from "@/lib/utils";

interface CollapsibleHeaderProps {
  authButton: React.ReactNode;
  mobileAuthButton: React.ReactNode;
}

export function CollapsibleHeader({ authButton, mobileAuthButton }: CollapsibleHeaderProps) {
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 맨 위에서는 항상 보임
      if (currentScrollY < 50) {
        setHidden(false);
      } else if (currentScrollY > lastScrollY) {
        // 스크롤 내리면 숨김
        setHidden(true);
      } else {
        // 스크롤 올리면 표시
        setHidden(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform duration-300",
        hidden && "-translate-y-full"
      )}
    >
      <div className="container flex max-w-5xl items-center mx-auto px-4 h-14">
        {/* Logo */}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold text-lg">Solve Helper</span>
        </Link>

        {/* Desktop Navigation */}
        <Suspense fallback={<nav className="hidden md:flex flex-1" />}>
          <DesktopNav />
        </Suspense>

        {/* Desktop Auth & Theme */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeSwitcher />
          {authButton}
        </div>

        {/* Mobile Menu */}
        <div className="flex flex-1 items-center justify-end md:hidden gap-2">
          <ThemeSwitcher />
          <Suspense fallback={<div className="h-9 w-9" />}>
            <MobileNav>
              {mobileAuthButton}
            </MobileNav>
          </Suspense>
        </div>
      </div>
    </header>
  );
}
