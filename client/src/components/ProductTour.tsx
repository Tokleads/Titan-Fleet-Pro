import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { createPortal } from "react-dom";

export interface TourStep {
  target: string;
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right";
}

interface ProductTourProps {
  steps: TourStep[];
  storageKey: string;
  onComplete?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

function getElement(target: string): HTMLElement | null {
  if (target.startsWith("[")) {
    return document.querySelector(target);
  }
  return document.querySelector(target);
}

function getTooltipPosition(
  elRect: Rect,
  placement: "top" | "bottom" | "left" | "right",
  tooltipWidth: number,
  tooltipHeight: number
) {
  const padding = 16;
  const arrowGap = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = 0;
  let left = 0;

  switch (placement) {
    case "top":
      top = elRect.top - tooltipHeight - arrowGap;
      left = elRect.left + elRect.width / 2 - tooltipWidth / 2;
      break;
    case "bottom":
      top = elRect.bottom + arrowGap;
      left = elRect.left + elRect.width / 2 - tooltipWidth / 2;
      break;
    case "left":
      top = elRect.top + elRect.height / 2 - tooltipHeight / 2;
      left = elRect.left - tooltipWidth - arrowGap;
      break;
    case "right":
      top = elRect.top + elRect.height / 2 - tooltipHeight / 2;
      left = elRect.right + arrowGap;
      break;
  }

  if (left < padding) left = padding;
  if (left + tooltipWidth > vw - padding) left = vw - tooltipWidth - padding;
  if (top < padding) top = padding;
  if (top + tooltipHeight > vh - padding) top = vh - tooltipHeight - padding;

  return { top, left };
}

function getBestPlacement(
  elRect: Rect,
  preferred: "top" | "bottom" | "left" | "right"
): "top" | "bottom" | "left" | "right" {
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const spaceTop = elRect.top;
  const spaceBottom = vh - elRect.bottom;
  const spaceLeft = elRect.left;
  const spaceRight = vw - elRect.right;
  const minSpace = 200;

  if (preferred === "bottom" && spaceBottom >= minSpace) return "bottom";
  if (preferred === "top" && spaceTop >= minSpace) return "top";
  if (preferred === "left" && spaceLeft >= minSpace) return "left";
  if (preferred === "right" && spaceRight >= minSpace) return "right";

  const spaces = [
    { dir: "bottom" as const, space: spaceBottom },
    { dir: "top" as const, space: spaceTop },
    { dir: "right" as const, space: spaceRight },
    { dir: "left" as const, space: spaceLeft },
  ];
  spaces.sort((a, b) => b.space - a.space);
  return spaces[0].dir;
}

export function ProductTour({
  steps,
  storageKey,
  onComplete,
  isOpen: controlledOpen,
  onClose: controlledClose,
}: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [internalOpen, setInternalOpen] = useState(false);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 360, height: 200 });

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  useEffect(() => {
    if (!isControlled) {
      const seen = localStorage.getItem(storageKey);
      if (!seen) {
        const timer = setTimeout(() => setInternalOpen(true), 800);
        return () => clearTimeout(timer);
      }
    }
  }, [storageKey, isControlled]);

  const close = useCallback(() => {
    localStorage.setItem(storageKey, "true");
    if (isControlled) {
      controlledClose?.();
    } else {
      setInternalOpen(false);
    }
    onComplete?.();
  }, [storageKey, isControlled, controlledClose, onComplete]);

  const findValidStep = useCallback(
    (from: number, direction: 1 | -1): number => {
      let idx = from;
      while (idx >= 0 && idx < steps.length) {
        const el = getElement(steps[idx].target);
        if (el) return idx;
        idx += direction;
      }
      return -1;
    },
    [steps]
  );

  const updateRect = useCallback(() => {
    if (!isOpen || !steps[currentStep]) return;
    const el = getElement(steps[currentStep].target);
    if (!el) {
      const nextValid = findValidStep(currentStep + 1, 1);
      if (nextValid >= 0) {
        setCurrentStep(nextValid);
      } else {
        close();
      }
      return;
    }
    const r = el.getBoundingClientRect();
    const pad = 6;
    setTargetRect({
      top: r.top - pad,
      left: r.left - pad,
      width: r.width + pad * 2,
      height: r.height + pad * 2,
      bottom: r.bottom + pad,
      right: r.right + pad,
    });
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [isOpen, currentStep, steps, findValidStep, close]);

  useEffect(() => {
    if (!isOpen) return;
    const startStep = findValidStep(0, 1);
    if (startStep < 0) {
      close();
      return;
    }
    setCurrentStep(startStep);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(updateRect, 100);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [isOpen, currentStep, updateRect]);

  useEffect(() => {
    if (tooltipRef.current) {
      const r = tooltipRef.current.getBoundingClientRect();
      setTooltipSize({ width: r.width, height: r.height });
    }
  }, [currentStep, isOpen]);

  const goNext = () => {
    const next = findValidStep(currentStep + 1, 1);
    if (next >= 0) {
      setCurrentStep(next);
    } else {
      close();
    }
  };

  const goBack = () => {
    const prev = findValidStep(currentStep - 1, -1);
    if (prev >= 0) {
      setCurrentStep(prev);
    }
  };

  if (!isOpen || !targetRect) return null;

  const step = steps[currentStep];
  if (!step) return null;

  const placement = getBestPlacement(
    targetRect,
    step.placement || "bottom"
  );
  const pos = getTooltipPosition(
    targetRect,
    placement,
    tooltipSize.width,
    tooltipSize.height
  );

  const totalVisibleSteps = steps.filter((s) => getElement(s.target)).length;
  const currentVisibleIndex =
    steps
      .slice(0, currentStep + 1)
      .filter((s) => getElement(s.target)).length;

  const overlay = (
    <div className="fixed inset-0 z-[9998]" data-testid="product-tour-overlay">
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.left}
              y={targetRect.top}
              width={targetRect.width}
              height={targetRect.height}
              rx="12"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.6)"
          mask="url(#tour-spotlight-mask)"
          style={{ pointerEvents: "auto" }}
          onClick={close}
        />
      </svg>

      <div
        className="absolute rounded-xl ring-2 ring-blue-500/50 ring-offset-2"
        style={{
          top: targetRect.top,
          left: targetRect.left,
          width: targetRect.width,
          height: targetRect.height,
          pointerEvents: "none",
        }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          ref={tooltipRef}
          initial={{ opacity: 0, y: placement === "top" ? 10 : -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute z-[9999] w-[340px] max-w-[calc(100vw-32px)]"
          style={{ top: pos.top, left: pos.left }}
          data-testid="product-tour-tooltip"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-medium text-blue-300 uppercase tracking-wider">
                  {currentVisibleIndex} of {totalVisibleSteps}
                </span>
              </div>
              <button
                onClick={close}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                data-testid="tour-close-button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-2">
              <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {step.description}
              </p>
            </div>

            <div className="px-5 pb-4 flex items-center justify-between gap-3">
              <button
                onClick={close}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors"
                data-testid="tour-skip-button"
              >
                Skip Tour
              </button>
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={goBack}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                    data-testid="tour-back-button"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>
                )}
                <button
                  onClick={goNext}
                  className="flex items-center gap-1 px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                  data-testid="tour-next-button"
                >
                  {findValidStep(currentStep + 1, 1) >= 0 ? (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </>
                  ) : (
                    "Got it!"
                  )}
                </button>
              </div>
            </div>

            <div className="px-5 pb-3">
              <div className="flex gap-1">
                {steps.map((s, i) => {
                  const exists = !!getElement(s.target);
                  if (!exists) return null;
                  return (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i <= currentStep ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );

  return createPortal(overlay, document.body);
}
