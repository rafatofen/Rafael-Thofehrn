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

  // Equirectangular: lon/lat → canvas x/y
  function proj(lon, lat, W, H) {
    return [(lon + 180) / 360 * W, (90 - lat) / 180 * H];
  }

  // Real-world continent outlines (simplified Natural Earth)
  const CONTINENTS = [
    // North America
    [[-168,72],[-140,74],[-95,74],[-75,72],[-65,60],[-52,47],[-66,44],[-70,42],[-75,35],[-80,25],[-85,15],[-92,15],[-100,20],[-110,23],[-118,32],[-122,37],[-124,48],[-130,54],[-140,58],[-152,60],[-160,60],[-165,62],[-168,66]],
    // Greenland
    [[-44,83],[-18,76],[-18,70],[-24,65],[-42,65],[-52,68],[-58,76],[-44,83]],
    // South America
    [[-80,8],[-76,8],[-67,1],[-50,-5],[-35,-5],[-38,-15],[-40,-20],[-44,-23],[-50,-28],[-53,-33],[-57,-38],[-62,-42],[-66,-50],[-68,-54],[-70,-55],[-75,-50],[-72,-35],[-72,-22],[-76,-5],[-80,0],[-80,8]],
    // Europe
    [[-10,36],[-9,44],[-2,46],[8,46],[12,44],[14,46],[16,48],[20,46],[22,44],[28,46],[30,60],[25,65],[20,68],[15,69],[10,63],[5,58],[0,51],[-5,48],[-5,44],[-10,36]],
    // Scandinavia
    [[5,58],[12,56],[10,63],[15,69],[20,70],[28,71],[30,70],[28,64],[22,60],[15,56],[10,57],[5,58]],
    // UK
    [[-6,50],[-2,50],[2,51],[0,53],[-3,56],[-5,58],[-6,57],[-5,54],[-6,50]],
    // Iberia
    [[-9,36],[-9,44],[-2,44],[3,42],[0,38],[-2,36],[-9,36]],
    // Africa
    [[-18,16],[-16,12],[-12,8],[-2,5],[8,4],[16,4],[22,4],[28,2],[34,0],[40,-4],[40,-10],[36,-18],[26,-34],[18,-34],[12,-24],[8,-2],[2,4],[-8,4],[-18,16],[0,16],[8,20],[24,20],[32,22],[36,18],[42,12],[36,22],[32,30],[32,36],[10,36],[-5,36],[-18,28],[-18,16]],
    // Middle East + Arabia
    [[28,36],[36,36],[44,40],[48,30],[56,24],[56,14],[44,12],[36,22],[34,30],[28,36]],
    // Asia North
    [[26,42],[36,36],[50,42],[70,44],[90,48],[110,54],[130,60],[140,60],[140,68],[100,74],[60,68],[40,68],[30,64],[26,62],[26,42]],
    // Asia South
    [[60,44],[80,44],[100,50],[120,56],[140,60],[140,50],[130,44],[122,32],[118,24],[100,8],[96,16],[92,22],[84,28],[68,24],[60,36],[60,44]],
    // India
    [[68,24],[80,28],[92,22],[88,18],[80,10],[72,10],[68,22],[68,24]],
    // Indochina
    [[98,22],[108,22],[110,18],[104,2],[100,2],[98,6],[98,22]],
    // Japan (main)
    [[130,32],[134,34],[138,36],[140,38],[142,44],[140,44],[136,36],[132,34],[130,32]],
    // Indonesia (Sumatra)
    [[96,6],[106,6],[106,-6],[98,-5],[96,2],[96,6]],
    // Borneo
    [[108,2],[118,6],[118,-2],[114,-4],[108,-2],[108,2]],
    // Australia ← key shape
    [[114,-22],[118,-20],[128,-14],[134,-12],[138,-14],[142,-20],[148,-20],[152,-24],[154,-28],[152,-32],[148,-38],[144,-38],[140,-36],[132,-32],[122,-34],[116,-34],[114,-30],[114,-22]],
    // Tasmania
    [[144,-40],[148,-40],[148,-44],[144,-44],[144,-40]],
    // NZ North
    [[172,-36],[178,-38],[178,-40],[174,-42],[172,-38],[172,-36]],
    // NZ South
    [[168,-44],[172,-44],[172,-46],[166,-46],[168,-44]],
    // Madagascar
    [[44,-12],[50,-14],[50,-24],[44,-26],[44,-12]],
  ];

  // Cities: [lon, lat, name, period, company, color, pulsing]
  const CITIES = [
    [-52.34, -31.77, 'PELOTAS',   'Dec 2020 — Oct 2022', 'Prodigious · Publicis',  '#bf5fff', false],
    [-46.63, -23.55, 'SÃO PAULO', 'Oct 2022 — Sep 2025', 'Vati Group',              '#ff2d55', false],
    [115.86, -31.95, 'PERTH',     '2025 — Present',       'Available for work',      '#00f5ff', true ],
  ];

  function draw() {
    const W = canvas.width  = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, W, H);

    // ── Graticule ──
    ctx.strokeStyle = 'rgba(232,230,255,0.06)';
    ctx.lineWidth = 0.5;
    for (let lat = -60; lat <= 90; lat += 30) {
      const [,y] = proj(0, lat, W, H);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    for (let lon = -180; lon <= 180; lon += 30) {
      const [x] = proj(lon, 0, W, H);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }

    // ── Continents ──
    CONTINENTS.forEach(ring => {
      ctx.beginPath();
      ring.forEach(([lon, lat], i) => {
        const [x, y] = proj(lon, lat, W, H);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle   = 'rgba(0,245,255,0.07)';
      ctx.strokeStyle = 'rgba(0,245,255,0.32)';
      ctx.lineWidth   = 0.8;
      ctx.fill();
      ctx.stroke();
    });

    // ── Journey connection lines ──
    const [x0, y0] = proj(CITIES[0][0], CITIES[0][1], W, H);
    const [x1, y1] = proj(CITIES[1][0], CITIES[1][1], W, H);
    const [x2, y2] = proj(CITIES[2][0], CITIES[2][1], W, H);

    const t = (Date.now() % 3000) / 3000;

    function drawArc(ax, ay, bx, by, color, offset) {
      const mx = (ax + bx) / 2;
      const my = Math.min(ay, by) - 40;
      ctx.beginPath();
      ctx.setLineDash([4, 6]);
      ctx.lineDashOffset = -((t + offset) % 1) * 100;
      ctx.strokeStyle = color;
      ctx.lineWidth   = 1;
      ctx.globalAlpha = 0.55;
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo(mx, my, bx, by);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    drawArc(x0, y0, x1, y1, '#bf5fff', 0);
    drawArc(x1, y1, x2, y2, '#ff2d55', 0.4);

    // ── City pins ──
    const pulse = Math.sin(Date.now() / 500) * 0.5 + 0.5; // 0..1

    CITIES.forEach(([lon, lat, name, period, company, color, pulsing]) => {
      const [cx, cy] = proj(lon, lat, W, H);

      // Pulse ring for current city
      if (pulsing) {
        const r = 6 + pulse * 18;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth   = 1;
        ctx.globalAlpha = (1 - pulse) * 0.7;
        ctx.stroke();
        ctx.globalAlpha = 1;

        const r2 = 4 + pulse * 10;
        ctx.beginPath();
        ctx.arc(cx, cy, r2, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth   = 0.8;
        ctx.globalAlpha = (1 - pulse) * 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Halo glow
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12);
      grad.addColorStop(0, color.replace(')', ',0.3)').replace('rgb', 'rgba'));
      grad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Leader line
      ctx.strokeStyle = color;
      ctx.lineWidth   = 0.7;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 4);
      ctx.lineTo(cx, cy - 18);
      ctx.lineTo(cx + 6, cy - 18);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Label text
      ctx.font         = 'bold 8px monospace';
      ctx.letterSpacing = '2px';
      ctx.fillStyle    = color;
      ctx.globalAlpha  = 0.95;
      ctx.fillText(name, cx + 8, cy - 14);

      ctx.font        = '6.5px monospace';
      ctx.fillStyle   = color;
      ctx.globalAlpha = 0.75;
      ctx.fillText(company, cx + 8, cy - 7);

      ctx.font        = '6px monospace';
      ctx.fillStyle   = color;
      ctx.globalAlpha = 0.5;
      ctx.fillText(period, cx + 8, cy - 0.5);

      ctx.globalAlpha = 1;
    });
  }

  function loop() { draw(); requestAnimationFrame(loop); }
  window.addEventListener('resize', () => {}, { passive: true });
  loop();
})();

/* ─── CONTACT CODE RAIN ─── */
(function initCodeRain() {
  const canvas = document.getElementById('contact-matrix');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Real code-like snippets — scrolling vertically in columns
  const SNIPPETS = [
    'const motion = new Timeline();',
    'render({ fps: 60, quality: "4K" });',
    'export default function Designer() {',
    'git commit -m "ship it"',
    'npm run build:production',
    'transform: translateX(-50%);',
    'animation: fadeIn 0.4s ease;',
    'return <Portfolio projects={work}/>',
    'ffmpeg -i input.mp4 -crf 18 out.mp4',
    'docker run -p 3000:3000 portfolio',
    'const brand = { color: "#00f5ff" };',
    'keyframes: { 0%: opacity:0, 100%: opacity:1 }',
    'for (let frame = 0; frame < 300; frame++)',
    'ctx.fillStyle = "rgba(0,245,255,0.8)";',
    'bezierCurveTo(cp1x, cp1y, cp2x, cp2y);',
    'viewport.width = screen.availWidth;',
    '.after-effects { blend-mode: screen; }',
    'resolve({ status: 200, delivered: true });',
    'const reel = await render(timeline, 4K);',
    'dispatch({ type: "PROJECT_COMPLETE" });',
  ];

  const COL_W  = 340;
  const SPEED  = 0.4;
  const FS     = 11;
  let cols = [];

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const n = Math.ceil(canvas.width / COL_W) + 1;
    cols = Array.from({ length: n }, (_, i) => ({
      x:      i * COL_W,
      y:      Math.random() * -canvas.height,
      lines:  shuffleSnippets(),
      li:     0,
    }));
  }

  function shuffleSnippets() {
    return [...SNIPPETS].sort(() => Math.random() - 0.5);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    cols.forEach(col => {
      col.y += SPEED;
      if (col.y > canvas.height + 20) {
        col.y = -canvas.height * 0.3;
        col.lines = shuffleSnippets();
      }

      col.lines.forEach((line, i) => {
        const y = col.y + i * (FS + 6);
        if (y < -20 || y > canvas.height + 20) return;

        // brightness based on vertical position
        const norm  = y / canvas.height;
        const alpha = Math.max(0, Math.min(0.55, 0.55 - Math.abs(norm - 0.5) * 0.8));

        // Highlight one "active" line per column
        const isActive = i === Math.floor(((Date.now() / 1200) + col.x) % col.lines.length);
        ctx.font      = isActive ? `bold ${FS}px monospace` : `${FS}px monospace`;
        ctx.fillStyle = isActive
          ? `rgba(0,245,255,${Math.min(alpha * 1.6, 0.7)})`
          : `rgba(0,245,255,${alpha})`;
        ctx.fillText(line, col.x, y);
      });
    });
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  setInterval(draw, 40);
})();
