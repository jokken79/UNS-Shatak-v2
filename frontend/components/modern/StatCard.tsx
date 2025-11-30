"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient?: string;
  delay?: number;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-blue-500",
  trend,
  gradient = "from-blue-500/10 to-purple-500/10",
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary">
        {/* Gradient Background */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-50 group-hover:opacity-70 transition-opacity",
          gradient
        )} />

        {/* Glassmorphism Effect */}
        <div className="absolute inset-0 backdrop-blur-[2px] bg-white/30 dark:bg-black/30" />

        <CardContent className="relative p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <motion.p
                className="text-3xl font-bold"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + 0.2, type: "spring", stiffness: 200 }}
              >
                {value}
              </motion.p>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
              {trend && (
                <div className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}>
                  <span>{trend.isPositive ? "↑" : "↓"}</span>
                  <span>{Math.abs(trend.value)}%</span>
                </div>
              )}
            </div>

            <motion.div
              className={cn("p-3 rounded-xl bg-background/50 backdrop-blur-sm", iconColor)}
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              <Icon className="w-6 h-6" />
            </motion.div>
          </div>

          {/* Animated Border Effect */}
          <motion.div
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-primary"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ delay: delay + 0.3, duration: 0.8, ease: "easeInOut" }}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
