import classNames from "classnames";
import { useEffect, useRef, useState } from "react";
import styles from "./input-toggle.module.scss";
import { LiquidGlass } from "../../liquid-glass";

interface InputToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const DRAG_THRESHOLD = 5;
const CLICK_ANIMATION_MS = 100;
const MOVE_IDLE_MS = 50;

export const InputToggle = ({
  onClick,
  checked,
  defaultChecked,
  ...props
}: InputToggleProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startPos: number;
    lastPos: number;
    maxOffset: number;
    moved: boolean;
  } | null>(null);
  const [absPos, setAbsPos] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [internalChecked, setInternalChecked] = useState(!!defaultChecked);
  const animationTimerRef = useRef<number | null>(null);
  const moveIdleTimerRef = useRef<number | null>(null);

  const isControlled = checked !== undefined;
  const currentChecked = isControlled ? !!checked : internalChecked;

  const emitToggle = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isControlled) setInternalChecked((prev) => !prev);
    onClick?.(e as unknown as React.MouseEvent<HTMLInputElement>);
  };

  const triggerClickAnimation = () => {
    setIsAnimating(true);
    if (animationTimerRef.current !== null) {
      window.clearTimeout(animationTimerRef.current);
    }
    animationTimerRef.current = window.setTimeout(() => {
      setIsAnimating(false);
      animationTimerRef.current = null;
    }, CLICK_ANIMATION_MS);
  };

  useEffect(() => {
    return () => {
      if (animationTimerRef.current !== null) {
        window.clearTimeout(animationTimerRef.current);
      }
      if (moveIdleTimerRef.current !== null) {
        window.clearTimeout(moveIdleTimerRef.current);
      }
    };
  }, []);

  const measureMaxOffset = () => {
    const track = trackRef.current;
    const button = buttonRef.current;
    if (!track || !button) return 0;
    const style = getComputedStyle(button);
    const marginLeft = parseFloat(style.marginLeft) || 0;
    const marginRight = parseFloat(style.marginRight) || 0;
    return Math.max(
      0,
      track.getBoundingClientRect().width -
        button.getBoundingClientRect().width -
        marginLeft -
        marginRight,
    );
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current !== null) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const maxOffset = measureMaxOffset();
    const startPos = currentChecked ? maxOffset : 0;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startPos,
      lastPos: startPos,
      maxOffset,
      moved: false,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const delta = e.clientX - drag.startX;
    if (Math.abs(delta) > DRAG_THRESHOLD) drag.moved = true;

    const pos = Math.max(0, Math.min(drag.maxOffset, drag.startPos + delta));

    if (pos !== drag.lastPos) {
      drag.lastPos = pos;
      setIsMoving(true);
      if (moveIdleTimerRef.current !== null) {
        window.clearTimeout(moveIdleTimerRef.current);
      }
      moveIdleTimerRef.current = window.setTimeout(() => {
        setIsMoving(false);
        moveIdleTimerRef.current = null;
      }, MOVE_IDLE_MS);
    }

    setAbsPos(pos);

    const threshold = currentChecked
      ? drag.maxOffset * 0.25
      : drag.maxOffset * 0.75;
    const shouldBeChecked = currentChecked ? pos > threshold : pos >= threshold;
    if (shouldBeChecked !== currentChecked) {
      emitToggle(e);
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const { moved } = drag;
    dragRef.current = null;
    setIsDragging(false);
    setIsMoving(false);
    setAbsPos(null);
    if (moveIdleTimerRef.current !== null) {
      window.clearTimeout(moveIdleTimerRef.current);
      moveIdleTimerRef.current = null;
    }

    if (!moved) {
      triggerClickAnimation();
      emitToggle(e);
    }
  };

  const activeMaxOffset = dragRef.current?.maxOffset ?? 0;
  const dragX =
    absPos === null ? 0 : absPos - (currentChecked ? activeMaxOffset : 0);

  return (
    <div
      ref={trackRef}
      className={classNames(styles.inputToggle, {
        [styles.inputToggleChecked]: currentChecked,
        [styles.inputToggleDragging]: isDragging,
        [styles.inputToggleMoving]: isMoving,
        [styles.inputToggleAnimating]: isAnimating,
      })}
      style={{ "--drag-x": `${dragX}px` } as React.CSSProperties}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      {...props}
    >
      <div ref={buttonRef} className={styles.inputToggleButton}>
        <LiquidGlass glass="clear" />
      </div>
    </div>
  );
};
