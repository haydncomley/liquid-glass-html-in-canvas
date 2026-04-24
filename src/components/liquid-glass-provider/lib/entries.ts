import { LENS_CLASS, LENS_SELECTOR, type LensVariant } from "./presets";

export interface LensEntry {
  rect: DOMRect;
  cornerR: number;
  z: number;
  variant: LensVariant;
  opacity: number;
  magnify: number;
  level: 0 | 1;
}

export function collectLensEntries(root: HTMLElement): LensEntry[] {
  const entries: LensEntry[] = [];
  const els = Array.from(root.querySelectorAll<HTMLElement>(LENS_SELECTOR));

  for (const el of els) {
    const rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) continue;

    const cs = getComputedStyle(el);
    const opacityRaw = parseFloat(cs.opacity);
    const opacity = Number.isFinite(opacityRaw)
      ? Math.max(0, Math.min(1, opacityRaw))
      : 1;
    if (opacity <= 0) continue;

    const cornerR = parseFloat(cs.borderTopLeftRadius) || 0;
    const zRaw = parseInt(cs.zIndex, 10);
    const z = Number.isFinite(zRaw) ? zRaw : 0;
    const magnifyRaw = parseFloat(cs.getPropertyValue("--liquid-magnify"));
    const magnify = Number.isFinite(magnifyRaw) ? magnifyRaw : 0;
    const variant: LensVariant = el.classList.contains(LENS_CLASS.clear)
      ? "clear"
      : "regular";
    const level: 0 | 1 = el.dataset.liquidLevel === "1" ? 1 : 0;

    entries.push({ rect, cornerR, z, variant, opacity, magnify, level });
  }

  // Low → high z so higher-z lenses draw on top.
  entries.sort((a, b) => a.z - b.z);
  return entries;
}
