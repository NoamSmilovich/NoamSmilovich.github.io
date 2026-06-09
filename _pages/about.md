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

<script src="/assets/js/hero-lorenz.js" defer></script>

