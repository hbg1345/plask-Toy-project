"use client";

import { UserPlus, Link2, FileSearch, MessageSquare } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./scroll-reveal";

const steps = [
  {
    icon: UserPlus,
    step: 1,
    title: "회원가입",
    description: "이메일로 간단하게 가입",
    color: "bg-blue-500",
  },
  {
    icon: Link2,
    step: 2,
    title: "AtCoder 연동",
    description: "핸들 입력으로 레이팅 동기화",
    color: "bg-purple-500",
  },
  {
    icon: FileSearch,
    step: 3,
    title: "문제 선택",
    description: "추천 문제 또는 직접 검색",
    color: "bg-orange-500",
  },
  {
    icon: MessageSquare,
    step: 4,
    title: "AI와 풀이",
    description: "막히면 힌트 받으며 해결",
    color: "bg-green-500",
  },
];

export function HowItWorksSection() {
  return (
    <section className="w-full max-w-5xl px-4">
      <ScrollReveal>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">어떻게 사용하나요?</h2>
          <p className="text-muted-foreground text-lg">4단계로 시작하는 알고리즘 학습</p>
        </div>
      </ScrollReveal>

      <StaggerContainer className="relative">
        {/* 연결선 (데스크톱) */}
        <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-1 bg-gradient-to-r from-blue-500 via-purple-500 via-orange-500 to-green-500 rounded-full" />

        <div className="grid gap-8 md:grid-cols-4">
          {steps.map((item) => (
            <StaggerItem key={item.step}>
              <div className="relative flex flex-col items-center text-center group">
                {/* 스텝 번호 + 아이콘 */}
                <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full ${item.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className="h-7 w-7" />
                </div>

                {/* 스텝 번호 배지 */}
                <div className="absolute -top-2 -right-2 z-20 flex items-center justify-center w-7 h-7 rounded-full bg-background border-2 border-current text-xs font-bold">
                  {item.step}
                </div>

                {/* 텍스트 */}
                <h3 className="font-semibold mt-4 mb-1 text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </StaggerItem>
          ))}
        </div>
      </StaggerContainer>
    </section>
  );
}
