// ── GALLERY CONDITIONAL RENDER ──
(function initGallery() {
  if (!CONFIG.showGallery || !CONFIG.photos || CONFIG.photos.length === 0) return;

  // Show section and nav link
  document.getElementById('seeme').style.display = '';
  const navLink = document.getElementById('nav-seeme');
  if (navLink) navLink.style.display = '';

  // Build slides
  const track = document.getElementById('carouselTrack');
  CONFIG.photos.forEach(photo => {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    slide.innerHTML = `
      <img src="${photo.src}" alt="${photo.label || 'Photo'}" draggable="false">
      <div class="slide-overlay"></div>
      ${photo.label ? `<div class="slide-label">${photo.label}</div>` : ''}
    `;
    track.appendChild(slide);
  });

  // Init carousel after slides are built
  initCarousel();
})();

function initCarousel() {
  const track = document.getElementById('carouselTrack');
  const wrap = document.getElementById('carouselWrap');
  const slides = track.querySelectorAll('.carousel-slide');
  const dotsWrap = document.getElementById('dots');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (slides.length === 0) return;

  let current = 0;
  let isDragging = false, startX = 0, dragOffset = 0;
  let autoTimer;

  // Build dots
  slides.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'dot' + (i === 0 ? ' active' : '');
    d.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(d);
  });

  function getSlideWidth() {
    return slides[0].offsetWidth + 20;
  }

  function goTo(idx) {
    current = Math.max(0, Math.min(idx, slides.length - 1));
    track.style.transition = 'transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    track.style.transform = `translateX(-${current * getSlideWidth()}px)`;
    document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === current));
    resetAuto();
  }

  // Buttons
  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  // Mouse drag
  wrap.addEventListener('mousedown', e => {
    isDragging = true;
    startX = e.pageX;
    dragOffset = current * getSlideWidth();
    track.style.transition = 'none';
    wrap.style.cursor = 'grabbing';
  });
  window.addEventListener('mouseup', e => {
    if (!isDragging) return;
    isDragging = false;
    wrap.style.cursor = 'grab';
    const delta = startX - e.pageX;
    if (Math.abs(delta) > 60) goTo(delta > 0 ? current + 1 : current - 1);
    else goTo(current);
  });
  wrap.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const walk = e.pageX - startX;
    track.style.transform = `translateX(-${dragOffset - walk}px)`;
  });

  // Touch
  wrap.addEventListener('touchstart', e => {
    startX = e.touches[0].pageX;
    dragOffset = current * getSlideWidth();
    track.style.transition = 'none';
  }, { passive: true });
  wrap.addEventListener('touchend', e => {
    const delta = startX - e.changedTouches[0].pageX;
    if (Math.abs(delta) > 50) goTo(delta > 0 ? current + 1 : current - 1);
    else goTo(current);
  });

  // Auto-play
  function resetAuto() {
    clearInterval(autoTimer);
    if (slides.length > 1) {
      autoTimer = setInterval(() => goTo((current + 1) % slides.length), 3500);
    }
  }
  resetAuto();

  // Keyboard
  document.addEventListener('keydown', e => {
    const seeme = document.getElementById('seeme');
    if (seeme.style.display === 'none') return;
    if (e.key === 'ArrowLeft') goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });
}

// ── PARTICLE CANVAS ──
(function initCanvas() {
  const canvas = document.getElementById('hero-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];
  let mouse = { x: -999, y: -999 };

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W; this.y = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.3; this.vy = (Math.random() - 0.5) * 0.3;
      this.r = Math.random() * 1.5 + 0.5; this.alpha = Math.random() * 0.5 + 0.1;
    }
    update() {
      const dx = mouse.x - this.x, dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const f = (120 - dist) / 120;
        this.vx -= (dx / dist) * f * 0.8;
        this.vy -= (dy / dist) * f * 0.8;
      }
      this.vx *= 0.98; this.vy *= 0.98;
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(167,139,250,${this.alpha})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < 120; i++) particles.push(new Particle());

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(99,102,241,${0.15 * (1 - d / 100)})`;
          ctx.lineWidth = 0.5; ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    requestAnimationFrame(animate);
  }
  animate();
})();

// ── TYPEWRITER ──
(function initTypewriter() {
  const words = ['and learn.', 'and deploy.', 'and scale.', 'and ship.'];
  let wi = 0, ci = 0, deleting = false;
  const el = document.getElementById('typed');

  function loop() {
    const word = words[wi];
    if (!deleting) {
      el.textContent = word.slice(0, ++ci);
      if (ci === word.length) { deleting = true; setTimeout(loop, 1800); return; }
    } else {
      el.textContent = word.slice(0, --ci);
      if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; }
    }
    setTimeout(loop, deleting ? 60 : 90);
  }
  loop();
})();

// ── SCROLL REVEAL ──
(function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();

// ── NAV SCROLL ──
window.addEventListener('scroll', () => {
  const nav = document.querySelector('nav');
  nav.style.background = window.scrollY > 50
    ? 'rgba(10,10,15,0.95)'
    : 'rgba(10,10,15,0.7)';
});
