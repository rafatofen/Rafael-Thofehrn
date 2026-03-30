/* ═══════════════════════════════════════════════════════════
   RAFAEL THOFEHRN — main.js
═══════════════════════════════════════════════════════════ */

/* ─── INTERACTIVE HERO CANVAS ─── */
(function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, mouse = { x: -9999, y: -9999 };
  const COLS = [
    [255, 45,  85],   // neon red
    [0,   245, 255],  // cyan
    [191, 95,  255],  // purple
    [57,  255, 20],   // green
  ];

  // Particles
  const NPARTICLES = 90;
  const particles = [];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  class Particle {
    constructor() { this.reset(true); }
    reset(initial) {
      this.x  = Math.random() * W;
      this.y  = initial ? Math.random() * H : (Math.random() > .5 ? -10 : H + 10);
      this.r  = Math.random() * 1.8 + .4;
      this.vx = (Math.random() - .5) * .4;
      this.vy = (Math.random() - .5) * .4;
      this.ci = Math.floor(Math.random() * COLS.length);
      this.alpha = Math.random() * .5 + .15;
      this.life  = 0;
      this.maxLife = 200 + Math.random() * 300;
    }
    update() {
      // mouse repel / attract
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const RADIUS = 180;
      if (dist < RADIUS) {
        const force = (RADIUS - dist) / RADIUS;
        this.vx += (dx / dist) * force * 0.6;
        this.vy += (dy / dist) * force * 0.6;
      }
      this.vx *= 0.96;
      this.vy *= 0.96;
      this.x += this.vx;
      this.y += this.vy;
      this.life++;
      if (this.life > this.maxLife || this.x < -20 || this.x > W + 20 || this.y < -20 || this.y > H + 20) {
        this.reset(false);
      }
    }
    draw() {
      const fade = this.life < 40 ? this.life / 40 : this.life > this.maxLife - 40 ? (this.maxLife - this.life) / 40 : 1;
      const [r, g, b] = COLS[this.ci];
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${this.alpha * fade})`;
      ctx.fill();
      // soft glow
      const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 6);
      grd.addColorStop(0, `rgba(${r},${g},${b},${0.06 * fade})`);
      grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 6, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }
  }

  // Aurora blobs that follow mouse lazily
  const blobs = [
    { x: 0.25, y: 0.5, tx: 0.25, ty: 0.5, ci: 0, r: 0.3 },
    { x: 0.75, y: 0.4, tx: 0.75, ty: 0.4, ci: 1, r: 0.28 },
    { x: 0.5,  y: 0.7, tx: 0.5,  ty: 0.7, ci: 2, r: 0.25 },
  ];

  function drawAurora() {
    blobs.forEach(b => {
      // drift toward mouse (very lazily)
      b.tx = (mouse.x / W) * .4 + b.x * .6;
      b.ty = (mouse.y / H) * .4 + b.y * .6;
      b.x += (b.tx - b.x) * 0.008;
      b.y += (b.ty - b.y) * 0.008;

      const bx = b.x * W, by = b.y * H;
      const radius = Math.min(W, H) * b.r;
      const [r, g, bl] = COLS[b.ci];
      const grd = ctx.createRadialGradient(bx, by, 0, bx, by, radius);
      grd.addColorStop(0, `rgba(${r},${g},${bl},0.07)`);
      grd.addColorStop(1, `rgba(${r},${g},${bl},0)`);
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
    });
  }

  // connections
  function drawConnections() {
    const MAX_DIST = 120;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < MAX_DIST) {
          const alpha = (1 - d / MAX_DIST) * 0.12;
          const [r, g, b] = COLS[particles[i].ci];
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  // mouse cursor glow on canvas
  function drawMouseGlow() {
    if (mouse.x < 0 || mouse.x > W) return;
    const grd = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 160);
    grd.addColorStop(0, 'rgba(0,245,255,0.06)');
    grd.addColorStop(1, 'rgba(0,245,255,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    drawAurora();
    drawMouseGlow();
    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener('resize', () => { resize(); });
  for (let i = 0; i < NPARTICLES; i++) particles.push(new Particle());

  // track mouse within hero section
  const heroSection = canvas.closest('.hero') || document.body;
  heroSection.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  heroSection.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  loop();
})();

/* ─── CURSOR ─── */
const cur = document.getElementById('cur');
const ring = document.getElementById('cur-ring');

if (cur && ring) {
  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cur.style.left = mx + 'px';
    cur.style.top  = my + 'px';
  });

  (function animRing() {
    rx += (mx - rx) * 0.1;
    ry += (my - ry) * 0.1;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animRing);
  })();
}

/* ─── NAV SCROLL ─── */
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.style.borderBottomColor = window.scrollY > 60
      ? 'rgba(232,230,255,0.14)'
      : 'rgba(232,230,255,0.07)';
  }, { passive: true });
}

/* ─── HAMBURGER MENU ─── */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });

  document.querySelectorAll('.mob-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
    });
  });
}

/* ─── REVEAL ON SCROLL ─── */
// Give each gcard a stagger delay based on its position in the grid
document.querySelectorAll('.gallery-grid').forEach(grid => {
  grid.querySelectorAll('.gcard').forEach((card, i) => {
    card.style.transitionDelay = `${(i % 3) * 0.1}s`;
  });
});

const revealEls = document.querySelectorAll('.reveal, .gcard, .cat-box');
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.06 });
revealEls.forEach(el => revealObs.observe(el));

/* ─── COUNT UP ─── */
function countUp(el) {
  const target = parseInt(el.dataset.target, 10);
  const dur = 1600;
  const start = performance.now();
  const tick = now => {
    const p = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.floor(ease * target);
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  };
  requestAnimationFrame(tick);
}

const counters = document.querySelectorAll('.astat-n[data-target]');
const cntObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { countUp(e.target); cntObs.unobserve(e.target); }
  });
}, { threshold: 0.5 });
counters.forEach(el => cntObs.observe(el));

/* ─── RANDOM GLITCH TWITCH ─── */
function scheduleGlitch() {
  const glitches = document.querySelectorAll('.glitch');
  glitches.forEach(el => {
    const delay = 2000 + Math.random() * 6000;
    setTimeout(() => {
      el.style.transform = `translate(${(Math.random()-.5)*6}px, ${(Math.random()-.5)*3}px)`;
      setTimeout(() => { el.style.transform = ''; }, 80);
      setTimeout(() => {
        el.style.transform = `translate(${(Math.random()-.5)*4}px, 0)`;
        setTimeout(() => { el.style.transform = ''; scheduleGlitch(); }, 60);
      }, 100);
    }, delay);
  });
}
scheduleGlitch();

/* ─── PORTFOLIO FILTER ─── */
const filterBtns = document.querySelectorAll('.filter-btn');
const galleryGrid = document.getElementById('galleryGrid');
const noResults   = document.getElementById('noResults');

if (filterBtns.length && galleryGrid) {
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      const cards  = galleryGrid.querySelectorAll('.gcard');
      let visible  = 0;

      cards.forEach(card => {
        const cats = card.dataset.cat || '';
        const show = filter === 'all' || cats.split(' ').includes(filter);
        card.classList.toggle('hidden', !show);
        if (show) visible++;
      });

      if (noResults) noResults.style.display = visible === 0 ? 'block' : 'none';
    });
  });
}

/* ─── ACTIVE NAV LINK ON SCROLL ─── */
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-list a');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 100) current = s.id;
  });
  navLinks.forEach(a => {
    const href = a.getAttribute('href') || '';
    a.classList.toggle('active', href === '#' + current || href === current);
  });
}, { passive: true });

/* ─── NEON FLICKER on hover cards ─── */
document.querySelectorAll('.port-card, .gcard').forEach(card => {
  card.addEventListener('mouseenter', () => {
    const arrow = card.querySelector('.port-arrow, .gcard-arrow');
    if (arrow) {
      arrow.style.boxShadow = '0 0 12px rgba(0,245,255,0.5)';
    }
  });
  card.addEventListener('mouseleave', () => {
    const arrow = card.querySelector('.port-arrow, .gcard-arrow');
    if (arrow) arrow.style.boxShadow = '';
  });
});

/* ─── CONTACT MATRIX RAIN ─── */
(function initMatrix() {
  const canvas = document.getElementById('contact-matrix');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Characters: mix of binary, hex digits, katakana-ish symbols
  const CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF#@%&!?';

  const FONT_SIZE = 14;
  let cols, drops;

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    cols  = Math.floor(canvas.width / FONT_SIZE);
    drops = Array.from({ length: cols }, () => Math.random() * -50);
  }

  function draw() {
    // Fade trail
    ctx.fillStyle = 'rgba(5,5,7,0.055)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${FONT_SIZE}px monospace`;

    for (let i = 0; i < cols; i++) {
      const char = CHARS[Math.floor(Math.random() * CHARS.length)];
      const y    = drops[i] * FONT_SIZE;

      // Head glyph — bright cyan/white
      const headAlpha = 0.9;
      const isHead    = drops[i] > 0 && y < canvas.height;
      ctx.fillStyle = isHead ? `rgba(220,255,255,${headAlpha})` : `rgba(0,245,255,0.65)`;
      ctx.fillText(char, i * FONT_SIZE, y);

      // Occasionally reset column
      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i] += 0.5;
    }
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  setInterval(draw, 50);
})();
