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

  interface WebGL2RenderingContext {
    texElementImage2D?(
      target: GLenum,
      level: GLint,
      internalformat: GLint,
      format: GLenum,
      type: GLenum,
      element: Element,
    ): void;
    texElementImage2D?(
      target: GLenum,
      level: GLint,
      internalformat: GLint,
      width: GLsizei,
      height: GLsizei,
      format: GLenum,
      type: GLenum,
      element: Element,
    ): void;
  }
}
