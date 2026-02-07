import { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Trash2, RotateCcw } from "lucide-react";

interface SignaturePadProps {
  onSignatureChange: (dataUrl: string | null) => void;
  width?: number;
  height?: number;
}

export function SignaturePad({ onSignatureChange, width, height = 180 }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [canvasWidth, setCanvasWidth] = useState(width || 350);

  useEffect(() => {
    if (!width && containerRef.current) {
      const updateWidth = () => {
        if (containerRef.current) {
          setCanvasWidth(containerRef.current.offsetWidth - 2);
        }
      };
      updateWidth();
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }
  }, [width]);

  const handleEnd = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      setIsEmpty(false);
      const dataUrl = sigCanvas.current.toDataURL("image/png");
      onSignatureChange(dataUrl);
    }
  };

  const handleClear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
    onSignatureChange(null);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            width: canvasWidth,
            height: height,
            className: "signature-canvas touch-none",
            style: { width: "100%", height: `${height}px` },
          }}
          penColor="#1e293b"
          minWidth={1.5}
          maxWidth={3}
          onEnd={handleEnd}
          data-testid="canvas-signature"
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-slate-400 text-sm font-medium">Sign here with your finger</p>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          data-testid="button-clear-signature"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>
    </div>
  );
}
