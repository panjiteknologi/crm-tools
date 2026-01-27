"use client"

import { cn } from "@/lib/utils"

interface PulseLoaderProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function InfinityLoader({ size = "lg", className }: PulseLoaderProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-20 h-20",
    lg: "w-28 h-28",
    xl: "w-36 h-36"
  }

  const dotSize = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
    xl: "w-3 h-3"
  }

  const ringSizes = {
    sm: { outer: "w-16 h-16", middle: "w-11 h-11", inner: "w-7 h-7" },
    md: { outer: "w-20 h-20", middle: "w-14 h-14", inner: "w-9 h-9" },
    lg: { outer: "w-28 h-28", middle: "w-20 h-20", inner: "w-13 h-13" },
    xl: { outer: "w-36 h-36", middle: "w-26 h-26", inner: "w-17 h-17" }
  }

  const ringStyles = {
    sm: { outer: "w-16 h-16 border-[2px]", middle: "w-11 h-11 border-[2px]", inner: "w-7 h-7 border-[2px]" },
    md: { outer: "w-20 h-20 border-[2.5px]", middle: "w-14 h-14 border-[2.5px]", inner: "w-9 h-9 border-[2.5px]" },
    lg: { outer: "w-28 h-28 border-[3px]", middle: "w-20 h-20 border-[3px]", inner: "w-13 h-13 border-[3px]" },
    xl: { outer: "w-36 h-36 border-[3.5px]", middle: "w-26 h-26 border-[3.5px]", inner: "w-17 h-17 border-[3.5px]" }
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
        {/* Outer Ring */}
        <div
          className={cn(
            "absolute rounded-full border-purple-500/30 animate-pulse-ring",
            ringStyles[size].outer
          )}
        />

        {/* Middle Ring */}
        <div
          className={cn(
            "absolute rounded-full border-blue-500/40 animate-pulse-ring",
            "animation-delay-150",
            ringStyles[size].middle
          )}
        />

        {/* Inner Ring */}
        <div
          className={cn(
            "absolute rounded-full border-purple-600/50 animate-pulse-ring",
            "animation-delay-300",
            ringStyles[size].inner
          )}
        />

        {/* Center Dot */}
        <div className={cn(
          "rounded-full bg-gradient-to-r from-purple-600 to-blue-600 animate-pulse-dot shadow-lg shadow-purple-500/50",
          dotSize[size]
        )} />

        {/* Glow Effect */}
        <div className={cn(
          "absolute rounded-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 blur-xl animate-pulse",
          sizeClasses[size]
        )} />
      </div>
    </div>
  )
}
