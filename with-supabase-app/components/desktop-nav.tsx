"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Archive, User, Home, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/problems", label: "Problems", icon: Archive },
  { href: "/recommendations", label: "Recommendations", icon: Lightbulb },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/profile", label: "Profile", icon: User },
];

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex flex-1 items-center space-x-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
