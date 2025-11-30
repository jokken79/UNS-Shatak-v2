"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  blur?: "sm" | "md" | "lg" | "xl";
  gradient?: string;
}

export function GlassCard({
  children,
  className,
  hover = true,
  blur = "md",
  gradient = "from-white/40 to-white/10 dark:from-black/40 dark:to-black/10",
}: GlassCardProps) {
  const blurValues = {
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg",
    xl: "backdrop-blur-xl",
  };

  return (
    <motion.div
      className={cn(
        "relative rounded-xl border border-white/20 dark:border-white/10",
        "shadow-xl",
        blurValues[blur],
        "bg-gradient-to-br",
        gradient,
        className
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      whileHover={hover ? { scale: 1.02, transition: { duration: 0.2 } } : undefined}
    >
      {/* Shine Effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Border Glow */}
      <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-blue-500/0 via-purple-500/20 to-blue-500/0 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
    </motion.div>
  );
}
