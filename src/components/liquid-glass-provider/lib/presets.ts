export type LensVariant = "regular" | "clear";

export const LENS_CLASS: Record<LensVariant, string> = {
  regular: "liquid-glass",
  clear: "liquid-glass-clear",
};

export const LENS_SELECTOR = Object.values(LENS_CLASS)
  .map((c) => `.${c}`)
  .join(", ");

export interface VariantPreset {
  fPower: number;
  blurLod: number;
  blurFollowsDpr: boolean;
  fresnelBlur: number;
  dim: number;
  contrast: number;
  chroma: number;
  thickness: number;
  specular: number;
  bevel: number;
}

export const VARIANT_PRESETS: Record<LensVariant, VariantPreset> = {
  regular: {
    fPower: 2,
    blurLod: 0.5,
    blurFollowsDpr: true,
    fresnelBlur: 1.2,
    dim: 0.75,
    contrast: 0.8,
    chroma: 0.01,
    thickness: 2,
    specular: 0.2,
    bevel: 0.05,
  },
  clear: {
    fPower: 2.5,
    blurLod: 0,
    blurFollowsDpr: false,
    fresnelBlur: 1,
    dim: 1,
    contrast: 0.9,
    chroma: 0.1,
    thickness: 2,
    specular: 0,
    bevel: 0.2,
  },
};

export interface VariantUniforms {
  fPower: number;
  blurLod: number;
  fresnelBlur: number;
  dim: number;
  contrast: number;
  chroma: number;
  thickness: number;
  specular: number;
  bevel: number;
}

export function resolveVariantUniforms(
  variant: LensVariant,
  dprLog: number,
): VariantUniforms {
  const p = VARIANT_PRESETS[variant];
  return {
    fPower: p.fPower,
    blurLod: p.blurLod + (p.blurFollowsDpr ? dprLog : 0),
    fresnelBlur: p.fresnelBlur,
    dim: p.dim,
    contrast: p.contrast,
    chroma: p.chroma,
    thickness: p.thickness,
    specular: p.specular,
    bevel: p.bevel,
  };
}

export const GLOBAL_PARAMS = {
  a: 0.7,
  b: 2.3,
  c: 5.2,
  d: 6.9,
  noise: 0.02,
  glowWeight: 0.2,
  glowBias: 0.15,
  glowEdge0: 0.3,
  glowEdge1: 0.1,
};

export const SHADOW = {
  offsetX: 0,
  offsetY: -8,
  radius: 24,
  opacity: 0.05,
};
