import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { hasEnvVars } from "@/lib/utils";
import { CollapsibleHeader } from "./collapsible-header";

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
  const authButton = !hasEnvVars ? <EnvVarWarning /> : <AuthButton />;
  const mobileAuthButton = !hasEnvVars ? <EnvVarWarning /> : <AuthButton />;

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
