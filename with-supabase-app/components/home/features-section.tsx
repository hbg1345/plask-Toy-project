"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BrainCircuit, Target, TrendingUp } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./scroll-reveal";
import { useLanguage } from "@/components/language-context";

const featureIcons = [BrainCircuit, Target, TrendingUp];
const featureGradients = [
  { gradient: "from-blue-500/20 to-cyan-500/20", iconColor: "text-blue-500" },
  { gradient: "from-orange-500/20 to-yellow-500/20", iconColor: "text-orange-500" },
  { gradient: "from-green-500/20 to-emerald-500/20", iconColor: "text-green-500" },
];

export function FeaturesSection() {
  const { tr } = useLanguage();

  const features = [
    { ...featureGradients[0], icon: featureIcons[0], ...tr.landing.features.aiCoaching },
    { ...featureGradients[1], icon: featureIcons[1], ...tr.landing.features.recommendation },
    { ...featureGradients[2], icon: featureIcons[2], ...tr.landing.features.tracking },
  ];

  return (
    <section className="w-full max-w-5xl px-4">
      <ScrollReveal>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">{tr.landing.features.heading}</h2>
          <p className="text-foreground text-lg">{tr.landing.features.subheading}</p>
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
                <p className="text-foreground text-sm leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
