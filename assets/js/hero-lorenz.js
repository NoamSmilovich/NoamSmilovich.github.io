// Lorenz-attractor backdrop for the home hero — a nod to dynamical systems.
// Theme-aware (reads --accent), static when prefers-reduced-motion.
(function () {
  function init() {
    var hero = document.querySelector('.home-hero');
    var canvas = hero && hero.querySelector('.home-hero__viz');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Pre-integrate the Lorenz system
    var pts = [], x = 0.1, y = 0, z = 0, s = 10, r = 28, b = 8 / 3, dt = 0.006;
    for (var i = 0; i < 6000; i++) {
      x += s * (y - x) * dt; y += (x * (r - z) - y) * dt; z += (x * y - b * z) * dt;
      pts.push([x, y, z - 25]);
    }

    var W, H, DPR, accent = '99,102,241';
    function readAccent() {
      var c = getComputedStyle(hero).getPropertyValue('--accent').trim().replace('#', '');
      if (c.length === 3) c = c.split('').map(function (d) { return d + d; }).join('');
      if (c.length === 6) { var n = parseInt(c, 16); accent = ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255); }
    }
    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = hero.clientWidth; H = hero.clientHeight;
      if (!W || !H) return;
      canvas.width = W * DPR; canvas.height = H * DPR;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      readAccent();
      if (reduce) draw();
    }
    function project(p, ang) {
      var ca = Math.cos(ang), sa = Math.sin(ang);
      var scale = Math.min(Math.max(W, 360), 1000) / 58;
      // sits center-right on wide heros, drifts toward center on narrow ones
      var cx = W > 560 ? W * 0.74 : W * 0.6;
      return [cx + (p[0] * ca - p[2] * sa) * scale, H * 0.52 - p[1] * scale, 0];
    }
    var angle = 0.6, head = 0, raf = 0, started = false;
    function draw() {
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);
      ctx.lineJoin = 'round';
      // faint full attractor
      ctx.strokeStyle = 'rgba(' + accent + ',0.26)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (var i = 0; i < pts.length; i += 2) {
        var q = project(pts[i], angle);
        i === 0 ? ctx.moveTo(q[0], q[1]) : ctx.lineTo(q[0], q[1]);
      }
      ctx.stroke();
      // brighter comet tracing the path
      var L = 300;
      for (var j = 0; j < L; j++) {
        var idx = (head - j + pts.length) % pts.length;
        var a = project(pts[idx], angle), c = project(pts[(idx + 1) % pts.length], angle);
        ctx.strokeStyle = 'rgba(' + accent + ',' + (0.9 * (1 - j / L)).toFixed(3) + ')';
        ctx.lineWidth = 2.3 * (1 - j / L) + 0.4;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke();
      }
    }
    function loop() { angle += 0.0012; head = (head + 3) % pts.length; draw(); raf = requestAnimationFrame(loop); }
    function start() { resize(); if (reduce) { draw(); return; } if (!started) { started = true; loop(); } }

    window.addEventListener('resize', resize);
    window.addEventListener('load', resize);          // re-fit once webfonts settle
    var tt = document.getElementById('theme-toggle');  // recolor when the theme flips
    if (tt) tt.addEventListener('click', function () { setTimeout(function () { readAccent(); if (reduce) draw(); }, 60); });
    start();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
