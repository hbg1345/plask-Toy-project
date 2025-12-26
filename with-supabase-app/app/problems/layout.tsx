import { AppLayout } from "@/components/app-layout";

export default function ProblemsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout contentWrapperClassName="flex-1 flex flex-col gap-20 p-5 max-w-7xl">
      {children}
    </AppLayout>
  );
}

