import { AppLayout } from "@/components/app-layout";
import { ChatLayoutWrapper } from "./ChatLayoutWrapper";
import { Suspense } from "react";
import { ChatAuthCheck } from "./ChatAuthCheck";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout
      contentWrapperClassName="flex flex-col p-0 w-full h-[calc(100vh-4rem-3rem)]"
      outerWrapperClassName="flex w-full flex-col items-center"
    >
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            로딩 중...
          </div>
        }
      >
        <ChatAuthCheck>
          <ChatLayoutWrapper>{children}</ChatLayoutWrapper>
        </ChatAuthCheck>
      </Suspense>
    </AppLayout>
  );
}
