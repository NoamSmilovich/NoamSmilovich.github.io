---
permalink: /
author_profile: true
redirect_from:
  - /about/
  - /about.html
---

{% include base_path %}

<section class="home-hero">
  <canvas class="home-hero__viz" aria-hidden="true"></canvas>
  <div class="home-hero__content">
    <h1 class="home-hero__title">Intelligent learning for general-purpose robots.</h1>
    <p class="home-hero__lead">
      My goal is to enable robots to perform a wide range of tasks through intelligent
      learning. Naive reinforcement learning alone won't get us there — so I combine ideas
      from optimal control, information theory, and intrinsic motivation to build agents
      that learn efficiently and generalize across tasks and environments.
    </p>
    <div class="home-hero__areas">
      <span class="chip">Robot Learning</span>
      <span class="chip">Reinforcement Learning</span>
      <span class="chip">Optimal Control</span>
      <span class="chip">Information Theory</span>
      <span class="chip">Intrinsic Motivation</span>
      <span class="chip">Generative AI</span>
      <span class="chip">Hybrid Dynamical Systems</span>
    </div>
  </div>
</section>

<div class="section-head"><h2>About</h2></div>
<div class="about-prose">
  <p>
    I came to robotics by an unusual route. I started in electrical engineering — designing RF and
    5G chips at Qualcomm and Tel Aviv University — before moving into software and then robotics for
    my PhD. Working across these fields taught me to pick things up quickly and connect ideas that
    don't usually meet.
  </p>
  <p>
    I also genuinely enjoy working with people. I've been a teaching assistant for several large courses —
    working closely and in person with students on a senior capstone, and helping teach Generative AI and
    reinforcement learning classes of up to a hundred students — which earned me my department's
    <strong>Graduate Teaching Assistant of the Year</strong> award. Explaining hard ideas clearly and
    helping students get unstuck is one of my favorite parts of the work.
  </p>
</div>

{% if site.data.awards.size > 0 %}
<div class="section-head"><h2>Awards &amp; Honors</h2></div>
<ul class="news">
  {% for a in site.data.awards %}
  <li class="news__item">
    <span class="news__date">{{ a.date }}</span>
    <div class="news__body"><strong>{{ a.title }}</strong>{% if a.org %} · {{ a.org }}{% endif %}</div>
  </li>
  {% endfor %}
</ul>
{% endif %}

<div class="section-head">
  <h2>Beyond research</h2>
  <a class="section-head__link" href="{{ '/gallery/' | relative_url }}">See the gallery <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
</div>
<p class="beyond-lead">
  Outside the lab, you'll usually find me traveling and hiking, hanging out with my dog, or on the
  pickleball court. I like staying active, exploring new places, and taking pretty pictures along the way.
</p>
<div class="photo-grid">
  <figure class="photo"><a href="{{ '/gallery/' | relative_url }}"><img src="{{ '/images/gallery/IMG_1910.jpeg' | relative_url }}" alt="My dog at golden hour" loading="lazy"></a></figure>
  <figure class="photo"><a href="{{ '/gallery/' | relative_url }}"><img src="{{ '/images/gallery/IMG_8104.jpeg' | relative_url }}" alt="Out on a hike" loading="lazy"></a></figure>
  <figure class="photo"><a href="{{ '/gallery/' | relative_url }}"><img src="{{ '/images/gallery/IMG_7171.jpeg' | relative_url }}" alt="Among the redwoods" loading="lazy"></a></figure>
  <figure class="photo"><a href="{{ '/gallery/' | relative_url }}"><img src="{{ '/images/gallery/IMG_8900.jpeg' | relative_url }}" alt="A summit view" loading="lazy"></a></figure>
</div>

<script>
// Lorenz attractor backdrop for the hero — a nod to dynamical systems.
// Faint, theme-aware (reads --accent), and static when prefers-reduced-motion.
(function () {
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
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    readAccent();
  }
  function project(p, ang) {
    var ca = Math.cos(ang), sa = Math.sin(ang);
    var scale = Math.min(Math.max(W, 360), 900) / 62;
    return [W * 0.74 + (p[0] * ca - p[2] * sa) * scale, H * 0.52 - p[1] * scale, 0];
  }
  var angle = 0.6, head = 0, raf;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineJoin = 'round';
    // faint full attractor
    ctx.strokeStyle = 'rgba(' + accent + ',0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = 0; i < pts.length; i += 2) {
      var q = project(pts[i], angle);
      i === 0 ? ctx.moveTo(q[0], q[1]) : ctx.lineTo(q[0], q[1]);
    }
    ctx.stroke();
    // brighter comet tracing the path
    var L = 240;
    for (var j = 0; j < L; j++) {
      var idx = (head - j + pts.length) % pts.length;
      var a = project(pts[idx], angle), c = project(pts[(idx + 1) % pts.length], angle);
      ctx.strokeStyle = 'rgba(' + accent + ',' + (0.55 * (1 - j / L)).toFixed(3) + ')';
      ctx.lineWidth = 1.6 * (1 - j / L) + 0.3;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c[0], c[1]); ctx.stroke();
    }
  }
  function loop() { angle += 0.0011; head = (head + 3) % pts.length; draw(); raf = requestAnimationFrame(loop); }
  function start() { resize(); reduce ? draw() : (cancelAnimationFrame(raf), loop()); }
  window.addEventListener('resize', function () { resize(); if (reduce) draw(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
</script>

