/* Herprint Taille — native section engine (no iframe).
   Runs the Éclat sparkle WebGL shader on each .hp-eclat__gl canvas.
   Depends on herprint-eclat-shaders.js (window.HP_VERT / HP_PRELUDE / HP_MAIN / HP_SHADERS). */
(function () {
  function initOne(canvas) {
    if (canvas.dataset.hpInit === '1') return;
    if (!window.HP_SHADERS || !window.HP_VERT) return; // shaders not loaded yet
    canvas.dataset.hpInit = '1';

    var wrap = canvas.parentElement;
    var gl = canvas.getContext('webgl', { antialias: true, alpha: false, preserveDrawingBuffer: true });
    if (!gl) { if (wrap) wrap.classList.add('no-webgl'); return; }

    var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var MOTION = reduce ? 0.18 : 0.4, TS = reduce ? 0.5 : 1.0;
    var entry = (window.HP_SHADERS || []).filter(function (s) { return s.key === 'eclat'; })[0];
    if (!entry) return;

    function comp(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
      return s;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, comp(gl.VERTEX_SHADER, window.HP_VERT));
    gl.attachShader(prog, comp(gl.FRAGMENT_SHADER, window.HP_PRELUDE + entry.body + window.HP_MAIN));
    gl.bindAttribLocation(prog, 0, 'aPos');
    gl.linkProgram(prog);
    var U = {};
    ['uRes', 'uTime', 'uMouse', 'uMDown', 'uMotion', 'uPulse', 'uPulseCount']
      .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    function resize() {
      var w = Math.round(canvas.clientWidth * DPR), h = Math.round(canvas.clientHeight * DPR);
      if (w === 0 || h === 0) return;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    addEventListener('resize', resize);

    var target = { x: 0.5, y: 0.5 }, mouse = { x: 0.5, y: 0.5 };
    var downT = 0, down = 0, pulses = [];
    function ev(e) {
      var r = canvas.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width;
      target.y = 1 - (e.clientY - r.top) / r.height;
    }
    canvas.addEventListener('pointermove', ev);
    canvas.addEventListener('pointerdown', function (e) {
      ev(e); downT = 1;
      pulses.push({ x: target.x, y: target.y, t0: performance.now() / 1000 });
      if (pulses.length > 8) pulses.shift();
    });
    addEventListener('pointerup', function () { downT = 0; });
    canvas.addEventListener('pointerleave', function () { downT = 0; });

    var start = performance.now(), pb = new Float32Array(24);
    function draw() {
      resize();
      var now = performance.now(), t = (now - start) / 1000 * TS;
      mouse.x += (target.x - mouse.x) * 0.08;
      mouse.y += (target.y - mouse.y) * 0.08;
      down += (downT - down) * 0.1;
      var n = 0;
      for (var i = 0; i < pulses.length; i++) {
        var age = now / 1000 - pulses[i].t0; if (age > 3.2) continue;
        pb[n * 3] = pulses[i].x; pb[n * 3 + 1] = pulses[i].y; pb[n * 3 + 2] = age; n++;
        if (n >= 8) break;
      }
      while (pulses.length && now / 1000 - pulses[0].t0 > 3.2) pulses.shift();
      gl.useProgram(prog);
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uTime, t);
      gl.uniform2f(U.uMouse, mouse.x, mouse.y);
      gl.uniform1f(U.uMDown, down);
      gl.uniform1f(U.uMotion, MOTION);
      gl.uniform3fv(U.uPulse, pb);
      gl.uniform1i(U.uPulseCount, n);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function frame() { draw(); requestAnimationFrame(frame); }
    resize(); draw(); requestAnimationFrame(frame);
  }

  function scanAll() {
    var list = document.querySelectorAll('canvas.hp-eclat__gl');
    for (var i = 0; i < list.length; i++) initOne(list[i]);
  }

  window.HPEclatScan = scanAll;
  if (document.readyState !== 'loading') scanAll();
  else document.addEventListener('DOMContentLoaded', scanAll);
  // Shopify theme editor: re-scan when a section is (re)loaded.
  document.addEventListener('shopify:section:load', scanAll);
})();
