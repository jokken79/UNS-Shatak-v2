"use client";

import { cn } from "@/lib/utils";

interface ShimmerProps {
  className?: string;
  shimmerClassName?: string;
}

export function Shimmer({ className, shimmerClassName }: ShimmerProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className={cn(
          "absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 dark:via-white/20 to-transparent",
          shimmerClassName
        )}
      />
    </div>
  );
}

// Add to tailwind.config.js:
/*
theme: {
  extend: {
    keyframes: {
      shimmer: {
        "100%": { transform: "translateX(100%)" },
      },
    },
  },
}
*/
