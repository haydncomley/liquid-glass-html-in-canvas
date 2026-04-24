import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./LiquidGlassProvider.module.scss";
import { LiquidGlassContext } from "./lib/context";
import { collectLensEntries, type LensEntry } from "./lib/entries";
import {
  applyGlobalUniforms,
  createLensTexture,
  createProgram,
  lookupUniforms,
  setupFullscreenQuad,
  type Uniforms,
} from "./lib/gl";
import { resolveVariantUniforms, SHADOW } from "./lib/presets";

interface Props {
  children: ReactNode;
}

interface GlLayer {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  u: Uniforms;
  tex: WebGLTexture;
}

function isLightColor(css: string): boolean {
  const m = css.match(/-?\d+(?:\.\d+)?/g);
  if (!m || m.length < 3) return false;
  const [r, g, b] = m.map(Number);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 140;
}

function initGlLayer(canvas: HTMLCanvasElement): GlLayer | null {
  const gl = canvas.getContext("webgl2");
  if (!gl) return null;
  let prog: WebGLProgram;
  try {
    prog = createProgram(gl);
  } catch (e) {
    console.error(e);
    return null;
  }
  gl.useProgram(prog);
  setupFullscreenQuad(gl, prog);
  const u = lookupUniforms(gl, prog);
  applyGlobalUniforms(gl, u);
  const tex = createLensTexture(gl);
  if (!tex) return null;
  gl.uniform1i(u.u_tex, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);
  return { canvas, gl, u, tex };
}

function uploadSource(layer: GlLayer, src: TexImageSource) {
  const { gl, tex } = layer;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  gl.generateMipmap(gl.TEXTURE_2D);
}

