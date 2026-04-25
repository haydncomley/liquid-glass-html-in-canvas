import { createContext } from "react";

export interface LiquidGlassContextValue {
  overlay: HTMLCanvasElement | null;
  // null while the provider is still feature-detecting; once resolved this
  // tells lenses whether to use the canvas overlay path or the CSS fallback.
  supported: boolean | null;
}

export const LiquidGlassContext = createContext<LiquidGlassContextValue>({
  overlay: null,
  supported: null,
});
