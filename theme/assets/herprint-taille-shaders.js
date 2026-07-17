/* Herprint — shader wallpapers
   Monet-inspired pastel palette + 5 interactive fragment shaders.
   Shared interaction in every shader:
     · light/glow follows cursor   · flow bends toward cursor
     · color shifts with position  · click sends a pulse/ripple
*/

window.HP_VERT = `
attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
`;

/* ---- common prelude: uniforms, noise, palette, interaction helpers ---- */
window.HP_PRELUDE = `
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform vec2  uMouse;     // normalised 0..1, y up (matches uv)
uniform float uMDown;     // smoothed pointer-down 0..1
uniform float uMotion;    // idle motion amount 0..1
uniform vec3  uPulse[8];  // .xy origin (0..1), .z age in seconds
uniform int   uPulseCount;

float aspect(){ return uRes.x / uRes.y; }
vec2  aspUV(vec2 uv){ return vec2(uv.x * aspect(), uv.y); }
vec2  mAsp(){ return vec2(uMouse.x * aspect(), uMouse.y); }

float hash21(vec2 p){
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}
vec2 hash22(vec2 p){
  float n = sin(dot(p, vec2(41.0, 289.0)));
  return fract(vec2(262144.0, 32768.0) * n);
}
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for(int i = 0; i < 5; i++){
    v += a * vnoise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

/* Monet water-lily pastel ramp */
vec3 monet(float t){
  t = clamp(t, 0.0, 1.0);
  vec3 c1 = vec3(0.957, 0.929, 0.886); // ivory
  vec3 c2 = vec3(0.725, 0.800, 0.882); // soft blue
  vec3 c3 = vec3(0.808, 0.749, 0.882); // lilac
  vec3 c4 = vec3(0.918, 0.768, 0.792); // dusty rose
  vec3 c5 = vec3(0.741, 0.820, 0.714); // sage
  vec3 c6 = vec3(0.890, 0.800, 0.631); // pale gold
  float u = t * 5.0;
  vec3 col;
  if(u < 1.0)      col = mix(c1, c2, smoothstep(0.0, 1.0, u));
  else if(u < 2.0) col = mix(c2, c3, smoothstep(0.0, 1.0, u - 1.0));
  else if(u < 3.0) col = mix(c3, c4, smoothstep(0.0, 1.0, u - 2.0));
  else if(u < 4.0) col = mix(c4, c5, smoothstep(0.0, 1.0, u - 3.0));
  else             col = mix(c5, c6, smoothstep(0.0, 1.0, u - 4.0));
  return col;
}

/* glow that follows the cursor */
float mouseGlow(vec2 uv, float k){
  return exp(-length(aspUV(uv) - mAsp()) * k);
}

/* click ripples: writes displacement + additive glow */
void ripples(vec2 uv, out vec2 disp, out float glow){
  disp = vec2(0.0); glow = 0.0;
  vec2 q = aspUV(uv);
  for(int i = 0; i < 8; i++){
    if(i >= uPulseCount) break;
    vec3 p = uPulse[i];
    float age = p.z;
    vec2 dir = q - vec2(p.x * aspect(), p.y);
    float dist = length(dir);
    float wave = sin(dist * 26.0 - age * 7.0);
    float env  = exp(-dist * 3.4) * exp(-age * 2.0) * smoothstep(0.0, 0.06, age);
    disp += (dir / (dist + 1e-4)) * wave * env * 0.026;
    glow += env * max(0.0, wave);
  }
}
`;

/* ---- shared main + post ---- */
window.HP_MAIN = `
vec3 render(vec2 uv);
void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / uRes;
  vec3 col = render(uv);
  float g = hash21(frag + uTime);
  col += (g - 0.5) * 0.018;                 // fine grain (kills banding)
  vec2 c = uv - 0.5; c.x *= aspect();
  float vig = smoothstep(1.25, 0.30, length(c));
  col *= mix(0.93, 1.0, vig);               // soft vignette
  col = clamp(col, 0.0, 1.0);
  gl_FragColor = vec4(col, 1.0);
}
`;

/* ===== 01 — Reflet : light caustics on water ===== */
const S_CAUSTICS = `
vec3 render(vec2 uv){
  float t = uTime * 0.06 * (0.45 + uMotion);
  vec2 disp; float rg; ripples(uv, disp, rg);
  vec2 p = aspUV(uv) * 3.0 + disp * 4.0;
  vec2 toM = mAsp() - aspUV(uv); float md = length(toM);
  p += toM * exp(-md * 2.4) * 0.55;
  vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2) + t * 1.3),
                fbm(p + 4.0 * q + vec2(8.3, 2.8) - t));
  float f = fbm(p + 4.0 * r);
  float caustic = pow(1.0 - abs(sin((f + length(r)) * 6.2831)), 6.0);
  float tcol = f * 0.7 + length(r) * 0.2 + (uMouse.x - 0.5) * 0.3 + 0.18;
  vec3 col = monet(tcol);
  col += caustic * vec3(0.95, 0.90, 0.74) * 0.55;       // golden glints
  col = mix(col, vec3(1.0), mouseGlow(uv, 4.0) * 0.22 + rg * 0.14);
  col = mix(col * 0.96, col * 1.06, smoothstep(0.0, 1.0, f));
  return col;
}
`;

