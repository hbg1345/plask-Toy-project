"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BrainCircuit, Target, TrendingUp } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./scroll-reveal";

const features = [
  {
    icon: BrainCircuit,
    title: "AI 코칭",
    description: "막힐 때 AI가 힌트를 단계별로 제공합니다. 정답을 바로 알려주지 않아 스스로 생각하며 풀 수 있어요.",
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500",
  },
  {
    icon: Target,
    title: "맞춤 추천",
    description: "내 레이팅에 맞는 문제를 자동으로 추천받으세요. 너무 쉽지도, 어렵지도 않은 딱 맞는 난이도.",
    gradient: "from-orange-500/20 to-yellow-500/20",
    iconColor: "text-orange-500",
  },
  {
    icon: TrendingUp,
    title: "성장 추적",
    description: "풀이 기록과 통계로 실력 향상을 확인하세요. 잔디 그래프로 꾸준함도 체크할 수 있어요.",
    gradient: "from-green-500/20 to-emerald-500/20",
    iconColor: "text-green-500",
  },
];

export function FeaturesSection() {
  return (
    <section className="w-full max-w-5xl px-4">
      <ScrollReveal>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">왜 이 플랫폼인가요?</h2>
          <p className="text-muted-foreground text-lg">효율적인 알고리즘 학습을 위한 핵심 기능</p>
        </div>
      </ScrollReveal>

      <StaggerContainer className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <StaggerItem key={feature.title}>
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-background to-muted/50 hover:shadow-xl transition-all duration-500 h-full">
              {/* 그라데이션 배경 */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <CardContent className="relative p-6 flex flex-col items-center text-center">
                {/* 아이콘 */}
                <div className={`mb-4 p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} group-hover:scale-110 transition-transform duration-500`}>
                  <feature.icon className={`h-8 w-8 ${feature.iconColor}`} />
                </div>

                {/* 텍스트 */}
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
