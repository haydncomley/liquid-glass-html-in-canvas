import { useEffect, useRef, useState, type ReactNode } from "react";
import "./CanvasHost.scss";

interface Props {
  children: ReactNode;
}

export function CanvasHost({ children }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const ok =
      typeof CanvasRenderingContext2D !== "undefined" &&
      "drawElementImage" in CanvasRenderingContext2D.prototype;
    setSupported(ok);
    if (!ok) {
      console.warn(
        "[CanvasHost] drawElementImage unavailable — rendering plain DOM. Enable chrome://flags/#canvas-draw-element in Chrome Canary.",
      );
      return;
    }

    const canvas = canvasRef.current;
    const content = contentRef.current;
    if (!canvas || !content) return;

    canvas.setAttribute("layoutsubtree", "");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const paint = () => {
      if (!canvas.width || !canvas.height) return;
      const dpr = 1;
      ctx.reset();
      ctx.scale(dpr, dpr);
      try {
        const t = ctx.drawElementImage!(content, 0, 0);
        content.style.transform = t.toString();
      } catch {
        canvas.requestPaint?.();
      }
    };

    canvas.onpaint = paint;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const box = entry.devicePixelContentBoxSize?.[0];
        if (!box) continue;
        canvas.width = box.inlineSize;
        canvas.height = box.blockSize;
      }
      canvas.requestPaint?.();
    });
    ro.observe(canvas, { box: "device-pixel-content-box" });

    const onScroll = () => canvas.requestPaint?.();
    content.addEventListener("scroll", onScroll, { passive: true });

    canvas.requestPaint?.();

    return () => {
      ro.disconnect();
      content.removeEventListener("scroll", onScroll);
      canvas.onpaint = null;
    };
  }, []);

  if (supported === false) return <>{children}</>;

  return (
    <canvas ref={canvasRef} className="canvas-host">
      <div ref={contentRef} className="canvas-host__content">
        {children}
      </div>
    </canvas>
  );
}
