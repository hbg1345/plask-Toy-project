"use client";

import {
  Rocket,
  Sword,
  Archive,
  MessageSquare,
  User,
} from "lucide-react";
import { useLanguage } from "@/components/language-context";

export default function GuidePage() {
  const { tr } = useLanguage();
  const g = tr.guide;

  const sections = [
    { icon: Rocket, ...g.gettingStarted },
    { icon: Sword, ...g.challenge },
    { icon: Archive, ...g.archive },
    { icon: MessageSquare, ...g.chat },
    { icon: User, ...g.profile },
  ];

  return (
    <div className="flex flex-col gap-8">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="flex items-center gap-2 text-base font-semibold mb-2">
              <section.icon className="h-5 w-5 text-primary" />
              {section.title}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {section.desc}
            </p>
          </div>
        ))}
    </div>
  );
}
