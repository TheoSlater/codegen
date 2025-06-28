"use client";
import React, { useMemo, type JSX } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@mui/material/styles";

interface TextShimmerProps {
  children: string;
  as?: React.ElementType;
  className?: string;
  duration?: number;
  spread?: number;
}

export function TextShimmer({
  children,
  as: Component = "p",
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) {
  const theme = useTheme();

  const MotionComponent = motion(Component as keyof JSX.IntrinsicElements);

  const dynamicSpread = useMemo(() => {
    return children.length * spread;
  }, [children, spread]);

  // Set base colors based on theme mode:
  // baseColor: slightly darker text color
  // baseGradientColor: shimmer highlight color (lighter)

  const baseColor = theme.palette.mode === "dark" ? "#71717a" : "#a1a1aa"; // gray shades
  const baseGradientColor =
    theme.palette.mode === "dark" ? "#ffffff" : "#000000";

  return (
    <MotionComponent
      className={className}
      initial={{ backgroundPosition: "200% center" }}
      animate={{ backgroundPosition: "0% center" }}
      transition={{
        repeat: Infinity,
        duration,
        ease: "linear",
      }}
      style={
        {
          // CSS vars injected for background gradient spread and colors
          "--spread": `${dynamicSpread}px`,
          "--base-color": baseColor,
          "--base-gradient-color": baseGradientColor,
          backgroundImage: `
          linear-gradient(
            90deg,
            #0000 calc(50% - var(--spread)),
            var(--base-gradient-color),
            #0000 calc(50% + var(--spread))
          ),
          linear-gradient(var(--base-color), var(--base-color))
        `,
          backgroundRepeat: "no-repeat",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
          backgroundSize: "250% 100%, auto",
          paddingBox: "padding-box",
        } as React.CSSProperties
      }
    >
      {children}
    </MotionComponent>
  );
}
