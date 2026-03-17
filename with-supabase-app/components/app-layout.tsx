import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { hasEnvVars } from "@/lib/utils";
import { CollapsibleHeader } from "./collapsible-header";
import { Suspense } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
  contentWrapperClassName?: string;
  outerWrapperClassName?: string;
  fixedHeight?: boolean;
}

export function AppLayout({
  children,
  contentWrapperClassName,
  outerWrapperClassName,
  fixedHeight = false,
}: AppLayoutProps) {
  // Next.js 16: async server component는 반드시 Suspense로 감싸야 함
  // fallback을 투명하게 만들어 플리커 방지 (기존 animate-pulse 제거)
  const authButton = !hasEnvVars ? (
    <EnvVarWarning />
  ) : (
    <Suspense fallback={<div className="w-16 h-9" />}>
      <AuthButton />
    </Suspense>
  );
  const mobileAuthButton = !hasEnvVars ? (
    <EnvVarWarning />
  ) : (
    <Suspense fallback={<div className="w-full h-8" />}>
      <AuthButton />
    </Suspense>
  );

  return (
    <main className={fixedHeight ? "h-screen flex flex-col overflow-hidden" : "min-h-screen flex flex-col"}>
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
