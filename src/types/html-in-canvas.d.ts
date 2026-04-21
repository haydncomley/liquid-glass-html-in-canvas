export {};

declare global {
  interface CanvasPaintEvent extends Event {
    readonly changedElements: ReadonlyArray<Element>;
  }

  interface HTMLCanvasElement {
    requestPaint?(): void;
    onpaint?: ((this: HTMLCanvasElement, ev: CanvasPaintEvent) => void) | null;
  }

  interface CanvasRenderingContext2D {
    drawElementImage?(element: Element, dx: number, dy: number): DOMMatrix;
    drawElementImage?(
      element: Element,
      dx: number,
      dy: number,
      dw: number,
      dh: number,
    ): DOMMatrix;
  }
}
