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

  // High-detail continent outlines (Natural Earth simplified)
  const LAND = [
    // ── North America ──
    [[-168,72],[-155,72],[-140,74],[-120,74],[-95,74],[-80,72],[-75,72],[-68,60],[-64,60],
     [-52,47],[-66,44],[-70,42],[-74,38],[-76,35],[-80,28],[-82,24],[-85,22],[-85,15],
     [-88,15],[-92,16],[-96,18],[-100,20],[-105,20],[-110,23],[-115,28],[-118,32],
     [-120,34],[-122,37],[-124,40],[-124,48],[-126,50],[-130,54],[-136,56],[-140,58],
     [-148,60],[-152,60],[-156,58],[-160,60],[-162,60],[-165,62],[-166,64],[-168,66],[-168,72]],
    // Alaska peninsula
    [[-156,58],[-152,56],[-148,56],[-146,58],[-148,60],[-152,60],[-156,58]],
    // Greenland
    [[-44,83],[-25,82],[-18,77],[-18,74],[-20,70],[-24,66],[-36,65],[-42,65],
     [-50,67],[-54,70],[-58,76],[-52,80],[-44,83]],
    // Central America
    [[-85,15],[-83,10],[-80,8],[-76,8],[-76,10],[-77,12],[-80,14],[-84,14],[-88,15],[-85,15]],
    // Cuba
    [[-85,23],[-82,23],[-79,22],[-75,20],[-73,20],[-74,22],[-78,22],[-82,24],[-85,23]],
    // ── South America ──
    [[-80,8],[-76,6],[-72,1],[-66,-2],[-52,-5],[-40,-5],[-36,-6],[-35,-10],
     [-38,-14],[-40,-18],[-40,-20],[-42,-22],[-44,-23],[-46,-24],[-48,-26],
     [-50,-28],[-52,-32],[-54,-34],[-56,-38],[-58,-40],[-62,-42],[-64,-45],
     [-66,-48],[-66,-52],[-68,-54],[-70,-55],[-73,-50],[-74,-44],[-72,-38],
     [-72,-34],[-72,-30],[-72,-22],[-76,-8],[-80,0],[-80,8]],
    // Falklands hint
    [[-59,-51],[-57,-51],[-57,-52],[-59,-52],[-59,-51]],
    // ── Europe ──
    [[-10,36],[-8,36],[-9,40],[-9,44],[-4,44],[-2,44],[-2,46],
     [2,44],[4,44],[6,44],[8,46],[10,44],[12,44],[14,44],[14,46],
     [16,48],[18,48],[20,46],[22,44],[24,44],[26,44],[28,44],[28,46],
     [30,60],[28,62],[26,64],[24,66],[22,68],[18,68],[14,69],[12,63],
     [8,58],[4,56],[0,52],[-2,50],[-4,48],[-6,46],[-5,44],[-10,36]],
    // Scandinavia (separate for detail)
    [[4,58],[6,57],[8,57],[10,56],[12,56],[12,58],[14,60],[14,63],
     [16,64],[18,66],[20,68],[24,70],[28,71],[30,70],[28,66],[26,64],
     [26,62],[28,60],[26,58],[22,58],[18,58],[14,58],[10,58],[8,58],[4,58]],
    // UK
    [[-2,50],[0,50],[2,51],[1,53],[0,54],[-2,54],[-3,56],[-4,57],
     [-5,58],[-6,57],[-5,56],[-4,54],[-4,52],[-2,50]],
    // Ireland
    [[-10,52],[-8,51],[-6,51],[-6,54],[-8,55],[-10,54],[-10,52]],
    // Iberia
    [[-8,36],[-8,38],[-9,40],[-9,44],[-6,44],[-2,44],[2,42],[3,40],[1,38],[0,38],[-2,36],[-4,36],[-8,36]],
    // Italy
    [[8,44],[12,44],[14,42],[16,40],[16,38],[15,38],[14,40],[12,38],[10,44],[8,44]],
    // ── Africa ──
    [[-18,16],[-16,12],[-14,10],[-12,8],[-8,4],[-2,4],[0,4],[2,4],[6,4],
     [8,4],[10,4],[12,4],[14,4],[16,4],[20,4],[22,4],[26,2],[30,0],[34,-2],
     [36,-4],[38,-6],[40,-8],[42,-10],[40,-14],[36,-18],[34,-20],[32,-22],
     [30,-24],[28,-28],[26,-32],[22,-34],[18,-34],[16,-32],[14,-28],[12,-24],
     [10,-18],[10,-14],[8,-6],[4,-2],[2,4],[0,8],[-2,8],[-4,10],[-8,10],
     [-12,8],[-16,12],[-18,16],[0,16],[4,16],[8,18],[12,20],[16,20],
     [20,20],[24,18],[28,18],[32,20],[36,18],[38,14],[40,12],[44,8],
     [42,12],[36,22],[32,30],[30,32],[32,36],[24,36],[10,36],[0,36],
     [-4,34],[-8,36],[-16,28],[-18,20],[-18,16]],
    // Madagascar
    [[44,-12],[46,-14],[50,-16],[50,-22],[48,-26],[44,-26],[44,-22],[44,-12]],
    // ── Middle East ──
    [[28,36],[32,36],[36,36],[38,36],[40,36],[42,38],[44,40],[46,38],
     [48,32],[50,28],[54,26],[56,24],[56,16],[52,12],[48,12],[44,12],
     [42,12],[38,14],[36,22],[34,30],[32,32],[28,36]],
    // ── Asia ──
    // Main body
    [[26,42],[28,44],[32,44],[36,42],[40,42],[44,42],[48,42],[52,42],
     [56,44],[60,44],[64,44],[68,44],[72,42],[76,44],[80,44],[84,44],
     [88,44],[92,44],[96,44],[100,48],[104,50],[108,52],[112,52],
     [116,52],[120,52],[124,52],[128,54],[132,56],[136,58],[140,60],
     [140,68],[130,70],[120,70],[100,74],[80,74],[60,70],[50,68],
     [40,68],[36,68],[30,66],[28,62],[26,60],[26,56],[26,50],[26,42]],
    // Asian South coast
    [[60,44],[64,42],[68,24],[72,24],[76,24],[80,28],[84,26],[88,24],
     [92,22],[96,20],[100,8],[104,2],[106,2],[108,4],[110,4],[112,4],
     [114,4],[116,6],[118,8],[120,16],[122,24],[124,28],[126,32],
     [128,36],[130,38],[132,36],[134,36],[136,38],[138,38],[140,40],
     [140,44],[136,42],[132,38],[128,36],[124,32],[122,24],[120,20],
     [116,16],[112,12],[108,8],[104,4],[100,8],[96,16],[92,22],[88,26],
     [84,28],[80,30],[76,24],[72,26],[68,26],[68,24],[62,22],[60,24],
     [58,24],[56,24],[56,28],[58,36],[60,40],[60,44]],
    // India
    [[68,24],[72,24],[76,24],[80,28],[86,24],[92,22],[88,18],[84,14],[80,10],[76,8],[72,10],[68,22],[68,24]],
    // Sri Lanka
    [[80,10],[82,8],[82,6],[80,6],[80,10]],
    // Indochina
    [[98,22],[102,22],[106,20],[108,18],[110,14],[108,10],[106,4],[104,2],[102,2],[100,4],[98,6],[98,10],[98,22]],
    // Japan Honshu
    [[130,32],[132,34],[134,34],[136,36],[138,36],[140,38],[140,40],[142,42],[142,44],[140,44],[138,42],[136,38],[134,36],[132,34],[130,32]],
    // Japan Kyushu
    [[130,32],[132,32],[132,30],[130,30],[130,32]],
    // Japan Hokkaido
    [[140,44],[142,44],[144,44],[145,44],[145,42],[143,42],[141,42],[140,44]],
    // Sumatra
    [[96,6],[100,4],[104,2],[106,2],[106,-2],[104,-4],[100,-4],[96,2],[96,6]],
    // Java
    [[106,-6],[108,-6],[110,-6],[112,-8],[114,-8],[108,-8],[106,-6]],
    // Borneo
    [[108,2],[110,4],[114,6],[118,6],[118,2],[116,0],[114,-2],[110,-4],[108,-2],[108,2]],
    // Sulawesi hint
    [[120,2],[122,2],[124,0],[122,-2],[120,0],[120,2]],
    // Philippines
    [[118,18],[120,18],[122,18],[124,16],[124,12],[122,10],[120,10],[118,12],[118,18]],
    // ── Australia (high detail) ──
    [[114,-22],[116,-20],[118,-20],[120,-18],[124,-16],[128,-14],[130,-12],
     [132,-12],[134,-12],[136,-12],[138,-14],[140,-16],[142,-18],[144,-18],
     [146,-20],[148,-20],[150,-22],[152,-24],[154,-26],[154,-28],[152,-30],
     [152,-32],[150,-34],[148,-36],[148,-38],[146,-38],[144,-38],[142,-38],
     [140,-36],[138,-36],[136,-34],[134,-32],[132,-32],[130,-32],[128,-32],
     [126,-34],[124,-34],[122,-34],[120,-34],[118,-34],[116,-34],[114,-32],
     [114,-28],[114,-24],[114,-22]],
    // Tasmania
    [[144,-40],[146,-40],[148,-40],[148,-42],[148,-44],[146,-44],[144,-44],[144,-40]],
    // NZ North Island
    [[172,-36],[174,-36],[176,-36],[178,-38],[178,-40],[176,-40],[174,-42],[172,-40],[172,-38],[172,-36]],
    // NZ South Island
    [[166,-44],[168,-44],[170,-44],[172,-44],[172,-46],[170,-46],[168,-46],[166,-46],[166,-44]],
    // ── Antarctica (hint) ──
    [[-180,-70],[0,-70],[180,-70],[180,-90],[-180,-90],[-180,-70]],
  ];

  // Cities
  const CITIES = {
    sao_paulo: { lon:-46.63, lat:-23.55, name:'SÃO PAULO', co:'Vati Group',              period:'2022 — 2025', color:'#ff2d55' },
    pelotas:   { lon:-52.34, lat:-31.77, name:'PELOTAS',   co:'Prodigious · Publicis',  period:'2020 — 2022', color:'#bf5fff' },
    perth:     { lon:115.86, lat:-31.95, name:'PERTH',     co:'Available for work',      period:'2025 — Now',  color:'#00f5ff', always:true },
  };

  // Which city is highlighted (null = none, 'perth' always on top)
  let activeCity = null;

  // Listen to timeline hover
  document.querySelectorAll('.tl-item[data-city]').forEach(item => {
    item.addEventListener('mouseenter', () => { activeCity = item.dataset.city; });
    item.addEventListener('mouseleave', () => { activeCity = null; });
  });

  function drawPin(cx, cy, city, W, H, boost) {
    const { color, name, co, period, always } = city;
    const t    = Date.now() / 500;
    const pulse = (Math.sin(t) * 0.5 + 0.5); // 0..1

    // For Perth or boosted cities, use full pulse; others static
    const isLive = always || boost;

    if (isLive) {
      // Outer ring
      const r1 = boost ? 10 + pulse * 26 : 6 + pulse * 18;
      ctx.beginPath();
      ctx.arc(cx, cy, r1, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth   = boost ? 1.5 : 1;
      ctx.globalAlpha = (1 - pulse) * (boost ? 0.9 : 0.6);
      ctx.stroke();
      // Inner ring
      const r2 = boost ? 6 + pulse * 14 : 4 + pulse * 10;
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
    ctx.arc(cx, cy, boost ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = boost ? 1 : 0.85;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, boost ? 3 : 2, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.globalAlpha = 1;

    // Label (only when active or always:true)
    if (boost || always) {
      const lx = cx + 8, ly = cy - 18;
      ctx.strokeStyle = color;
      ctx.lineWidth   = 0.7;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 4);
      ctx.lineTo(cx, ly);
      ctx.lineTo(lx, ly);
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.font      = `bold ${boost ? 9 : 8}px monospace`;
      ctx.fillStyle = color;
      ctx.globalAlpha = 1;
      ctx.fillText(name, lx + 2, ly + 4);

      ctx.font      = `${boost ? 7.5 : 6.5}px monospace`;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.75;
      ctx.fillText(co, lx + 2, ly + 12);

      ctx.font      = `6px monospace`;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.5;
      ctx.fillText(period, lx + 2, ly + 20);
      ctx.globalAlpha = 1;
    }
  }

  function draw() {
    const W = canvas.width  = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, W, H);

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
      ctx.fillStyle   = 'rgba(0,245,255,0.08)';
      ctx.strokeStyle = 'rgba(0,245,255,0.35)';
      ctx.lineWidth   = 0.7;
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

    // Draw pins — Perth always boosted, others boosted on hover
    Object.entries(CITIES).forEach(([key, city]) => {
      const [cx, cy] = proj(city.lon, city.lat, W, H);
      const boost = (key === 'perth') || (key === activeCity);
      drawPin(cx, cy, city, W, H, boost);
    });
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