/* ===== 02 — Sillage : ink-in-water diffusion (the chosen hero) ===== */
const S_INK = `
uniform vec3  uPaper;       // field / base tone
uniform vec3  uInk1;        // pigment — light
uniform vec3  uInk2;        // pigment — mid
uniform vec3  uInk3;        // pigment — deep
uniform vec3  uHi;          // soft highlight (never pure white)
uniform float uGlow;        // luminosity of the brightest wisps 0..1
uniform float uDensity;     // ink coverage 0..1
uniform float uSoftness;    // edge diffusion 0..1
uniform float uFlowSpeed;   // drift multiplier
uniform float uWake;        // cursor wake / sillage strength
uniform vec2  uMouseV;      // smoothed cursor velocity (aspect space)

vec3 render(vec2 uv){
  float t = uTime * 0.07 * uFlowSpeed * (0.4 + uMotion);
  vec2 disp; float rg; ripples(uv, disp, rg);
  vec2 P = aspUV(uv);
  vec2 p = P * 2.0 + disp * 5.0;
  vec2 toM = mAsp() - P; float md = length(toM);

  // slow upward drift + gentle lateral sway + a pull toward the cursor
  vec2 flow = vec2(sin(uTime * 0.13) * 0.12, -t * 1.1)
            + toM * exp(-md * 1.8) * (0.5 + uWake * 0.8);

  // two-stage curl-like domain warp -> organic ink tendrils
  vec2 w1 = vec2(fbm(p * 0.9 + flow),         fbm(p * 0.9 + flow + 4.7));
  vec2 w2 = vec2(fbm(p * 1.7 + w1 * 1.6 + flow + 7.0),
                 fbm(p * 1.7 + w1 * 1.6 - flow + 2.3));
  float base = fbm(p + w2 * 2.2 + flow);
  float fil  = fbm(p * 3.4 + w2 * 3.0);                  // fine filament detail

  float edge = 0.62 - uDensity * 0.34;                   // denser -> lower threshold
  float soft = mix(0.05, 0.30, uSoftness);
  float ink = smoothstep(edge - soft, edge + soft, base + (fil - 0.5) * 0.22);

  // sillage: ink smears in the wake behind a moving cursor
  vec2 vdir = normalize(uMouseV + vec2(1e-4));
  float along = dot(-toM, vdir);
  float perp  = length(-toM - vdir * along);
  float wake = smoothstep(0.40, 0.0, perp)
             * smoothstep(0.0, 0.35, along) * smoothstep(1.1, 0.25, along)
             * min(length(uMouseV) * 8.0, 1.0) * uWake;
  ink = max(ink, wake * 0.9);
  ink += exp(-md * 3.2) * 0.40 * uMDown;                 // press-and-hold bloom
  ink = clamp(ink, 0.0, 1.0);

  // pigment build-up over paper — soft 3-stop palette, low contrast, capped highlights
  float depth = smoothstep(0.0, 1.0, ink);
  float h = clamp(base * 0.60 + w2.x * 0.25 + (uMouse.x - 0.5) * 0.22 + 0.25, 0.0, 1.0);
  vec3 pig = (h < 0.5) ? mix(uInk1, uInk2, h * 2.0)
                       : mix(uInk2, uInk3, (h - 0.5) * 2.0);
  vec3 col = mix(uPaper, pig, depth);
  col = mix(col, col * 0.93, depth * 0.26);              // gentle cores (hazy, calm)
  // luminous breath + cursor light lift toward the soft highlight — not white
  float breath = pow(1.0 - abs(ink - 0.5) * 2.0, 3.0);
  float lift = breath * 0.12 + rg * 0.12 + mouseGlow(uv, 3.2) * 0.12;
  col = mix(col, uHi, clamp(lift, 0.0, 1.0) * uGlow);
  return col;
}
`;

