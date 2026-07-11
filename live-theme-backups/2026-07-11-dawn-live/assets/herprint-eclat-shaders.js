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
  // warm 14k-gold glint along the facet edges (echoes the plating)
  float spark = smoothstep(0.06, 0.0, edge);
  col += spark * vec3(0.96, 0.80, 0.46) * 0.55;           // gold edge sparkle
  col += pow(spark, 3.0) * vec3(1.0, 0.97, 0.86) * 0.35;  // hot crystal highlight
  col += mouseGlow(uv, 3.0) * 0.24 * vec3(1.0, 0.95, 0.82);
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

/* ===== 06 — Lustre : flowing liquid gold + pearl sheen ===== */
const S_LUSTRE = `
vec3 lustrePal(float t){
  t = clamp(t, 0.0, 1.0);
  vec3 deeprose = vec3(0.831, 0.722, 0.714); // muted rose (lighter)
  vec3 rose     = vec3(0.878, 0.812, 0.808); // soft #d8c6c6-ish
  vec3 blush    = vec3(0.929, 0.871, 0.859);
  vec3 cream    = vec3(0.973, 0.953, 0.933);
  vec3 petal    = vec3(0.945, 0.886, 0.875); // soft pink accent
  vec3 mist     = vec3(0.886, 0.871, 0.890); // cool mauve accent
  if(t < 0.22)      return mix(deeprose, rose,  smoothstep(0.0,1.0, t / 0.22));
  else if(t < 0.50) return mix(rose,     blush, smoothstep(0.0,1.0,(t-0.22)/0.28));
  else if(t < 0.74) return mix(blush,    cream, smoothstep(0.0,1.0,(t-0.50)/0.24));
  else if(t < 0.88) return mix(cream,    petal, smoothstep(0.0,1.0,(t-0.74)/0.14));
  else              return mix(petal,    mist,  smoothstep(0.0,1.0,(t-0.88)/0.12));
}
vec3 render(vec2 uv){
  float t = uTime * 0.045 * (0.45 + uMotion);
  vec2 disp; float rg; ripples(uv, disp, rg);
  vec2 p = aspUV(uv) * 2.7 + disp * 4.0;
  vec2 toM = mAsp() - aspUV(uv); float md = length(toM);
  p += toM * exp(-md * 2.2) * 0.5;                        // flow bends to cursor
  // layered domain warp -> molten, flowing surface
  vec2 q = vec2(fbm(p + t), fbm(p + vec2(3.2, 1.7) - t));
  vec2 r = vec2(fbm(p + 2.2 * q + vec2(1.7, 9.2) + t * 1.2),
                fbm(p + 2.2 * q + vec2(8.3, 2.8) - t));
  float f = fbm(p + 2.4 * r);
  // soft, sparse light veins where the surface catches the light
  float vein = pow(1.0 - abs(sin((f + length(r)) * 6.2831)), 9.0);
  float tcol = f * 0.46 + length(r) * 0.20 + (uMouse.x - 0.5) * 0.14 + 0.12;
  vec3 col = lustrePal(tcol);
  // very faint iridescent shimmer (hue drifts with position + cursor y)
  float irid = sin((f + r.x) * 10.0 + (uMouse.y - 0.5) * 6.0);
  col += vec3(0.016, 0.004, 0.008) * irid * (1.0 - vein);
  col = mix(col * 0.975, col * 1.035, smoothstep(0.0, 1.0, f)); // gentle body shading
  col += vein * vec3(0.95, 0.84, 0.80) * 0.26;            // soft rose-gold glint
  col += pow(vein, 3.0) * vec3(1.0, 0.96, 0.94) * 0.14;   // faint specular
  col = mix(col, vec3(1.0), mouseGlow(uv, 3.2) * 0.12 + rg * 0.12);
  return col;
}
`;

