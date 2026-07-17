/*
 * Jewelry try-on — in-browser earring overlay.
 * All processing stays on the customer's device; no photo is ever uploaded.
 * Uses MediaPipe FaceLandmarker (loaded from CDN) to track the head and
 * composite the product image onto the earlobe(s). Sizing is face-relative
 * (no per-product measurements needed). When the head turns toward a profile,
 * only the ear facing the camera is shown.
 */

const VISION_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18';
const VISION_MODULE = `${VISION_BASE}/vision_bundle.mjs`;
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

// FaceLandmarker mesh indices (478-point model with iris refinement).
const LM = {
  noseTip: 1,
  rightTragus: 234, // in front of the right ear
  leftTragus: 454, // in front of the left ear
  foreheadTop: 10,
  chin: 152,
};

// Average forehead-to-chin span (landmarks 10→152). Used as a yaw-stable scale
// reference so earring size works without any per-product millimetre data.
const REAL_FACE_SPAN_MM = 115;
const TURN_THRESHOLD = 0.22; // head-turn asymmetry beyond which we show one ear
const MAX_CANVAS = 460; // largest displayed edge, in CSS px

class JewelryTryon extends HTMLElement {
  constructor() {
    super();
    this.config = {};
    this.landmarker = null;
    this.runningMode = 'IMAGE';
    this.overlayBitmap = null;
    this.rafId = null;
    this.stream = null;
    this.lastResult = null;
    this.source = null; // current <img> or <video> being drawn
    this.sizeMultiplier = 1;
    this.offsetFactor = 0; // vertical nudge as a fraction of face height
    this.baseRotation = 0; // per-product default orientation (radians)
    this.rotationOffset = 0; // customer rotate slider (radians)
  }

