import { Suspense } from "react";
import { HeroLandingWrapper } from "@/components/home/hero-landing-wrapper";
import { Hero } from "@/components/hero";
import { AppLayout } from "@/components/app-layout";
import { OngoingPracticeIndicator } from "@/components/ongoing-practice-indicator";

function LandingSkeleton() {
  return (
    <div className="h-screen w-full flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-16 w-96 bg-muted animate-pulse rounded mx-auto" />
        <div className="h-8 w-64 bg-muted animate-pulse rounded mx-auto" />
        <div className="h-12 w-40 bg-muted animate-pulse rounded mx-auto mt-8" />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AppLayout
      outerWrapperClassName="flex-1 w-full flex flex-col"
      contentWrapperClassName="w-full flex-1 flex flex-col"
    >
      {/* 풀스크린 랜딩 (스크롤 애니메이션) */}
      <Suspense fallback={<LandingSkeleton />}>
        <HeroLandingWrapper />
      </Suspense>

      {/* 랜딩 이후 콘텐츠 */}
      <div className="w-full flex flex-col gap-20 items-center py-20 max-w-5xl mx-auto px-5">
        <Suspense fallback={null}>
          <Hero />
        </Suspense>
        <OngoingPracticeIndicator />
      </div>
    </AppLayout>
  );
}
