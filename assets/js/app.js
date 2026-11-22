/* ÁUREA · Mapa inmersivo de El Salvador
   Vanilla JS + GSAP + Pannellum. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const G = window.SV_GEO;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TOUCH = matchMedia('(hover: none)').matches || 'ontouchstart' in window;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };

  /* ---------- Projection (same as build script) ---------- */
  const LON0 = -90.45, LAT0 = 14.75, LON1 = -87.35;
  const COSL = Math.cos(13.7 * Math.PI / 180);
  const K = 1000 / ((LON1 - LON0) * COSL);
  const proj = (lat, lon) => [(lon - LON0) * COSL * K, (LAT0 - lat) * K];
  const fmtCoord = (lat, lon) => `${Math.abs(lat).toFixed(3)}° N · ${Math.abs(lon).toFixed(3)}° O`;

  /* ---------- Data ---------- */
  const P = 'assets/pano/';
  const PROPS = [
    {
      id: 'sonsonate', name: 'Villa Costa Azul', city: 'Sonsonate', dep: 'Sonsonate',
      loc: 'Los Cóbanos · Acajutla, Sonsonate', lat: 13.527, lon: -89.806,
      price: '$1,250,000', stem: 26,
      desc: 'Residencia frente al Pacífico entre palmeras, con acceso directo a la playa, piscina de borde infinito y paneles solares. A minutos del arrecife de Los Cóbanos.',
      specs: [['Área', '520 m²'], ['Terreno', '1 800 m²'], ['Hab.', '5'], ['Baños', '6']],
      video: 'assets/video/sonsonate.mp4', poster: 'assets/video/sonsonate.jpg',
      scenes: [
        ['terraza', 'Terraza al océano', 'illovo_beach_balcony', 150],
        ['suite', 'Suite principal', 'relax_inn_seaview_suite', 0],
        ['bano', 'Baño en suite', 'en_suite', 0],
      ],
    },
    {
      id: 'sansalvador', name: 'Residencia Escalón', city: 'San Salvador', dep: 'San Salvador',
      loc: 'Colonia Escalón, San Salvador', lat: 13.708, lon: -89.247,
      price: '$890,000', stem: 38,
      desc: 'Casa de piedra y jardín maduro en la zona más exclusiva de la capital. Piscina, terraza techada y rooftop con vista al volcán de San Salvador.',
      specs: [['Área', '610 m²'], ['Terreno', '1 150 m²'], ['Hab.', '4'], ['Baños', '5']],
      video: 'assets/video/sansalvador.mp4', poster: 'assets/video/sansalvador.jpg',
      scenes: [
        ['rooftop', 'Rooftop con vista', 'hotel_rooftop_balcony', 0],
        ['master', 'Master suite', 'hotel_room', 0],
        ['spa', 'Baño de autor', 'modern_bathroom', 0],
      ],
    },
    {
      id: 'santaana', name: 'Hacienda Ilamatepec', city: 'Santa Ana', dep: 'Santa Ana',
      loc: 'Faldas del volcán, Santa Ana', lat: 13.93, lon: -89.6,
      price: '$1,480,000', stem: 92,
      desc: 'Casa de campo en 4.5 manzanas de cafetal con vistas al volcán de Santa Ana. Corredores amplios, gran salón con chimenea y clima de altura todo el año.',
      specs: [['Área', '740 m²'], ['Terreno', '4.5 mz'], ['Hab.', '6'], ['Baños', '5']],
      video: 'assets/video/santaana.mp4', poster: 'assets/video/santaana.jpg',
      scenes: [
        ['corredor', 'Corredor al jardín', 'veranda', 180],
        ['salon', 'Gran salón', 'lythwood_lounge', 0],
        ['habitacion', 'Habitación principal', 'lythwood_room', 0],
      ],
    },
    {
      id: 'sanmiguel', name: 'Villa Chaparrastique', city: 'San Miguel', dep: 'San Miguel',
      loc: 'Ciudad Pacífica, San Miguel', lat: 13.462, lon: -88.162,
      price: '$760,000', stem: 38,
      desc: 'Villa tropical con piscina, jacuzzi y jardines de palmeras frente al volcán Chaparrastique. Deck panorámico, piscina climatizada y salón familiar.',
      specs: [['Área', '480 m²'], ['Terreno', '1 300 m²'], ['Hab.', '4'], ['Baños', '4']],
      video: 'assets/video/sanmiguel.mp4', poster: 'assets/video/sanmiguel.jpg',
      scenes: [
        ['deck', 'Deck panorámico', 'sundowner_deck', 0],
        ['piscina', 'Piscina climatizada', 'indoor_pool', 0],
        ['salon', 'Salón familiar', 'wooden_lounge', 0],
      ],
    },
  ];
  PROPS.forEach((p, i) => { p.i = i; [p.x, p.y] = proj(p.lat, p.lon); });

  /* ---------- Elements ---------- */
  const el = {
    body: document.body, loader: $('#loader'), bar: $('#loaderBar'), pct: $('#loaderPct'), msg: $('#loaderMsg'),
    ring: $('.ring-progress'), topbar: $('.topbar'), stage: $('#stage'), intro: $('.intro'), plist: $('#plist'),
    viewport: $('#mapViewport'), pan: $('#mapPan'), tilt: $('#mapTilt'), plane: $('#mapPlane'), svg: $('#mapSvg'), pins: $('#pins'),
    clouds: $('#clouds'), fog: $('#fog'), hud: $('#hud'), hudAlt: $('#hudAlt'), hudDest: $('#hudDest'), hudCoord: $('#hudCoord'),
    aerial: $('#aerial'), media: $('.aerial__media'), video: $('#aerialVideo'), pcard: $('#pcard'),
    tour: $('#tour'), pano: $('#pano'), scenes: $('#scenes'), tLoc: $('#tLoc'), tScene: $('#tScene'),
    tourLoading: $('#tourLoading'), tourHint: $('#tourHint'),
  };

  /* =========================================================
     MAP
     ========================================================= */
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };

  function buildMap() {
    const svg = el.svg;
    svg.setAttribute('viewBox', `0 0 ${G.w} ${G.h}`);
    const defs = mk('defs', {}, svg);
    const lg = mk('linearGradient', { id: 'landGrad', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    mk('stop', { offset: 0, 'stop-color': '#1e2b37' }, lg); mk('stop', { offset: 1, 'stop-color': '#131c25' }, lg);
    const lh = mk('linearGradient', { id: 'landGradHi', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    mk('stop', { offset: 0, 'stop-color': '#34485a' }, lh); mk('stop', { offset: 1, 'stop-color': '#1f2e3b' }, lh);
    const f1 = mk('filter', { id: 'blur', x: '-10%', y: '-10%', width: '120%', height: '130%' }, defs);
    mk('feGaussianBlur', { stdDeviation: 7 }, f1);
    const f2 = mk('filter', { id: 'blur2', x: '-10%', y: '-10%', width: '120%', height: '120%' }, defs);
    mk('feGaussianBlur', { stdDeviation: 3 }, f2);

    // graticule
    const gg = mk('g', {}, svg);
    for (let lon = -90; lon <= -87.5; lon += 0.5) {
      const [x] = proj(0, lon);
      mk('line', { class: 'grat', x1: x, y1: 0, x2: x, y2: G.h }, gg);
      const t = mk('text', { class: 'grat-l', x: x + 4, y: 12 }, gg); t.textContent = `${Math.abs(lon)}°O`;
    }
    for (let lat = 13; lat <= 14.5; lat += 0.5) {
      const [, y] = proj(lat, 0);
      mk('line', { class: 'grat', x1: 0, y1: y, x2: G.w, y2: y }, gg);
      const t = mk('text', { class: 'grat-l', x: 4, y: y - 4 }, gg); t.textContent = `${lat}°N`;
    }

    mk('path', { class: 'neighbors', d: G.neighbors }, svg);
    [['GUATEMALA', ...G.labels.gt], ['HONDURAS', ...G.labels.hn]].forEach(([t, x, y]) => {
      const n = mk('text', { class: 'country-l', x, y }, svg); n.textContent = t;
    });
    const oc = mk('text', { class: 'ocean-l', x: G.labels.pac[0], y: G.labels.pac[1] }, svg); oc.textContent = 'Océano Pacífico';

    mk('path', { class: 'shadow', d: G.outline, transform: 'translate(5 12)' }, svg);
    mk('path', { class: 'coast', d: G.outline }, svg);
    const dg = mk('g', {}, svg);
    G.deps.forEach((d) => mk('path', { class: 'dep', d: d.d, 'data-name': d.name }, dg));
    const outline = mk('path', { class: 'outline', d: G.outline }, svg);

    // lakes (approx.)
    [[13.865, -89.545, 6, 7], [13.672, -89.05, 15, 11], [14.23, -89.52, 8, 5]].forEach(([la, lo, rx, ry]) => {
      const [x, y] = proj(la, lo); mk('ellipse', { class: 'lake', cx: x, cy: y, rx, ry }, svg);
    });
    // volcanoes
    [['Ilamatepec', 13.853, -89.63], ['Izalco', 13.813, -89.633, 1], ['Quetzaltepec', 13.736, -89.294], ['Chichontepec', 13.61, -88.84], ['Chaparrastique', 13.434, -88.269]]
      .forEach(([n, la, lo, nolabel]) => {
        const [x, y] = proj(la, lo);
        const g = mk('g', { class: 'volc' }, svg);
        mk('path', { d: `M${x - 6},${y + 3}L${x},${y - 6}L${x + 6},${y + 3}Z` }, g);
        if (!nolabel) { const t = mk('text', { x, y: y + 13 }, g); t.textContent = n; }
      });

    // department labels (skip where a pin label would collide)
    const skip = new Set(['San Salvador', 'Sonsonate', 'San Miguel', 'Santa Ana', 'Cuscatlán']);
    G.deps.forEach((d) => {
      if (skip.has(d.name)) return;
      const t = mk('text', { class: 'dlabel', x: d.cx, y: d.cy }, svg); t.textContent = d.name;
    });
    return outline;
  }

  function buildPins() {
    PROPS.forEach((p) => {
      const pin = document.createElement('div');
      pin.className = 'pin';
      pin.dataset.id = p.id;
      pin.style.left = `${(p.x / G.w) * 100}%`;
      pin.style.top = `${(p.y / G.h) * 100}%`;
      pin.style.setProperty('--stem', `${p.stem}px`);
      pin.innerHTML = `
        <div class="pin__stand"><div class="pin__label"><b>${p.name}</b><small>${p.city} · ${p.price}</small></div><div class="pin__stem"></div></div>
        <span class="pin__dot"></span>
        <button aria-label="Volar a ${p.name}, ${p.city}"></button>`;
      el.pins.appendChild(pin);
      p.pin = pin;
      pin.addEventListener('click', () => fly(p));
      pin.addEventListener('pointerenter', () => highlight(p, true));
      pin.addEventListener('pointerleave', () => highlight(p, false));
    });

    PROPS.forEach((p) => {
      const li = document.createElement('li');
      li.innerHTML = `<button><span class="n">0${p.i + 1}</span><span class="t"><b>${p.name}</b><small>${p.city}</small></span><span class="p">${p.price}</span></button>`;
      const b = li.firstChild;
      b.addEventListener('click', () => fly(p));
      b.addEventListener('pointerenter', () => highlight(p, true));
      b.addEventListener('pointerleave', () => highlight(p, false));
      b.addEventListener('focus', () => highlight(p, true));
      b.addEventListener('blur', () => highlight(p, false));
      p.li = b;
      el.plist.appendChild(li);
    });

    const sel = $('#contactProp');
    PROPS.forEach((p) => { const o = document.createElement('option'); o.textContent = `${p.name} — ${p.city}`; sel.appendChild(o); });
  }

  function highlight(p, on) {
    p.pin.classList.toggle('active', on);
    p.li.classList.toggle('active', on);
    const dep = el.svg.querySelector(`.dep[data-name="${p.dep}"]`);
    if (dep) dep.classList.toggle('hl', on);
    if (on) Prefetch.prioritize(p);
  }

  /* ---------- Map camera state (applied every frame) ---------- */
  let baseTilt = 34;
  const cam = { x: 0, y: 0, s: 1, t: 34, op: 1 };
  const par = { x: 0, y: 0, tx: 0, ty: 0 };
  let view = 'loading'; // loading | map | flying | aerial | tour

  function readBaseTilt() {
    baseTilt = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tilt')) || 30;
  }

  function applyCam() {
    par.x += (par.tx - par.x) * 0.06;
    par.y += (par.ty - par.y) * 0.06;
    const t = cam.t + par.y;
    el.pan.style.transform = `translate3d(${cam.x}px,${cam.y}px,0)`;
    el.tilt.style.transform = `rotateX(${t}deg) rotateZ(${par.x}deg)`;
    el.plane.style.transform = `scale(${cam.s})`;
    el.viewport.style.setProperty('--tilt', `${t}deg`);
    el.viewport.style.opacity = cam.op;
  }

  window.addEventListener('pointermove', (e) => {
    if (view !== 'map' || TOUCH) return;
    par.tx = (e.clientX / innerWidth - 0.5) * 2.2;
    par.ty = (e.clientY / innerHeight - 0.5) * -3.5;
  });

  /* =========================================================
     CLOUDS (canvas 3D fly-through)
     ========================================================= */
  const Clouds = (() => {
    const cv = el.clouds, ctx = cv.getContext('2d');
    const imgs = [];
    const st = { density: 0, speed: 1.5 };
    const N = innerWidth < 700 ? 38 : 64;
    let W = 0, H = 0, parts = [], running = false;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = innerWidth; H = innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(p, far) {
      p.x = (Math.random() * 2 - 1) * 1.7;
      p.y = (Math.random() * 2 - 1) * 1.1;
      p.z = far ? 3.6 + Math.random() * 0.8 : 0.35 + Math.random() * 4;
      p.i = (Math.random() * 4) | 0;
      p.r = Math.random() * Math.PI * 2;
      p.s = 0.7 + Math.random() * 0.9;
      return p;
    }
    function load(srcs) { srcs.forEach((s) => { const im = new Image(); im.src = s; imgs.push(im); }); }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      if (st.density <= 0.001) return;
      parts.sort((a, b) => b.z - a.z);
      const M = Math.max(W, H);
      for (const p of parts) {
        const sc = 1 / p.z;
        const a = st.density * smooth(4.4, 3.0, p.z) * smooth(0.12, 0.55, p.z);
        if (a < 0.01) continue;
        const im = imgs[p.i]; if (!im || !im.complete) continue;
        const size = p.s * sc * M * 0.62;
        ctx.globalAlpha = Math.min(1, a);
        ctx.save();
        ctx.translate(W / 2 + p.x * sc * W * 0.38, H / 2 + p.y * sc * H * 0.38);
        ctx.rotate(p.r);
        ctx.drawImage(im, -size / 2, -size / 2, size, size);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
    let last = 0;
    function tick(now) {
      if (!running) return;
      const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      for (const p of parts) { p.z -= dt * st.speed; p.r += dt * 0.05; if (p.z < 0.12) spawn(p, true); }
      draw();
      requestAnimationFrame(tick);
    }
    return {
      st, load,
      init() { resize(); parts = Array.from({ length: N }, () => spawn({}, false)); window.addEventListener('resize', resize); },
      start() { if (running) return; running = true; last = 0; el.clouds.style.opacity = 1; requestAnimationFrame(tick); },
      stop() { running = false; ctx.clearRect(0, 0, W, H); el.clouds.style.opacity = 0; },
    };
  })();

  /* =========================================================
     PREFETCH (videos as blobs + panoramas)
     ========================================================= */
  const Prefetch = (() => {
    const conn = navigator.connection || {};
    const slow = !!conn.saveData || /(^|-)2g|3g/.test(conn.effectiveType || '');
    const queue = [];
    let busy = false, enabled = false;

    function loadImg(src) {
      return new Promise((res) => { const im = new Image(); im.decoding = 'async'; im.onload = im.onerror = () => res(); im.src = src; });
    }
    function video(p) {
      if (p.videoPromise) return p.videoPromise;
      p.videoPromise = fetch(p.video).then((r) => { if (!r.ok) throw 0; return r.blob(); })
        .then((b) => { p.videoURL = URL.createObjectURL(b); return p.videoURL; })
        .catch(() => { p.videoPromise = null; return p.video; });
      return p.videoPromise;
    }
    function panoTask(p, k) { return () => { const src = P + p.scenes[k][2] + '.jpg'; return (p.panoDone ||= {})[k] ? null : loadImg(src).then(() => { p.panoDone[k] = 1; }); }; }

    async function pump() {
      if (busy || !enabled) return;
      busy = true;
      while (queue.length) { const job = queue.shift(); try { await job(); } catch (e) { /* ignore */ } }
      busy = false;
    }
    function enqueue(p, front) {
      const jobs = [() => video(p), panoTask(p, 0)];
      if (front) queue.unshift(...jobs); else queue.push(...jobs);
    }
    return {
      start() {
        enabled = true;
        if (!slow) {
          PROPS.forEach((p) => enqueue(p));
          PROPS.forEach((p) => { queue.push(panoTask(p, 1), panoTask(p, 2)); });
        }
        pump();
      },
      prioritize(p) { if (!enabled) return; if (!p.videoURL) { enqueue(p, true); pump(); } },
      video,
      loadImg,
    };
  })();

  /* =========================================================
     LOADER
     ========================================================= */
  async function boot() {
    readBaseTilt();
    cam.t = baseTilt;
    const outline = buildMap();
    buildPins();
    Clouds.init();

    const cloudSrcs = [0, 1, 2, 3].map((i) => `assets/img/cloud${i}.webp`);
    Clouds.load(cloudSrcs);
    const imgs = [...cloudSrcs, ...PROPS.map((p) => p.poster), ...PROPS.flatMap((p) => p.scenes.map((s) => `${P}${s[2]}_thumb.jpg`))];
    const fontJobs = ['300 20px Cormorant', 'italic 400 20px Cormorant', '400 15px Manrope', '500 15px Manrope']
      .map((f) => (document.fonts ? document.fonts.load(f) : Promise.resolve()));
    const jobs = [...fontJobs, ...imgs.map((s) => Prefetch.loadImg(s))];
    const total = jobs.length;
    let done = 0;
    const shown = { v: 0 };
    const msgs = ['Trazando la cartografía', 'Formando las nubes', 'Preparando las residencias', 'Afinando los recorridos 360°'];
    const render = () => {
      const v = shown.v;
      el.pct.textContent = `${Math.round(v * 100)}%`;
      el.bar.style.transform = `scaleX(${v})`;
      el.ring.style.strokeDashoffset = 352 * (1 - v);
      el.msg.textContent = msgs[Math.min(msgs.length - 1, Math.floor(v * msgs.length))];
    };
    jobs.forEach((j) => j.finally(() => { done++; gsap.to(shown, { v: done / total, duration: 0.6, ease: 'power2.out', onUpdate: render, overwrite: true }); }));

    const minTime = sleep(RM ? 600 : 2600);
    await Promise.race([Promise.allSettled(jobs), sleep(12000)]);
    await minTime;
    await new Promise((r) => gsap.to(shown, { v: 1, duration: 0.5, onUpdate: render, onComplete: r, overwrite: true }));
    await sleep(350);

    gsap.ticker.add(applyCam);
    intro(outline);
    el.loader.classList.add('done');
    el.body.classList.remove('is-loading');
    setTimeout(() => { el.loader.remove(); }, 1200);
    Prefetch.start();
  }

  function intro(outline) {
    const len = outline.getTotalLength ? outline.getTotalLength() : 4000;
    outline.style.strokeDasharray = len;
    outline.style.strokeDashoffset = len;
    Object.assign(cam, { x: 0, y: 60, s: 0.86, t: baseTilt + 20, op: 0 });
    const d = RM ? 0.01 : 1;
    const tl = gsap.timeline({ onComplete: () => { view = 'map'; } });
    const C = { clearProps: 'opacity,transform' };
    tl.to(cam, { y: 0, s: 1, t: baseTilt, op: 1, duration: 2.2 * d, ease: 'power3.out' }, 0)
      .to(outline, { strokeDashoffset: 0, duration: 2.6 * d, ease: 'power2.inOut' }, 0.2)
      .from('.intro > *', { opacity: 0, y: 24, duration: 1.1 * d, stagger: 0.09, ease: 'power3.out', ...C }, 0.3)
      .from('.topbar', { opacity: 0, y: -12, duration: 1 * d, ...C }, 0.4)
      .from('.pin', { opacity: 0, y: -30, duration: 0.9 * d, stagger: 0.12, ease: 'back.out(1.6)', ...C }, 1.0)
      .from('.map-legend, .map-hint', { opacity: 0, duration: 1 * d, ...C }, 1.4);
  }

  /* =========================================================
     FLIGHT: map -> clouds -> aerial
     ========================================================= */
  let current = null;

  function waitVideo(v, ms) {
    return new Promise((res) => {
      if (v.readyState >= 3) return res();
      const done = () => { v.removeEventListener('canplay', done); v.removeEventListener('loadeddata', done); res(); };
      v.addEventListener('canplay', done); v.addEventListener('loadeddata', done);
      setTimeout(done, ms);
    });
  }

  async function prepareVideo(p) {
    let src = p.videoURL;
    if (!src) {
      const pr = Prefetch.video(p);
      src = await Promise.race([pr, sleep(3500).then(() => null)]) || p.video;
    }
    const v = el.video;
    v.poster = p.poster;
    if (v.dataset.src !== src) { v.src = src; v.dataset.src = src; v.load(); }
    await waitVideo(v, 6000);
  }

  function fillCard(p) {
    $('#pLoc').textContent = p.loc;
    $('#pName').textContent = p.name;
    $('#pDesc').textContent = p.desc;
    $('#pPrice').textContent = p.price;
    $('#pSpecs').innerHTML = p.specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    gsap.set('#pcard > *', { clearProps: 'opacity,transform' });
    $$('#pcard > *').forEach((n) => n.classList.add('reveal'));
  }

  function altCounter(from, to, dur, ease) {
    const o = { a: from };
    return gsap.to(o, { a: to, duration: dur, ease, onUpdate: () => { el.hudAlt.textContent = `${Math.round(o.a).toLocaleString('es-SV').replace(/,/g, ' ')} m`; } });
  }

  async function fly(p) {
    if (view !== 'map') return;
    view = 'flying';
    current = p;
    Prefetch.prioritize(p);
    const videoReady = prepareVideo(p);
    fillCard(p);

    el.hudDest.textContent = p.name;
    el.hudCoord.textContent = fmtCoord(p.lat, p.lon);
    el.stage.classList.add('flying');
    el.topbar.classList.add('hide');
    el.intro.classList.add('hide');
    PROPS.forEach((q) => q.pin.classList.toggle('target', q === p));
    el.pins.classList.add('fade');
    par.tx = par.ty = 0;

    // zoom origin at the pin (plane is untransformed at s=1, so changing origin is seamless)
    el.plane.style.transformOrigin = `${(p.x / G.w) * 100}% ${(p.y / G.h) * 100}%`;
    const r = p.pin.querySelector('.pin__dot').getBoundingClientRect();
    const dx = innerWidth / 2 - (r.left + r.width / 2);
    const dy = innerHeight / 2 - (r.top + r.height / 2);

    const D = RM ? 0.25 : 1;
    gsap.set(el.hud, { opacity: 0 });
    const tl = gsap.timeline();
    tl.to(cam, { x: dx, y: dy, duration: 1.6 * D, ease: 'power2.inOut' }, 0)
      .to(cam, { t: baseTilt * 0.25, duration: 2.4 * D, ease: 'power2.inOut' }, 0)
      .to(cam, { s: 16, duration: 2.8 * D, ease: 'power3.in' }, 0.25 * D)
      .to(el.hud, { opacity: 1, duration: 0.6 }, 0.5 * D)
      .add(altCounter(8500, 900, 2.8 * D, 'power2.in'), 0.2 * D)
      .add(() => { Clouds.st.density = 0; Clouds.st.speed = 1.6; Clouds.start(); }, 0.7 * D)
      .to(Clouds.st, { density: 1, duration: 1.8 * D, ease: 'power1.in' }, 0.7 * D)
      .to(Clouds.st, { speed: 3.2, duration: 2 * D, ease: 'power2.in' }, 0.9 * D)
      .to(el.fog, { opacity: 0.94, duration: 0.9 * D, ease: 'power2.in' }, 2.2 * D);
    await tl;
    await videoReady;

    // swap to aerial view behind the fog
    el.stage.style.visibility = 'hidden';
    el.aerial.hidden = false;
    gsap.set(el.media, { scale: 1.45, filter: 'blur(6px) brightness(1.15)' });
    el.video.currentTime = 0;
    el.video.play().catch(() => {});

    const tl2 = gsap.timeline();
    tl2.to(el.fog, { opacity: 0, duration: 1.4 * D, ease: 'power2.out' }, 0)
      .to(Clouds.st, { density: 0, duration: 2 * D, ease: 'power2.out' }, 0.1)
      .to(Clouds.st, { speed: 1, duration: 2 * D }, 0)
      .to(el.media, { scale: 1, filter: 'blur(0px) brightness(1)', duration: 3 * D, ease: 'power3.out' }, 0)
      .add(altCounter(900, 120, 2.4 * D, 'power3.out'), 0)
      .to(el.hud, { opacity: 0, duration: 0.6 }, 2.2 * D)
      .to('#pcard .reveal', { opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: 'power3.out' }, 1.2 * D)
      .from('#aerial .back, .aerial__badge', { opacity: 0, duration: 0.8, clearProps: 'opacity' }, 1.4 * D);
    await tl2;
    Clouds.stop();
    view = 'aerial';
    $('#enterHouse').focus({ preventScroll: true });
  }

  /* ---------- back to map ---------- */
  async function backToMap() {
    if (view !== 'aerial') return;
    view = 'flying';
    const D = RM ? 0.3 : 1;
    Clouds.st.density = 0; Clouds.st.speed = 2.4; Clouds.start();
    const tl = gsap.timeline();
    tl.to(Clouds.st, { density: 1, duration: 0.8 * D }, 0)
      .to(el.fog, { opacity: 0.9, duration: 0.8 * D, ease: 'power2.in' }, 0.1)
      .to('#pcard .reveal', { opacity: 0, y: 12, duration: 0.4 }, 0)
      .to(el.media, { scale: 1.3, duration: 0.9 * D, ease: 'power2.in' }, 0);
    await tl;
    el.video.pause();
    el.aerial.hidden = true;
    gsap.set(el.media, { clearProps: 'all' });
    el.stage.style.visibility = '';
    readBaseTilt();
    Object.assign(cam, { s: 5, t: baseTilt * 0.4 });
    el.pins.classList.remove('fade');
    PROPS.forEach((q) => q.pin.classList.remove('target', 'active'));
    const tl2 = gsap.timeline();
    tl2.to(el.fog, { opacity: 0, duration: 1 * D }, 0)
      .to(Clouds.st, { density: 0, duration: 1.4 * D }, 0)
      .to(cam, { s: 1, x: 0, y: 0, t: baseTilt, duration: 2.2 * D, ease: 'power3.out' }, 0)
      .add(() => { el.topbar.classList.remove('hide'); el.intro.classList.remove('hide'); el.stage.classList.remove('flying'); }, 0.9 * D);
    await tl2;
    Clouds.stop();
    el.plane.style.transformOrigin = '50% 50%';
    view = 'map';
  }

  /* =========================================================
     360 TOUR
     ========================================================= */
  let viewer = null;
  let hintTimer = 0;

  function buildViewer(p) {
    const scenes = {};
    p.scenes.forEach(([id, title, file, yaw]) => {
      scenes[id] = { title, type: 'equirectangular', panorama: P + file + '.jpg', yaw, pitch: 0, hfov: 120 };
    });
    viewer = pannellum.viewer(el.pano, {
      default: {
        firstScene: p.scenes[0][0], sceneFadeDuration: 1100, autoLoad: true,
        autoRotate: RM ? 0 : -1.4, autoRotateInactivityDelay: 5000,
        showControls: false, compass: false, mouseZoom: true, keyboardZoom: true,
        hfov: 120, minHfov: 45, maxHfov: 120, friction: 0.12, touchPanSpeedCoeffFactor: 1,
        strings: { loadingLabel: 'Cargando…' },
      },
      scenes,
    });
    viewer.on('scenechange', (id) => { setScene(p, id); el.tourLoading.classList.add('on'); });
    viewer.on('load', () => { el.tourLoading.classList.remove('on'); });
    viewer.on('error', () => { el.tourLoading.classList.remove('on'); });
    viewer.on('mousedown', hideHint);
    viewer.on('touchstart', hideHint);

    el.scenes.innerHTML = '';
    p.scenes.forEach(([id, title, file]) => {
      const b = document.createElement('button');
      b.className = 'scene-btn'; b.dataset.id = id;
      b.innerHTML = `<img src="${P}${file}_thumb.jpg" alt="" loading="lazy"><span>${title}</span>`;
      b.addEventListener('click', () => { if (viewer.getScene() !== id) viewer.loadScene(id); });
      el.scenes.appendChild(b);
    });
    setScene(p, p.scenes[0][0]);
    $('#rotateBtn').setAttribute('aria-pressed', RM ? 'false' : 'true');
  }

  function setScene(p, id) {
    const s = p.scenes.find((x) => x[0] === id);
    el.tScene.textContent = s ? s[1] : '';
    $$('.scene-btn', el.scenes).forEach((b) => b.classList.toggle('active', b.dataset.id === id));
  }

  function hideHint() { el.tourHint.classList.add('gone'); clearTimeout(hintTimer); }

  function viewerLoaded(ms) {
    return new Promise((res) => {
      let ok = false;
      const done = () => { if (!ok) { ok = true; res(); } };
      try { if (viewer.isLoaded && viewer.isLoaded()) return done(); viewer.on('load', done); viewer.on('error', done); } catch (e) { done(); }
      setTimeout(done, ms);
    });
  }

  async function waitPannellum() {
    for (let i = 0; i < 100 && !window.pannellum; i++) await sleep(50);
  }

  async function enterHouse() {
    if (view !== 'aerial' || !current) return;
    view = 'flying';
    const p = current;
    const D = RM ? 0.3 : 1;
    el.tLoc.textContent = `${p.name} · ${p.city}`;
    const tl = gsap.timeline();
    tl.to('#pcard .reveal, #aerial .back, .aerial__badge', { opacity: 0, y: 10, duration: 0.5, stagger: 0.03 }, 0)
      .to(el.media, { scale: 2.8, filter: 'blur(14px) brightness(1.5)', duration: 1.8 * D, ease: 'power3.in' }, 0)
      .to(el.fog, { opacity: 1, duration: 0.8 * D, ease: 'power2.in' }, 1.1 * D);

    await waitPannellum();
    el.tour.hidden = false;
    el.tour.style.visibility = 'hidden';
    el.tourHint.classList.remove('gone');
    buildViewer(p);
    await tl;
    await viewerLoaded(10000);

    el.video.pause();
    el.aerial.hidden = true;
    el.tour.style.visibility = '';
    try { viewer.resize && viewer.resize(); } catch (e) { /* noop */ }
    gsap.set('#pcard .reveal, #aerial .back, .aerial__badge', { clearProps: 'opacity,transform' });
    $$('#pcard > *').forEach((n) => n.classList.remove('reveal'));
    gsap.set(el.media, { clearProps: 'all' });

    const tl2 = gsap.timeline();
    tl2.to(el.fog, { opacity: 0, duration: 1.4 * D, ease: 'power2.out' }, 0)
      .add(() => { try { viewer.setHfov(TOUCH ? 100 : 92, 2600); } catch (e) { /* noop */ } }, 0.1)
      .from('.tour__top, .scenes', { opacity: 0, y: (i) => (i ? 20 : -20), duration: 0.9, ease: 'power3.out', clearProps: 'opacity,transform' }, 0.6);
    hintTimer = setTimeout(hideHint, 6000);
    await tl2;
    view = 'tour';
  }

  async function exitTour() {
    if (view !== 'tour') return;
    view = 'flying';
    const D = RM ? 0.3 : 1;
    await gsap.to(el.fog, { opacity: 1, duration: 0.6 * D, ease: 'power2.in' });
    try { viewer.destroy(); } catch (e) { /* noop */ }
    viewer = null;
    el.pano.innerHTML = '';
    el.tour.hidden = true;
    el.aerial.hidden = false;
    $$('#pcard > *').forEach((n) => n.classList.remove('reveal'));
    gsap.set('#pcard > *', { opacity: 1, y: 0 });
    gsap.set(el.media, { scale: 1.6, filter: 'blur(8px) brightness(1.3)' });
    el.video.play().catch(() => {});
    const tl = gsap.timeline();
    tl.to(el.fog, { opacity: 0, duration: 1.2 * D }, 0)
      .to(el.media, { scale: 1, filter: 'blur(0px) brightness(1)', duration: 1.8 * D, ease: 'power3.out' }, 0)
      .from('#pcard > *', { opacity: 0, y: 14, duration: 0.8, stagger: 0.06 }, 0.5 * D);
    await tl;
    $$('#pcard > *').forEach((n) => n.classList.add('reveal'));
    gsap.set('#pcard .reveal', { opacity: 1, y: 0 });
    view = 'aerial';
  }

  /* ---------- tour tools ---------- */
  const fsOK = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
  if (!fsOK) $('#fsBtn').hidden = true;
  $('#fsBtn').addEventListener('click', () => {
    const d = document;
    if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else (d.documentElement.requestFullscreen || d.documentElement.webkitRequestFullscreen).call(d.documentElement);
  });
  $('#rotateBtn').addEventListener('click', (e) => {
    if (!viewer) return;
    const on = e.currentTarget.getAttribute('aria-pressed') === 'true';
    if (on) viewer.stopAutoRotate(); else viewer.startAutoRotate(-1.4);
    e.currentTarget.setAttribute('aria-pressed', on ? 'false' : 'true');
  });
  if (TOUCH && 'DeviceOrientationEvent' in window) {
    const g = $('#gyroBtn');
    g.hidden = false;
    g.addEventListener('click', async () => {
      if (!viewer) return;
      try {
        if (viewer.isOrientationActive()) { viewer.stopOrientation(); g.setAttribute('aria-pressed', 'false'); return; }
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          const r = await DeviceOrientationEvent.requestPermission(); if (r !== 'granted') return;
        }
        viewer.startOrientation(); g.setAttribute('aria-pressed', 'true'); hideHint();
      } catch (err) { /* unsupported */ }
    });
  }

  /* =========================================================
     UI wiring
     ========================================================= */
  $('#backToMap').addEventListener('click', backToMap);
  $('#enterHouse').addEventListener('click', enterHouse);
  $('#exitTour').addEventListener('click', exitTour);
  $$('[data-home]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); if (view === 'aerial') backToMap(); }));

  let lastFocus = null;
  function openModal(name) {
    const m = $(`#modal-${name}`); if (!m) return;
    lastFocus = document.activeElement;
    if (name === 'contact' && current) { const s = $('#contactProp'); s.selectedIndex = current.i; }
    m.hidden = false;
    const f = m.querySelector('input,select,button.btn'); (f || m.querySelector('.modal__x')).focus();
  }
  function closeModals() { $$('.modal').forEach((m) => (m.hidden = true)); if (lastFocus) lastFocus.focus({ preventScroll: true }); }
  $$('[data-open]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); openModal(b.dataset.open); }));
  $$('.modal').forEach((m) => m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) closeModals(); }));

  $('#contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.currentTarget; let ok = true;
    $$('input[required]', f).forEach((i) => { const bad = !i.value.trim(); i.classList.toggle('err', bad); if (bad) ok = false; });
    if (!ok) return;
    $('.form-ok', f).hidden = false;
    $('button[type=submit]', f).disabled = true;
    setTimeout(() => { closeModals(); f.reset(); $('.form-ok', f).hidden = true; $('button[type=submit]', f).disabled = false; }, 2600);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if ($$('.modal').some((m) => !m.hidden)) return closeModals();
    if (view === 'tour') exitTour(); else if (view === 'aerial') backToMap();
  });

  window.addEventListener('resize', () => { if (view === 'map') readBaseTilt(), (cam.t = baseTilt); });
  document.addEventListener('visibilitychange', () => {
    if (view !== 'aerial') return;
    if (document.hidden) el.video.pause(); else el.video.play().catch(() => {});
  });

  boot();
})();
