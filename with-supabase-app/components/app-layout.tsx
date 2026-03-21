interface AppLayoutProps {
  children: React.ReactNode;
  contentWrapperClassName?: string;
  outerWrapperClassName?: string;
  fixedHeight?: boolean;
  showFooter?: boolean;
}

export function AppLayout({
  children,
  contentWrapperClassName,
  outerWrapperClassName,
  fixedHeight = false,
  showFooter = true,
}: AppLayoutProps) {
  return (
    <main className={fixedHeight ? "h-screen flex flex-col overflow-hidden" : "min-h-screen flex flex-col"}>
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
      {showFooter && (
        <footer className="w-full py-4 text-center text-xs text-muted-foreground">
          <a href="https://deboot.tistory.com/" target="_blank" rel="noopener noreferrer" className="hover:underline">
            deboot.tistory.com
          </a>
        </footer>
      )}
    </main>
  );
}
