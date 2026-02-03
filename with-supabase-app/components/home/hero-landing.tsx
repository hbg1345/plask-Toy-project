"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const sections = [
  {
    title: "막히면 물어보세요",
    description: "AI가 정답을 알려주지 않아요. 대신 어디서 막혔는지 파악하고, 다음 단계로 나아갈 수 있는 힌트를 제공합니다. 스스로 문제를 해결하는 능력을 키워보세요.",
    image: "/images/feature-chat.png",
  },
  {
    title: "딱 맞는 난이도",
    description: "너무 쉬우면 지루하고, 너무 어려우면 포기하게 돼요. 현재 레이팅을 기반으로 적절한 난이도의 문제를 추천받아 효율적으로 실력을 키우세요.",
    image: "/images/feature-recommend.png",
  },
  {
    title: "꾸준히 기록하세요",
    description: "매일 푼 문제, 걸린 시간, 성공률까지. 풀이 기록이 쌓이면 나만의 학습 패턴이 보이고, 어느새 실력이 성장해 있을 거예요.",
    image: "/images/feature-stats.png",
  },
];

interface HeroLandingProps {
  isLoggedIn: boolean;
}

export function HeroLanding({ isLoggedIn }: HeroLandingProps) {
  return (
    <div className="w-full">
      {/* 히어로 섹션 */}
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-sm tracking-widest text-muted-foreground mb-3">
          SOLVE HELPER
        </p>
        <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
          혼자 고민하지 마세요
        </h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
          공식 해설을 기반으로 답변하는 AI가 막힌 부분을 함께 해결해드려요.
        </p>
        <Button asChild size="lg" className="rounded-full">
          <Link href={isLoggedIn ? "/practice" : "/auth/sign-up"}>
            {isLoggedIn ? "연습 시작" : "시작하기"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* 기능 섹션들 - 좌우 번갈아가며 */}
      <div className="flex flex-col">
        {sections.map((section, index) => (
          <FeatureSection key={section.title} section={section} index={index} />
        ))}
      </div>
    </div>
  );
}

function FeatureSection({
  section,
  index,
}: {
  section: (typeof sections)[number];
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-16 md:py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <div
          className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 ${
            index % 2 === 1 ? "md:flex-row-reverse" : ""
          }`}
        >
          {/* 이미지 */}
          <motion.div
            className="flex-1 w-full"
            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="aspect-video rounded-xl bg-muted border overflow-hidden shadow-lg">
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Screenshot
              </div>
            </div>
          </motion.div>

          {/* 텍스트 */}
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {section.title}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {section.description}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
