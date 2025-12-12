import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface TitanButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  children: React.ReactNode;
}

const variants = {
  primary: "bg-primary text-primary-foreground shadow-titan-md hover:brightness-110 active:brightness-95",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  destructive: "bg-destructive text-destructive-foreground shadow-titan-sm hover:bg-destructive/90",
  outline: "border border-input bg-transparent shadow-titan-sm hover:bg-accent hover:text-accent-foreground",
};

const sizes = {
  sm: "h-9 px-4 text-xs rounded-lg",
  md: "h-11 px-6 text-sm rounded-xl", // 44px min touch target
  lg: "h-14 px-8 text-base rounded-[14px]", // Titan Standard Primary
  icon: "h-11 w-11 rounded-xl flex items-center justify-center",
};

export const TitanButton = React.forwardRef<HTMLButtonElement, TitanButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </motion.button>
    );
  }
);
TitanButton.displayName = "TitanButton";