/* ===== 07 — Éclat : drifting crystal sparkles over a soft blush gradient ===== */
const S_ECLAT = `
// one layer of twinkling crystal glints
float eclatLayer(vec2 uv, float scale, vec2 drift, float seed, float tw){
  vec2 p = uv * scale + drift;
  vec2 ip = floor(p);
  vec2 fp = fract(p) - 0.5;
  vec2 rnd = hash22(ip + seed);
  float present = step(0.55, rnd.y);                 // only some cells sparkle
  vec2 off = (rnd - 0.5) * 0.7;                       // jitter inside cell
  vec2 d = fp - off;
  float dist = length(d);
  float ph = 6.2831 * rnd.x;
  float tk = pow(0.5 + 0.5 * sin(tw + ph), 4.0);      // twinkle
  float core = smoothstep(0.16, 0.0, dist);
  float ray = smoothstep(0.45, 0.0, abs(d.x)) * smoothstep(0.018, 0.0, abs(d.y))
            + smoothstep(0.45, 0.0, abs(d.y)) * smoothstep(0.018, 0.0, abs(d.x));
  return present * tk * (core + ray * 0.6);
}
// Monet pastel shine wheel (ivory · soft blue · dusty rose · sage · pale gold — no lilac)
vec3 monetShine(float t){
  t = fract(t);
  vec3 c1 = vec3(0.957, 0.929, 0.886); // ivory
  vec3 c2 = vec3(0.725, 0.800, 0.882); // soft blue
  vec3 c3 = vec3(0.918, 0.768, 0.792); // dusty rose
  vec3 c4 = vec3(0.741, 0.820, 0.714); // sage
  vec3 c5 = vec3(0.890, 0.800, 0.631); // pale gold
  float u = t * 5.0;
  if(u < 1.0)      return mix(c1, c2, smoothstep(0.0,1.0,u));
  else if(u < 2.0) return mix(c2, c3, smoothstep(0.0,1.0,u-1.0));
  else if(u < 3.0) return mix(c3, c4, smoothstep(0.0,1.0,u-2.0));
  else if(u < 4.0) return mix(c4, c5, smoothstep(0.0,1.0,u-3.0));
  else             return mix(c5, c1, smoothstep(0.0,1.0,u-4.0)); // wrap (no lilac)
}
// warm peach · blush pink · salmon shine wheel (dreamy, no cool tones)
vec3 warmShine(float t){
  t = fract(t);
  vec3 c1 = vec3(0.973, 0.835, 0.718); // soft peach
  vec3 c2 = vec3(0.961, 0.761, 0.737); // warm pink
  vec3 c3 = vec3(0.945, 0.643, 0.561); // salmon
  vec3 c4 = vec3(0.965, 0.792, 0.745); // warm blush rose
  float u = t * 4.0;
  if(u < 1.0)      return mix(c1, c2, smoothstep(0.0,1.0,u));
  else if(u < 2.0) return mix(c2, c3, smoothstep(0.0,1.0,u-1.0));
  else if(u < 3.0) return mix(c3, c4, smoothstep(0.0,1.0,u-2.0));
  else             return mix(c4, c1, smoothstep(0.0,1.0,u-3.0)); // wrap
}
// click bloom (starburst): warm light rays radiate from the click, expand + fade
float eclatBloom(vec2 a){
  float b = 0.0;
  for(int i = 0; i < 8; i++){
    if(i >= uPulseCount) break;
    vec3 p = uPulse[i];
    vec2 d = a - vec2(p.x * aspect(), p.y);
    float dist = length(d);
    float ang = atan(d.y, d.x);
    float age = p.z;
    float grow = age * 0.5;                                // rays extend outward
    float core = exp(-dist * 7.0);                         // soft center
    float rays = pow(0.5 + 0.5 * sin(ang * 6.0 + age * 1.6), 6.0); // softer rays
    float radial = exp(-abs(dist - grow) * 7.0);           // narrower, fainter front
    float env = exp(-age * 1.9) * smoothstep(0.0, 0.08, age);
    b += (core * 0.45 + rays * radial * 0.5) * env;
  }
  return b;
}
vec3 render(vec2 uv){
  float t = uTime * 0.5 * (0.45 + uMotion);
  float bloom = eclatBloom(aspUV(uv));
  vec2 a = aspUV(uv);
  vec2 toM = mAsp() - a; float md = length(toM);

  // soft blush gradient ground with a gentle cloud
  float cloud = fbm(a * 1.6 + vec2(0.0, t * 0.05));
  float g = clamp(uv.y * 0.7 + cloud * 0.4 + (uMouse.x - 0.5) * 0.12, 0.0, 1.0);
  vec3 top    = vec3(0.957, 0.937, 0.925);   // pale cream-rose
  vec3 mid    = vec3(0.910, 0.853, 0.851);   // blush
  vec3 bottom = vec3(0.851, 0.776, 0.784);   // dusty rose
  vec3 col = g < 0.5 ? mix(bottom, mid, smoothstep(0.0,1.0,g*2.0))
                     : mix(mid, top,  smoothstep(0.0,1.0,(g-0.5)*2.0));

  // ---- star-river band: a flowing diagonal where sparkles gather ----
  vec2 center = vec2(aspect() * 0.5, 0.5);
  vec2 dir = normalize(vec2(1.0, 0.62));      // lower-left -> upper-right
  vec2 nrm = vec2(-dir.y, dir.x);
  float along  = dot(a - center, dir);
  float across = dot(a - center, nrm);
  across -= 0.16 * (1.0 - clamp(along * along / 0.9, 0.0, 1.0)); // gentle upward arc
  across += (fbm(vec2(along * 1.3 + 4.0, t * 0.04)) - 0.5) * 0.24; // meander
  across += (fbm(vec2(along * 3.0 - 2.0, 7.0)) - 0.5) * 0.10;      // finer wobble
  float sigma = 0.11;
  float band = exp(-(across * across) / (2.0 * sigma * sigma));
  float core = exp(-(across * across) / (2.0 * 0.045 * 0.045));    // bright spine

  // warm peach-rose haze glowing along the leading band
  vec3 bandGlow = vec3(0.961, 0.851, 0.808);  // soft peach (#d8c6c6 lifted warm)
  col = mix(col, bandGlow, band * 0.30 + core * 0.22);

  // sparkle field — dense on the river, sparse elsewhere
  float halo = exp(-md * 2.6);                // cursor proximity 0..1
  float boost = 1.0 + halo * 3.4;             // sparkles flare brighter near the cursor
  float density = 0.06 + band * 2.0 + core * 1.1;
  float tw = t * 1.6;
  float s = 0.0;
  s += eclatLayer(a, 7.0,  vec2(0.03, 0.05) * t, 0.0,  tw)       * 1.0;
  s += eclatLayer(a, 11.0, vec2(-0.04, 0.07) * t, 9.3, tw * 1.3) * 0.8;
  s += eclatLayer(a, 16.0, vec2(0.05, 0.10) * t, 21.7, tw * 0.8) * 0.55;
  s *= boost * density;
  s += bloom * 1.1;                           // click blooms a gentle burst of sparkles

  // crystal glint colour: cool-white core leaning rose-gold
  vec3 glint = mix(vec3(1.0, 0.985, 0.97), vec3(1.0, 0.92, 0.86), 0.4);
  col += s * glint * 0.9;

  // dreamy warm peach/pink/salmon shine the cursor coaxes out of the crystals
  float ang = atan(a.y - mAsp().y, a.x - mAsp().x);
  vec3 shine = warmShine(ang / 6.2831 + md * 0.9 - uTime * 0.06);
  col += shine * halo * (0.12 + s * 1.0);     // tints the glints + soft warm veil
  col = mix(col, vec3(1.0), halo * 0.06);     // gentle bright bloom under the cursor

  // click light-bloom: a soft expanding warm glow
  col += warmShine(bloom * 0.5 + 0.05) * bloom * 0.24;
  col = mix(col, vec3(1.0), clamp(bloom, 0.0, 1.0) * 0.06);
  return clamp(col, 0.0, 1.0);
}
`;

window.HP_SHADERS = [
  { key: 'reflet',  name: 'Reflet',  sub: 'caustics', body: S_CAUSTICS },
  { key: 'sillage', name: 'Sillage', sub: 'ink',      body: S_INK },
  { key: 'voile',   name: 'Voile',   sub: 'silk',     body: S_SILK },
  { key: 'taille',  name: 'Taille',  sub: 'facets',   body: S_FACETS },
  { key: 'nymphea', name: 'Nymphéa', sub: 'bloom',    body: S_BLOOM },
  { key: 'lustre',  name: 'Lustre',  sub: 'gold',     body: S_LUSTRE },
  { key: 'eclat',   name: 'Éclat',   sub: 'sparkle',  body: S_ECLAT },
];
