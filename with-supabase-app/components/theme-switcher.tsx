"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const ICON_SIZE = 16;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-pixel-white/80 hover:text-pixel-cyan hover:bg-pixel-navy"
        >
          {theme === "light" ? (
            <Sun key="light" size={ICON_SIZE} />
          ) : theme === "dark" ? (
            <Moon key="dark" size={ICON_SIZE} />
          ) : (
            <Laptop key="system" size={ICON_SIZE} />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-content bg-pixel-dark border-4 border-pixel-white shadow-[4px_4px_0_0_#333c57]"
        align="start"
      >
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(e) => setTheme(e)}
        >
          <DropdownMenuRadioItem
            className="flex gap-2 font-game text-xs font-medium text-pixel-gray hover:text-pixel-yellow focus:text-pixel-yellow focus:bg-pixel-navy"
            value="light"
          >
            <Sun size={ICON_SIZE} />
            <span>LIGHT</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            className="flex gap-2 font-game text-xs font-medium text-pixel-gray hover:text-pixel-yellow focus:text-pixel-yellow focus:bg-pixel-navy"
            value="dark"
          >
            <Moon size={ICON_SIZE} />
            <span>DARK</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            className="flex gap-2 font-game text-xs font-medium text-pixel-gray hover:text-pixel-yellow focus:text-pixel-yellow focus:bg-pixel-navy"
            value="system"
          >
            <Laptop size={ICON_SIZE} />
            <span>SYSTEM</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { ThemeSwitcher };
