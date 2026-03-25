import { AppLayout } from "@/components/app-layout";

export default function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout outerWrapperClassName="flex-1 w-full flex flex-col items-center bg-pixel-dark" contentWrapperClassName="flex-1 flex flex-col gap-4 p-5 max-w-7xl">
      {children}
    </AppLayout>
  );
}
