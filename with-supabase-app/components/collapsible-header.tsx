import Link from "next/link";
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
        <DesktopNav />

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
