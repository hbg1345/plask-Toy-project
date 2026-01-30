import Link from "next/link";
import { Suspense } from "react";
import { DesktopNav } from "./desktop-nav";
import { MobileNav } from "./mobile-nav";
import { ThemeSwitcher } from "./theme-switcher";

interface CollapsibleHeaderProps {
  authButton: React.ReactNode;
  mobileAuthButton: React.ReactNode;
}

export function CollapsibleHeader({ authButton, mobileAuthButton }: CollapsibleHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex max-w-5xl items-center mx-auto px-4 h-14">
        {/* Logo */}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold text-lg">앳코더 도우미</span>
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
