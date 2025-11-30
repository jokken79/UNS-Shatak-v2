"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GradientTextProps {
  children: ReactNode;
  gradient?: string;
  animate?: boolean;
  className?: string;
}

export function GradientText({
  children,
  gradient = "from-blue-600 via-purple-600 to-pink-600",
  animate = true,
  className = "",
}: GradientTextProps) {
  const Component = animate ? motion.span : "span";
  const animationProps = animate
    ? {
        initial: { backgroundPosition: "0% 50%" },
        animate: { backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] },
        transition: { duration: 5, repeat: Infinity, ease: "linear" },
      }
    : {};

  return (
    <Component
      className={cn(
        "inline-block bg-gradient-to-r bg-clip-text text-transparent font-bold",
        gradient,
        animate && "bg-[length:200%_auto]",
        className
      )}
      {...animationProps}
    >
      {children}
    </Component>
  );
}
