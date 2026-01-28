"use client";

import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, MessageSquare, Archive } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/problems", label: "Problems", icon: Archive },
  { href: "/chat", label: "Chat", icon: MessageSquare },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
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
        <nav className="hidden md:flex flex-1 items-center space-x-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium rounded-md transition-all duration-300",
                  isScrolled ? "px-2 py-1" : "px-3 py-2",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className={cn(
                  "transition-all duration-300",
                  isScrolled ? "h-3.5 w-3.5" : "h-4 w-4"
                )} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center">
          {!hasEnvVars ? (
            <EnvVarWarning />
          ) : (
            <Suspense fallback={<div className="h-8 w-20 bg-muted animate-pulse rounded" />}>
              <AuthButton />
            </Suspense>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="flex flex-1 items-center justify-end md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">메뉴 열기</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <SheetHeader>
                <SheetTitle>앳코더 도우미</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-6 pt-6 border-t">
                {!hasEnvVars ? (
                  <EnvVarWarning />
                ) : (
                  <Suspense fallback={<div className="h-8 w-full bg-muted animate-pulse rounded" />}>
                    <AuthButton />
                  </Suspense>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
