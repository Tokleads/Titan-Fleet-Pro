import React from "react";
import { cn } from "@/lib/utils";

interface TitanInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const TitanInput = React.forwardRef<HTMLInputElement, TitanInputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-muted-foreground ml-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "flex h-12 w-full rounded-[10px] border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm",
              icon && "pl-10",
              error && "border-destructive ring-destructive/20",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-destructive ml-1">{error}</p>}
      </div>
    );
  }
);
TitanInput.displayName = "TitanInput";
