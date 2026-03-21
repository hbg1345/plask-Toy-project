"use client";

import { UserPlus, Link2, FileSearch, MessageSquare } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./scroll-reveal";
import { useLanguage } from "@/components/language-context";

const stepIcons = [UserPlus, Link2, FileSearch, MessageSquare];
const stepColors = ["bg-blue-500", "bg-purple-500", "bg-orange-500", "bg-green-500"];

export function HowItWorksSection() {
  const { tr } = useLanguage();

  const steps = tr.landing.howItWorks.steps.map((step, i) => ({
    ...step,
    step: i + 1,
    icon: stepIcons[i],
    color: stepColors[i],
  }));

  return (
    <section className="w-full max-w-5xl px-4">
      <ScrollReveal>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">{tr.landing.howItWorks.heading}</h2>
          <p className="text-foreground text-lg">{tr.landing.howItWorks.subheading}</p>
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
                <p className="text-sm text-foreground">{item.description}</p>
              </div>
            </StaggerItem>
          ))}
        </div>
      </StaggerContainer>
    </section>
  );
}
