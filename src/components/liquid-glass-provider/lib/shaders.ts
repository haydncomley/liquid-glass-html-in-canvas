export const VERT_SRC = `#version 300 es
in vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`;

export const FRAG_SRC = `#version 300 es
precision highp float;

uniform sampler2D u_tex;
uniform vec2  u_resolution;
uniform vec2  u_center;
uniform vec2  u_halfSize;
uniform float u_cornerRadius;

uniform float u_a;
uniform float u_b;
uniform float u_c;
uniform float u_d;
uniform float u_fPower;
uniform float u_noise;
uniform float u_glowWeight;
uniform float u_glowBias;
uniform float u_glowEdge0;
uniform float u_glowEdge1;
uniform float u_blurLod;
uniform float u_fresnelBlur;
uniform float u_dim;
uniform vec3  u_dimColor;
uniform float u_contrast;
uniform float u_chroma;
uniform float u_thickness;
uniform float u_specular;
uniform float u_bevel;
uniform float u_shadowRadius;
uniform float u_shadowOpacity;
uniform vec2  u_shadowOffset;
uniform float u_opacity;
uniform float u_magnify;

out vec4 outColor;

const float M_E = 2.718281828459045;

float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + vec2(r);
  return min(max(q.x, q.y), 0.0) + length(max(q, vec2(0.0))) - r;
}

float refract_f(float x) {
  return 1.0 - u_b * pow(u_c * M_E, -u_d * x - u_a);
}

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 p = gl_FragCoord.xy - u_center;
  float d = sdRoundedBox(p, u_halfSize, u_cornerRadius);

  // Half-width of the AA band, in device pixels. Straddles the SDF boundary
  // so fragments crossing it get symmetric partial coverage.
  const float AA_HALF = 0.75;

  if (d > AA_HALF) {
    if (u_shadowRadius <= 0.0) discard;
    float sd = sdRoundedBox(p - u_shadowOffset, u_halfSize, u_cornerRadius);
    if (sd > u_shadowRadius) discard;
    float st = clamp(sd / u_shadowRadius, 0.0, 1.0);
    outColor = vec4(0.0, 0.0, 0.0, pow(1.0 - st, 2.0) * u_shadowOpacity * u_opacity);
    return;
  }

  float charLen = min(u_halfSize.x, u_halfSize.y);
  float dist = clamp(-d / charLen, 0.0, 1.0);
  float refracted = pow(refract_f(dist / u_thickness), u_fPower);
  // Reverse magnification only where edge refraction has faded, preserving the edge bend.
  float sampleScale = refracted + u_magnify * dist;
  vec2 sampleP = p * sampleScale;

  vec2 fragPos = u_center + sampleP;
  vec2 uv = clamp(fragPos / u_resolution, vec2(0.0), vec2(1.0));

  // Add a fresnel-weighted blur that peaks at the rim (dist=0) and fades to 0
  // at the centre, so edge refraction gets softened without blurring the middle.
  float fresnel = pow(1.0 - dist, 3.0);
  float lod = u_blurLod * refracted + u_fresnelBlur * fresnel;
  float ringPx = exp2(lod) * 0.8;
  vec2 ringStep = ringPx / u_resolution;
  vec4 base = textureLod(u_tex, uv, lod);
  for (int i = 0; i < 6; i++) {
    float a = 1.0471975512 * float(i);
    vec2 off = vec2(cos(a), sin(a)) * ringStep;
    base += textureLod(u_tex, uv + off, lod);
  }
  base /= 7.0;

  if (u_chroma > 0.0) {
    float spread = u_chroma * (1.0 - refracted);
    vec2 uvR = clamp((u_center + p * (refracted + spread)) / u_resolution, vec2(0.0), vec2(1.0));
    vec2 uvB = clamp((u_center + p * (refracted - spread)) / u_resolution, vec2(0.0), vec2(1.0));
    base.r = textureLod(u_tex, uvR, lod).r;
    base.b = textureLod(u_tex, uvB, lod).b;
  }
  vec4 n = vec4(vec3(rand(gl_FragCoord.xy * 1e-3) - 0.5), 0.0);
  vec4 color = base + n * u_noise;

  // In light mode (bright u_dimColor), drop the directional rim shading and the
  // top-biased specular — both read as stray halos against a light backdrop.
  float lightMode = step(1.5, u_dimColor.r + u_dimColor.g + u_dimColor.b);

  vec2 pn = p / u_halfSize;
  float dirTerm = sin(atan(pn.y, pn.x) - 0.5) * u_glowWeight
                  * smoothstep(u_glowEdge0, u_glowEdge1, dist);
  dirTerm *= 1.0 - lightMode;
  float mul = dirTerm + 1.0 + u_glowBias;
  vec3 toned = mix(vec3(0.5), color.rgb * mul, u_contrast);
  color.rgb = mix(u_dimColor, toned, u_dim);

  if (u_specular > 0.0) {
    float rimPx = 2.5;
    float rim = 1.0 - clamp(-d / rimPx, 0.0, 1.0);
    float top = clamp(pn.y * 0.5 + 0.55, 0.0, 1.0);
    float specWeight = mix(top, 0.5, lightMode);
    color.rgb += vec3(pow(rim, 2.0) * specWeight * u_specular);
  }

  if (u_bevel > 0.0) {
    // Directional inner lighting, lit from the lower-right: pn.x - pn.y
    // is negative at top-left (shadow) and positive at bottom-right
    // (highlight) in flipped-Y screen space. Fades toward the centre so
    // it reads as an inner rim rather than a global gradient.
    float bevelDir = (pn.x - pn.y) * 0.5;
    float bevelMask = pow(1.0 - dist, 2.0);
    color.rgb += vec3(bevelDir * bevelMask * u_bevel);
  }

  // AA feather centred on the SDF boundary: 50% coverage at d=0, full
  // coverage at d=-AA_HALF, zero at d=+AA_HALF.
  color.a *= smoothstep(AA_HALF, -AA_HALF, d) * u_opacity;
  color.rgb *= u_opacity;

  outColor = color;
}`;
