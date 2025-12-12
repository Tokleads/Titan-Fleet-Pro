import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface SegmentedControlProps {
  options: { label: string; value: string; variant?: "default" | "success" | "danger" }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TitanSegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  return (
    <div className={cn("flex p-1 bg-secondary rounded-xl gap-1", className)}>
      {options.map((option) => {
        const isSelected = value === option.value;
        
        let activeClass = "bg-background text-foreground shadow-titan-sm";
        if (isSelected && option.variant === "success") activeClass = "bg-green-600 text-white shadow-titan-sm";
        if (isSelected && option.variant === "danger") activeClass = "bg-destructive text-white shadow-titan-sm";

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex-1 py-3 text-sm font-medium rounded-[10px] transition-all duration-200 flex items-center justify-center gap-2",
              isSelected ? activeClass : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            {isSelected && (
              <motion.span
                layoutId="segment-indicator"
                className="absolute inset-0 rounded-[10px] bg-transparent"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
