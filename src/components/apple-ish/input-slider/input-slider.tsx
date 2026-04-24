import classNames from "classnames";
import { useEffect, useRef, useState } from "react";
import styles from "./input-slider.module.scss";
import { LiquidGlass } from "../../liquid-glass";

interface InputSliderProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "defaultValue" | "onChange" | "type"
  > {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
}

const MOVE_IDLE_MS = 50;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

export const InputSlider = ({
  value,
  defaultValue,
  min = 0,
  max = 100,
  step,
  onChange,
  className,
  style,
  ...props
}: InputSliderProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startPx: number;
    lastPx: number;
    maxOffset: number;
  } | null>(null);
  const [activePx, setActivePx] = useState<number | null>(null);
  const [activeMax, setActiveMax] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? min);
  const moveIdleTimerRef = useRef<number | null>(null);

  const isControlled = value !== undefined;
  const currentValue = isControlled ? (value as number) : internalValue;
  const clampedValue = clamp(currentValue, min, max);
  const range = max - min || 1;
  const valuePct = (clampedValue - min) / range;

  const commitFromPx = (px: number, maxOffset: number) => {
    if (maxOffset <= 0) return;
    const frac = clamp(px / maxOffset, 0, 1);
    let next = min + frac * range;
    if (step != null) {
      next = min + Math.round((next - min) / step) * step;
    }
    next = clamp(next, min, max);
    if (next === currentValue) return;
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
  };

  useEffect(() => {
    return () => {
      if (moveIdleTimerRef.current !== null) {
        window.clearTimeout(moveIdleTimerRef.current);
      }
    };
  }, []);

  const measure = () => {
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!track || !thumb) return null;
    const trackRect = track.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const maxOffset = Math.max(0, trackRect.width - thumbRect.width);
    return { trackRect, thumbRect, maxOffset };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current !== null) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const m = measure();
    if (!m) return;
    const { trackRect, thumbRect, maxOffset } = m;

    const onThumb =
      e.clientX >= thumbRect.left && e.clientX <= thumbRect.right;

    let startPx = thumbRect.left - trackRect.left;
    if (!onThumb) {
      startPx = clamp(
        e.clientX - trackRect.left - thumbRect.width / 2,
        0,
        maxOffset,
      );
      commitFromPx(startPx, maxOffset);
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startPx,
      lastPx: startPx,
      maxOffset,
    };
    setActivePx(startPx);
    setActiveMax(maxOffset);
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const delta = e.clientX - drag.startX;
    const px = clamp(drag.startPx + delta, 0, drag.maxOffset);

    if (px !== drag.lastPx) {
      drag.lastPx = px;
      setIsMoving(true);
      if (moveIdleTimerRef.current !== null) {
        window.clearTimeout(moveIdleTimerRef.current);
      }
      moveIdleTimerRef.current = window.setTimeout(() => {
        setIsMoving(false);
        moveIdleTimerRef.current = null;
      }, MOVE_IDLE_MS);
    }

    setActivePx(px);
    commitFromPx(px, drag.maxOffset);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    dragRef.current = null;
    setIsDragging(false);
    setIsMoving(false);
    setActivePx(null);
    if (moveIdleTimerRef.current !== null) {
      window.clearTimeout(moveIdleTimerRef.current);
      moveIdleTimerRef.current = null;
    }
  };

  const thumbPct =
    activePx !== null && activeMax > 0 ? activePx / activeMax : valuePct;

  return (
    <div
      ref={trackRef}
      className={classNames(styles.inputSlider, className, {
        [styles.inputSliderDragging]: isDragging,
        [styles.inputSliderMoving]: isMoving,
      })}
      style={
        { "--thumb-pct": thumbPct, ...(style ?? {}) } as React.CSSProperties
      }
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      {...props}
    >
      <div className={styles.inputSliderRail} />
      <div ref={thumbRef} className={styles.inputSliderThumb}>
        <LiquidGlass glass="clear" />
      </div>
    </div>
  );
};
