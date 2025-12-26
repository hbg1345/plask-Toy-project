import { AppLayout } from "@/components/app-layout";
import { ChatLayoutWrapper } from "./ChatLayoutWrapper";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout
      contentWrapperClassName="flex flex-col p-0 max-w-5xl mx-auto w-full h-[calc(100vh-4rem-3rem)]"
      outerWrapperClassName="flex w-full flex-col items-center"
    >
      <ChatLayoutWrapper>{children}</ChatLayoutWrapper>
    </AppLayout>
  );
}
