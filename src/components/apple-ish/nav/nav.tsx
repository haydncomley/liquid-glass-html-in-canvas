import { Mic, Search } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import styles from "./nav.module.scss";
import { LiquidGlass } from "../../liquid-glass";
import classNames from "classnames";

interface NavProps {
  children: React.ReactNode | React.ReactNode[];
  location?: "top" | "bottom";
}

export const Nav = ({ children, location = "bottom" }: NavProps) => {
  return (
    <nav
      className={classNames({
        [styles.bottomNav]: location === "bottom",
        [styles.topNav]: location === "top",
      })}
    >
      {children}
    </nav>
  );
};

const NavSearch = () => {
  return (
    <div className={styles.bottomNavSearch}>
      <LiquidGlass className={styles.bottomNavSearchField}>
        <div className={styles.bottomNavSearchFieldContent}>
          <Search />
          <input
            className={styles.bottomNavSearchFieldInput}
            type="text"
            name="search"
            id="search"
            placeholder="Search"
          />
          <Mic />
        </div>
      </LiquidGlass>
    </div>
  );
};

interface NavFabProps {
  Icon?: React.ReactNode;
  label?: string;
  location?: "left" | "right";
  onClick?: () => void;
}

const NavFab = ({ Icon, label, onClick }: NavFabProps) => {
  return (
    <div className={styles.navFab}>
      <div className={styles.navFabButton} onClick={onClick}>
        <LiquidGlass className={styles.navFabButtonContent}>
          {Icon}
          {label}
        </LiquidGlass>
      </div>
    </div>
  );
};

interface NavBarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
}

interface NavBarProps {
  items: NavBarItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
}

const DRAG_THRESHOLD = 5;
const MOVE_IDLE_MS = 50;
const CLICK_ANIMATION_MS = 150;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

interface Metrics {
  itemWidth: number;
  itemLefts: number[];
}

interface DragState {
  pointerId: number;
  startX: number;
  startPos: number;
  lastPos: number;
  itemWidth: number;
  firstLeft: number;
  lastLeft: number;
  moved: boolean;
  pressedIdx: number;
}

const NavBar = ({ items, value, defaultValue, onChange }: NavBarProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const dragRef = useRef<DragState | null>(null);
  const animationTimerRef = useRef<number | null>(null);
  const moveIdleTimerRef = useRef<number | null>(null);
  const [internalValue, setInternalValue] = useState<string | undefined>(
    defaultValue,
  );
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [absPos, setAbsPos] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const activeIdx = items.findIndex((i) => i.id === currentValue);
  const hasActive = activeIdx >= 0;
  const effectiveIdx = hasActive ? activeIdx : 0;

  useLayoutEffect(() => {
    const update = () => {
      const track = trackRef.current;
      if (!track) return;
      const children = itemRefs.current;
      if (children.length === 0) return;
      const trackRect = track.getBoundingClientRect();
      const lefts: number[] = [];
      let widthSum = 0;
      let widthCount = 0;
      for (const el of children) {
        if (!el) {
          lefts.push(0);
          continue;
        }
        const r = el.getBoundingClientRect();
        lefts.push(r.left - trackRect.left);
        widthSum += r.width;
        widthCount += 1;
      }
      if (widthCount === 0) return;
      const next: Metrics = {
        itemWidth: widthSum / widthCount,
        itemLefts: lefts,
      };
      setMetrics((prev) => {
        if (
          prev &&
          prev.itemWidth === next.itemWidth &&
          prev.itemLefts.length === next.itemLefts.length &&
          prev.itemLefts.every((v, i) => v === next.itemLefts[i])
        ) {
          return prev;
        }
        return next;
      });
    };

    update();
    // The items live in the pill LiquidGlass's portal, whose position is
    // re-synced every rAF tick. ResizeObserver only catches size changes, so
    // poll positions on rAF to keep metrics aligned with the portal.
    let raf = requestAnimationFrame(function tick() {
      update();
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [items.length]);

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

  const emitChange = (id: string) => {
    if (id === currentValue) return;
    if (!isControlled) setInternalValue(id);
    onChange?.(id);
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

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current !== null) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (!metrics || metrics.itemLefts.length === 0) return;
    const { itemWidth, itemLefts } = metrics;

    let pressedIdx = effectiveIdx;
    for (let i = 0; i < itemRefs.current.length; i++) {
      const c = itemRefs.current[i];
      if (!c) continue;
      const r = c.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right) {
        pressedIdx = i;
        break;
      }
    }

    const firstLeft = itemLefts[0];
    const lastLeft = itemLefts[itemLefts.length - 1];
    const startPos = itemLefts[pressedIdx] ?? firstLeft;

    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startPos,
      lastPos: startPos,
      itemWidth,
      firstLeft,
      lastLeft,
      moved: false,
      pressedIdx,
    };
    setAbsPos(startPos);
    setIsDragging(true);
    const pressedId = items[pressedIdx]?.id;
    if (pressedId) emitChange(pressedId);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const delta = e.clientX - drag.startX;
    if (Math.abs(delta) > DRAG_THRESHOLD) drag.moved = true;

    const pos = clamp(drag.startPos + delta, drag.firstLeft, drag.lastLeft);

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

    if (drag.moved && drag.itemWidth > 0) {
      const idxFromPos = clamp(
        Math.round((pos - drag.firstLeft) / drag.itemWidth),
        0,
        items.length - 1,
      );
      const targetId = items[idxFromPos]?.id;
      if (targetId && targetId !== currentValue) emitChange(targetId);
    }
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const { moved, pressedIdx } = drag;
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
      const id = items[pressedIdx]?.id;
      if (id) emitChange(id);
    }
  };

  const restX = metrics?.itemLefts[effectiveIdx] ?? 0;
  const indicatorX = absPos ?? restX;
  const indicatorW = metrics?.itemWidth ?? 0;

  return (
    <div className={styles.navBar}>
      <LiquidGlass className={styles.navBarPill}>
        <div
          ref={trackRef}
          className={classNames(styles.navBarContent, {
            [styles.navBarContentDragging]: isDragging,
            [styles.navBarContentMoving]: isMoving,
            [styles.navBarContentAnimating]: isAnimating,
          })}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {items.map(({ id, label, icon }, i) => (
            <button
              key={id}
              type="button"
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className={classNames(styles.navBarItem, {
                [styles.navBarItemActive]: id === currentValue,
                [styles.navBarItemSelected]:
                  id === currentValue && !isMoving && !isDragging,
              })}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </LiquidGlass>
      <div
        className={classNames(styles.navBarIndicator, {
          [styles.navBarIndicatorDragging]: isDragging,
          [styles.navBarIndicatorMoving]: isMoving,
          [styles.navBarIndicatorAnimating]: isAnimating,
          [styles.navBarIndicatorHidden]: !hasActive || indicatorW === 0,
        })}
        style={
          {
            "--indicator-x": `${indicatorX}px`,
            "--indicator-w": `${indicatorW}px`,
          } as CSSProperties
        }
        aria-hidden="true"
      >
        <LiquidGlass glass="clear" level={1} />
      </div>
    </div>
  );
};

Nav.Search = NavSearch;
Nav.Fab = NavFab;
Nav.Bar = NavBar;
