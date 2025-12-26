import { Hero } from "@/components/hero";
import { AppLayout } from "@/components/app-layout";

export default function Home() {
  return (
    <AppLayout outerWrapperClassName="flex-1 w-full flex flex-col gap-20 items-center">
          <Hero />
    </AppLayout>
  );
}
