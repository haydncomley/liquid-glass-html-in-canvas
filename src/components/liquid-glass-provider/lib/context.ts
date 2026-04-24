import { createContext } from "react";

export interface LiquidGlassContextValue {
  overlay: HTMLCanvasElement | null;
}

export const LiquidGlassContext = createContext<LiquidGlassContextValue>({
  overlay: null,
});
