import { Suspense } from "react";
import { HeroLandingWrapper } from "@/components/home/hero-landing-wrapper";
import { AppLayout } from "@/components/app-layout";

function LandingSkeleton() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-pixel-dark">
      <div className="text-center space-y-4">
        <div className="h-16 w-96 bg-pixel-navy animate-pulse mx-auto" />
        <div className="h-8 w-64 bg-pixel-navy animate-pulse mx-auto" />
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
      <Suspense fallback={<LandingSkeleton />}>
        <HeroLandingWrapper />
      </Suspense>
    </AppLayout>
  );
}