  connectedCallback() {
    const configEl = this.querySelector('[data-tryon-config]');
    try {
      this.config = JSON.parse(configEl.textContent);
    } catch (e) {
      this.config = {};
    }

    this.trigger = this.querySelector('[data-tryon-open]');
    this.modal = this.querySelector('[data-tryon-modal]');
    this.canvas = this.querySelector('[data-tryon-canvas]');
    this.ctx = this.canvas.getContext('2d');
    this.status = this.querySelector('[data-tryon-status]');
    this.fileInput = this.querySelector('[data-tryon-file]');
    this.video = this.querySelector('[data-tryon-video]');
    this.controls = this.querySelector('[data-tryon-controls]');

    this.trigger.addEventListener('click', () => this.open());
    this.querySelectorAll('[data-tryon-close]').forEach((el) =>
      el.addEventListener('click', () => this.close())
    );
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('is-open')) this.close();
    });

    this.querySelector('[data-tryon-upload-btn]').addEventListener('click', () =>
      this.fileInput.click()
    );
    this.fileInput.addEventListener('change', (e) => this.handleFile(e));
    this.querySelector('[data-tryon-camera-btn]').addEventListener('click', () =>
      this.startCamera()
    );

    this.querySelector('[data-tryon-size]').addEventListener('input', (e) => {
      this.sizeMultiplier = parseFloat(e.target.value);
      this.redrawStill();
    });
    this.querySelector('[data-tryon-offset]').addEventListener('input', (e) => {
      this.offsetFactor = parseFloat(e.target.value);
      this.redrawStill();
    });
    const rotateEl = this.querySelector('[data-tryon-rotate]');
    if (rotateEl)
      rotateEl.addEventListener('input', (e) => {
        this.rotationOffset = (parseFloat(e.target.value) * Math.PI) / 180;
        this.redrawStill();
      });

    const addBtn = this.querySelector('[data-tryon-add]');
    if (addBtn) addBtn.addEventListener('click', () => this.addToCart(addBtn));
  }

  open() {
    this.modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    this.setStatus('Loading the try-on…');
    Promise.all([this.initLandmarker(), this.prepareOverlay()])
      .then(() => this.setStatus('Upload a photo or use your camera to begin.'))
      .catch((err) => {
        console.error('[tryon]', err);
        this.setStatus('Sorry — try-on could not start on this device or browser.');
      });
  }

  close() {
    this.stopCamera();
    this.modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  setStatus(message) {
    if (this.status) this.status.textContent = message || '';
  }

  async initLandmarker() {
    if (this.landmarker) return;
    const { FaceLandmarker, FilesetResolver } = await import(VISION_MODULE);
    const fileset = await FilesetResolver.forVisionTasks(`${VISION_BASE}/wasm`);
    const make = (delegate) =>
      FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: this.runningMode,
        numFaces: 1,
      });
    try {
      this.landmarker = await make('GPU');
    } catch (e) {
      console.warn('[tryon] GPU delegate unavailable, using CPU:', e.message);
      this.landmarker = await make('CPU');
    }
  }

  async setRunningMode(mode) {
    if (this.runningMode === mode || !this.landmarker) {
      this.runningMode = mode;
      return;
    }
    this.runningMode = mode;
    await this.landmarker.setOptions({ runningMode: mode });
  }

  // Load the product image and knock out a near-white background so only the
  // jewelry remains. Skipped when the merchant supplies a transparent cutout.
  // Prefer a pre-isolated single-earring cutout (built from the product photo)
  // when the merchant hasn't supplied a dedicated transparent overlay.
  async resolveCutout() {
    if (!this.config.keyout || !this.config.overlaysUrl || !this.config.handle) return;
    try {
      if (!this._overlayMap) {
        const res = await fetch(this.config.overlaysUrl);
        this._overlayMap = res.ok ? await res.json() : {};
      }
      const entry = this._overlayMap[this.config.handle];
      if (entry && entry.u) {
        this.config.overlayUrl = entry.u;
        this.config.keyout = false; // cutout already has a clean alpha
        this.baseRotation = ((entry.r || 0) * Math.PI) / 180;
      }
    } catch (e) {
      console.warn('[tryon] cutout map unavailable, using product photo:', e.message);
    }
  }

  async prepareOverlay() {
    if (this.overlayBitmap) return;
    await this.resolveCutout();
    const url = this.config.overlayUrl;
    if (!url) throw new Error('No overlay image configured');

    const img = await this.loadImage(url);
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const cx = c.getContext('2d');
    cx.drawImage(img, 0, 0);

    if (this.config.keyout) {
      try {
        this.whiteKey(cx, c.width, c.height);
      } catch (e) {
        // Cross-origin readback can fail; fall back to the raw image.
        console.warn('[tryon] background removal skipped:', e.message);
      }
    }
    this.overlayBitmap = c;
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image failed to load'));
      img.src = url;
    });
  }

  // Sample the corners, then make pixels near that background colour transparent.
  whiteKey(cx, w, h) {
    const data = cx.getImageData(0, 0, w, h);
    const px = data.data;
    const corners = [
      [0, 0],
      [w - 1, 0],
      [0, h - 1],
      [w - 1, h - 1],
    ];
    let br = 0;
    let bg = 0;
    let bb = 0;
    corners.forEach(([x, y]) => {
      const i = (y * w + x) * 4;
      br += px[i];
      bg += px[i + 1];
      bb += px[i + 2];
    });
    br /= 4;
    bg /= 4;
    bb /= 4;

    const tol = 38; // colour distance tolerance
    const feather = 22;
    for (let i = 0; i < px.length; i += 4) {
      const dr = px[i] - br;
      const dg = px[i + 1] - bg;
      const db = px[i + 2] - bb;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);
      if (dist < tol) {
        px[i + 3] = 0;
      } else if (dist < tol + feather) {
        px[i + 3] = Math.round((px[i + 3] * (dist - tol)) / feather);
      }
    }
    cx.putImageData(data, 0, 0);
  }

  async handleFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    this.stopCamera();
    this.setStatus('Reading your photo…');
    const url = URL.createObjectURL(file);
    try {
      const img = await this.loadImage(url);
      await this.setRunningMode('IMAGE');
      this.source = img;
      this.mirror = false;
      this.fitCanvas(img.naturalWidth, img.naturalHeight);
      const result = this.landmarker.detect(img);
      this.lastResult = result;
      this.drawFrame(img, result);
      this.afterDetect(result);
    } catch (err) {
      console.error('[tryon]', err);
      this.setStatus('That image could not be read. Try another photo.');
    } finally {
      URL.revokeObjectURL(url);
      e.target.value = '';
    }
  }

  async startCamera() {
    this.setStatus('Starting camera…');
    try {
      await this.setRunningMode('VIDEO');
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      this.video.srcObject = this.stream;
      this.mirror = true;
      this.source = this.video;
      await this.video.play();
      if (!this.video.videoWidth) {
        await new Promise((resolve) =>
          this.video.addEventListener('loadedmetadata', resolve, { once: true })
        );
      }
      this.fitCanvas(this.video.videoWidth || 640, this.video.videoHeight || 480);
      this.controls.hidden = false;
      this.loopCamera();
    } catch (err) {
      console.error('[tryon]', err);
      this.setStatus('Camera unavailable — you can upload a photo instead.');
    }
  }

  loopCamera() {
    const step = () => {
      if (!this.stream) return;
      if (this.video.readyState >= 2) {
        const result = this.landmarker.detectForVideo(this.video, performance.now());
        this.lastResult = result;
        this.drawFrame(this.video, result);
        if (result.faceLandmarks && result.faceLandmarks.length) {
          this.setStatus('');
        } else {
          this.setStatus('Looking for you — face the camera, then turn slowly to see each side.');
        }
      }
      this.rafId = requestAnimationFrame(step);
    };
    this.rafId = requestAnimationFrame(step);
  }

  stopCamera() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.video) this.video.srcObject = null;
  }

  afterDetect(result) {
    if (result.faceLandmarks && result.faceLandmarks.length) {
      this.controls.hidden = false;
      this.setStatus('');
    } else {
      this.controls.hidden = true;
      this.setStatus('No face found — try a clear photo of your face or side profile.');
    }
  }

  redrawStill() {
    if (this.stream) return; // live loop already redraws
    if (this.source && this.lastResult) this.drawFrame(this.source, this.lastResult);
  }

  fitCanvas(srcW, srcH) {
    const scale = Math.min(MAX_CANVAS / srcW, MAX_CANVAS / srcH, 1);
    this.canvas.width = Math.round(srcW * scale);
    this.canvas.height = Math.round(srcH * scale);
  }

  drawFrame(source, result) {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.save();
    if (this.mirror) {
      ctx.translate(W, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(source, 0, 0, W, H);

    const faces = result && result.faceLandmarks;
    if (faces && faces.length && this.overlayBitmap) {
      this.drawEarrings(ctx, faces[0], W, H);
    }
    ctx.restore();
  }

  drawEarrings(ctx, lm, W, H) {
    const pt = (idx) => ({ x: lm[idx].x * W, y: lm[idx].y * H });
    const top = pt(LM.foreheadTop);
    const chin = pt(LM.chin);
    const nose = pt(LM.noseTip);
    const rCheek = pt(LM.rightTragus);
    const lCheek = pt(LM.leftTragus);

    // Face-relative scale and tilt (stable as the head turns).
    const faceSpanPx = Math.hypot(top.x - chin.x, top.y - chin.y);
    const pxPerMM = faceSpanPx / REAL_FACE_SPAN_MM;
    const roll = Math.atan2(top.x - chin.x, chin.y - top.y);

    const heightMm = this.config.heightMm || 30;
    const drawH = heightMm * pxPerMM * this.sizeMultiplier;
    const ratio = this.overlayBitmap.width / this.overlayBitmap.height;
    const drawW = drawH * ratio;
    const lobeDrop = faceSpanPx * (0.06 + this.offsetFactor);

    // Head turn: when one side foreshortens, the nose sits closer to that cheek.
    // asym (scale-free) decides frontal vs turned; landmark depth (z) decides
    // which ear faces the camera — the nearer ear has the smaller z.
    const dR = Math.abs(nose.x - rCheek.x);
    const dL = Math.abs(lCheek.x - nose.x);
    const asym = (dL - dR) / (dL + dR + 1e-3);
    let ears;
    if (Math.abs(asym) < TURN_THRESHOLD) {
      ears = [LM.rightTragus, LM.leftTragus];
    } else {
      ears = lm[LM.rightTragus].z < lm[LM.leftTragus].z ? [LM.rightTragus] : [LM.leftTragus];
    }

    ears.forEach((idx) => {
      const p = pt(idx);
      ctx.save();
      ctx.translate(p.x, p.y + lobeDrop);
      ctx.rotate(roll + this.baseRotation + this.rotationOffset);
      ctx.drawImage(this.overlayBitmap, -drawW / 2, 0, drawW, drawH);
      ctx.restore();
    });
  }

  async addToCart(btn) {
    if (!this.config.variantId) return;
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Adding…';
    try {
      const res = await fetch(this.config.addUrl || '/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: this.config.variantId, quantity: 1 }),
      });
      if (!res.ok) throw new Error('Add to cart failed');
      btn.textContent = 'Added ✓';
      document.dispatchEvent(new CustomEvent('tryon:added'));
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = original;
      }, 2000);
    } catch (err) {
      console.error('[tryon]', err);
      btn.textContent = 'Try again';
      btn.disabled = false;
    }
  }
}

if (!customElements.get('jewelry-tryon')) {
  customElements.define('jewelry-tryon', JewelryTryon);
}
