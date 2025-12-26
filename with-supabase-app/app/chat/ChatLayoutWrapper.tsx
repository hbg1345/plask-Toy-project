"use client";

import { Suspense } from "react";
import { ChatLayoutClient } from "./ChatLayoutClient";
import { ChatLayoutProvider } from "./ChatLayoutContext";

export function ChatLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ChatLayoutProvider>
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            로딩 중...
          </div>
        }
      >
        <ChatLayoutClient>{children}</ChatLayoutClient>
      </Suspense>
    </ChatLayoutProvider>
  );
}
