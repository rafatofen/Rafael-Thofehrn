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
    [[24.0,36.0],[36.0,40.0],[80.0,40.0],[100.0,72.0],[112.0,88.0],[112.0,104.0],[120.0,112.0],[126.0,116.0],[126.0,120.0],[140.0,132.0],[150.0,140.0],[160.0,140.0],[168.0,144.0],[184.0,150.0],[190.0,160.0],[200.0,164.0],[204.0,164.0],[208.0,160.0],[196.0,160.0],[192.0,156.0],[184.0,148.0],[176.0,148.0],[172.0,148.0],[168.0,140.0],[160.0,136.0],[150.0,136.0],[140.0,128.0],[128.0,120.0],[124.0,124.0],[124.0,116.0],[120.0,104.0],[116.0,84.0],[112.0,80.0],[108.0,80.0],[104.0,76.0],[100.0,72.0],[96.0,68.0],[88.0,64.0],[80.0,60.0],[68.0,60.0],[64.0,60.0],[56.0,64.0],[56.0,60.0],[48.0,60.0],[40.0,64.0],[36.0,64.0],[32.0,60.0],[28.0,56.0],[24.0,48.0],[24.0,36.0]],
    // alaska
    [[24.0,72.0],[36.0,72.0],[44.0,72.0],[52.0,68.0],[56.0,68.0],[64.0,64.0],[80.0,60.0],[88.0,64.0],[96.0,68.0],[100.0,72.0],[96.0,72.0],[88.0,68.0],[80.0,64.0],[64.0,60.0],[56.0,60.0],[48.0,60.0],[40.0,64.0],[32.0,60.0],[28.0,56.0],[24.0,48.0],[24.0,72.0]],
    // greenland
    [[272.0,12.0],[308.0,12.0],[324.0,24.0],[324.0,28.0],[320.0,36.0],[316.0,40.0],[308.0,44.0],[296.0,48.0],[284.0,48.0],[272.0,48.0],[260.0,44.0],[248.0,36.0],[244.0,28.0],[248.0,20.0],[272.0,12.0]],
    // baffin_island
    [[224.0,32.0],[236.0,32.0],[236.0,36.0],[232.0,40.0],[224.0,40.0],[216.0,40.0],[208.0,36.0],[224.0,32.0]],
    // cuba
    [[190.0,136.0],[196.0,136.0],[204.0,136.0],[208.0,140.0],[212.0,140.0],[210.0,136.0],[204.0,136.0],[196.0,132.0],[190.0,136.0]],
    // central_am
    [[184.0,148.0],[190.0,160.0],[200.0,164.0],[204.0,164.0],[208.0,160.0],[196.0,160.0],[192.0,156.0],[184.0,148.0]],
    // sa_main
    [[200.0,164.0],[208.0,176.0],[216.0,184.0],[224.0,188.0],[240.0,188.0],[256.0,188.0],[272.0,184.0],[284.0,188.0],[288.0,192.0],[290.0,196.0],[288.0,200.0],[284.0,208.0],[280.0,216.0],[280.0,224.0],[276.0,224.0],[272.0,228.0],[268.0,228.0],[264.0,232.0],[260.0,240.0],[256.0,248.0],[252.0,256.0],[248.0,260.0],[240.0,264.0],[232.0,272.0],[228.0,280.0],[228.0,288.0],[224.0,288.0],[220.0,284.0],[216.0,272.0],[216.0,264.0],[216.0,252.0],[216.0,240.0],[216.0,224.0],[212.0,208.0],[208.0,196.0],[204.0,188.0],[200.0,180.0],[200.0,172.0],[200.0,164.0]],
    // falklands
    [[236.0,284.0],[244.0,284.0],[244.0,288.0],[236.0,284.0]],
    // europe
    [[340.0,108.0],[344.0,108.0],[344.0,104.0],[340.0,100.0],[344.0,96.0],[356.0,92.0],[356.0,88.0],[364.0,88.0],[364.0,84.0],[360.0,80.0],[364.0,76.0],[368.0,76.0],[368.0,72.0],[376.0,68.0],[376.0,64.0],[368.0,64.0],[368.0,68.0],[364.0,72.0],[360.0,72.0],[356.0,72.0],[356.0,68.0],[360.0,64.0],[360.0,60.0],[368.0,60.0],[368.0,56.0],[372.0,52.0],[368.0,52.0],[368.0,48.0],[372.0,44.0],[376.0,40.0],[376.0,36.0],[384.0,36.0],[388.0,40.0],[396.0,40.0],[400.0,40.0],[408.0,40.0],[416.0,40.0],[416.0,44.0],[412.0,52.0],[412.0,56.0],[416.0,60.0],[416.0,64.0],[408.0,68.0],[404.0,68.0],[400.0,68.0],[396.0,64.0],[392.0,64.0],[388.0,68.0],[388.0,72.0],[392.0,76.0],[396.0,80.0],[396.0,84.0],[392.0,88.0],[388.0,88.0],[388.0,92.0],[392.0,92.0],[396.0,96.0],[400.0,100.0],[400.0,104.0],[396.0,104.0],[392.0,104.0],[388.0,104.0],[384.0,104.0],[380.0,100.0],[384.0,96.0],[384.0,92.0],[380.0,92.0],[376.0,92.0],[372.0,92.0],[368.0,92.0],[364.0,92.0],[360.0,92.0],[356.0,92.0],[352.0,92.0],[352.0,96.0],[356.0,100.0],[356.0,104.0],[352.0,104.0],[348.0,104.0],[344.0,104.0],[344.0,108.0],[340.0,108.0]],
    // uk
    [[348.0,80.0],[352.0,80.0],[356.0,80.0],[360.0,80.0],[364.0,76.0],[360.0,72.0],[356.0,72.0],[352.0,76.0],[348.0,80.0]],
    // ireland
    [[340.0,76.0],[348.0,76.0],[348.0,72.0],[344.0,68.0],[340.0,72.0],[340.0,76.0]],
    // iceland
    [[312.0,52.0],[332.0,52.0],[336.0,48.0],[332.0,44.0],[320.0,44.0],[312.0,48.0],[312.0,52.0]],
    // iberia
    [[340.0,108.0],[344.0,108.0],[344.0,104.0],[344.0,96.0],[356.0,92.0],[356.0,92.0],[360.0,92.0],[364.0,92.0],[368.0,92.0],[368.0,96.0],[364.0,96.0],[364.0,100.0],[360.0,104.0],[356.0,108.0],[348.0,108.0],[344.0,108.0],[340.0,108.0]],
    // italy
    [[376.0,92.0],[380.0,92.0],[384.0,92.0],[388.0,92.0],[388.0,96.0],[392.0,100.0],[392.0,104.0],[388.0,104.0],[384.0,104.0],[380.0,100.0],[380.0,96.0],[376.0,92.0]],
    // norway_detail
    [[368.0,64.0],[376.0,64.0],[376.0,60.0],[380.0,60.0],[380.0,56.0],[384.0,56.0],[388.0,52.0],[392.0,48.0],[396.0,44.0],[400.0,40.0],[404.0,40.0],[408.0,40.0],[412.0,40.0],[416.0,40.0],[416.0,44.0],[412.0,48.0],[412.0,52.0],[408.0,56.0],[408.0,60.0],[404.0,64.0],[400.0,68.0],[396.0,68.0],[392.0,68.0],[388.0,68.0],[384.0,68.0],[380.0,68.0],[376.0,68.0],[372.0,68.0],[368.0,64.0]],
    // africa
    [[324.0,148.0],[328.0,152.0],[328.0,156.0],[332.0,160.0],[336.0,164.0],[344.0,172.0],[356.0,172.0],[360.0,172.0],[364.0,172.0],[368.0,172.0],[372.0,172.0],[376.0,176.0],[380.0,176.0],[384.0,176.0],[388.0,176.0],[392.0,176.0],[396.0,176.0],[400.0,180.0],[404.0,184.0],[408.0,188.0],[412.0,192.0],[416.0,196.0],[420.0,200.0],[424.0,204.0],[428.0,208.0],[432.0,212.0],[432.0,216.0],[428.0,224.0],[424.0,228.0],[420.0,236.0],[416.0,240.0],[416.0,244.0],[412.0,248.0],[408.0,248.0],[404.0,248.0],[400.0,248.0],[396.0,248.0],[392.0,244.0],[388.0,240.0],[384.0,232.0],[380.0,224.0],[380.0,216.0],[380.0,208.0],[380.0,200.0],[376.0,192.0],[368.0,184.0],[364.0,176.0],[360.0,172.0],[356.0,172.0],[352.0,164.0],[344.0,160.0],[336.0,160.0],[332.0,156.0],[328.0,152.0],[324.0,148.0],[360.0,148.0],[368.0,148.0],[376.0,144.0],[384.0,140.0],[392.0,140.0],[400.0,140.0],[408.0,140.0],[416.0,140.0],[424.0,140.0],[432.0,144.0],[436.0,152.0],[440.0,156.0],[444.0,156.0],[448.0,164.0],[444.0,156.0],[432.0,136.0],[428.0,124.0],[428.0,116.0],[424.0,108.0],[408.0,108.0],[380.0,108.0],[364.0,108.0],[356.0,108.0],[352.0,112.0],[344.0,108.0],[332.0,120.0],[324.0,140.0],[324.0,148.0]],
    // madagascar
    [[448.0,204.0],[452.0,208.0],[456.0,212.0],[460.0,216.0],[460.0,228.0],[456.0,232.0],[452.0,232.0],[448.0,228.0],[448.0,216.0],[448.0,204.0]],
    // middle_east
    [[416.0,108.0],[420.0,108.0],[424.0,108.0],[428.0,108.0],[432.0,108.0],[436.0,108.0],[440.0,104.0],[444.0,104.0],[448.0,100.0],[452.0,100.0],[452.0,104.0],[456.0,112.0],[460.0,120.0],[464.0,128.0],[468.0,132.0],[472.0,132.0],[472.0,136.0],[468.0,140.0],[464.0,144.0],[460.0,152.0],[456.0,156.0],[452.0,156.0],[448.0,156.0],[444.0,156.0],[440.0,152.0],[436.0,148.0],[432.0,140.0],[432.0,136.0],[428.0,124.0],[428.0,116.0],[424.0,112.0],[420.0,112.0],[416.0,108.0]],
    // arabian_pen
    [[432.0,136.0],[436.0,144.0],[440.0,152.0],[444.0,156.0],[448.0,156.0],[452.0,156.0],[456.0,156.0],[460.0,152.0],[464.0,144.0],[468.0,140.0],[472.0,136.0],[472.0,132.0],[476.0,136.0],[480.0,140.0],[480.0,144.0],[472.0,148.0],[468.0,152.0],[464.0,156.0],[460.0,156.0],[456.0,156.0],[448.0,152.0],[444.0,152.0],[436.0,152.0],[432.0,144.0],[432.0,136.0]],
    // russia_eu
    [[416.0,40.0],[424.0,40.0],[432.0,40.0],[440.0,44.0],[448.0,48.0],[452.0,52.0],[456.0,56.0],[460.0,60.0],[456.0,68.0],[452.0,76.0],[448.0,80.0],[444.0,84.0],[440.0,88.0],[436.0,92.0],[440.0,96.0],[444.0,96.0],[448.0,92.0],[452.0,92.0],[456.0,92.0],[460.0,92.0],[464.0,92.0],[468.0,92.0],[472.0,92.0],[476.0,92.0],[480.0,88.0],[480.0,72.0],[480.0,60.0],[480.0,52.0],[480.0,44.0],[476.0,40.0],[468.0,40.0],[460.0,40.0],[448.0,40.0],[440.0,40.0],[432.0,40.0],[424.0,40.0],[416.0,40.0]],
    // russia_asia
    [[480.0,72.0],[488.0,72.0],[496.0,72.0],[504.0,72.0],[512.0,72.0],[520.0,72.0],[528.0,72.0],[536.0,72.0],[544.0,72.0],[552.0,68.0],[560.0,64.0],[568.0,60.0],[576.0,56.0],[584.0,52.0],[592.0,48.0],[600.0,44.0],[608.0,40.0],[616.0,36.0],[620.0,36.0],[624.0,40.0],[632.0,40.0],[640.0,40.0],[648.0,44.0],[656.0,48.0],[664.0,56.0],[672.0,64.0],[680.0,72.0],[688.0,80.0],[696.0,72.0],[700.0,68.0],[696.0,64.0],[692.0,64.0],[688.0,68.0],[684.0,72.0],[680.0,72.0],[672.0,64.0],[664.0,64.0],[656.0,56.0],[648.0,52.0],[640.0,48.0],[632.0,44.0],[624.0,44.0],[616.0,40.0],[608.0,44.0],[600.0,48.0],[592.0,52.0],[584.0,56.0],[576.0,60.0],[568.0,64.0],[560.0,72.0],[552.0,76.0],[544.0,80.0],[536.0,84.0],[528.0,88.0],[520.0,88.0],[512.0,88.0],[504.0,88.0],[496.0,84.0],[488.0,76.0],[480.0,72.0]],
    // kazakhstan
    [[464.0,92.0],[472.0,92.0],[480.0,92.0],[488.0,92.0],[496.0,92.0],[504.0,96.0],[512.0,96.0],[520.0,92.0],[524.0,88.0],[528.0,88.0],[528.0,80.0],[520.0,80.0],[512.0,80.0],[504.0,80.0],[496.0,80.0],[488.0,80.0],[480.0,80.0],[472.0,80.0],[464.0,80.0],[460.0,84.0],[460.0,88.0],[464.0,92.0]],
    // china
    [[512.0,108.0],[520.0,108.0],[528.0,124.0],[536.0,132.0],[544.0,136.0],[552.0,140.0],[560.0,140.0],[568.0,140.0],[576.0,140.0],[580.0,140.0],[588.0,136.0],[592.0,132.0],[596.0,128.0],[600.0,124.0],[604.0,120.0],[604.0,116.0],[604.0,108.0],[600.0,100.0],[596.0,92.0],[592.0,92.0],[584.0,92.0],[576.0,92.0],[568.0,96.0],[560.0,96.0],[552.0,92.0],[544.0,92.0],[536.0,92.0],[528.0,92.0],[520.0,92.0],[512.0,92.0],[504.0,92.0],[504.0,100.0],[504.0,108.0],[512.0,108.0]],
    // india
    [[496.0,132.0],[500.0,132.0],[504.0,132.0],[508.0,132.0],[512.0,132.0],[520.0,124.0],[528.0,124.0],[536.0,132.0],[540.0,136.0],[544.0,136.0],[540.0,140.0],[536.0,144.0],[532.0,148.0],[528.0,152.0],[524.0,156.0],[520.0,160.0],[516.0,164.0],[512.0,164.0],[508.0,164.0],[504.0,160.0],[500.0,156.0],[496.0,136.0],[496.0,132.0]],
    // sri_lanka
    [[520.0,160.0],[524.0,164.0],[524.0,168.0],[520.0,168.0],[520.0,160.0]],
    // se_asia_main
    [[560.0,140.0],[568.0,140.0],[576.0,144.0],[580.0,148.0],[584.0,152.0],[580.0,160.0],[576.0,164.0],[572.0,172.0],[568.0,176.0],[564.0,176.0],[560.0,172.0],[560.0,164.0],[556.0,160.0],[556.0,152.0],[556.0,144.0],[560.0,140.0]],
    // malay_pen
    [[560.0,168.0],[564.0,172.0],[568.0,176.0],[564.0,176.0],[560.0,176.0],[560.0,172.0],[560.0,168.0]],
    // sumatra
    [[552.0,168.0],[556.0,172.0],[560.0,172.0],[564.0,172.0],[568.0,176.0],[572.0,180.0],[572.0,184.0],[568.0,188.0],[564.0,188.0],[560.0,188.0],[556.0,184.0],[552.0,180.0],[552.0,176.0],[552.0,168.0]],
    // java
    [[572.0,192.0],[576.0,192.0],[580.0,196.0],[584.0,196.0],[588.0,196.0],[580.0,196.0],[576.0,196.0],[572.0,192.0]],
    // borneo
    [[576.0,176.0],[580.0,172.0],[584.0,168.0],[588.0,168.0],[592.0,168.0],[596.0,168.0],[596.0,172.0],[596.0,176.0],[592.0,180.0],[588.0,184.0],[584.0,188.0],[580.0,188.0],[576.0,184.0],[576.0,176.0]],
    // sulawesi
    [[600.0,176.0],[604.0,180.0],[608.0,184.0],[604.0,184.0],[600.0,180.0],[600.0,176.0]],
    // new_guinea
    [[620.0,184.0],[624.0,188.0],[632.0,192.0],[640.0,192.0],[648.0,192.0],[656.0,192.0],[656.0,196.0],[648.0,196.0],[640.0,196.0],[632.0,196.0],[624.0,192.0],[616.0,188.0],[616.0,184.0],[620.0,184.0]],
    // philippines
    [[596.0,144.0],[600.0,144.0],[604.0,148.0],[608.0,152.0],[604.0,156.0],[600.0,160.0],[596.0,160.0],[596.0,156.0],[600.0,152.0],[596.0,148.0],[596.0,144.0]],
    // japan_honshu
    [[620.0,112.0],[624.0,112.0],[628.0,112.0],[632.0,108.0],[636.0,108.0],[640.0,104.0],[640.0,100.0],[644.0,100.0],[644.0,96.0],[640.0,96.0],[640.0,100.0],[636.0,100.0],[632.0,104.0],[628.0,108.0],[624.0,112.0],[620.0,112.0]],
    // japan_kyushu
    [[620.0,116.0],[624.0,116.0],[624.0,120.0],[620.0,120.0],[620.0,116.0]],
    // japan_hokkaido
    [[640.0,92.0],[644.0,92.0],[648.0,92.0],[648.0,96.0],[644.0,96.0],[640.0,96.0],[640.0,92.0]],
    // taiwan
    [[600.0,132.0],[604.0,136.0],[604.0,132.0],[600.0,132.0]],
    // korea
    [[612.0,112.0],[616.0,108.0],[616.0,104.0],[616.0,100.0],[612.0,100.0],[608.0,104.0],[608.0,108.0],[612.0,112.0]],
    // australia
    [[588.0,224.0],[592.0,220.0],[596.0,220.0],[600.0,216.0],[604.0,216.0],[608.0,212.0],[612.0,208.0],[616.0,208.0],[620.0,204.0],[624.0,204.0],[628.0,204.0],[632.0,204.0],[636.0,208.0],[640.0,212.0],[640.0,216.0],[644.0,216.0],[648.0,216.0],[652.0,220.0],[656.0,220.0],[660.0,224.0],[664.0,228.0],[668.0,232.0],[668.0,236.0],[664.0,240.0],[660.0,244.0],[660.0,248.0],[656.0,252.0],[656.0,256.0],[652.0,256.0],[648.0,256.0],[644.0,256.0],[640.0,252.0],[636.0,252.0],[632.0,248.0],[628.0,244.0],[624.0,244.0],[620.0,244.0],[616.0,244.0],[612.0,248.0],[608.0,248.0],[604.0,248.0],[600.0,248.0],[596.0,248.0],[592.0,248.0],[588.0,244.0],[588.0,236.0],[588.0,228.0],[588.0,224.0]],
    // tasmania
    [[648.0,260.0],[652.0,260.0],[656.0,260.0],[656.0,268.0],[652.0,268.0],[648.0,268.0],[648.0,260.0]],
    // nz_north
    [[708.0,256.0],[716.0,256.0],[716.0,260.0],[712.0,264.0],[708.0,260.0],[708.0,256.0]],
    // nz_south
    [[692.0,268.0],[700.0,268.0],[704.0,268.0],[704.0,272.0],[700.0,276.0],[696.0,272.0],[692.0,272.0],[692.0,268.0]]
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
