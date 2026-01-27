"use client"

import { cn } from "@/lib/utils"

interface InfinityLoaderProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function InfinityLoader({ size = "md", className }: InfinityLoaderProps) {
  const sizeClasses = {
    sm: "w-16 h-8",
    md: "w-24 h-12",
    lg: "w-32 h-16"
  }

  const dotSize = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5"
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        {/* Infinity path SVG */}
        <svg
          className={cn("animate-infinity-draw", sizeClasses[size])}
          viewBox="0 0 100 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Gradient definition */}
          <defs>
            <linearGradient id="infinityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(147 51 234)" />
              <stop offset="50%" stopColor="rgb(37 99 235)" />
              <stop offset="100%" stopColor="rgb(147 51 234)" />
            </linearGradient>
          </defs>

          {/* Infinity symbol path */}
          <path
            d="M 25 25 C 25 10, 45 10, 50 25 C 55 40, 75 40, 75 25 C 75 10, 55 10, 50 25 C 45 40, 25 40, 25 25"
            stroke="url(#infinityGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="200"
            strokeDashoffset="0"
          />
        </svg>

        {/* Animated dots following the path */}
        <div className="absolute top-1/2 left-0 w-full -translate-y-1/2">
          <div className="relative w-full h-full">
            {/* Dot 1 */}
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 animate-infinity-dot shadow-lg shadow-purple-500/50",
                dotSize[size]
              )}
              style={{
                animationDelay: '0s'
              }}
            />

            {/* Dot 2 */}
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-infinity-dot shadow-lg shadow-blue-500/50",
                dotSize[size]
              )}
              style={{
                animationDelay: '0.66s'
              }}
            />

            {/* Dot 3 */}
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 animate-infinity-dot shadow-lg shadow-purple-500/50",
                dotSize[size]
              )}
              style={{
                animationDelay: '1.33s'
              }}
            />
          </div>
        </div>

        {/* Glow effect */}
        <div className={cn(
          "absolute inset-0 rounded-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 blur-xl animate-pulse",
          sizeClasses[size]
        )} />
      </div>
    </div>
  )
}