/* ===== 03 — Voile : flowing silk / fabric folds ===== */
const S_SILK = `
vec3 render(vec2 uv){
  float t = uTime * 0.05 * (0.45 + uMotion);
  vec2 disp; float rg; ripples(uv, disp, rg);
  vec2 p = aspUV(uv) * 3.0 + disp * 4.0;
  vec2 toM = mAsp() - aspUV(uv); float md = length(toM);
  p += toM * exp(-md * 2.0) * 0.4;
  float warp = fbm(p * 0.8 + t);
  float phase = p.x * 4.0 + warp * 5.0 + sin(p.y * 2.0 + t) * 1.5;
  float h = sin(phase) * 0.5 + 0.5;                      // fold height
  float dh = cos(phase) * 0.5;
  vec2 ldir = normalize(mAsp() - aspUV(uv) + 1e-4);      // light from cursor
  float spec = pow(max(0.0, dot(normalize(vec2(dh, 1.0)), ldir)), 3.0);
  spec *= exp(-md * 1.1);
  float tcol = h * 0.5 + warp * 0.3 + (uMouse.x - 0.5) * 0.3 + 0.22;
  vec3 col = monet(tcol);
  col *= 0.84 + 0.3 * h;                                  // drape shading
  col += spec * vec3(1.0, 0.97, 0.9) * 0.6;              // silk sheen
  col = mix(col, vec3(1.0), rg * 0.14 + mouseGlow(uv, 4.0) * 0.14);
  return col;
}
`;

/* ===== 04 — Taille : faceted / crystalline geometry ===== */
const S_FACETS = `
vec3 render(vec2 uv){
  float t = uTime * 0.04 * (0.45 + uMotion);
  vec2 disp; float rg; ripples(uv, disp, rg);
  vec2 p = aspUV(uv) * 5.0 + disp * 3.0;
  vec2 toM = mAsp() - aspUV(uv); float md = length(toM);
  p += toM * exp(-md * 2.4) * 0.5;
  vec2 ip = floor(p), fp = fract(p);
  float md1 = 8.0, md2 = 8.0; vec2 cell = ip;
  for(int y = -1; y <= 1; y++){
    for(int x = -1; x <= 1; x++){
      vec2 g = vec2(float(x), float(y));
      vec2 o = hash22(ip + g);
      o = 0.5 + 0.45 * sin(t * 1.5 + 6.2831 * o);
      vec2 r = g + o - fp;
      float d = dot(r, r);
      if(d < md1){ md2 = md1; md1 = d; cell = ip + g; }
      else if(d < md2){ md2 = d; }
    }
  }
  float edge = sqrt(md2) - sqrt(md1);
  float facet = hash21(cell);
  float tcol = facet * 0.8 + (uMouse.x - 0.5) * 0.3 + sqrt(md1) * 0.1 + 0.12;
  vec3 col = monet(tcol);
  col *= 0.8 + 0.5 * smoothstep(0.0, 0.4, edge);          // bevelled facet
  col += smoothstep(0.06, 0.0, edge) * vec3(1.0, 0.96, 0.85) * 0.5; // edge sparkle
  col += mouseGlow(uv, 3.0) * 0.24 * vec3(1.0, 0.98, 0.92);
  col = mix(col, vec3(1.0), rg * 0.2);
  return col;
}
`;

/* ===== 05 — Nymphéa : painterly Monet bloom ===== */
const S_BLOOM = `
vec3 render(vec2 uv){
  float t = uTime * 0.05 * (0.45 + uMotion);
  vec2 disp; float rg; ripples(uv, disp, rg);
  vec2 p = aspUV(uv) * 2.5 + disp * 4.0;
  vec2 rel = aspUV(uv) - mAsp(); float md = length(rel);
  p += vec2(-rel.y, rel.x) * exp(-md * 2.0) * 0.8;        // stir around cursor
  for(int i = 0; i < 3; i++){
    p += 0.5 * vec2(fbm(p * 1.3 + t + vec2(0.0, 3.0)),
                    fbm(p * 1.3 - t + vec2(5.0, 0.0)));
  }
  float v = fbm(p * 1.2);
  float strokes = fbm(p * 6.0 + v * 3.0);
  float tcol = v * 0.8 + strokes * 0.15 + (uMouse.x - 0.5) * 0.25
             + (uMouse.y - 0.5) * 0.1 + 0.2;
  vec3 col = monet(tcol);
  col *= 0.9 + 0.2 * strokes;                             // brush dabs
  col = mix(col, monet(tcol + 0.2), smoothstep(0.4, 0.6, v) * 0.5);
  col += mouseGlow(uv, 3.5) * 0.2 * vec3(1.0, 0.98, 0.9);
  col = mix(col, vec3(1.0), rg * 0.14);
  return col;
}
`;

window.HP_SHADERS = [
  { key: 'reflet',  name: 'Reflet',  sub: 'caustics', body: S_CAUSTICS },
  { key: 'sillage', name: 'Sillage', sub: 'ink',      body: S_INK },
  { key: 'voile',   name: 'Voile',   sub: 'silk',     body: S_SILK },
  { key: 'taille',  name: 'Taille',  sub: 'facets',   body: S_FACETS },
  { key: 'nymphea', name: 'Nymphéa', sub: 'bloom',    body: S_BLOOM },
];
