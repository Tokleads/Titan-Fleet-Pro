import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface TitanCardProps extends HTMLMotionProps<"div"> {
  variant?: "default" | "flat" | "elevated";
}

const variants = {
  default: "bg-card text-card-foreground border border-border shadow-titan-sm",
  flat: "bg-secondary/50 border-transparent",
  elevated: "bg-card text-card-foreground border-transparent shadow-titan-lg",
};

export const TitanCard = React.forwardRef<HTMLDivElement, TitanCardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "rounded-[12px] overflow-hidden",
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
TitanCard.displayName = "TitanCard";

export function TitanCardHeader({ className, children }: { className?: string, children: React.ReactNode }) {
  return <div className={cn("px-6 py-4 border-b border-border/50", className)}>{children}</div>;
}

export function TitanCardContent({ className, children }: { className?: string, children: React.ReactNode }) {
  return <div className={cn("p-6", className)}>{children}</div>;
}
