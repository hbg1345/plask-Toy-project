import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import { Suspense } from "react";
import Link from "next/link";
import { DesktopNav } from "./desktop-nav";
import { MobileNav } from "./mobile-nav";

interface AppLayoutProps {
  children: React.ReactNode;
  contentWrapperClassName?: string;
  outerWrapperClassName?: string;
}

export function AppLayout({
  children,
  contentWrapperClassName,
  outerWrapperClassName,
}: AppLayoutProps) {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-5xl items-center mx-auto px-4">
          {/* Logo */}
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-lg">AtCoder Supporter</span>
          </Link>

          {/* Desktop Navigation */}
          <DesktopNav />

          {/* Desktop Auth & Theme */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeSwitcher />
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <Suspense fallback={<div className="h-8 w-20 bg-muted animate-pulse rounded" />}>
                <AuthButton />
              </Suspense>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="flex flex-1 items-center justify-end md:hidden gap-2">
            <ThemeSwitcher />
            <MobileNav>
              {!hasEnvVars ? (
                <EnvVarWarning />
              ) : (
                <Suspense fallback={<div className="h-8 w-full bg-muted animate-pulse rounded" />}>
                  <AuthButton />
                </Suspense>
              )}
            </MobileNav>
          </div>
        </div>
      </header>

      {/* Content */}
      <div
        className={
          outerWrapperClassName || "flex-1 w-full flex flex-col items-center"
        }
      >
        <div
          className={`w-full ${
            contentWrapperClassName ||
            "flex-1 flex flex-col gap-20 max-w-5xl p-5"
          }`}
        >
          {children}
        </div>

        {/* Footer */}
        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-4">
          <p>
            Powered by{" "}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
