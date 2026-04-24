import { GLOBAL_PARAMS } from "./presets";
import { FRAG_SRC, VERT_SRC } from "./shaders";

export const UNIFORM_NAMES = [
  "u_tex",
  "u_resolution",
  "u_center",
  "u_halfSize",
  "u_cornerRadius",
  "u_blurLod",
  "u_fresnelBlur",
  "u_fPower",
  "u_dim",
  "u_dimColor",
  "u_contrast",
  "u_chroma",
  "u_thickness",
  "u_specular",
  "u_bevel",
  "u_shadowRadius",
  "u_shadowOpacity",
  "u_shadowOffset",
  "u_opacity",
  "u_magnify",
  "u_a",
  "u_b",
  "u_c",
  "u_d",
  "u_noise",
  "u_glowWeight",
  "u_glowBias",
  "u_glowEdge0",
  "u_glowEdge1",
] as const;

export type UniformName = (typeof UNIFORM_NAMES)[number];
export type Uniforms = Record<UniformName, WebGLUniformLocation | null>;

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error(`[LiquidGlassProvider] shader: ${log}`);
  }
  return s;
}

export function createProgram(gl: WebGL2RenderingContext): WebGLProgram {
  const vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(
      `[LiquidGlassProvider] link: ${gl.getProgramInfoLog(prog)}`,
    );
  }
  return prog;
}

export function lookupUniforms(
  gl: WebGL2RenderingContext,
  prog: WebGLProgram,
): Uniforms {
  const out = {} as Uniforms;
  for (const name of UNIFORM_NAMES) {
    out[name] = gl.getUniformLocation(prog, name);
  }
  return out;
}

export function setupFullscreenQuad(
  gl: WebGL2RenderingContext,
  prog: WebGLProgram,
) {
  const posLoc = gl.getAttribLocation(prog, "a_position");
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
}

export function createLensTexture(gl: WebGL2RenderingContext) {
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_LINEAR,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  return tex;
}

export function applyGlobalUniforms(
  gl: WebGL2RenderingContext,
  u: Uniforms,
) {
  gl.uniform1f(u.u_a, GLOBAL_PARAMS.a);
  gl.uniform1f(u.u_b, GLOBAL_PARAMS.b);
  gl.uniform1f(u.u_c, GLOBAL_PARAMS.c);
  gl.uniform1f(u.u_d, GLOBAL_PARAMS.d);
  gl.uniform1f(u.u_noise, GLOBAL_PARAMS.noise);
  gl.uniform1f(u.u_glowWeight, GLOBAL_PARAMS.glowWeight);
  gl.uniform1f(u.u_glowBias, GLOBAL_PARAMS.glowBias);
  gl.uniform1f(u.u_glowEdge0, GLOBAL_PARAMS.glowEdge0);
  gl.uniform1f(u.u_glowEdge1, GLOBAL_PARAMS.glowEdge1);
}