function drawEntries(
  layer: GlLayer,
  entries: LensEntry[],
  scaleX: number,
  scaleY: number,
  isLightMode: boolean,
) {
  const { gl, u, canvas } = layer;
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT);
  if (entries.length === 0) return;

  const canvasRect = canvas.getBoundingClientRect();
  gl.uniform2f(u.u_resolution, canvas.width, canvas.height);
  const dprLog = Math.log2(scaleX || 1);

  for (const { rect, cornerR, variant, opacity, magnify } of entries) {
    const cxCss = rect.left - canvasRect.left + rect.width / 2;
    const cyCss = rect.top - canvasRect.top + rect.height / 2;

    gl.uniform2f(
      u.u_center,
      cxCss * scaleX,
      canvas.height - cyCss * scaleY,
    );
    gl.uniform2f(
      u.u_halfSize,
      (rect.width / 2) * scaleX,
      (rect.height / 2) * scaleY,
    );
    gl.uniform1f(u.u_cornerRadius, cornerR * scaleX);

    gl.uniform2f(
      u.u_shadowOffset,
      SHADOW.offsetX * scaleX,
      SHADOW.offsetY * scaleY,
    );
    gl.uniform1f(u.u_shadowRadius, SHADOW.radius * scaleX);
    gl.uniform1f(u.u_shadowOpacity, SHADOW.opacity);
    gl.uniform1f(u.u_opacity, opacity);
    gl.uniform1f(u.u_magnify, magnify);

    const v = resolveVariantUniforms(variant, dprLog);
    gl.uniform1f(u.u_fPower, v.fPower);
    gl.uniform1f(u.u_blurLod, v.blurLod);
    gl.uniform1f(u.u_fresnelBlur, v.fresnelBlur);
    gl.uniform1f(u.u_dim, v.dim);
    if (isLightMode) {
      gl.uniform3f(u.u_dimColor, 1, 1, 1);
    } else {
      gl.uniform3f(u.u_dimColor, 0.2, 0.2, 0.2);
    }
    gl.uniform1f(u.u_contrast, v.contrast);
    gl.uniform1f(u.u_chroma, v.chroma);
    gl.uniform1f(u.u_thickness, v.thickness);
    gl.uniform1f(u.u_specular, v.specular);
    gl.uniform1f(u.u_bevel, v.bevel);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

export function LiquidGlassProvider({ children }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const gl0Ref = useRef<HTMLCanvasElement>(null);
  const gl1Ref = useRef<HTMLCanvasElement>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [overlayEl, setOverlayEl] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const source = sourceRef.current;
    const overlay = overlayRef.current;
    const gl0Canvas = gl0Ref.current;
    const gl1Canvas = gl1Ref.current;
    if (!wrap || !source || !overlay || !gl0Canvas || !gl1Canvas) return;

    const ctx2d = source.getContext("2d");
    const overlayCtx = overlay.getContext("2d");
    const layer0 = initGlLayer(gl0Canvas);
    const layer1 = initGlLayer(gl1Canvas);
    const ok =
      !!ctx2d &&
      !!overlayCtx &&
      !!layer0 &&
      !!layer1 &&
      typeof ctx2d.drawElementImage === "function" &&
      typeof overlayCtx.drawElementImage === "function";
    setSupported(ok);
    if (!ctx2d || !overlayCtx || !layer0 || !layer1 || !ok) {
      console.warn(
        "[LiquidGlassProvider] required APIs missing — falling back to plain DOM. Enable chrome://flags/#canvas-draw-element in Chrome Canary.",
      );
      return;
    }

    source.setAttribute("layoutsubtree", "");
    overlay.setAttribute("layoutsubtree", "");

    // Off-screen canvas used to composite base + overlay into a single texture
    // for level-1 lenses.
    const combined = document.createElement("canvas");
    const combinedCtx = combined.getContext("2d");
    if (!combinedCtx) {
      setSupported(false);
      return;
    }

    // `contentDirty`    — base canvas needs a fresh `drawElementImage` pass.
    // `overlayDirty`    — overlay canvas needs a fresh `drawElementImage` pass
    //                     (drives the overlay's *visible* bitmap, independent of
    //                     whether any level-1 lens is currently active).
    // `combinedDirty`   — off-screen (base + overlay) texture needs re-upload
    //                     for the next level-1 refraction sample.
    let contentDirty = true;
    let overlayDirty = true;
    let combinedDirty = true;
    let isLightMode = false;

    const refreshBase = (scaleX: number, scaleY: number) => {
      try {
        ctx2d.reset();
        const bg =
          getComputedStyle(document.documentElement).backgroundColor || "#000";
        isLightMode = isLightColor(bg);
        ctx2d.fillStyle = bg;
        ctx2d.fillRect(0, 0, source.width, source.height);

        const sourceRect = source.getBoundingClientRect();
        for (const child of source.children) {
          if (!(child instanceof HTMLElement)) continue;
          const r = child.getBoundingClientRect();
          ctx2d.drawElementImage!(
            child,
            (r.left - sourceRect.left) * scaleX,
            (r.top - sourceRect.top) * scaleY,
          );
        }
      } catch {
        return false;
      }
      return true;
    };

    const refreshOverlay = (scaleX: number, scaleY: number) => {
      try {
        overlayCtx.reset();
        const overlayRect = overlay.getBoundingClientRect();
        for (const child of overlay.children) {
          if (!(child instanceof HTMLElement)) continue;
          const r = child.getBoundingClientRect();
          overlayCtx.drawElementImage!(
            child,
            (r.left - overlayRect.left) * scaleX,
            (r.top - overlayRect.top) * scaleY,
          );
        }
      } catch {
        return false;
      }
      return true;
    };

    const frame = () => {
      if (!source.width || !source.height) return;

      const scaleX = gl0Canvas.width / gl0Canvas.clientWidth;
      const scaleY = gl0Canvas.height / gl0Canvas.clientHeight;

      if (contentDirty) {
        if (!refreshBase(scaleX, scaleY)) return;
        uploadSource(layer0, source);
        contentDirty = false;
        combinedDirty = true;
      }

      // Paint the overlay every time its contents change — regardless of
      // whether any level-1 lens is active. The overlay canvas is the DOM
      // layer that actually *shows* portaled children; skipping this leaves
      // them invisible until a lens interaction forces a pass.
      if (overlayDirty) {
        if (!refreshOverlay(scaleX, scaleY)) return;
        overlayDirty = false;
        combinedDirty = true;
      }

      const entries = collectLensEntries(source);
      const lvl0: LensEntry[] = [];
      const lvl1: LensEntry[] = [];
      for (const e of entries) (e.level === 1 ? lvl1 : lvl0).push(e);

      drawEntries(layer0, lvl0, scaleX, scaleY, isLightMode);

      if (lvl1.length > 0) {
        if (combinedDirty) {
          combinedCtx.clearRect(0, 0, combined.width, combined.height);
          combinedCtx.drawImage(source, 0, 0);
          combinedCtx.drawImage(overlay, 0, 0);
          uploadSource(layer1, combined);
          combinedDirty = false;
        }
        drawEntries(layer1, lvl1, scaleX, scaleY, isLightMode);
      } else {
        // Still clear so stale refractions disappear when a level-1 lens unmounts.
        layer1.gl.viewport(0, 0, gl1Canvas.width, gl1Canvas.height);
        layer1.gl.clear(layer1.gl.COLOR_BUFFER_BIT);
      }
    };

    source.onpaint = () => {
      contentDirty = true;
    };
    overlay.onpaint = () => {
      overlayDirty = true;
    };

    const ro = new ResizeObserver((observed) => {
      for (const entry of observed) {
        const box =
          entry.devicePixelContentBoxSize?.[0] ?? entry.contentBoxSize?.[0];
        if (!box) continue;
        const w = box.inlineSize;
        const h = box.blockSize;
        source.width = w;
        source.height = h;
        overlay.width = w;
        overlay.height = h;
        gl0Canvas.width = w;
        gl0Canvas.height = h;
        gl1Canvas.width = w;
        gl1Canvas.height = h;
        combined.width = w;
        combined.height = h;
      }
      contentDirty = true;
      overlayDirty = true;
      combinedDirty = true;
    });
    ro.observe(source, { box: "device-pixel-content-box" });

    // Capture phase so descendants with their own overflow still trigger re-snapshot.
    const onScroll = () => {
      contentDirty = true;
      overlayDirty = true;
      combinedDirty = true;
    };
    document.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    });

    let running = true;
    const tick = () => {
      if (!running) return;
      frame();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    setOverlayEl(overlay);

    return () => {
      running = false;
      ro.disconnect();
      document.removeEventListener("scroll", onScroll, { capture: true });
      source.onpaint = null;
      overlay.onpaint = null;
      setOverlayEl(null);
    };
  }, []);

  if (supported === false) {
    return (
      <LiquidGlassContext.Provider value={{ overlay: null }}>
        {children}
      </LiquidGlassContext.Provider>
    );
  }

  return (
    <LiquidGlassContext.Provider value={{ overlay: overlayEl }}>
      <div ref={wrapRef} className={styles.liquidGlassProvider}>
        <canvas ref={sourceRef} className={styles.liquidGlassBase}>
          {children}
        </canvas>
        <canvas
          ref={gl0Ref}
          className={`${styles.liquidGlassLayer} ${styles.liquidGlassEffects}`}
        />
        <canvas
          ref={overlayRef}
          className={`${styles.liquidGlassLayer} ${styles.liquidGlassOverlay}`}
        />
        <canvas
          ref={gl1Ref}
          className={`${styles.liquidGlassLayer} ${styles.liquidGlassEffects}`}
        />
      </div>
    </LiquidGlassContext.Provider>
  );
}
