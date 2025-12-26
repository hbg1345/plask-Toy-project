"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className={cn(
        "font-semibold",
        isActive && "bg-accent text-yellow-500 dark:text-yellow-400"
      )}
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
}

