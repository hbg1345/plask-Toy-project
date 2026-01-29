import { Suspense } from "react";
import { Hero } from "@/components/hero";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OngoingPracticeIndicator } from "@/components/ongoing-practice-indicator";

function HeroSkeleton() {
  return (
    <div className="flex flex-col gap-8 items-center w-full max-w-5xl px-4">
      <div className="h-10 w-96 bg-muted animate-pulse rounded" />
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
      <div className="w-full grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
          </CardHeader>
          <CardContent>
            <div className="h-[320px] bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
          </CardHeader>
          <CardContent>
            <div className="h-[320px] bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AppLayout outerWrapperClassName="flex-1 w-full flex flex-col gap-20 items-center">
      <Suspense fallback={<HeroSkeleton />}>
        <Hero />
      </Suspense>
      <OngoingPracticeIndicator />
    </AppLayout>
  );
}
