import {
  useContext,
  useLayoutEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import styles from "./LiquidGlass.module.scss";
import { LiquidGlassContext } from "../liquid-glass-provider/lib/context";

export type GlassVariant = "regular" | "clear";

interface LiquidGlassProps extends HTMLAttributes<HTMLDivElement> {
  glass?: GlassVariant;
  /**
   * Render this lens above the provider's overlay layer so it refracts
   * content portaled there (other lenses' children). Default 0.
   */
  level?: 0 | 1;
  children?: ReactNode;
}

export function LiquidGlass({
  glass = "regular",
  level = 0,
  className,
  style,
  children,
  ...rest
}: LiquidGlassProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const { overlay, supported } = useContext(LiquidGlassContext);
  const isFallback = supported === false;

  useLayoutEffect(() => {
    if (isFallback) return;
    const anchor = anchorRef.current;
    const portal = portalRef.current;
    if (!anchor || !portal) return;

    const sync = () => {
      const r = anchor.getBoundingClientRect();
      // `translate` composes with any `transform` the consumer sets via className
      // or style, instead of overwriting it.
      portal.style.translate = `${r.left}px ${r.top}px`;
      portal.style.width = `${r.width}px`;
      portal.style.height = `${r.height}px`;
    };

    sync();

    const ro = new ResizeObserver(sync);
    ro.observe(anchor);

    let raf = requestAnimationFrame(function tick() {
      sync();
      raf = requestAnimationFrame(tick);
    });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  });

  const marker = glass === "clear" ? "liquid-glass-clear" : "liquid-glass";

  if (isFallback) {
    // No source canvas exists, so there's nothing to portal into and nothing to
    // sync against. Render the lens in normal layout flow with a CSS-only glass
    // surface — children stay interactive and the consumer's className governs
    // sizing/border-radius exactly as in the shader path.
    const fallbackClass = [
      marker,
      styles.fallback,
      glass === "clear" ? styles.fallbackClear : styles.fallbackRegular,
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <span
        {...rest}
        className={fallbackClass}
        data-glass
        data-liquid-level={level}
        style={style}
      >
        {children}
      </span>
    );
  }

  const anchorClass = [marker, styles.anchor, className]
    .filter(Boolean)
    .join(" ");
  const portalClass = [styles.portal, className].filter(Boolean).join(" ");
  const portalTarget = overlay ?? document.body;

  return (
    <>
      <span
        ref={anchorRef}
        className={anchorClass}
        aria-hidden="true"
        data-glass
        data-liquid-level={level}
        style={style}
      >
        {children}
      </span>
      {createPortal(
        <div
          {...rest}
          ref={portalRef}
          className={portalClass}
          style={style}
        >
          {children}
        </div>,
        portalTarget,
      )}
    </>
  );
}
