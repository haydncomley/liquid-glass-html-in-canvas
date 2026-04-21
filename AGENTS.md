# AGENTS.md

Context for any agent working in this repo. Keep this file loaded on every run.

## Project intent

Experiment with the brand-new **HTML-in-Canvas** API (Chrome, behind a flag as of M147/M148). The project name `liquid-glass-canvas` hints at the target: draw live, styled, accessible HTML into a `<canvas>` and then distort/refract it via a WebGL or WebGPU shader to achieve an Apple-style "liquid glass" effect over real page content.

Stack: Vite + React + TypeScript + SCSS.

## HTML-in-Canvas — what it is

A WICG proposal (shipping experimentally in Chromium) that lets you paint real DOM subtrees into a 2D, WebGL, or WebGPU canvas. Previously this required `foreignObject` SVG hacks, `html2canvas` screenshots, or rebuilding layout from scratch in canvas — all of which broke accessibility, i18n, fonts, and subpixel rendering.

- Spec + explainer: https://github.com/WICG/html-in-canvas
- Rendered spec: https://wicg.github.io/html-in-canvas/
- Docs + demos: https://html-in-canvas.dev/
- Blink Intent-to-Experiment: https://groups.google.com/a/chromium.org/g/blink-dev/c/t_nGEmJ_v4s

## Enabling it

- Chrome/Brave flag: `chrome://flags/#canvas-draw-element` → **Enabled** → relaunch.
- Available in Chrome Canary and Brave Stable (Chromium 147+).
- Origin-trial / experiment window: M148 → M151 inclusive.
- **Assume the user has the flag on.** Still feature-detect at runtime.

```ts
const supported =
  'drawElementImage' in CanvasRenderingContext2D.prototype;
```

## The three primitives

### 1. `layoutsubtree` attribute on `<canvas>`

Opts the canvas's direct children into layout + hit testing. They behave like normal DOM (focus, a11y, events) but are **not painted** until you draw them. Each direct child gets a stacking context, is a containing block for descendants, and has paint containment.

```html
<canvas layoutsubtree width="800" height="600">
  <!-- Real, interactive, accessible DOM. Invisible until drawn. -->
  <form id="login">
    <input name="email" />
    <button>Sign in</button>
  </form>
</canvas>
```

### 2. Draw methods (per context)

| Context | Method |
|---|---|
| 2D | `ctx.drawElementImage(el, dx, dy[, dw, dh])` (also 5- and 9-arg source-rect forms) |
| WebGL | `gl.texElementImage2D(target, level, internalformat, format, type, el)` (+ variants with width/height and source rect) |
| WebGPU | `queue.copyElementImageToTexture(source, destination)` (+ variants with size and source rect) |

The 2D method **returns a `DOMMatrix`** — a CSS transform that, when applied to the element's `style.transform`, aligns the live DOM with the drawn pixels so hit-testing lines up with what the user sees.

```ts
const t = ctx.drawElementImage(form, 100, 0);
form.style.transform = t.toString();
```

For 3D contexts use `getElementTransform(el, drawTransform)` to compute the equivalent CSS transform.

### 3. `paint` event + `requestPaint()`

```ts
canvas.onpaint = (e) => {
  ctx.reset();
  for (const el of e.changedElements) ctx.drawElementImage(el, 0, 0);
};
```

Fires when a child's rendering may have changed (after layout/style, before paint). Does **not** fire for CSS-transform-only changes. Call `canvas.requestPaint()` to schedule a redraw manually. DOM mutations made inside `onpaint` land on the **next** frame.

Pair with a `ResizeObserver` using `box: 'device-pixel-content-box'` to keep the bitmap crisp on HiDPI.

## Minimal 2D example

```tsx
useEffect(() => {
  const canvas = canvasRef.current!;
  const ctx = canvas.getContext('2d')!;

  const ro = new ResizeObserver(([entry]) => {
    const box = entry.devicePixelContentBoxSize[0];
    canvas.width = box.inlineSize;
    canvas.height = box.blockSize;
    canvas.requestPaint();
  });
  ro.observe(canvas, { box: 'device-pixel-content-box' });

  canvas.onpaint = () => {
    ctx.reset();
    const child = canvas.firstElementChild as HTMLElement;
    const t = ctx.drawElementImage(child, 0, 0);
    child.style.transform = t.toString();
  };

  return () => ro.disconnect();
}, []);

return (
  <canvas ref={canvasRef} layoutsubtree>
    <div className="card">…real DOM here…</div>
  </canvas>
);
```

JSX note: `layoutsubtree` is not yet in React's typings. Either spread `{...{ layoutsubtree: '' }}` or declare it in a `*.d.ts`:

```ts
declare module 'react' {
  interface CanvasHTMLAttributes<T> { layoutsubtree?: boolean | string }
}
```

## WebGL / WebGPU sketch

```ts
// WebGL
gl.texElementImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, el);

// WebGPU
queue.copyElementImageToTexture(el, { texture });
```

For the liquid-glass effect the pipeline is: draw the HTML subtree into a texture via `texElementImage2D` / `copyElementImageToTexture`, then sample that texture in a fragment shader with a displacement/refraction term (plus blur + edge highlight) wherever the glass overlay is.

## Gotchas (read before debugging)

- `drawElementImage` **throws** if called before an initial snapshot exists for the child. In practice: let the first `onpaint` fire, or call `requestPaint()` after mount.
- CSS transforms on the source element are **ignored for drawing** but still affect hit testing/accessibility — that's why you write the returned matrix back to `style.transform`.
- Overflowing content is clipped to the element's border box.
- Only **direct** children of the canvas are drawable roots; deeper nodes must be reached via a direct child.
- The `paint` event does not fire for transform-only changes; call `requestPaint()` yourself in animation loops.
- DOM mutations inside `onpaint` apply on the next frame — don't expect synchronous reflow.

## Privacy / taint

The browser strips privacy-sensitive signals before painting, so no canvas taint for same-origin content:

- **Excluded from the bitmap:** cross-origin embedded content, system colors, spell-check underlines, `:visited` styles, pending autofill, subpixel AA.
- **Preserved:** find-in-page highlights, scrollbar chrome, caret blink rate, `forced-colors`.

Cross-origin iframes inside a drawn subtree will not render — plan layouts around that.

## Working style in this repo

- Keep the surface small: one canvas, one shader, clear boundary between DOM layer and GL layer.
- Prefer a hook (`useHtmlInCanvas`) over ad-hoc effects once a second call site appears — not before.
- Feature-detect and render an HTML-only fallback when the API is missing; don't assume the flag.
- SCSS per component, colocated. No CSS-in-JS.
