"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DesktopNav } from "./desktop-nav";
import { MobileNav } from "./mobile-nav";
import { ThemeSwitcher } from "./theme-switcher";

interface CollapsibleHeaderProps {
  authButton: React.ReactNode;
  mobileAuthButton: React.ReactNode;
}

export function CollapsibleHeader({ authButton, mobileAuthButton }: CollapsibleHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300",
        isScrolled ? "shadow-sm" : ""
      )}
    >
      <div
        className={cn(
          "container flex max-w-5xl items-center mx-auto px-4 transition-all duration-300",
          isScrolled ? "h-11" : "h-16"
        )}
      >
        {/* Logo */}
        <Link
          href="/"
          className={cn(
            "mr-6 flex items-center space-x-2 transition-all duration-300",
            isScrolled ? "scale-90 origin-left" : ""
          )}
        >
          <span className="font-bold text-lg">앳코더 도우미</span>
        </Link>

        {/* Desktop Navigation */}
        <DesktopNav isScrolled={isScrolled} />

        {/* Desktop Auth & Theme */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeSwitcher />
          {authButton}
        </div>

        {/* Mobile Menu */}
        <div className="flex flex-1 items-center justify-end md:hidden gap-2">
          <ThemeSwitcher />
          <MobileNav>
            {mobileAuthButton}
          </MobileNav>
        </div>
      </div>
    </header>
  );
}
