"use client";

import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const isProtectedPage = pathname === "/profile";

  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
      <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
        <div className="flex gap-5 items-center font-semibold">
          <Link href={"/"}>Atcoder Supporter</Link>
          <Link href={"/problems"}>Problems</Link>
          <Link href={"/chat"}>Chat</Link>
          {isProtectedPage && (
            <Link href={"/profile"}>Profile</Link>
          )}
        </div>
        {!hasEnvVars ? (
          <EnvVarWarning />
        ) : (
          <Suspense>
            <AuthButton />
          </Suspense>
        )}
      </div>
    </nav>
  );
}
