import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { hasEnvVars } from "@/lib/utils";
import { Suspense } from "react";
import { CollapsibleHeader } from "./collapsible-header";

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
  const authButton = !hasEnvVars ? (
    <EnvVarWarning />
  ) : (
    <Suspense fallback={<div className="h-6 w-16 bg-pixel-navy animate-pulse" />}>
      <AuthButton />
    </Suspense>
  );

  const mobileAuthButton = !hasEnvVars ? (
    <EnvVarWarning />
  ) : (
    <Suspense fallback={<div className="h-8 w-full bg-pixel-navy animate-pulse" />}>
      <AuthButton />
    </Suspense>
  );

  return (
    <main className="min-h-screen flex flex-col">
      <CollapsibleHeader authButton={authButton} mobileAuthButton={mobileAuthButton} />

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
      </div>
    </main>
  );
}
