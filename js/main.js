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
/* ─── EXPERIENCE MAP CANVAS ─── */
(function initExpMap() {
  const canvas = document.getElementById('exp-map-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Equirectangular projection
  function proj(lon, lat, W, H) {
    return [(lon + 180) / 360 * W, (90 - lat) / 180 * H];
  }

  const LAND = [
    // na_main
    [[-168.0,72.0],[-162.0,70.0],[-140.0,70.0],[-130.0,54.0],[-124.0,46.0],[-124.0,38.0],[-120.0,34.0],[-117.0,32.0],[-117.0,30.0],[-110.0,24.0],[-105.0,20.0],[-100.0,20.0],[-96.0,18.0],[-88.0,15.0],[-85.0,10.0],[-80.0,8.0],[-78.0,8.0],[-76.0,10.0],[-82.0,10.0],[-84.0,12.0],[-88.0,16.0],[-92.0,16.0],[-94.0,16.0],[-96.0,20.0],[-100.0,22.0],[-105.0,22.0],[-110.0,26.0],[-116.0,30.0],[-118.0,28.0],[-118.0,32.0],[-120.0,38.0],[-122.0,48.0],[-124.0,50.0],[-126.0,50.0],[-128.0,52.0],[-130.0,54.0],[-132.0,56.0],[-136.0,58.0],[-140.0,60.0],[-146.0,60.0],[-148.0,60.0],[-152.0,58.0],[-152.0,60.0],[-156.0,60.0],[-160.0,58.0],[-162.0,58.0],[-164.0,60.0],[-166.0,62.0],[-168.0,66.0],[-168.0,72.0]],
    // alaska
    [[-168.0,54.0],[-162.0,54.0],[-158.0,54.0],[-154.0,56.0],[-152.0,56.0],[-148.0,58.0],[-140.0,60.0],[-136.0,58.0],[-132.0,56.0],[-130.0,54.0],[-132.0,54.0],[-136.0,56.0],[-140.0,58.0],[-148.0,60.0],[-152.0,60.0],[-156.0,60.0],[-160.0,58.0],[-164.0,60.0],[-166.0,62.0],[-168.0,66.0],[-168.0,54.0]],
    // greenland
    [[-44.0,84.0],[-26.0,84.0],[-18.0,78.0],[-18.0,76.0],[-20.0,72.0],[-22.0,70.0],[-26.0,68.0],[-32.0,66.0],[-38.0,66.0],[-44.0,66.0],[-50.0,68.0],[-56.0,72.0],[-58.0,76.0],[-56.0,80.0],[-44.0,84.0]],
    // baffin_island
    [[-68.0,74.0],[-62.0,74.0],[-62.0,72.0],[-64.0,70.0],[-68.0,70.0],[-72.0,70.0],[-76.0,72.0],[-68.0,74.0]],
    // cuba
    [[-85.0,22.0],[-82.0,22.0],[-78.0,22.0],[-76.0,20.0],[-74.0,20.0],[-75.0,22.0],[-78.0,22.0],[-82.0,24.0],[-85.0,22.0]],
    // central_am
    [[-88.0,16.0],[-85.0,10.0],[-80.0,8.0],[-78.0,8.0],[-76.0,10.0],[-82.0,10.0],[-84.0,12.0],[-88.0,16.0]],
    // sa_main
    [[-80.0,8.0],[-76.0,2.0],[-72.0,-2.0],[-68.0,-4.0],[-60.0,-4.0],[-52.0,-4.0],[-44.0,-2.0],[-38.0,-4.0],[-36.0,-6.0],[-35.0,-8.0],[-36.0,-10.0],[-38.0,-14.0],[-40.0,-18.0],[-40.0,-22.0],[-42.0,-22.0],[-44.0,-24.0],[-46.0,-24.0],[-48.0,-26.0],[-50.0,-30.0],[-52.0,-34.0],[-54.0,-38.0],[-56.0,-40.0],[-60.0,-42.0],[-64.0,-46.0],[-66.0,-50.0],[-66.0,-54.0],[-68.0,-54.0],[-70.0,-52.0],[-72.0,-46.0],[-72.0,-42.0],[-72.0,-36.0],[-72.0,-30.0],[-72.0,-22.0],[-74.0,-14.0],[-76.0,-8.0],[-78.0,-4.0],[-80.0,0.0],[-80.0,4.0],[-80.0,8.0]],
    // falklands
    [[-62.0,-52.0],[-58.0,-52.0],[-58.0,-54.0],[-62.0,-52.0]],
    // europe
    [[-10.0,36.0],[-8.0,36.0],[-8.0,38.0],[-10.0,40.0],[-8.0,42.0],[-2.0,44.0],[-2.0,46.0],[2.0,46.0],[2.0,48.0],[0.0,50.0],[2.0,52.0],[4.0,52.0],[4.0,54.0],[8.0,56.0],[8.0,58.0],[4.0,58.0],[4.0,56.0],[2.0,54.0],[0.0,54.0],[-2.0,54.0],[-2.0,56.0],[0.0,58.0],[0.0,60.0],[4.0,60.0],[4.0,62.0],[6.0,64.0],[4.0,64.0],[4.0,66.0],[6.0,68.0],[8.0,70.0],[8.0,72.0],[12.0,72.0],[14.0,70.0],[18.0,70.0],[20.0,70.0],[24.0,70.0],[28.0,70.0],[28.0,68.0],[26.0,64.0],[26.0,62.0],[28.0,60.0],[28.0,58.0],[24.0,56.0],[22.0,56.0],[20.0,56.0],[18.0,58.0],[16.0,58.0],[14.0,56.0],[14.0,54.0],[16.0,52.0],[18.0,50.0],[18.0,48.0],[16.0,46.0],[14.0,46.0],[14.0,44.0],[16.0,44.0],[18.0,42.0],[20.0,40.0],[20.0,38.0],[18.0,38.0],[16.0,38.0],[14.0,38.0],[12.0,38.0],[10.0,40.0],[12.0,42.0],[12.0,44.0],[10.0,44.0],[8.0,44.0],[6.0,44.0],[4.0,44.0],[2.0,44.0],[0.0,44.0],[-2.0,44.0],[-4.0,44.0],[-4.0,42.0],[-2.0,40.0],[-2.0,38.0],[-4.0,38.0],[-6.0,38.0],[-8.0,38.0],[-8.0,36.0],[-10.0,36.0]],
    // uk
    [[-6.0,50.0],[-4.0,50.0],[-2.0,50.0],[0.0,50.0],[2.0,52.0],[0.0,54.0],[-2.0,54.0],[-4.0,52.0],[-6.0,50.0]],
    // ireland
    [[-10.0,52.0],[-6.0,52.0],[-6.0,54.0],[-8.0,56.0],[-10.0,54.0],[-10.0,52.0]],
    // iceland
    [[-24.0,64.0],[-14.0,64.0],[-12.0,66.0],[-14.0,68.0],[-20.0,68.0],[-24.0,66.0],[-24.0,64.0]],
    // iberia
    [[-10.0,36.0],[-8.0,36.0],[-8.0,38.0],[-8.0,42.0],[-2.0,44.0],[-2.0,44.0],[0.0,44.0],[2.0,44.0],[4.0,44.0],[4.0,42.0],[2.0,42.0],[2.0,40.0],[0.0,38.0],[-2.0,36.0],[-6.0,36.0],[-8.0,36.0],[-10.0,36.0]],
    // italy
    [[8.0,44.0],[10.0,44.0],[12.0,44.0],[14.0,44.0],[14.0,42.0],[16.0,40.0],[16.0,38.0],[14.0,38.0],[12.0,38.0],[10.0,40.0],[10.0,42.0],[8.0,44.0]],
    // norway_detail
    [[4.0,58.0],[8.0,58.0],[8.0,60.0],[10.0,60.0],[10.0,62.0],[12.0,62.0],[14.0,64.0],[16.0,66.0],[18.0,68.0],[20.0,70.0],[22.0,70.0],[24.0,70.0],[26.0,70.0],[28.0,70.0],[28.0,68.0],[26.0,66.0],[26.0,64.0],[24.0,62.0],[24.0,60.0],[22.0,58.0],[20.0,56.0],[18.0,56.0],[16.0,56.0],[14.0,56.0],[12.0,56.0],[10.0,56.0],[8.0,56.0],[6.0,56.0],[4.0,58.0]],
    // africa
    [[-18.0,16.0],[-16.0,14.0],[-16.0,12.0],[-14.0,10.0],[-12.0,8.0],[-8.0,4.0],[-2.0,4.0],[0.0,4.0],[2.0,4.0],[4.0,4.0],[6.0,4.0],[8.0,2.0],[10.0,2.0],[12.0,2.0],[14.0,2.0],[16.0,2.0],[18.0,2.0],[20.0,0.0],[22.0,-2.0],[24.0,-4.0],[26.0,-6.0],[28.0,-8.0],[30.0,-10.0],[32.0,-12.0],[34.0,-14.0],[36.0,-16.0],[36.0,-18.0],[34.0,-22.0],[32.0,-24.0],[30.0,-28.0],[28.0,-30.0],[28.0,-32.0],[26.0,-34.0],[24.0,-34.0],[22.0,-34.0],[20.0,-34.0],[18.0,-34.0],[16.0,-32.0],[14.0,-30.0],[12.0,-26.0],[10.0,-22.0],[10.0,-18.0],[10.0,-14.0],[10.0,-10.0],[8.0,-6.0],[4.0,-2.0],[2.0,2.0],[0.0,4.0],[-2.0,4.0],[-4.0,8.0],[-8.0,10.0],[-12.0,10.0],[-14.0,12.0],[-16.0,14.0],[-18.0,16.0],[0.0,16.0],[4.0,16.0],[8.0,18.0],[12.0,20.0],[16.0,20.0],[20.0,20.0],[24.0,20.0],[28.0,20.0],[32.0,20.0],[36.0,18.0],[38.0,14.0],[40.0,12.0],[42.0,12.0],[44.0,8.0],[42.0,12.0],[36.0,22.0],[34.0,28.0],[34.0,32.0],[32.0,36.0],[24.0,36.0],[10.0,36.0],[2.0,36.0],[-2.0,36.0],[-4.0,34.0],[-8.0,36.0],[-14.0,30.0],[-18.0,20.0],[-18.0,16.0]],
    // madagascar
    [[44.0,-12.0],[46.0,-14.0],[48.0,-16.0],[50.0,-18.0],[50.0,-24.0],[48.0,-26.0],[46.0,-26.0],[44.0,-24.0],[44.0,-18.0],[44.0,-12.0]],
    // middle_east
    [[28.0,36.0],[30.0,36.0],[32.0,36.0],[34.0,36.0],[36.0,36.0],[38.0,36.0],[40.0,38.0],[42.0,38.0],[44.0,40.0],[46.0,40.0],[46.0,38.0],[48.0,34.0],[50.0,30.0],[52.0,26.0],[54.0,24.0],[56.0,24.0],[56.0,22.0],[54.0,20.0],[52.0,18.0],[50.0,14.0],[48.0,12.0],[46.0,12.0],[44.0,12.0],[42.0,12.0],[40.0,14.0],[38.0,16.0],[36.0,20.0],[36.0,22.0],[34.0,28.0],[34.0,32.0],[32.0,34.0],[30.0,34.0],[28.0,36.0]],
    // arabian_pen
    [[36.0,22.0],[38.0,18.0],[40.0,14.0],[42.0,12.0],[44.0,12.0],[46.0,12.0],[48.0,12.0],[50.0,14.0],[52.0,18.0],[54.0,20.0],[56.0,22.0],[56.0,24.0],[58.0,22.0],[60.0,20.0],[60.0,18.0],[56.0,16.0],[54.0,14.0],[52.0,12.0],[50.0,12.0],[48.0,12.0],[44.0,14.0],[42.0,14.0],[38.0,14.0],[36.0,18.0],[36.0,22.0]],
    // russia_eu
    [[28.0,70.0],[32.0,70.0],[36.0,70.0],[40.0,68.0],[44.0,66.0],[46.0,64.0],[48.0,62.0],[50.0,60.0],[48.0,56.0],[46.0,52.0],[44.0,50.0],[42.0,48.0],[40.0,46.0],[38.0,44.0],[40.0,42.0],[42.0,42.0],[44.0,44.0],[46.0,44.0],[48.0,44.0],[50.0,44.0],[52.0,44.0],[54.0,44.0],[56.0,44.0],[58.0,44.0],[60.0,46.0],[60.0,54.0],[60.0,60.0],[60.0,64.0],[60.0,68.0],[58.0,70.0],[54.0,70.0],[50.0,70.0],[44.0,70.0],[40.0,70.0],[36.0,70.0],[32.0,70.0],[28.0,70.0]],
    // russia_asia
    [[60.0,54.0],[64.0,54.0],[68.0,54.0],[72.0,54.0],[76.0,54.0],[80.0,54.0],[84.0,54.0],[88.0,54.0],[92.0,54.0],[96.0,56.0],[100.0,58.0],[104.0,60.0],[108.0,62.0],[112.0,64.0],[116.0,66.0],[120.0,68.0],[124.0,70.0],[128.0,72.0],[130.0,72.0],[132.0,70.0],[136.0,70.0],[140.0,70.0],[144.0,68.0],[148.0,66.0],[152.0,62.0],[156.0,58.0],[160.0,54.0],[164.0,50.0],[168.0,54.0],[170.0,56.0],[168.0,58.0],[166.0,58.0],[164.0,56.0],[162.0,54.0],[160.0,54.0],[156.0,58.0],[152.0,58.0],[148.0,62.0],[144.0,64.0],[140.0,66.0],[136.0,68.0],[132.0,68.0],[128.0,70.0],[124.0,68.0],[120.0,66.0],[116.0,64.0],[112.0,62.0],[108.0,60.0],[104.0,58.0],[100.0,54.0],[96.0,52.0],[92.0,50.0],[88.0,48.0],[84.0,46.0],[80.0,46.0],[76.0,46.0],[72.0,46.0],[68.0,48.0],[64.0,52.0],[60.0,54.0]],
    // kazakhstan
    [[52.0,44.0],[56.0,44.0],[60.0,44.0],[64.0,44.0],[68.0,44.0],[72.0,42.0],[76.0,42.0],[80.0,44.0],[82.0,46.0],[84.0,46.0],[84.0,50.0],[80.0,50.0],[76.0,50.0],[72.0,50.0],[68.0,50.0],[64.0,50.0],[60.0,50.0],[56.0,50.0],[52.0,50.0],[50.0,48.0],[50.0,46.0],[52.0,44.0]],
    // china
    [[76.0,36.0],[80.0,36.0],[84.0,28.0],[88.0,24.0],[92.0,22.0],[96.0,20.0],[100.0,20.0],[104.0,20.0],[108.0,20.0],[110.0,20.0],[114.0,22.0],[116.0,24.0],[118.0,26.0],[120.0,28.0],[122.0,30.0],[122.0,32.0],[122.0,36.0],[120.0,40.0],[118.0,44.0],[116.0,44.0],[112.0,44.0],[108.0,44.0],[104.0,42.0],[100.0,42.0],[96.0,44.0],[92.0,44.0],[88.0,44.0],[84.0,44.0],[80.0,44.0],[76.0,44.0],[72.0,44.0],[72.0,40.0],[72.0,36.0],[76.0,36.0]],
    // india
    [[68.0,24.0],[70.0,24.0],[72.0,24.0],[74.0,24.0],[76.0,24.0],[80.0,28.0],[84.0,28.0],[88.0,24.0],[90.0,22.0],[92.0,22.0],[90.0,20.0],[88.0,18.0],[86.0,16.0],[84.0,14.0],[82.0,12.0],[80.0,10.0],[78.0,8.0],[76.0,8.0],[74.0,8.0],[72.0,10.0],[70.0,12.0],[68.0,22.0],[68.0,24.0]],
    // sri_lanka
    [[80.0,10.0],[82.0,8.0],[82.0,6.0],[80.0,6.0],[80.0,10.0]],
    // se_asia_main
    [[100.0,20.0],[104.0,20.0],[108.0,18.0],[110.0,16.0],[112.0,14.0],[110.0,10.0],[108.0,8.0],[106.0,4.0],[104.0,2.0],[102.0,2.0],[100.0,4.0],[100.0,8.0],[98.0,10.0],[98.0,14.0],[98.0,18.0],[100.0,20.0]],
    // malay_pen
    [[100.0,6.0],[102.0,4.0],[104.0,2.0],[102.0,2.0],[100.0,2.0],[100.0,4.0],[100.0,6.0]],
    // sumatra
    [[96.0,6.0],[98.0,4.0],[100.0,4.0],[102.0,4.0],[104.0,2.0],[106.0,0.0],[106.0,-2.0],[104.0,-4.0],[102.0,-4.0],[100.0,-4.0],[98.0,-2.0],[96.0,0.0],[96.0,2.0],[96.0,6.0]],
    // java
    [[106.0,-6.0],[108.0,-6.0],[110.0,-8.0],[112.0,-8.0],[114.0,-8.0],[110.0,-8.0],[108.0,-8.0],[106.0,-6.0]],
    // borneo
    [[108.0,2.0],[110.0,4.0],[112.0,6.0],[114.0,6.0],[116.0,6.0],[118.0,6.0],[118.0,4.0],[118.0,2.0],[116.0,0.0],[114.0,-2.0],[112.0,-4.0],[110.0,-4.0],[108.0,-2.0],[108.0,2.0]],
    // sulawesi
    [[120.0,2.0],[122.0,0.0],[124.0,-2.0],[122.0,-2.0],[120.0,0.0],[120.0,2.0]],
    // new_guinea
    [[130.0,-2.0],[132.0,-4.0],[136.0,-6.0],[140.0,-6.0],[144.0,-6.0],[148.0,-6.0],[148.0,-8.0],[144.0,-8.0],[140.0,-8.0],[136.0,-8.0],[132.0,-6.0],[128.0,-4.0],[128.0,-2.0],[130.0,-2.0]],
    // philippines
    [[118.0,18.0],[120.0,18.0],[122.0,16.0],[124.0,14.0],[122.0,12.0],[120.0,10.0],[118.0,10.0],[118.0,12.0],[120.0,14.0],[118.0,16.0],[118.0,18.0]],
    // japan_honshu
    [[130.0,34.0],[132.0,34.0],[134.0,34.0],[136.0,36.0],[138.0,36.0],[140.0,38.0],[140.0,40.0],[142.0,40.0],[142.0,42.0],[140.0,42.0],[140.0,40.0],[138.0,40.0],[136.0,38.0],[134.0,36.0],[132.0,34.0],[130.0,34.0]],
    // japan_kyushu
    [[130.0,32.0],[132.0,32.0],[132.0,30.0],[130.0,30.0],[130.0,32.0]],
    // japan_hokkaido
    [[140.0,44.0],[142.0,44.0],[144.0,44.0],[144.0,42.0],[142.0,42.0],[140.0,42.0],[140.0,44.0]],
    // taiwan
    [[120.0,24.0],[122.0,22.0],[122.0,24.0],[120.0,24.0]],
    // korea
    [[126.0,34.0],[128.0,36.0],[128.0,38.0],[128.0,40.0],[126.0,40.0],[124.0,38.0],[124.0,36.0],[126.0,34.0]],
    // australia
    [[114.0,-22.0],[116.0,-20.0],[118.0,-20.0],[120.0,-18.0],[122.0,-18.0],[124.0,-16.0],[126.0,-14.0],[128.0,-14.0],[130.0,-12.0],[132.0,-12.0],[134.0,-12.0],[136.0,-12.0],[138.0,-14.0],[140.0,-16.0],[140.0,-18.0],[142.0,-18.0],[144.0,-18.0],[146.0,-20.0],[148.0,-20.0],[150.0,-22.0],[152.0,-24.0],[154.0,-26.0],[154.0,-28.0],[152.0,-30.0],[150.0,-32.0],[150.0,-34.0],[148.0,-36.0],[148.0,-38.0],[146.0,-38.0],[144.0,-38.0],[142.0,-38.0],[140.0,-36.0],[138.0,-36.0],[136.0,-34.0],[134.0,-32.0],[132.0,-32.0],[130.0,-32.0],[128.0,-32.0],[126.0,-34.0],[124.0,-34.0],[122.0,-34.0],[120.0,-34.0],[118.0,-34.0],[116.0,-34.0],[114.0,-32.0],[114.0,-28.0],[114.0,-24.0],[114.0,-22.0]],
    // tasmania
    [[144.0,-40.0],[146.0,-40.0],[148.0,-40.0],[148.0,-44.0],[146.0,-44.0],[144.0,-44.0],[144.0,-40.0]],
    // nz_north
    [[174.0,-38.0],[178.0,-38.0],[178.0,-40.0],[176.0,-42.0],[174.0,-40.0],[174.0,-38.0]],
    // nz_south
    [[166.0,-44.0],[170.0,-44.0],[172.0,-44.0],[172.0,-46.0],[170.0,-48.0],[168.0,-46.0],[166.0,-46.0],[166.0,-44.0]]
  ];

  // Cities
  const CITIES = {
    sao_paulo: { lon:-46.63, lat:-23.55, name:'SÃO PAULO', co:'Vati Group',              period:'2022 — 2025', color:'#ff2d55' },
    pelotas:   { lon:-52.34, lat:-31.77, name:'PELOTAS',   co:'Prodigious · Publicis',  period:'2020 — 2022', color:'#bf5fff' },
    perth:     { lon:115.86, lat:-31.95, name:'PERTH',     co:'Available for work',      period:'2025 — Now',  color:'#00f5ff', always:true },
  };

  // Which city is highlighted (null = none, 'perth' always on top)
  let activeCity = null;
  // Zoom state: smoothly lerp toward target
  let zoomCx = 0, zoomCy = 0, zoomLvl = 1;
  let targetCx = 0, targetCy = 0, targetZoom = 1;

  // Listen to timeline hover
  document.querySelectorAll('.tl-item[data-city]').forEach(item => {
    item.addEventListener('mouseenter', () => { activeCity = item.dataset.city; });
    item.addEventListener('mouseleave', () => { activeCity = null; });
  });

  function drawPin(cx, cy, city, W, H, boost, zoom) {
    zoom = zoom || 1;
    const iz = 1 / zoom; // inverse scale for text/labels
    const { color, name, co, period, always } = city;
    const t    = Date.now() / 500;
    const pulse = (Math.sin(t) * 0.5 + 0.5); // 0..1

    // For Perth or boosted cities, use full pulse; others static
    const isLive = always || boost;

    if (isLive) {
      // Outer ring
      const r1 = (boost ? 10 + pulse * 26 : 6 + pulse * 18) * iz;
      ctx.beginPath();
      ctx.arc(cx, cy, r1, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth   = boost ? 1.5 : 1;
      ctx.globalAlpha = (1 - pulse) * (boost ? 0.9 : 0.6);
      ctx.stroke();
      // Inner ring
      const r2 = (boost ? 6 + pulse * 14 : 4 + pulse * 10) * iz;
      ctx.beginPath();
      ctx.arc(cx, cy, r2, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth   = 0.8;
      ctx.globalAlpha = (1 - pulse) * (boost ? 0.7 : 0.4);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Glow halo
    const haloR = boost ? 20 : (always ? 14 : 8);
    const grad  = ctx.createRadialGradient(cx, cy, 0, cx, cy, haloR);
    const rgb   = color === '#00f5ff' ? '0,245,255' : color === '#ff2d55' ? '255,45,85' : '191,95,255';
    grad.addColorStop(0, `rgba(${rgb},${boost ? 0.35 : 0.18})`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    ctx.beginPath();
    ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Dot
    ctx.beginPath();
    ctx.arc(cx, cy, (boost ? 5 : 3.5) * iz, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = boost ? 1 : 0.85;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, (boost ? 3 : 2) * iz, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.globalAlpha = 1;

    // Label (only when active or always:true)
    if (boost || always) {
      const lx = cx + 8 * iz, ly = cy - 18 * iz;
      ctx.strokeStyle = color;
      ctx.lineWidth   = 0.7 * iz;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 4 * iz);
      ctx.lineTo(cx, ly);
      ctx.lineTo(lx, ly);
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.font      = `bold ${(boost ? 9 : 8) * iz}px monospace`;
      ctx.fillStyle = color;
      ctx.globalAlpha = 1;
      ctx.fillText(name, lx + 2 * iz, ly + 4 * iz);

      ctx.font      = `${(boost ? 7.5 : 6.5) * iz}px monospace`;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.75;
      ctx.fillText(co, lx + 2 * iz, ly + 12 * iz);

      ctx.font      = `${6 * iz}px monospace`;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.5;
      ctx.fillText(period, lx + 2 * iz, ly + 20 * iz);
      ctx.globalAlpha = 1;
    }
  }

  function draw() {
    const W = canvas.width  = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, W, H);

    // Smooth zoom toward active city
    if (activeCity && CITIES[activeCity]) {
      const c = CITIES[activeCity];
      const [px, py] = proj(c.lon, c.lat, W, H);
      targetCx   = px;
      targetCy   = py;
      targetZoom = 2.4;
    } else {
      targetCx   = W / 2;
      targetCy   = H / 2;
      targetZoom = 1;
    }
    // Lerp zoom
    zoomCx  += (targetCx   - zoomCx)   * 0.06;
    zoomCy  += (targetCy   - zoomCy)   * 0.06;
    zoomLvl += (targetZoom - zoomLvl)  * 0.06;

    // Apply zoom transform
    ctx.save();
    ctx.translate(zoomCx, zoomCy);
    ctx.scale(zoomLvl, zoomLvl);
    ctx.translate(-zoomCx, -zoomCy);

    // Graticule
    ctx.lineWidth   = 0.4;
    ctx.strokeStyle = 'rgba(232,230,255,0.055)';
    for (let lat = -60; lat <= 90; lat += 30) {
      const [,y] = proj(0, lat, W, H);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    for (let lon = -150; lon <= 180; lon += 30) {
      const [x] = proj(lon, 0, W, H);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }

    // Continents
    LAND.forEach(ring => {
      ctx.beginPath();
      ring.forEach(([lon, lat], i) => {
        const [x, y] = proj(lon, lat, W, H);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle   = 'rgba(0,245,255,0.22)';
      ctx.strokeStyle = 'rgba(0,245,255,0.62)';
      ctx.lineWidth   = 1.0;
      ctx.fill();
      ctx.stroke();
    });

    // Journey arcs
    const cities = Object.values(CITIES);
    const t = (Date.now() % 4000) / 4000;
    const pairs = [
      [CITIES.pelotas, CITIES.sao_paulo, '#bf5fff'],
      [CITIES.sao_paulo, CITIES.perth,   '#ff2d55'],
    ];
    pairs.forEach(([a, b, color], pi) => {
      const [ax, ay] = proj(a.lon, a.lat, W, H);
      const [bx, by] = proj(b.lon, b.lat, W, H);
      const mx = (ax + bx) / 2;
      const my = Math.min(ay, by) - H * 0.12;
      ctx.beginPath();
      ctx.setLineDash([5, 7]);
      ctx.lineDashOffset = -((t + pi * 0.5) % 1) * 120;
      ctx.strokeStyle    = color;
      ctx.lineWidth      = 0.9;
      ctx.globalAlpha    = 0.45;
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo(mx, my, bx, by);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    });

    // Draw pins INSIDE the zoom transform so they move with the map
    Object.entries(CITIES).forEach(([key, city]) => {
      const [cx, cy] = proj(city.lon, city.lat, W, H);
      const boost = (key === 'perth') || (key === activeCity);
      // Pass current zoom so drawPin can compensate font/dot sizes
      drawPin(cx, cy, city, W, H, boost, zoomLvl);
    });

    ctx.restore(); // end zoom transform
  }

  function loop() { draw(); requestAnimationFrame(loop); }
  loop();
})();

/* ─── CONTACT VS CODE RAIN (left side only) ─── */
(function initCodeRain() {
  const canvas = document.getElementById('contact-matrix');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // VS Code syntax color palette
  const SYNTAX = {
    keyword:  '#ff2d55',    // const, function, return, export
    type:     '#00f5ff',    // Timeline, string types
    string:   '#39ff14',    // "values"
    comment:  '#555577',    // // comments
    prop:     '#bf5fff',    // property names
    number:   '#ff8c5a',    // numbers
    plain:    'rgba(232,230,255,0.55)', // default
  };

  // Realistic code lines with syntax info
  const LINES = [
    { text: 'const motion = new Timeline();',         color: SYNTAX.keyword },
    { text: '  fps: 60, quality: "4K",',              color: SYNTAX.prop },
    { text: 'render(timeline, settings);',             color: SYNTAX.type },
    { text: '// export for client delivery',           color: SYNTAX.comment },
    { text: 'export default Designer;',                color: SYNTAX.keyword },
    { text: 'transform: translateX(-50%);',            color: SYNTAX.prop },
    { text: 'animation: fadeIn 0.4s ease;',            color: SYNTAX.prop },
    { text: '"motion" | "brand" | "web"',              color: SYNTAX.string },
    { text: 'ffmpeg -i raw.mov -crf 18 out.mp4',       color: SYNTAX.plain },
    { text: 'const brand = { primary: "#00f5ff" };',   color: SYNTAX.number },
    { text: 'for (let f = 0; f < 300; f++) {',         color: SYNTAX.keyword },
    { text: '  ctx.fillStyle = accent;',               color: SYNTAX.prop },
    { text: '  drawFrame(timeline[f]);',               color: SYNTAX.type },
    { text: '}',                                        color: SYNTAX.plain },
    { text: 'git commit -m "v6.2 — ship it"',          color: SYNTAX.string },
    { text: 'npm run build:production',                 color: SYNTAX.plain },
    { text: '/* Motion · Brand · Web · AI */',          color: SYNTAX.comment },
    { text: 'resolve({ status: 200, ok: true });',      color: SYNTAX.keyword },
    { text: 'keyframes: [{ opacity: 0 }, { opacity: 1 }]', color: SYNTAX.prop },
    { text: 'bezierCurveTo(cp1x, cp1y, x, y);',        color: SYNTAX.type },
    { text: '// available for new projects — 2026',     color: SYNTAX.comment },
    { text: 'return <Portfolio projects={work} />;',    color: SYNTAX.keyword },
    { text: 'screen.width > 1440 ? "4K" : "HD"',       color: SYNTAX.number },
    { text: 'dispatch({ type: "PROJECT_COMPLETE" });',  color: SYNTAX.type },
  ];

  const FS = 11.5;
  const LINE_H = 20;
  const SPEED  = 0.35;
  const COL_W  = 380;
  let columns  = [];

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    // Only fill the LEFT HALF
    const halfW = canvas.width / 2;
    const n = Math.ceil(halfW / COL_W);
    columns = Array.from({ length: n }, (_, i) => ({
      x: i * COL_W + (Math.random() * 20 - 10),
      y: -(Math.random() * canvas.height * 1.5),
      lines: shuffle([...LINES]),
    }));
  }

  function shuffle(arr) { return arr.sort(() => Math.random() - 0.5); }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    columns.forEach(col => {
      col.y += SPEED;
      const totalH = col.lines.length * LINE_H;
      if (col.y > canvas.height + 40) {
        col.y = -totalH * 0.5;
        col.lines = shuffle([...LINES]);
      }

      col.lines.forEach((line, i) => {
        const y = col.y + i * LINE_H;
        if (y < -LINE_H || y > canvas.height + LINE_H) return;

        // Fade at top and bottom edges
        const norm  = y / canvas.height;
        const fade  = Math.max(0, Math.min(1, 1 - Math.abs(norm - 0.45) * 2.2));

        // Active line highlight
        const t      = Date.now() / 1800;
        const active = i === Math.floor((t + col.x * 0.01) % col.lines.length);
        const alpha  = active ? Math.min(fade * 1.5, 0.85) : fade * 0.48;

        ctx.font      = active ? `bold ${FS}px monospace` : `${FS}px monospace`;
        ctx.fillStyle = line.color;
        ctx.globalAlpha = alpha;
        ctx.fillText(line.text, col.x, y);
      });
      ctx.globalAlpha = 1;
    });
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  setInterval(draw, 40);
})();
