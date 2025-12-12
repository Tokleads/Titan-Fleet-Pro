import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CaptureTileProps {
  label: string;
  sublabel?: string;
  value?: string | null; // URL or placeholder
  onCapture: () => void;
  required?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export function TitanCaptureTile({ label, sublabel, value, onCapture, required, className, icon }: CaptureTileProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onCapture}
      className={cn(
        "relative cursor-pointer group rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-secondary/20 hover:bg-secondary/40 transition-colors overflow-hidden aspect-[4/3] flex flex-col items-center justify-center text-center p-4",
        value && "border-solid border-primary/20 bg-background",
        className
      )}
    >
      {value ? (
        <>
          <img src={value} alt={label} className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
          <div className="absolute bottom-3 right-3 bg-white/90 text-primary text-xs font-bold px-2 py-1 rounded shadow-sm">
            Retake
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
          <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
            {icon}
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">
              {label} {required && <span className="text-destructive">*</span>}
            </p>
            {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
          </div>
        </div>
      )}
    </motion.div>
  );
}
