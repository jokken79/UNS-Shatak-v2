"use client";
import { useEffect } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useThemeStore, applyTheme } from "@/stores/theme";
import { Button } from "@/components/ui";

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const cycleTheme = () => {
    const themes: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const icons = {
    light: <Sun className="w-4 h-4" />,
    dark: <Moon className="w-4 h-4" />,
    system: <Monitor className="w-4 h-4" />,
  };

  const labels = {
    light: "Light",
    dark: "Dark",
    system: "System",
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleTheme}
      className="w-full justify-start gap-2"
    >
      {icons[theme]}
      <span className="text-sm">{labels[theme]}</span>
    </Button>
  );
}
