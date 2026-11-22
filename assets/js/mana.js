/* MANÁ Bienes Raíces — mapa por departamentos, vuelo, dron y tour 360°. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const G = window.SV_GEO;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TOUCH = matchMedia('(hover: none)').matches;
  const MOBILE = () => innerWidth <= 820;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const WA = '50372108846';
  const waLink = (msg) => `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
  const icon = (id) => `<svg><use href="#i-${id}"/></svg>`;

  /* ---------- Data (demo) ---------- */
  const P = 'assets/pano/';
  const PROPS = [
    { id: 'escalon', dep: 'san-salvador', name: 'Residencia Escalón', type: 'Casa', zone: 'Colonia Escalón, San Salvador',
      lat: 13.7065, lon: -89.2445, price: '$485,000', beds: 4, baths: 5, area: '610 m²', land: '1,150 m²', video: 'sansalvador',
      desc: 'Casa de piedra con jardín, piscina y rooftop con vista al volcán de San Salvador, en la zona más exclusiva de la capital.',
      scenes: [['rooftop', 'Rooftop con vista', 'hotel_rooftop_balcony', 0], ['master', 'Habitación principal', 'hotel_room', 0], ['bano', 'Baño principal', 'modern_bathroom', 0]] },
    { id: 'ilopango', dep: 'san-salvador', name: 'Casa del Lago', type: 'Casa', zone: 'Ilopango, San Salvador',
      lat: 13.674, lon: -89.085, price: '$365,000', beds: 3, baths: 3, area: '380 m²', land: '900 m²', video: 'sanbenito',
      desc: 'Casa de descanso con piscina, pérgola y rancho techado, a minutos del lago de Ilopango.',
      scenes: [['rancho', 'Rancho y piscina', 'lapa', 0], ['sala', 'Sala principal', 'lebombo', 0], ['bano', 'Baño', 'bathroom', 0]] },
    { id: 'cobanos', dep: 'sonsonate', name: 'Villa Costa Azul', type: 'Casa de playa', zone: 'Los Cóbanos, Acajutla',
      lat: 13.527, lon: -89.806, price: '$395,000', beds: 5, baths: 6, area: '520 m²', land: '1,800 m²', video: 'sonsonate',
      desc: 'Frente al mar entre palmeras, con piscina de borde infinito, paneles solares y acceso directo a la playa.',
      scenes: [['terraza', 'Terraza al océano', 'illovo_beach_balcony', 150], ['suite', 'Suite principal', 'relax_inn_seaview_suite', 0], ['bano', 'Baño en suite', 'en_suite', 0]] },
    { id: 'acajutla', dep: 'sonsonate', name: 'Casa Bahía', type: 'Casa de playa', zone: 'Acajutla, Sonsonate',
      lat: 13.600, lon: -89.830, price: '$275,000', beds: 3, baths: 3, area: '290 m²', land: '1,100 m²', video: 'metalio',
      desc: 'Casa con piscina y jardín a pocos pasos de la playa, ideal para vivir o para renta vacacional.',
      scenes: [['deck', 'Deck techado', 'sundowner_deck', 0], ['entrada', 'Vestíbulo', 'entrance_hall', 0], ['jardin', 'Jardín', 'lythwood_terrace', 0]] },
    { id: 'zonte', dep: 'la-libertad', name: 'Casa de playa El Zonte', type: 'Casa de playa', zone: 'El Zonte, Chiltiupán',
      lat: 13.505, lon: -89.440, price: '$340,000', beds: 3, baths: 2, area: '260 m²', land: '700 m²', video: 'elzonte',
      desc: 'En la costa de Surf City, rodeada de palmeras y con vista al Pacífico desde la sala y el balcón.',
      scenes: [['sala', 'Sala con vista al mar', 'cayley_interior', 0], ['cocina', 'Cocina y comedor', 'kiara_interior', 0], ['balcon', 'Balcón', 'balcony', 0]] },
    { id: 'ilamatepec', dep: 'santa-ana', name: 'Hacienda Ilamatepec', type: 'Casa de campo', zone: 'Faldas del volcán, Santa Ana',
      lat: 13.90, lon: -89.60, price: '$560,000', beds: 6, baths: 5, area: '740 m²', land: '4.5 mz', video: 'santaana',
      desc: 'Casa de campo en 4.5 manzanas de cafetal con vista al volcán de Santa Ana y clima fresco todo el año.',
      scenes: [['corredor', 'Corredor al jardín', 'veranda', 180], ['salon', 'Gran salón', 'lythwood_lounge', 0], ['habitacion', 'Habitación principal', 'lythwood_room', 0]] },
    { id: 'chaparrastique', dep: 'san-miguel', name: 'Villa Chaparrastique', type: 'Casa', zone: 'Ciudad Pacífica, San Miguel',
      lat: 13.462, lon: -88.162, price: '$210,000', beds: 4, baths: 3, area: '420 m²', land: '800 m²', video: 'sanmiguel',
      desc: 'Villa tropical con piscina y jardines frente al volcán Chaparrastique, en residencial con seguridad.',
      scenes: [['fachada', 'Fachada y jardín', 'bloem_olive_house', 0], ['piscina', 'Piscina techada', 'indoor_pool', 0], ['sala', 'Sala familiar', 'wooden_lounge', 0]] },
  ];
  PROPS.forEach((p) => { p.poster = `assets/video/${p.video}.jpg`; p.src = `assets/video/${p.video}.mp4`; });
  const DEPS = G.deps.map((d) => ({ ...d, props: PROPS.filter((p) => p.dep === d.id) }));
  const depById = (id) => DEPS.find((d) => d.id === id);

  const el = {
    body: document.body, loader: $('#loader'), bar: $('#loaderBar'), pct: $('#loaderPct'), msg: $('#loaderMsg'),
    topbar: $('#topbar'), country: $('#country'), svg: $('#svgMap'), tip: $('#maptip'), deplist: $('#deplist'), stats: $('#stats'),
    dept: $('#dept'), sidebar: $('#sidebar'), cards: $('#cards'), deptTitle: $('#deptTitle'), deptCount: $('#deptCount'),
    clouds: $('#clouds'), fog: $('#fog'), hud: $('#hud'), hudAlt: $('#hudAlt'), hudDest: $('#hudDest'),
    aerial: $('#aerial'), media: $('.aerial__media'), video: $('#aerialVideo'),
    tour: $('#tour'), pano: $('#pano'), scenes: $('#scenes'), tLoc: $('#tLoc'), tScene: $('#tScene'), tourLoading: $('#tourLoading'), tourHint: $('#tourHint'),
  };
  let view = 'loading'; // country | dept | flying | aerial | tour
  let curDep = null, curProp = null;

  /* =========================================================
     COUNTRY SVG MAP
     ========================================================= */
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent && parent.appendChild(n); return n; };
  const FULL = () => (MOBILE() ? [40, 110, 940, 470] : [0, 0, G.w, G.h]);

  function buildCountry() {
    const s = el.svg;
    s.setAttribute('viewBox', FULL().join(' '));
    mk('path', { class: 'neighbors', d: G.neighbors }, s);
    [['GUATEMALA', ...G.labels.gt], ['HONDURAS', ...G.labels.hn]].forEach(([t, x, y]) => { mk('text', { class: 'country-l', x, y }, s).textContent = t; });
    mk('text', { class: 'ocean-l', x: G.labels.pac[0], y: G.labels.pac[1] }, s).textContent = 'Océano Pacífico';
    mk('path', { class: 'shadow', d: G.outline, transform: 'translate(4 8)' }, s);
    const g = mk('g', {}, s);
    DEPS.forEach((d) => {
      const path = mk('path', { class: 'dep' + (d.props.length ? ' has' : ''), d: d.d, tabindex: 0, role: 'button',
        'aria-label': `${d.name}: ${d.props.length ? d.props.length + ' propiedades' : 'sin propiedades publicadas'}` }, g);
      d.path = path;
      path.addEventListener('click', () => enterDept(d));
      path.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enterDept(d); } });
      path.addEventListener('pointerenter', (e) => showTip(d, e));
      path.addEventListener('pointermove', (e) => moveTip(e));
      path.addEventListener('pointerleave', hideTip);
      path.addEventListener('focus', () => hl(d, true));
      path.addEventListener('blur', () => hl(d, false));
    });
    mk('path', { class: 'outline', d: G.outline }, s);
    DEPS.forEach((d) => {
      const short = { 'La Libertad': 'La Libertad', 'San Salvador': 'S. Salvador' }[d.name] || d.name;
      if (!d.props.length) mk('text', { class: 'dlabel', x: d.cx, y: d.cy }, s).textContent = short;
    });
    DEPS.filter((d) => d.props.length).forEach((d) => {
      const b = mk('g', { class: 'badge' }, s);
      mk('circle', { cx: d.cx, cy: d.cy, r: 11 }, b);
      mk('text', { x: d.cx, y: d.cy + .5 }, b).textContent = d.props.length;
      mk('text', { class: 'dlabel', x: d.cx, y: d.cy + 22 }, s).textContent = d.name;
    });

    // panel: stats + department list
    const withProps = DEPS.filter((d) => d.props.length).sort((a, b) => b.props.length - a.props.length);
    el.stats.innerHTML = `<li><b>${PROPS.length}</b><span>propiedades</span></li><li><b>${withProps.length}</b><span>departamentos</span></li><li><b>360°</b><span>tours</span></li>`;
    withProps.forEach((d) => {
      const li = document.createElement('li');
      li.innerHTML = `<button><span class="ico">${icon('pin')}</span><span><b>${d.name}</b><small>${d.props.map((p) => p.zone.split(',')[0]).join(' · ')}</small></span><span class="n">${d.props.length}</span></button>`;
      const b = li.firstChild; d.li = b;
      b.addEventListener('click', () => enterDept(d));
      b.addEventListener('pointerenter', () => hl(d, true));
      b.addEventListener('pointerleave', () => hl(d, false));
      el.deplist.appendChild(li);
    });
  }
  function hl(d, on) { d.path.classList.toggle('hl', on); d.li && d.li.classList.toggle('hl', on); if (on) d.props.forEach((p) => Prefetch.poster(p)); }
  function showTip(d, e) {
    if (TOUCH) return;
    hl(d, true);
    el.tip.innerHTML = `<b>${d.name}</b><span>${d.props.length ? `${d.props.length} ${d.props.length > 1 ? 'casas' : 'casa'} con tour 360°` : 'Próximamente'}</span>`;
    el.tip.hidden = false; moveTip(e);
  }
  function moveTip(e) { const r = el.country.querySelector('.country__map').getBoundingClientRect(); el.tip.style.left = `${e.clientX - r.left}px`; el.tip.style.top = `${e.clientY - r.top}px`; }
  function hideTip() { el.tip.hidden = true; DEPS.forEach((d) => hl(d, false)); }

  function animateViewBox(to, dur) {
    const from = el.svg.getAttribute('viewBox').split(' ').map(Number);
    const o = { t: 0 };
    return gsap.to(o, { t: 1, duration: dur, ease: 'power2.inOut', onUpdate: () => {
      el.svg.setAttribute('viewBox', from.map((v, i) => v + (to[i] - v) * o.t).join(' '));
    } });
  }

  /* =========================================================
     DEPARTMENT VIEW (Leaflet, Airbnb-style markers)
     ========================================================= */
  let map = null, maskLayer = null, outlineLayer = null, markers = [];

  function initMap() {
    if (map) return;
    map = L.map('leaflet', { zoomControl: false, attributionControl: true, zoomSnap: 0.25, wheelPxPerZoomLevel: 90, minZoom: 7, maxZoom: 18 });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, updateWhenZooming: false, keepBuffer: 3, crossOrigin: true,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    map.setView([13.75, -88.9], 8);
    $('#zIn').addEventListener('click', () => map.zoomIn());
    $('#zOut').addEventListener('click', () => map.zoomOut());
  }

  function deptPadding() {
    return MOBILE() ? { paddingTopLeft: [24, 130], paddingBottomRight: [24, 170] } : { paddingTopLeft: [parseInt(getComputedStyle(document.documentElement).getPropertyValue('--side')) + 40, 50], paddingBottomRight: [70, 50] };
  }

  function setupDept(d) {
    initMap();
    if (maskLayer) maskLayer.remove();
    if (outlineLayer) outlineLayer.remove();
    markers.forEach((m) => m.remove()); markers = [];
    const world = [[-89, -179], [-89, 179], [89, 179], [89, -179]];
    maskLayer = L.polygon([world, ...d.geo], { stroke: false, fillColor: '#FFFFFF', fillOpacity: 0.62, interactive: false }).addTo(map);
    outlineLayer = L.polygon(d.geo, { color: '#024C7E', weight: 2.6, fill: false, interactive: false }).addTo(map);
    map.invalidateSize();
    map.fitBounds(d.bounds, { ...deptPadding(), animate: false });

    d.props.forEach((p) => {
      const m = L.marker([p.lat, p.lon], {
        icon: L.divIcon({ className: 'mk-wrap', html: `<span class="mk${p.visited ? ' visited' : ''}" role="button" aria-label="Ver ${p.name}">${icon('casa')}</span>`, iconSize: [52, 40], iconAnchor: [26, 40] }),
        keyboard: true, title: p.name, riseOnHover: true,
      }).addTo(map);
      if (!TOUCH) m.bindTooltip(`<img src="${p.poster}" alt=""><div><b>${p.name}</b><span>${p.zone}</span><em>${p.price}</em></div>`, { direction: 'top', offset: [0, -44], className: 'mk-tip', opacity: 1 });
      m.on('click', () => flyToHouse(p));
      m.on('mouseover', () => cardHl(p, true));
      m.on('mouseout', () => cardHl(p, false));
      p.marker = m; markers.push(m);
    });

    // sidebar
    el.deptTitle.textContent = d.name;
    el.deptCount.textContent = d.props.length ? `${d.props.length} ${d.props.length > 1 ? 'casas' : 'casa'} en venta con tour 360°` : 'Sin propiedades publicadas por ahora';
    el.cards.innerHTML = '';
    if (!d.props.length) {
      el.cards.innerHTML = `<div class="empty"><img src="assets/brand/mana-isotipo.svg" alt=""><h3>Muy pronto en ${d.name}</h3><p>¿Buscas o quieres vender un inmueble aquí? Escríbenos y te ayudamos.</p>
        <a class="btn btn--green" href="${waLink(`Hola MANÁ, busco un inmueble en ${d.name}`)}" target="_blank" rel="noopener">${icon('wa')}Escríbenos por WhatsApp</a>
        <a class="btn btn--outline" href="tel:+50372108846">${icon('tel')}Llamar 7210-8846</a></div>`;
    }
    d.props.forEach((p) => {
      const c = document.createElement('button');
      c.className = 'card';
      c.innerHTML = `<div class="card__img"><img src="${p.poster}" alt="${p.name}" loading="lazy"><span class="card__badge">${p.type}</span><span class="card__360">${icon('360')}Tour 360°</span></div>
        <div class="card__body"><div class="card__row"><h3>${p.name}</h3><span class="card__op">Venta</span></div>
        <p class="card__zone">${p.zone}</p>
        <p class="card__meta"><span>${icon('bed')}${p.beds}</span><span>${icon('bath')}${p.baths}</span><span>${icon('area')}${p.area}</span></p>
        <p class="card__price">${p.price}</p></div>`;
      c.addEventListener('click', () => flyToHouse(p));
      c.addEventListener('pointerenter', () => markerHl(p, true));
      c.addEventListener('pointerleave', () => markerHl(p, false));
      c.addEventListener('focus', () => markerHl(p, true));
      c.addEventListener('blur', () => markerHl(p, false));
      p.card = c;
      el.cards.appendChild(c);
    });
    el.cards.scrollTop = 0; el.cards.scrollLeft = 0;
  }
  function markerHl(p, on) {
    const e = p.marker && p.marker.getElement(); if (!e) return;
    e.classList.toggle('front', on); e.querySelector('.mk').classList.toggle('hl', on);
    if (on) Prefetch.prioritize(p);
  }
  function cardHl(p, on) { p.card && p.card.classList.toggle('hl', on); if (on) Prefetch.prioritize(p); }

  async function enterDept(d) {
    if (view !== 'country') return;
    view = 'busy'; curDep = d; hideTip();
    const bb = d.path.getBBox();
    const pad = Math.max(bb.width, bb.height) * 0.25;
    const ratio = el.svg.clientWidth / el.svg.clientHeight || 1.6;
    let w = bb.width + pad * 2, h = bb.height + pad * 2;
    if (w / h < ratio) w = h * ratio; else h = w / ratio;
    const target = [bb.x + bb.width / 2 - w / 2, bb.y + bb.height / 2 - h / 2, w, h];
    el.dept.hidden = false;
    setupDept(d);           // tiles start loading behind the SVG zoom
    Prefetch.dept(d);
    await animateViewBox(target, RM ? 0.01 : 0.9);
    el.country.classList.add('out');
    el.dept.classList.add('in');
    el.sidebar.classList.remove('hide');
    gsap.fromTo('.card, .empty', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, delay: 0.15, clearProps: 'opacity,transform' });
    await sleep(500);
    view = 'dept';
  }

  async function backToCountry() {
    if (view !== 'dept') return;
    view = 'busy';
    el.dept.classList.remove('in');
    el.country.classList.remove('out');
    await animateViewBox(FULL(), RM ? 0.01 : 0.8);
    el.dept.hidden = true;
    view = 'country';
  }

  /* =========================================================
     CLOUDS — optimized: half-res canvas, pre-rotated sprites, few particles
     ========================================================= */
  const Clouds = (() => {
    const cv = el.clouds, ctx = cv.getContext('2d', { alpha: true });
    const SCALE = 0.5;                    // render at half resolution (clouds are soft)
    const st = { density: 0, speed: 1.4 };
    const N = innerWidth < 820 ? 14 : 22;
    let W = 0, H = 0, parts = [], running = false, sprites = [], last = 0;

    function prep(imgs) {
      sprites = [];
      imgs.forEach((im) => {
        for (let r = 0; r < 3; r++) {
          const c = document.createElement('canvas'); c.width = c.height = 256;
          const x = c.getContext('2d'); x.translate(128, 128); x.rotate(r * 2.1); x.drawImage(im, -128, -128, 256, 256);
          sprites.push(c);
        }
      });
    }
    function resize() { W = innerWidth; H = innerHeight; cv.width = Math.round(W * SCALE); cv.height = Math.round(H * SCALE); }
    function spawn(p, far) {
      p.x = (Math.random() * 2 - 1) * 1.6; p.y = (Math.random() * 2 - 1) * 1.0;
      p.z = far ? 3.4 + Math.random() * 0.8 : 0.4 + Math.random() * 3.6;
      p.i = (Math.random() * sprites.length) | 0; p.s = 0.9 + Math.random() * 0.9; return p;
    }
    function tick(now) {
      if (!running) return;
      const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      const w = cv.width, h = cv.height, M = Math.max(w, h);
      ctx.clearRect(0, 0, w, h);
      if (st.density > 0.002 && sprites.length) {
        for (const p of parts) { p.z -= dt * st.speed; if (p.z < 0.15) spawn(p, true); }
        parts.sort((a, b) => b.z - a.z);
        for (const p of parts) {
          const a = st.density * clamp((4.2 - p.z) / 1.2, 0, 1) * clamp((p.z - 0.15) / 0.4, 0, 1);
          if (a < 0.02) continue;
          const sc = 1 / p.z, size = p.s * sc * M * 0.6;
          ctx.globalAlpha = a > 1 ? 1 : a;
          ctx.drawImage(sprites[p.i], w / 2 + p.x * sc * w * 0.36 - size / 2, h / 2 + p.y * sc * h * 0.36 - size / 2, size, size);
        }
        ctx.globalAlpha = 1;
      }
      requestAnimationFrame(tick);
    }
    return {
      st,
      init(srcs) {
        resize(); window.addEventListener('resize', resize);
        const imgs = srcs.map((s) => { const im = new Image(); im.src = s; return im; });
        Promise.all(imgs.map((im) => im.decode().catch(() => {}))).then(() => { prep(imgs); parts = Array.from({ length: N }, () => spawn({}, false)); });
      },
      start() { if (running) return; running = true; last = 0; cv.style.opacity = 1; requestAnimationFrame(tick); },
      stop() { running = false; ctx.clearRect(0, 0, cv.width, cv.height); cv.style.opacity = 0; },
    };
  })();

  /* =========================================================
     PREFETCH
     ========================================================= */
  const Prefetch = (() => {
    const conn = navigator.connection || {};
    const slow = !!conn.saveData || /(^|-)2g|3g/.test(conn.effectiveType || '');
    const q = []; let busy = false;
    const img = (src) => new Promise((res) => { const i = new Image(); i.decoding = 'async'; i.onload = i.onerror = () => res(); i.src = src; });
    function video(p) {
      if (p.videoPromise) return p.videoPromise;
      p.videoPromise = fetch(p.src).then((r) => { if (!r.ok) throw 0; return r.blob(); })
        .then((b) => (p.videoURL = URL.createObjectURL(b)))
        .catch(() => { p.videoPromise = null; return p.src; });
      return p.videoPromise;
    }
    const pano0 = (p) => () => (p.pano0 ||= img(P + p.scenes[0][2] + '.jpg'));
    async function pump() { if (busy) return; busy = true; while (q.length) { try { await q.shift()(); } catch (e) { /* noop */ } } busy = false; }
    return {
      img, video,
      poster(p) { p.posterP ||= img(p.poster); },
      dept(d) { if (slow) return; d.props.forEach((p) => q.push(() => video(p), pano0(p))); pump(); },
      prioritize(p) { if (!p.videoURL) { q.unshift(() => video(p), pano0(p)); pump(); } },
    };
  })();

  /* =========================================================
     FLIGHT: department map -> clouds -> drone view
     ========================================================= */
  function waitVideo(v, ms) {
    return new Promise((res) => {
      if (v.readyState >= 3) return res();
      const done = () => { v.removeEventListener('canplay', done); res(); };
      v.addEventListener('canplay', done); setTimeout(done, ms);
    });
  }
  async function prepareVideo(p) {
    let src = p.videoURL || (await Promise.race([Prefetch.video(p), sleep(3000).then(() => null)])) || p.src;
    const v = el.video; v.poster = p.poster;
    if (v.dataset.src !== src) { v.src = src; v.dataset.src = src; v.load(); }
    await waitVideo(v, 6000);
  }
  function fillCard(p) {
    $('#pType').textContent = p.type;
    $('#pName').textContent = p.name;
    $('#pZone').textContent = p.zone;
    $('#pDesc').textContent = p.desc;
    $('#pPrice').textContent = p.price;
    $('#pSpecs').innerHTML = `<li>${icon('bed')}<b>${p.beds}</b><small>Habitaciones</small></li><li>${icon('bath')}<b>${p.baths}</b><small>Baños</small></li><li>${icon('area')}<b>${p.area}</b><small>Construcción</small></li><li>${icon('pin')}<b>${p.land}</b><small>Terreno</small></li>`;
    const msg = waLink(`Hola MANÁ, me interesa ${p.name} (${p.zone}) de ${p.price}.`);
    $('#pWa').href = msg; $('#tWa').href = msg;
    $('#backLabel').textContent = `Volver a ${depById(p.dep).name}`;
    gsap.set('#pcard', { clearProps: 'all' });
    $('#pcard').classList.add('reveal');
  }
  function alt(from, to, dur, ease) {
    const o = { a: from };
    return gsap.to(o, { a: to, duration: dur, ease, onUpdate: () => { el.hudAlt.textContent = `${Math.round(o.a).toLocaleString('en-US').replace(/,/g, ' ')} m`; } });
  }

  async function flyToHouse(p) {
    if (view !== 'dept') return;
    view = 'flying'; curProp = p;
    Prefetch.prioritize(p);
    const ready = prepareVideo(p);
    fillCard(p);
    el.hudDest.textContent = p.name;
    el.sidebar.classList.add('hide');
    el.topbar.classList.add('hide');
    markers.forEach((m) => { if (m !== p.marker) m.setOpacity(0.25); else m.closeTooltip && m.closeTooltip(); });
    outlineLayer && outlineLayer.setStyle({ opacity: 0 }); maskLayer && maskLayer.setStyle({ fillOpacity: 0 });
    const D = RM ? 0.3 : 1;
    const flyDur = 2.4 * D;
    map.flyTo([p.lat, p.lon], 16.5, { duration: flyDur, easeLinearity: 0.15 });

    Clouds.st.density = 0; Clouds.st.speed = 1.2;
    const tl = gsap.timeline();
    tl.to(el.hud, { opacity: 1, duration: 0.4 }, 0.2)
      .add(alt(2400, 300, flyDur, 'power2.in'), 0)
      .add(() => Clouds.start(), flyDur * 0.4)
      .to(Clouds.st, { density: 1, duration: flyDur * 0.55, ease: 'power1.in' }, flyDur * 0.4)
      .to(Clouds.st, { speed: 2.8, duration: flyDur * 0.6, ease: 'power2.in' }, flyDur * 0.4)
      .to(el.fog, { opacity: 0.96, duration: 0.6 * D, ease: 'power2.in' }, flyDur * 0.85);
    await tl;
    await ready;

    el.aerial.hidden = false;
    gsap.set(el.media, { scale: 1.3 });
    el.video.currentTime = 0;
    el.video.play().catch(() => {});
    const tl2 = gsap.timeline();
    tl2.to(el.fog, { opacity: 0, duration: 1.2 * D, ease: 'power2.out' }, 0.05)
      .to(Clouds.st, { density: 0, duration: 1.6 * D, ease: 'power2.out' }, 0)
      .to(Clouds.st, { speed: 1, duration: 1.6 * D }, 0)
      .to(el.media, { scale: 1, duration: 2.4 * D, ease: 'power3.out' }, 0)
      .add(alt(300, 60, 1.8 * D, 'power3.out'), 0)
      .to(el.hud, { opacity: 0, duration: 0.5 }, 1.6 * D)
      .to('#pcard', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0.9 * D)
      .fromTo('#aerial .back, .live', { opacity: 0 }, { opacity: 1, duration: 0.6, clearProps: 'opacity' }, 1.1 * D);
    await tl2;
    Clouds.stop();
    p.visited = true;
    view = 'aerial';
    $('#enterHouse').focus({ preventScroll: true });
  }

  async function backToDept() {
    if (view !== 'aerial') return;
    view = 'busy';
    const D = RM ? 0.3 : 1;
    await gsap.to(el.fog, { opacity: 1, duration: 0.5 * D, ease: 'power2.in' });
    el.video.pause();
    el.aerial.hidden = true;
    gsap.set(el.media, { clearProps: 'all' });
    setupDept(curDep);
    el.sidebar.classList.remove('hide');
    el.topbar.classList.remove('hide');
    await gsap.to(el.fog, { opacity: 0, duration: 0.8 * D, ease: 'power2.out' });
    view = 'dept';
  }

  /* =========================================================
     360 TOUR
     ========================================================= */
  let viewer = null, hintTimer = 0;
  function buildViewer(p) {
    const scenes = {};
    p.scenes.forEach(([id, title, file, yaw]) => { scenes[id] = { title, type: 'equirectangular', panorama: P + file + '.jpg', yaw, pitch: 0, hfov: 120 }; });
    viewer = pannellum.viewer(el.pano, {
      default: { firstScene: p.scenes[0][0], sceneFadeDuration: 900, autoLoad: true, autoRotate: RM ? 0 : -1.4, autoRotateInactivityDelay: 5000,
        showControls: false, compass: false, mouseZoom: true, keyboardZoom: true, hfov: 120, minHfov: 45, maxHfov: 120, friction: 0.12 },
      scenes,
    });
    viewer.on('scenechange', (id) => { setScene(p, id); el.tourLoading.classList.add('on'); });
    viewer.on('load', () => el.tourLoading.classList.remove('on'));
    viewer.on('error', () => el.tourLoading.classList.remove('on'));
    viewer.on('mousedown', hideHint); viewer.on('touchstart', hideHint);
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
      let ok = false; const done = () => { if (!ok) { ok = true; res(); } };
      try { if (viewer.isLoaded && viewer.isLoaded()) return done(); viewer.on('load', done); viewer.on('error', done); } catch (e) { done(); }
      setTimeout(done, ms);
    });
  }
  async function enterHouse() {
    if (view !== 'aerial') return;
    view = 'busy';
    const p = curProp, D = RM ? 0.3 : 1;
    el.tLoc.textContent = `${p.name} · ${p.zone}`;
    for (let i = 0; i < 80 && !window.pannellum; i++) await sleep(50);
    const tl = gsap.timeline();
    tl.to('#pcard, #aerial .back, .live', { opacity: 0, y: 10, duration: 0.4 }, 0)
      .to(el.media, { scale: 2.4, duration: 1.5 * D, ease: 'power3.in' }, 0)
      .to(el.fog, { opacity: 1, duration: 0.7 * D, ease: 'power2.in' }, 0.85 * D);
    el.tour.hidden = false; el.tour.style.visibility = 'hidden';
    el.tourHint.classList.remove('gone');
    buildViewer(p);
    await tl;
    await viewerLoaded(10000);
    el.video.pause();
    el.aerial.hidden = true;
    el.tour.style.visibility = '';
    try { viewer.resize(); } catch (e) { /* noop */ }
    gsap.set('#aerial .back, .live', { clearProps: 'all' });
    gsap.set(el.media, { clearProps: 'all' });
    const tl2 = gsap.timeline();
    tl2.to(el.fog, { opacity: 0, duration: 1.2 * D, ease: 'power2.out' }, 0)
      .add(() => { try { viewer.setHfov(MOBILE() ? 100 : 92, 2400); } catch (e) { /* noop */ } }, 0.1)
      .fromTo('.tour__top, .tour__bottom', { opacity: 0 }, { opacity: 1, duration: 0.8, clearProps: 'opacity' }, 0.5);
    hintTimer = setTimeout(hideHint, 6000);
    await tl2;
    view = 'tour';
  }
  async function exitTour() {
    if (view !== 'tour') return;
    view = 'busy';
    const D = RM ? 0.3 : 1;
    await gsap.to(el.fog, { opacity: 1, duration: 0.5 * D, ease: 'power2.in' });
    try { viewer.destroy(); } catch (e) { /* noop */ }
    viewer = null; el.pano.innerHTML = '';
    el.tour.hidden = true; el.aerial.hidden = false;
    gsap.set('#pcard', { opacity: 1, y: 0 });
    gsap.set(el.media, { scale: 1.4 });
    el.video.play().catch(() => {});
    const tl = gsap.timeline();
    tl.to(el.fog, { opacity: 0, duration: 1 * D }, 0).to(el.media, { scale: 1, duration: 1.6 * D, ease: 'power3.out' }, 0);
    await tl;
    view = 'aerial';
  }

  /* tour tools */
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
    const g = $('#gyroBtn'); g.hidden = false;
    g.addEventListener('click', async () => {
      if (!viewer) return;
      try {
        if (viewer.isOrientationActive()) { viewer.stopOrientation(); g.setAttribute('aria-pressed', 'false'); return; }
        if (typeof DeviceOrientationEvent.requestPermission === 'function') { if ((await DeviceOrientationEvent.requestPermission()) !== 'granted') return; }
        viewer.startOrientation(); g.setAttribute('aria-pressed', 'true'); hideHint();
      } catch (err) { /* unsupported */ }
    });
  }

  /* =========================================================
     LOADER
     ========================================================= */
  async function boot() {
    buildCountry();
    const cloudSrc = [0, 1, 2, 3].map((i) => `assets/img/cloud${i}.webp`);
    Clouds.init(cloudSrc);
    const imgs = ['assets/brand/mana-logo.svg', 'assets/brand/mana-horizontal.svg', 'assets/brand/mana-isotipo.svg', ...cloudSrc, ...PROPS.map((p) => p.poster)];
    const fonts = ['500 16px Montserrat', '700 16px Montserrat', '800 16px Montserrat', '400 16px "Nunito Sans"', '700 16px "Nunito Sans"']
      .map((f) => (document.fonts ? document.fonts.load(f) : Promise.resolve()));
    const jobs = [...fonts, ...imgs.map((s) => Prefetch.img(s))];
    const total = jobs.length; let done = 0;
    const shown = { v: 0 };
    const msgs = ['Preparando el mapa', 'Ubicando las casas', 'Formando las nubes', 'Listo para volar'];
    const render = () => {
      el.pct.textContent = `${Math.round(shown.v * 100)}%`;
      el.bar.style.transform = `scaleX(${shown.v})`;
      el.msg.textContent = msgs[Math.min(msgs.length - 1, Math.floor(shown.v * msgs.length))];
    };
    jobs.forEach((j) => j.finally(() => { done++; gsap.to(shown, { v: done / total, duration: 0.5, onUpdate: render, overwrite: true }); }));
    const min = sleep(RM ? 500 : 2300);
    await Promise.race([Promise.allSettled(jobs), sleep(10000)]);
    await min;
    await new Promise((r) => gsap.to(shown, { v: 1, duration: 0.4, onUpdate: render, onComplete: r, overwrite: true }));
    await sleep(250);
    el.loader.classList.add('done');
    el.body.classList.remove('is-loading');
    setTimeout(() => el.loader.remove(), 900);
    const d = RM ? 0.01 : 1;
    gsap.timeline({ onComplete: () => { view = 'country'; } })
      .from('.country__panel > *', { opacity: 0, y: 18, duration: 0.7 * d, stagger: 0.06, ease: 'power3.out', clearProps: 'opacity,transform' }, 0.1)
      .from('#svgMap .dep', { opacity: 0, duration: 0.6 * d, stagger: 0.03, clearProps: 'opacity' }, 0.2)
      .from('#svgMap .badge', { scale: 0, transformOrigin: 'center', duration: 0.5 * d, stagger: 0.08, ease: 'back.out(2)', clearProps: 'transform' }, 0.8);
    // warm up the tile cache for the first department people usually pick
    setTimeout(initMap, 1500);
  }

  /* =========================================================
     UI wiring
     ========================================================= */
  $('#toCountry').addEventListener('click', backToCountry);
  $('#backToDept').addEventListener('click', backToDept);
  $('#enterHouse').addEventListener('click', enterHouse);
  $('#exitTour').addEventListener('click', exitTour);
  $$('[data-home]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); if (view === 'dept') backToCountry(); }));

  let lastFocus = null;
  const openModal = (n) => { const m = $(`#modal-${n}`); if (!m) return; lastFocus = document.activeElement; m.hidden = false; (m.querySelector('a.btn') || m.querySelector('.modal__x')).focus(); };
  const closeModals = () => { $$('.modal').forEach((m) => (m.hidden = true)); lastFocus && lastFocus.focus({ preventScroll: true }); };
  $$('[data-open]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); openModal(b.dataset.open); }));
  $$('.modal').forEach((m) => m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) closeModals(); }));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if ($$('.modal').some((m) => !m.hidden)) return closeModals();
    if (view === 'tour') exitTour(); else if (view === 'aerial') backToDept(); else if (view === 'dept') backToCountry();
  });
  document.addEventListener('visibilitychange', () => { if (view === 'aerial') document.hidden ? el.video.pause() : el.video.play().catch(() => {}); });
  window.addEventListener('resize', () => { if (map && view === 'dept') map.invalidateSize(); });

  boot();
})();
