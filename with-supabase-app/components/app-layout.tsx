import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ChatLink } from "@/components/chat-link";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
  contentWrapperClassName?: string;
  outerWrapperClassName?: string;
}

export function AppLayout({ children, contentWrapperClassName, outerWrapperClassName }: AppLayoutProps) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className={outerWrapperClassName || "flex-1 w-full flex flex-col items-center"}>
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>Atcoder Supporter</Link>
              {hasEnvVars && (
                <Suspense fallback={null}>
                  <ChatLink />
                </Suspense>
              )}
            </div>
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <Suspense
                fallback={
                  <div className="flex gap-2">
                    <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
                    <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
                  </div>
                }
              >
                <AuthButton />
              </Suspense>
            )}
          </div>
        </nav>
        <div className={`w-full ${contentWrapperClassName || "flex-1 flex flex-col gap-20 max-w-5xl p-5"}`}>
          {children}
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
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
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}

