import { AppLayout } from "@/components/app-layout";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {  
  return (
    <AppLayout 
      contentWrapperClassName="flex-1 flex flex-col gap-20 p-5 max-h-[80vh]"
    >
      {children}
    </AppLayout>
  );
}

