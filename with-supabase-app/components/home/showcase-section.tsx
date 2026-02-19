"use client";

import Image from "next/image";
import { ScrollReveal } from "./scroll-reveal";
import { MessageSquare, Sparkles, BarChart3 } from "lucide-react";

const showcases = [
  {
    title: "AI와 대화하며 문제 해결",
    description:
      "막히는 부분이 있으면 AI에게 물어보세요. 정답을 바로 알려주지 않고, 단계별 힌트로 스스로 깨달을 수 있도록 도와줍니다.",
    image: "/images/showcase-chat.png",
    icon: MessageSquare,
    direction: "left" as const,
  },
  {
    title: "나에게 딱 맞는 문제 추천",
    description:
      "AtCoder 레이팅을 기반으로 적절한 난이도의 문제를 추천받으세요. 너무 쉬워서 지루하거나, 너무 어려워서 좌절하지 않아요.",
    image: "/images/showcase-practice.png",
    icon: Sparkles,
    direction: "right" as const,
  },
  {
    title: "성장 과정을 한눈에",
    description:
      "풀이 기록, 레이팅 변화, 난이도별 분포를 확인하세요. 잔디 그래프로 꾸준함도 체크할 수 있어요.",
    image: "/images/showcase-profile.png",
    icon: BarChart3,
    direction: "left" as const,
  },
];

export function ShowcaseSection() {
  return (
    <section className="w-full max-w-6xl px-4 space-y-24">
      {showcases.map((item, index) => (
        <div
          key={item.title}
          className={`flex flex-col gap-8 items-center ${
            index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
          }`}
        >
          {/* 텍스트 */}
          <ScrollReveal
            direction={item.direction}
            className="flex-1 space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <item.icon className="h-4 w-4" />
              <span>Feature {index + 1}</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold">{item.title}</h3>
            <p className="text-foreground text-lg leading-relaxed">
              {item.description}
            </p>
          </ScrollReveal>

          {/* 이미지 */}
          <ScrollReveal
            direction={index % 2 === 0 ? "right" : "left"}
            delay={0.2}
            className="flex-1"
          >
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 border shadow-2xl">
              {/* 실제 이미지가 없으면 placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <item.icon className="h-16 w-16 mx-auto mb-4 text-foreground/50" />
                  <p className="text-foreground/50 text-sm">
                    스크린샷 이미지
                    <br />
                    {item.image}
                  </p>
                </div>
              </div>
              {/* 이미지가 있으면 표시 */}
              {/* <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover"
              /> */}
            </div>
          </ScrollReveal>
        </div>
      ))}
    </section>
  );
}
