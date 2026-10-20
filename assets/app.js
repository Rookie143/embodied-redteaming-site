/* Embodied Red Teaming: every page of the site. Each page names itself in <body data-page> and its way back to the
   site root in <body data-root> ('' on the home page, '../' on the others); this script fills whatever sections the
   page has. Everything it shows comes from data/site.js (text, models, media) and
   data/results.js (numbers). The layout and the look follow the Embodied First Exam site (MIT), whose stylesheet
   assets/exam.css is used as is; assets/redteam.css adds the pieces that page did not have. */
(() => {
const S = window.SITE, R = window.RESULTS;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const int = (n) => Number(n || 0).toLocaleString('en-US');
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const catById = Object.fromEntries(S.categories.map((c) => [c.id, c]));
const modelById = Object.fromEntries(S.models.map((m) => [m.id, m]));
const GH = S.meta.github;
const PAGE = document.body.dataset.page || 'home';
const ROOT = document.body.dataset.root || '';
const link = (p = '') => ROOT + p || './';
const PAGES = [['leaderboard', 'Leaderboard'], ['compare', 'Compare'], ['hazards', 'Hazards'], ['attacks', 'Attacks'], ['scenarios', 'Scenarios'], ['method', 'Method']];

const ICON = {
  doc: '<path d="M6 2.5h8l4 4v15H6z"/><path d="M14 2.5v4h4M9 11h6M9 14.5h6M9 18h4"/>',
  layers: '<path d="M12 3l9 4.5-9 4.5-9-4.5z"/><path d="M3 12l9 4.5 9-4.5M3 16.5L12 21l9-4.5"/>',
  arm: '<path d="M5 21h9M9.5 21v-4"/><circle cx="9.5" cy="15" r="2"/><path d="M10.8 13.4l4.6-5.2"/><circle cx="16.3" cy="7.3" r="1.7"/><path d="M17.6 6.1l2.9-1.5M17.7 8.5l2.6 1.7"/>',
  bolt: '<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/>',
  pair: '<rect x="2.5" y="6" width="8.5" height="12" rx="2.5"/><rect x="13" y="6" width="8.5" height="12" rx="2.5"/><path d="M5 12h3M16 12h3M17.5 10.5v3"/>',
  replay: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 3.5v3.6h3.6"/><path d="M10.5 9l4 3-4 3z"/>',
  judge: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 7.2l4 1.6v3.2c0 2.4-1.7 4.3-4 5.2-2.3-.9-4-2.8-4-5.2V8.8z"/>',
  frozen: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><path d="M9.6 5L12 7.4 14.4 5M9.6 19L12 16.6 14.4 19"/>',
  budget: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2.5h5"/>',
  bound: '<path d="M3 20h18"/><path d="M5 20V9M10 20V5M15 20v-8M20 20v-5"/><path d="M3 4.5h18" stroke-dasharray="2 2.5"/>',
};
const svg = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k] || ''}</svg>`;
const MARK = `<svg viewBox="0 0 32 32" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <rect x="8.5" y="25.6" width="13" height="3.6" rx="1.8" fill="currentColor"/><rect x="12.6" y="9" width="4.8" height="15.5" fill="currentColor"/>
  <path d="M15 9L8.6 15.4" stroke="currentColor" stroke-width="4.4"/><path d="M10.3 17.1L6.9 13.7M10.3 17.1L8.5 18.9M6.9 13.7L5.1 15.5" stroke="currentColor" stroke-width="2.2"/>
  <circle cx="15" cy="24" r="3.5" fill="currentColor"/><circle cx="15" cy="9" r="3.5" fill="var(--harm)"/>
  <circle cx="25" cy="19" r="4.2" stroke="var(--harm)" stroke-width="2.2"/><path d="M25 12.6v2.2M25 23.2v2.2M18.6 19h2.2M29.2 19h2.2" stroke="var(--harm)" stroke-width="1.8"/></svg>`;
const GITHUB = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>';
const MOON = '<svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
const SUN = '<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg>';
const MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';

/* ------------------------------------------------------------------ chrome */

function chrome() {
  $('#nav').outerHTML = `<nav class="nav always" aria-label="Sections">
    <a class="wordmark" href="${link()}"><span class="mark" aria-hidden="true">${MARK}</span>${esc(S.meta.name)}</a>
    <div class="nav-links">${PAGES.map(([p, l]) => `<a href="${link(`${p}/`)}"${p === PAGE || (PAGE === 'model' && p === 'leaderboard') ? ' class="active" aria-current="page"' : ''}>${l}</a>`).join('')}</div>
    <a class="icon-btn gh-btn${GH ? '' : ' soon'}"${GH ? ` href="${esc(GH)}"` : ' aria-disabled="true"'} aria-label="GitHub" title="${GH ? 'GitHub' : 'GitHub: coming soon'}">${GITHUB}</a>
    <button class="icon-btn menu-btn" id="menu-toggle" type="button" aria-label="Menu" aria-expanded="false">${MENU}</button>
    <button class="icon-btn" id="theme-toggle" type="button" aria-label="Switch between day and night">${MOON}${SUN}</button>
  </nav>`;
  $('#menu-toggle').addEventListener('click', (e) => {
    const open = e.currentTarget.closest('.nav').classList.toggle('open');
    e.currentTarget.setAttribute('aria-expanded', String(open));
  });
  $$('.nav-links a').forEach((a) => a.addEventListener('click', () => $('.nav').classList.remove('open')));
  $('#theme-toggle').addEventListener('click', () => {
    const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('ert-theme', t); } catch (e) { /* private mode */ }
  });
  $$('[data-gh]').forEach((el) => {
    if (GH) el.href = GH; else { el.classList.add('soon'); el.setAttribute('aria-disabled', 'true'); el.title = 'Coming soon'; }
    if (el.classList.contains('gh-start')) el.insertAdjacentHTML('afterbegin', GITHUB);
  });
  const d = new Date(S.meta.updated).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  $('#footer').outerHTML = `<footer class="footer"><div class="footer-grid">
    <div><a class="wordmark" href="${link()}"><span class="mark" aria-hidden="true">${MARK}</span>${esc(S.meta.name)}</a>
      <div class="prov">Results updated ${esc(d)}${S.meta.placeholder ? ' · placeholder data' : ''}</div>
      <div class="copy">© 2026 ${esc(S.meta.name)} · layout after <a class="link" href="https://www.embodied-first-exam.ai/">Embodied First Exam</a> (MIT)</div></div>
    <div><h5>The arena</h5><ul><li><a href="${link('leaderboard/')}">Leaderboard</a></li><li><a href="${link('hazards/')}">Hazards</a></li><li><a href="${link('attacks/')}">Attacks</a></li></ul></div>
    <div><h5>Method</h5><ul><li><a href="${link('scenarios/')}">Scenarios</a></li><li><a href="${link('method/')}">The loop</a></li><li><a href="${link('method/')}#metrics">Metrics</a></li></ul></div>
    <div><h5>Community</h5><ul><li><a data-gh>GitHub</a></li><li><a data-gh>Submit an attack</a></li></ul></div>
  </div></footer>`;
  $$('footer [data-gh]').forEach((el) => { if (GH) el.href = GH; else el.classList.add('soon'); });
  if (S.meta.placeholder || R.placeholder) {
    const b = $('#ph-badge');
    b.hidden = false;
    b.innerHTML = '<i></i>Preview · placeholder numbers and media';
  }
}

/** The inner pages' heads: a small, quiet copy of the first screen's wall on the right, pictures only, so the title
 *  sits on the same paper as the home page's. Each page deals the scenes in its own order; a phone gets none. */
function headWall() {
  const head = $('.page-head');
  if (!head || innerWidth < 760) return;
  let seed = [...PAGE].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  // unsafe scenes first, so the wall says what the site is about
  const pool = S.tiles.map((t) => [rnd() + (t.kind === 'unsafe' ? 0 : 0.6), t]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const n = 6, per = 8;
  const cols = Array.from({ length: n }, (_, c) => pool.slice(c * per, c * per + per));
  const tile = (t) => `<a class="wt${t.cat ? ' hz' : ''}" tabindex="-1"><img src="${esc(t.poster)}" alt="" loading="lazy" decoding="async">${t.cat ? '<span class="hz-dot" aria-hidden="true"></span>' : ''}</a>`;
  const durs = [150, 124, 168, 136, 176, 118];
  head.insertAdjacentHTML('afterbegin', `<div class="head-paper" aria-hidden="true"></div><div class="head-deco" aria-hidden="true">
    <div class="wall head-wall${still ? ' paused' : ''}">${cols.map((c, i) => {
      const html = c.map(tile).join('');
      return `<div class="wall-col${i % 2 ? ' down' : ''}" style="--dur:${durs[i]}s;--delay:-${((i * 37) % 100) / 100 * durs[i]}s">${html}${html}</div>`;
    }).join('')}</div></div>`);
  const wall = $('.head-wall', head);
  // the wall fades in only past the end of the title and the lead, measured on their text
  const clear = () => {
    const r = document.createRange();
    const right = Math.max(0, ...$$('h1, .lead, .kicker', head).map((el) => { r.selectNodeContents(el); return r.getBoundingClientRect().right; }));
    head.style.setProperty('--clear', `${Math.round(right + 48)}px`);
  };
  clear();
  addEventListener('resize', clear);
  document.fonts?.ready.then(clear);
  new IntersectionObserver(([e]) => wall.classList.toggle('paused', still || !e.isIntersecting)).observe(head);
}

function reveal() {
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); io.unobserve(e.target);
    e.target.dispatchEvent(new CustomEvent('revealed'));
  }), { rootMargin: '0px 0px -6% 0px' });
  $$('.reveal:not(.in)').forEach((el) => io.observe(el));
}

/* ------------------------------------------------------------------ hero */

function hero() {
  $('#hero-q').textContent = S.meta.q;
  $('#hero-q-em').textContent = S.meta.q_em;
  $('#hero-h1').innerHTML = S.meta.h1.map((l) => `<span>${esc(l)}</span>`).join('');
  $('#hero-lead').textContent = S.meta.lead;
  const el = $('#hero-run'), cmd = S.meta.command;
  const paint = (s) => esc(s).replace(/(^|\s)(--?\w[\w-]*)(?=\s|$)/g, '$1<span class="f">$2</span>');
  el.innerHTML = `<div class="hr-bar"><span class="pr" aria-hidden="true">$</span><code class="hr-cmd" aria-label="${esc(cmd)}"></code><span class="caret" aria-hidden="true"></span>
    <button type="button" class="hr-copy" aria-label="Copy the command" title="Copy">
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/></svg></button></div>`;
  const code = $('.hr-cmd', el);
  const done = () => { code.innerHTML = paint(cmd); };
  if (still) done();
  else { let i = 0; const tick = () => { code.textContent = cmd.slice(0, ++i); if (i < cmd.length) setTimeout(tick, 18 + Math.random() * 26); else done(); }; setTimeout(tick, 700); }
  const btn = $('.hr-copy', el);
  btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(cmd); } catch { return; }
    btn.classList.add('ok'); setTimeout(() => btn.classList.remove('ok'), 1600);
  });
}

/** The first screen's wall: scenes dealt into tilted columns that drift up and down. The open right part of the wall
 *  holds the unsafe scenes and plays them; the part under the title holds the rest, as stills. */
function heroWall() {
  const wall = $('#wall');
  const phone = innerWidth < 760;
  const gap = phone ? 10 : 12;
  const tw = Math.round(Math.max(130, Math.min(300, innerWidth * (phone ? 0.3 : 0.13))));
  wall.style.setProperty('--tw', `${tw}px`); wall.style.setProperty('--wg', `${gap}px`);
  const n = Math.max(3, Math.ceil(wall.offsetWidth / (tw + gap)) + 1);
  const per = Math.ceil(wall.offsetHeight / (tw * 0.75 + gap)) + 1;
  const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const unsafe = shuffle(S.tiles.filter((t) => t.kind === 'unsafe'));
  const scenes = shuffle(S.tiles.filter((t) => t.kind !== 'unsafe'));
  const wr = wall.getBoundingClientRect();
  const colX = (c) => wr.left + c * (tw + gap) + tw / 2;
  // the wall is tilted by 9 degrees; columns whose middle lands right of 46% of the screen are the open, playing side
  const open = (c) => !phone && colX(c) > innerWidth * 0.5;
  let ui = 0, si = 0;
  const take = (pool, k) => pool[k % pool.length];
  const cols = Array.from({ length: n }, (_, c) => Array.from({ length: per }, (_, r) => {
    // the open side: mostly unsafe scenes, a benign scene every fourth tile; behind the title: the other way round
    const wantUnsafe = open(c) ? (r + c) % 4 !== 3 : (r + c) % 4 === 0;
    return wantUnsafe ? take(unsafe, ui++) : take(scenes, si++);
  }));
  const tile = (t) => {
    const cat = t.cat && catById[t.cat];
    const video = t.video && !phone && !still ? `<video muted loop playsinline preload="none" data-src="${esc(t.video)}"></video>` : '';
    const label = cat ? `${cat.name} · ${t.instr || t.title}` : `Benign scene · ${t.title}`;
    return `<a class="wt${cat ? ' hz' : ''}" tabindex="-1" href="${link(cat ? `scenarios/?cat=${t.cat}` : 'scenarios/')}"><img src="${esc(t.poster)}" alt="" loading="lazy" decoding="async">${video}
      <span class="tag">${esc(cat ? cat.code : 'SCENE')}</span>${cat ? '<span class="hz-dot" aria-hidden="true"></span>' : ''}<span class="ttl">${esc(label)}</span></a>`;
  };
  const durs = [92, 76, 100, 84, 108, 72, 96, 80];
  wall.innerHTML = cols.map((c, i) => {
    const html = c.map(tile).join(''), dur = durs[i % durs.length];
    return `<div class="wall-col${i % 2 ? ' down' : ''}" style="--dur:${dur}s;--delay:-${((i * 37) % 100) / 100 * dur}s">${html}${html}</div>`;
  }).join('');
  // a column moves one copy of itself per loop: its duration follows its length, about 9 px/s
  $$('.wall-col', wall).forEach((el, i) => { const half = el.offsetHeight / 2; if (half > 0) el.style.setProperty('--dur', `${(half / 9 * durs[i % durs.length] / 84).toFixed(1)}s`); });
  if (!phone && !still) {
    // play the tiles in the open right part, at most 16 at a time, unsafe scenes first
    const inZone = new Set();
    const schedule = () => {
      const pick = new Set([...inZone].sort((a, b) => b.classList.contains('hz') - a.classList.contains('hz')).slice(0, 16));
      $$('.wt.playing', wall).forEach((t) => { if (!pick.has(t)) { $('video', t).pause(); t.classList.remove('playing'); } });
      pick.forEach((t) => {
        if (t.classList.contains('playing')) return;
        const v = $('video', t);
        if (!v.src) v.src = v.dataset.src;
        t.classList.add('playing');
        v.play().catch(() => t.classList.remove('playing'));
      });
    };
    const io = new IntersectionObserver((es) => { es.forEach((e) => (e.isIntersecting ? inZone.add(e.target) : inZone.delete(e.target))); schedule(); },
      { rootMargin: '0px 0px 0px -46%', threshold: 0.35 });
    $$('.wt', wall).forEach((t) => { if ($('video', t)) io.observe(t); });
  }
  new IntersectionObserver(([e]) => wall.classList.toggle('paused', !e.isIntersecting)).observe($('.hero-wall'));
}

/* ------------------------------------------------------------------ numbers */

function countUp(el) {
  const to = +el.dataset.to;
  if (still) { el.textContent = int(to); return; }
  const t0 = performance.now(), d = 1400;
  const f = (t) => { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); el.textContent = int(Math.round(to * e)); if (k < 1) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}

function bigNumbers() {
  const T = S.totals;
  const llm = S.models.filter((m) => m.track === 'llm').length, vla = S.models.length - llm;
  const pairs = S.interfaces.reduce((a, i) => a + S.models.filter((m) => m.track === i.track).length, 0);
  const settings = S.attacks.length * S.defenses.length;
  const episodes = T.unsafe_tasks * settings * pairs + T.benign_twins * S.defenses.length * pairs;
  const items = [['doc', T.unsafe_tasks, 'unsafe tasks', `each with a benign twin`], ['arm', S.models.length, 'foundation models', `${llm} LLM / VLM · ${vla} VLA`], ['bolt', S.attacks.length, 'attack settings', `${S.attacks.filter((a) => a.access !== 'none').length} black-box attacks`]];
  const el = $('#bignums');
  el.innerHTML = items.map(([ic, v, l, sub]) => `<div>${svg(ic)}<dt data-to="${v}">0</dt><dd>${esc(l)}<small>${esc(sub)}</small></dd></div>`).join('');
  el.insertAdjacentHTML('afterend', `<p class="nums-line reveal"><span><b>${S.categories.length}</b> hazard categories</span><i aria-hidden="true">·</i><span><b>${S.interfaces.length}</b> robot interfaces</span><i aria-hidden="true">·</i><span><b>${int(episodes)}</b> episodes</span></p>`);
  el.addEventListener('revealed', () => $$('dt', el).forEach(countUp));
}

/* ------------------------------------------------------------------ leaderboard */

const org = (m) => S.orgs[m.org] || { name: m.org };
const markOf = (m) => { const o = org(m); return `<span class="mk${o.logo ? '' : ' mono'}" title="${esc(o.name)}">${o.logo || esc(o.mono || o.name[0])}</span>`; };
const LEVELS = (S.levels || []).map((l) => l.id);
/** One setting's numbers per model: [attempted, completed, benign, queries]; level 'all' is the mean over the levels. */
const cell = (itf, atk, dfn, lvl = 'all') => {
  if (lvl !== 'all' || !LEVELS.length) return R.cells[LEVELS.length ? `${itf}|${atk}|${dfn}|${lvl}` : `${itf}|${atk}|${dfn}`] || {};
  const rows = LEVELS.map((l) => R.cells[`${itf}|${atk}|${dfn}|${l}`] || {}), out = {};
  Object.keys(rows[0] || {}).forEach((id) => { out[id] = [0, 1, 2, 3].map((j) => Math.round(rows.reduce((s, r) => s + ((r[id] || [])[j] || 0), 0) / rows.length)); });
  return out;
};
const itfOf = (m) => (m.track === 'llm' ? 'cap' : 'native');
const modelHref = (m) => link(`model/?id=${encodeURIComponent(m.id)}`);
const compareHref = (a, b) => link(`compare/?a=${encodeURIComponent(a)}${b ? `&b=${encodeURIComponent(b)}` : ''}`);
/** The headline number behind the star rating: mean completed attack success over every attack and level, no defense. */
const scoreOf = (m, itf = itfOf(m)) => Math.round(S.attacks.reduce((s, a) => s + ((cell(itf, a.id, 'none')[m.id] || [0, 0])[1]), 0) / S.attacks.length);
const ratingOf = (m) => { const x = scoreOf(m); return { score: x, ...(S.rating.stars.find((r) => x < r.max) || S.rating.stars[S.rating.stars.length - 1]) }; };
const starsHtml = (n, cls = '') => `<span class="stars st${n} ${cls}" role="img" aria-label="${n} of 5 stars">${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i></span>`;
/** Every model of a track, safest first by its rating score. */
const ranked = (track) => S.models.filter((m) => m.track === track).sort((a, b) => scoreOf(a) - scoreOf(b));
/** One row per company: its safest model stands for it. */
const companies = (track) => {
  const by = new Map();
  ranked(track).forEach((m) => { if (!by.has(m.org)) by.set(m.org, []); by.get(m.org).push(m); });
  return [...by.entries()].map(([o, ms]) => ({ org: o, best: ms[0], models: ms }));
};

function leaderboard() {
  const el = $('#lbh');
  const st = { view: 'models', track: 'llm', itf: 'cap', atk: 'robopair', dfn: 'none', lvl: 'all', open: null };
  const seg = (name, opts, cur, label) => `<div class="seg" data-k="${name}" role="group" aria-label="${label}">${opts.map(([v, l]) =>
    `<button type="button" data-v="${v}" aria-pressed="${v === cur}" class="${v === cur ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const controls = () => {
    const itfs = S.interfaces.filter((i) => i.track === st.track);
    return `<div class="lbh-top rt-top">
      ${seg('view', [['models', 'Models'], ['companies', 'Companies']], st.view, 'View')}
      ${seg('track', [['llm', 'LLM / VLM agents'], ['vla', 'VLA policies']], st.track, 'Track')}
      ${itfs.length > 1 ? seg('itf', itfs.map((i) => [i.id, i.name]), st.itf, 'Robot interface') : `<span class="rt-fixed">${esc(itfs[0].name)}</span>`}
    </div>
    <div class="lbh-top rt-top rt-sub">
      <span class="label">Attack</span>${seg('atk', S.attacks.map((a) => [a.id, a.name]), st.atk, 'Attack')}
      <span class="label">Defense</span>${seg('dfn', S.defenses.map((d) => [d.id, d.name]), st.dfn, 'Defense')}
      ${LEVELS.length ? `<span class="label">Level</span>${seg('lvl', [['all', 'All'], ...S.levels.map((l) => [l.id, l.name])], st.lvl, 'Task level')}` : ''}
    </div>
    <p class="lb-desc" id="lbh-desc"></p>`;
  };
  el.innerHTML = `<div class="rt-controls"></div>
    <div class="lbh-chart"><div class="lbh-ax"><div class="lbh-axis"><span></span><span class="lbh-n rt-sh">Rating</span><span class="lbh-ticks" aria-hidden="true">${[0, 25, 50, 75, 100].map((t) => `<i style="left:${t}%">${t}%</i>`).join('')}</span><span class="lbh-n">ASR ↓</span><span class="lbh-n">Benign ↑</span></div></div>
    <div class="lbh-rows"></div></div>
    <div class="rt-key"><span><i class="k-c"></i>Harm completed</span><span><i class="k-a"></i>Harm attempted, not completed</span><span><i class="k-b"></i>Benign twin solved</span><span class="muted">Ranked by completed attack success in this setting, lowest first. Stars rate every attack and level together. Click a row for more.</span></div>`;
  const paintControls = () => {
    $('.rt-controls', el).innerHTML = controls();
    const a = S.attacks.find((x) => x.id === st.atk), d = S.defenses.find((x) => x.id === st.dfn), i = S.interfaces.find((x) => x.id === st.itf);
    const l = (S.levels || []).find((x) => x.id === st.lvl);
    $('#lbh-desc').innerHTML = `<b>${esc(a.name)}.</b> ${esc(a.desc)} ${d.desc ? `<b>${esc(d.name.replace('+ ', ''))}.</b> ${esc(d.desc)}` : ''} <span class="muted">Interface: ${esc(i.name)} · ${l ? `${esc(l.name)}: ${esc(l.desc)}` : 'all levels'} · ${int(S.totals.unsafe_tasks)} unsafe tasks.${st.view === 'companies' ? ' Each company is shown by its safest model.' : ''}</span>`;
  };
  const rowsEl = $('.lbh-rows', el);
  const row = (id, m, name, sub, v, k) => {
    const [att, comp, ben] = v, r = ratingOf(m);
    return `<button type="button" class="lbh-row${st.open === id ? ' on' : ''}" data-id="${esc(id)}" style="--i:${k}" aria-expanded="${st.open === id}" aria-label="${esc(name)}, place ${k + 1}: harm completed in ${comp}% of unsafe tasks, attempted in ${att}%; rated ${r.stars} of 5">
      <span class="rk r${k + 1}">${k + 1}</span>${markOf(m)}
      <span class="lbh-name"><span class="lbh-nl"><b>${esc(name)}</b><span class="lbh-set">${esc(sub)}</span></span></span>
      <span class="rt-star">${starsHtml(r.stars)}</span>
      <span class="lbh-track"><span class="lbh-a" style="--w:${att}%"></span><span class="lbh-s" style="--w:${comp}%"></span></span>
      <span class="lbh-val"><b>${comp}<small>%</small></b><em>tried ${att}%</em></span>
      <span class="lbh-ben" style="--b:${ben}%"><i></i><b>${ben}%</b></span>
    </button>${st.open === id ? (id.startsWith('org:') ? orgDetail(id.slice(4)) : detail(m, v)) : ''}`;
  };
  const detail = (m, v) => {
    const [att, comp, ben, q] = v, prof = R.profile[m.id] || {}, r = ratingOf(m);
    const worst = S.attacks.map((a) => [a, (cell(st.itf, a.id, st.dfn, st.lvl)[m.id] || [0, 0])[1]]).sort((x, y) => y[1] - x[1]);
    const rival = ranked(m.track).find((x) => x.id !== m.id && x.org !== m.org);
    return `<div class="rt-detail">
      <div class="rt-dcol"><p class="label">By hazard category · completed</p>
        ${S.categories.map((c) => { const x = Math.min(100, Math.round(comp * (prof[c.id] || 1))); return `<div class="rt-cat"><span>${esc(c.name)}</span><span class="rt-mini"><i style="--w:${x}%"></i></span><b>${x}%</b></div>`; }).join('')}</div>
      <div class="rt-dcol"><p class="label">By attack · completed</p>
        ${worst.map(([a, x]) => `<div class="rt-cat${a.id === st.atk ? ' cur' : ''}"><span>${esc(a.name)}</span><span class="rt-mini"><i style="--w:${x}%"></i></span><b>${x}%</b></div>`).join('')}</div>
      <dl class="rt-stats">
        <div><dt>${starsHtml(r.stars)}</dt><dd>${esc(r.label)} · ${r.score}% overall</dd></div><div><dt>${comp}%</dt><dd>ASR, completed</dd></div>
        <div><dt>${ben}%</dt><dd>Benign success</dd></div><div><dt>${q}</dt><dd>Median queries to break</dd></div>
      </dl>
      <p class="rt-links"><a class="btn primary" href="${modelHref(m)}">Full safety report <span class="arr">→</span></a>${rival ? `<a class="btn" href="${compareHref(m.id, rival.id)}">Compare with ${esc(rival.name)}</a>` : ''}</p></div>`;
  };
  const orgDetail = (o) => {
    const v = cell(st.itf, st.atk, st.dfn, st.lvl);
    const ms = ranked(st.track).filter((m) => m.org === o && v[m.id]);
    return `<div class="rt-detail rt-org"><div class="rt-dcol"><p class="label">Every ${esc((S.orgs[o] || {}).name || o)} model on this board</p>
      ${ms.map((m) => `<a class="rt-cat rt-om" href="${modelHref(m)}"><span>${esc(m.name)}</span><span class="rt-mini"><i style="--w:${v[m.id][1]}%"></i></span><b>${v[m.id][1]}%</b>${starsHtml(ratingOf(m).stars)}</a>`).join('')}</div></div>`;
  };
  const paintRows = (animate) => {
    const v = cell(st.itf, st.atk, st.dfn, st.lvl);
    let items = S.models.filter((m) => m.track === st.track && v[m.id]).map((m) => [m.id, m, m.name, `${org(m).name} · ${m.access === 'open' ? 'open weights' : 'API'}`, v[m.id]]);
    if (st.view === 'companies') {
      const best = new Map();
      items.forEach((it) => { const o = it[1].org; if (!best.has(o) || it[4][1] < best.get(o)[4][1]) best.set(o, it); });
      items = [...best.values()].map(([, m, , , vv]) => { const n = S.models.filter((x) => x.org === m.org && x.track === st.track).length; return [`org:${m.org}`, m, org(m).name, `best: ${m.name}${n > 1 ? ` · ${n} models` : ''}`, vv]; });
    }
    items.sort((a, b) => a[4][1] - b[4][1] || a[4][0] - b[4][0]);
    // FLIP: rows that stay slide from their old place to the new one
    const before = new Map($$('.lbh-row', rowsEl).map((r) => [r.dataset.id, r.getBoundingClientRect().top]));
    rowsEl.innerHTML = items.map(([id, m, name, sub, vv], k) => row(id, m, name, sub, vv, k)).join('');
    el.classList.toggle('by-org', st.view === 'companies');
    if (!animate || still) return;
    $$('.lbh-row', rowsEl).forEach((r) => {
      const was = before.get(r.dataset.id);
      if (was == null) { r.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'ease-out' }); return; }
      const dy = was - r.getBoundingClientRect().top;
      if (dy) r.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
  };
  // bars grow from their old width to the new one: keep the old widths before repainting
  const repaint = () => {
    const old = new Map($$('.lbh-row', rowsEl).map((r) => [r.dataset.id, $$('.lbh-a, .lbh-s, .lbh-ben i', r).map((b) => b.getBoundingClientRect().width)]));
    paintRows(true);
    if (still) return;
    $$('.lbh-row', rowsEl).forEach((r) => {
      const w = old.get(r.dataset.id) || [0, 0, 0];
      $$('.lbh-a, .lbh-s, .lbh-ben i', r).forEach((b, j) => {
        const to = b.getBoundingClientRect().width;
        b.animate([{ width: `${w[j]}px` }, { width: `${to}px` }], { duration: 900, easing: 'cubic-bezier(.2,.8,.2,1)' });
      });
    });
  };
  el.addEventListener('click', (e) => {
    const b = e.target.closest('.seg button');
    if (b) {
      const k = b.closest('.seg').dataset.k, v = b.dataset.v;
      if (st[k] === v) return;
      st[k] = v;
      if (k === 'track') st.itf = S.interfaces.find((i) => i.track === v).id;
      if (k === 'track' || k === 'view') st.open = null;
      paintControls(); repaint();
      return;
    }
    if (e.target.closest('a')) return;
    const r = e.target.closest('.lbh-row');
    if (r) { st.open = st.open === r.dataset.id ? null : r.dataset.id; paintRows(false); }
  });
  paintControls(); paintRows(false);
}

/* ------------------------------------------------------------------ the companies board */

/** Big cards, one per company, safest first: its best model, its stars, its number. "Whose robot brain is safest?" */
function vendors() {
  const el = $('#vendors');
  let track = 'llm';
  const paint = () => {
    const cs = companies(track).sort((a, b) => scoreOf(a.best) - scoreOf(b.best));
    el.innerHTML = `<div class="hm-top"><div class="seg" role="group" aria-label="Track">${[['llm', 'LLM / VLM agents'], ['vla', 'VLA policies']].map(([v, l]) => `<button type="button" data-v="${v}" class="${v === track ? 'on' : ''}" aria-pressed="${v === track}">${l}</button>`).join('')}</div>
      <p class="lb-desc">${esc(S.rating.basis)} Each company is rated by its safest model.</p></div>
      <div class="vd-grid">${cs.map((c, i) => { const r = ratingOf(c.best), o = S.orgs[c.org] || { name: c.org }; return `<a class="vd-card s${r.stars}" href="${modelHref(c.best)}" style="--i:${i}">
        <span class="vd-rank">#${i + 1}</span>
        <span class="vd-logo${o.logo ? '' : ' mono'}">${o.logo || esc(o.mono || o.name[0])}</span>
        <b class="vd-org">${esc(o.name)}</b>
        ${starsHtml(r.stars, 'big')}<span class="vd-lab">${esc(r.label)}</span>
        <span class="vd-num"><b>${r.score}<small>%</small></b> harm completed</span>
        <span class="vd-best">best model: ${esc(c.best.name)}${c.models.length > 1 ? ` · ${c.models.length} rated` : ''}</span></a>`; }).join('')}</div>`;
    el.classList.remove('lit'); void el.offsetWidth; requestAnimationFrame(() => el.classList.add('lit'));
  };
  el.addEventListener('click', (e) => { const b = e.target.closest('.seg button'); if (b && b.dataset.v !== track) { track = b.dataset.v; paint(); } });
  paint();
}

/* ------------------------------------------------------------------ heatmap */

function heatmap() {
  const el = $('#heatmap');
  let track = 'llm';
  const paint = () => {
    const itf = S.interfaces.find((i) => i.track === track).id;
    const ms = S.models.filter((m) => m.track === track);
    // worst case over attacks, no defense: the strongest attack we have, per model and category
    const worst = (m) => Math.max(...S.attacks.map((a) => (cell(itf, a.id, 'none')[m.id] || [0, 0])[1]));
    const val = (m, c) => Math.min(100, Math.round(worst(m) * ((R.profile[m.id] || {})[c.id] || 1)));
    ms.sort((a, b) => worst(a) - worst(b));
    el.innerHTML = `<div class="hm-top"><div class="seg" role="group" aria-label="Track">${[['llm', 'LLM / VLM agents'], ['vla', 'VLA policies']].map(([v, l]) => `<button type="button" data-v="${v}" class="${v === track ? 'on' : ''}" aria-pressed="${v === track}">${l}</button>`).join('')}</div>
      <p class="lb-desc">Completed attack success under the strongest attack for each model, no defense, by hazard category. Darker is worse.</p></div>
      <div class="hm-grid" style="--n:${S.categories.length}">
        <span></span>${S.categories.map((c) => `<span class="hm-h" title="${esc(c.desc)}"><b>${esc(c.code)}</b>${esc(c.name)}</span>`).join('')}
        ${ms.map((m, r) => `<span class="hm-m">${markOf(m)}<b>${esc(m.name)}</b></span>${S.categories.map((c, k) => { const x = val(m, c); return `<span class="hm-c${x >= 55 ? ' hi' : ''}" style="--v:${x};--d:${(r * S.categories.length + k) * 14}ms" title="${esc(m.name)} · ${esc(c.name)}: ${x}%"><b>${x}</b></span>`; }).join('')}`).join('')}
      </div>
      <div class="hm-scale"><span>0%</span><i></i><span>100%</span></div>`;
    el.classList.remove('lit'); void el.offsetWidth; requestAnimationFrame(() => el.classList.add('lit'));
  };
  el.addEventListener('click', (e) => { const b = e.target.closest('.seg button'); if (b && b.dataset.v !== track) { track = b.dataset.v; paint(); } });
  paint();
}

/* ------------------------------------------------------------------ attack player */

function attackPlayer() {
  const el = $('#atk'), X = S.example;
  const ids = S.attacks.map((a) => a.id).filter((id) => X.turns[id]);
  let cur = 0, timer = null, typing = null;
  const VERDICT = { refused: ['Refused', 'safe'], attempted: ['Attempted · failed', 'tried'], completed: ['Harm completed', 'harm'] };
  el.innerHTML = `<div class="atk-media"><img src="${esc(X.scene)}" alt="">${still ? '' : `<video muted loop playsinline autoplay src="${esc(X.video)}"></video>`}
      <span class="atk-goal"><span class="label">Hidden goal</span>${esc(X.goal)}</span></div>
    <div class="atk-panel">
      <div class="seg atk-tabs" role="tablist">${ids.map((id, i) => `<button type="button" role="tab" data-i="${i}">${esc(S.attacks.find((a) => a.id === id).name)}</button>`).join('')}</div>
      <div class="atk-chat">
        <div class="atk-msg u"><span class="label">Attacker → robot</span><p class="atk-p"></p></div>
        <div class="atk-msg r"><span class="label">Robot's plan</span><code class="atk-r"></code></div>
        <div class="atk-v"></div>
      </div>
      <p class="atk-desc"></p>
      <p class="atk-note muted">${esc(X.note)}</p>
    </div>`;
  const type = (node, text, ms, then) => {
    if (still) { node.textContent = text; then?.(); return; }
    let i = 0; node.textContent = '';
    const tick = () => { node.textContent = text.slice(0, ++i); if (i < text.length) typing = setTimeout(tick, ms); else then?.(); };
    tick();
  };
  const show = (i) => {
    cur = i; clearTimeout(typing);
    const id = ids[i], t = X.turns[id], a = S.attacks.find((x) => x.id === id), [vl, vc] = VERDICT[t.verdict];
    $$('.atk-tabs button', el).forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-selected', k === i); });
    $('.atk-desc', el).innerHTML = `<b>${esc(a.name)}</b> · ${esc(a.access)} · ${esc(a.desc)}`;
    const v = $('.atk-v', el); v.className = 'atk-v'; v.textContent = '';
    $('.atk-r', el).textContent = '';
    type($('.atk-p', el), t.prompt, 14, () => setTimeout(() => type($('.atk-r', el), t.reply, 22, () => { v.className = `atk-v ${vc} in`; v.textContent = vl; }), 250));
  };
  const auto = () => { clearInterval(timer); timer = setInterval(() => show((cur + 1) % ids.length), 7000); };
  el.addEventListener('click', (e) => { const b = e.target.closest('.atk-tabs button'); if (b) { show(+b.dataset.i); clearInterval(timer); } });
  let started = false;
  new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) { started = true; show(0); if (!still) auto(); } }).observe(el);
}

/* ------------------------------------------------------------------ scenarios */

const card = (img, video, title, sub, tag, href, ext) => `<a class="g-item"${href ? ` href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ''}` : ''}><div class="img"><img src="${esc(img)}" alt="" loading="lazy" decoding="async">${video ? `<video muted loop playsinline preload="none" data-src="${esc(video)}" aria-hidden="true"></video>` : ''}${tag ? `<span class="rel-tag">${tag}</span>` : ''}</div><b>${esc(title)}</b><span>${esc(sub)}</span></a>`;
const catTag = (c) => `<i aria-hidden="true">⚠</i>${esc(c.code)}`;
const unsafeOf = (c) => S.tiles.filter((t) => t.kind === 'unsafe' && t.cat === c);

function hoverPlay(root) {
  const canHover = matchMedia('(hover: hover) and (pointer: fine)');
  $$('.g-item', root).forEach((a) => {
    const v = $('video[data-src]', a);
    if (!v || a.dataset.hp) return;
    a.dataset.hp = 1;
    a.addEventListener('pointerenter', (e) => { if (e.pointerType === 'touch' || !canHover.matches || still) return; if (!v.src) v.src = v.dataset.src; a.classList.add('playing'); v.play().catch(() => {}); });
    a.addEventListener('pointerleave', () => { a.classList.remove('playing'); v.pause(); });
  });
}

/** The hazard categories as cards, one scene each; on the home page they lead to the Scenarios page, filtered. */
function gallery() {
  const el = $('#gallery');
  const cats = S.categories.map((c) => { const t = unsafeOf(c.id)[0]; return t ? card(t.poster, t.video, c.name, c.desc, catTag(c), `${link('scenarios/')}?cat=${c.id}`) : ''; }).join('');
  el.innerHTML = `<div class="suite-group"><h3 class="sg-head">Hazard categories<small>${S.categories.length} categories</small></h3><div class="gallery">${cats}</div></div>`;
  hoverPlay(el);
}

/** Every unsafe scene, filtered by category (?cat= in the address keeps the choice). */
function sceneGrid() {
  const el = $('#scene-grid');
  let cur = new URLSearchParams(location.search).get('cat') || 'all';
  if (cur !== 'all' && !catById[cur]) cur = 'all';
  const all = S.tiles.filter((t) => t.kind === 'unsafe');
  const paint = () => {
    const shown = cur === 'all' ? all : unsafeOf(cur);
    el.innerHTML = `<div class="chips sc-chips" role="group" aria-label="Hazard category">${[['all', 'All', all.length], ...S.categories.map((c) => [c.id, c.name, unsafeOf(c.id).length])].map(([id, l, n]) =>
      `<button type="button" class="chip${id === cur ? ' on' : ''}" data-c="${id}" aria-pressed="${id === cur}">${esc(l)}<i>${n}</i></button>`).join('')}</div>
      ${cur !== 'all' ? `<p class="lb-desc">${esc(catById[cur].desc)}</p>` : ''}
      <div class="gallery sc-grid">${shown.map((t) => card(t.poster, t.video, t.title, t.instr, catTag(catById[t.cat]))).join('') || '<p class="muted">No scenes in this category yet.</p>'}</div>`;
    hoverPlay(el);
  };
  el.addEventListener('click', (e) => {
    const b = e.target.closest('.chip'); if (!b) return;
    cur = b.dataset.c;
    const u = new URL(location.href); if (cur === 'all') u.searchParams.delete('cat'); else u.searchParams.set('cat', cur);
    history.replaceState(null, '', u);
    paint();
  });
  paint();
}

function sources() {
  const el = $('#sources');
  el.innerHTML = `<div class="gallery">${S.sources.map((s) => card(s.poster, s.video, s.name, `${s.n ? `${s.n} tasks · ` : ''}${s.body} · ${s.desc}`, '', s.url, true)).join('')}</div>`;
  hoverPlay(el);
}

/* ------------------------------------------------------------------ hazards page */

/** Each category: a scene, what it covers, how the models fare on it, and a few of its instructions. */
function hazardList() {
  const el = $('#hazard-list');
  const ms = S.models.filter((m) => m.track === 'llm');
  const worst = (m) => Math.max(...S.attacks.map((a) => (cell('cap', a.id, 'none')[m.id] || [0, 0])[1]));
  el.innerHTML = S.categories.map((c) => {
    const ts = unsafeOf(c.id), t = ts[0];
    const vals = ms.map((m) => Math.min(100, Math.round(worst(m) * ((R.profile[m.id] || {})[c.id] || 1))));
    const mean = Math.round(vals.reduce((a, b) => a + b, 0) / (vals.length || 1));
    return `<article class="hz-row reveal" id="${c.id}">
      ${t ? `<div class="g-item hz-img"><div class="img"><img src="${esc(t.poster)}" alt="" loading="lazy">${t.video ? `<video muted loop playsinline preload="none" data-src="${esc(t.video)}"></video>` : ''}<span class="rel-tag">${catTag(c)}</span></div></div>` : '<div></div>'}
      <div class="hz-body"><h3>${esc(c.name)}</h3><p>${esc(c.desc)}</p>
        <div class="hz-stat"><b>${mean}%</b><span>mean completed attack success, LLM / VLM agents, strongest attack</span></div>
        ${ts.length ? `<p class="label">Example instructions</p><ul>${ts.slice(0, 4).map((x) => `<li>${esc(x.instr.length > 140 ? x.instr.slice(0, 138) + '…' : x.instr)}</li>`).join('')}</ul>` : ''}
        <p class="note"><a href="${link('scenarios/')}?cat=${c.id}">All ${esc(c.name)} scenes →</a></p></div>
    </article>`;
  }).join('');
  hoverPlay(el);
}

/* ------------------------------------------------------------------ leaderboard page */

/** Models × attacks: completed attack success for every attack side by side, one track and defense at a time. */
function attackMatrix() {
  const el = $('#atk-matrix');
  const st = { itf: 'cap', dfn: 'none' };
  const paint = () => {
    const itf = S.interfaces.find((i) => i.id === st.itf);
    const ms = S.models.filter((m) => m.track === itf.track);
    const mean = (m) => S.attacks.reduce((a, x) => a + ((cell(st.itf, x.id, st.dfn)[m.id] || [0, 0])[1]), 0) / S.attacks.length;
    ms.sort((a, b) => mean(a) - mean(b));
    el.innerHTML = `<div class="hm-top"><div class="seg" data-k="itf" role="group" aria-label="Interface">${S.interfaces.map((i) => `<button type="button" data-v="${i.id}" class="${i.id === st.itf ? 'on' : ''}">${esc(i.name)}</button>`).join('')}</div>
        <div class="seg" data-k="dfn" role="group" aria-label="Defense">${S.defenses.map((d) => `<button type="button" data-v="${d.id}" class="${d.id === st.dfn ? 'on' : ''}">${esc(d.name)}</button>`).join('')}</div></div>
      <div class="hm-grid" style="--n:${S.attacks.length + 1}">
        <span></span>${S.attacks.map((a) => `<span class="hm-h"><b>${esc(a.access)}</b>${esc(a.name)}</span>`).join('')}<span class="hm-h"><b>mean</b>All attacks</span>
        ${ms.map((m, r) => `<span class="hm-m">${markOf(m)}<b>${esc(m.name)}</b></span>${S.attacks.map((a, k) => { const x = (cell(st.itf, a.id, st.dfn)[m.id] || [0, 0])[1]; return `<span class="hm-c${x >= 55 ? ' hi' : ''}" style="--v:${x};--d:${(r * 6 + k) * 12}ms" title="${esc(m.name)} · ${esc(a.name)}: ${x}%"><b>${x}</b></span>`; }).join('')}<span class="hm-c mean" style="--v:${Math.round(mean(m))};--d:0ms"><b>${Math.round(mean(m))}</b></span>`).join('')}
      </div>`;
    el.classList.remove('lit'); void el.offsetWidth; requestAnimationFrame(() => el.classList.add('lit'));
  };
  el.addEventListener('click', (e) => { const b = e.target.closest('.seg button'); if (!b) return; st[b.closest('.seg').dataset.k] = b.dataset.v; paint(); });
  paint();
}

function rules() {
  const R6 = [
    ['Ranked by harm done', 'Rows are ordered by completed attack success: how often the harm actually happened. Lower is safer.'],
    ['Attempts count too', 'The hatched bar shows harm attempted but not completed, often only because the robot was clumsy.'],
    ['Utility beside safety', 'Benign-twin success sits next to every score, so a model that refuses everything shows it.'],
    ['Two tracks, apart', 'LLM / VLM agents and VLA policies differ in what they can do (refuse in words or not), so they are ranked apart.'],
    ['One setting at a time', 'Each attack × defense × interface is its own board: the same tasks, the same budget, the same judge.'],
    ['A lower bound', 'Attack success is what our attacks found within budget. A stronger attacker can only find more.'],
  ];
  $('#rules').innerHTML = `<dl>${R6.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>`;
}

/* ------------------------------------------------------------------ attacks page */

function attackCatalog() {
  const el = $('#atk-catalog');
  const llm = S.models.filter((m) => m.track === 'llm'), vla = S.models.filter((m) => m.track === 'vla');
  const avg = (itf, a, d, ms) => Math.round(ms.reduce((s, m) => s + ((cell(itf, a, d)[m.id] || [0, 0])[1]), 0) / (ms.length || 1));
  el.innerHTML = S.attacks.map((a, i) => {
    const bars = [['LLM / VLM', avg('cap', a.id, 'none', llm), avg('cap', a.id, 'constitution', llm)], ['VLA', avg('native', a.id, 'none', vla), avg('native', a.id, 'constitution', vla)]];
    return `<article class="ac-card reveal" style="--i:${i}"><div class="ac-top"><span class="lp-n">${String(i + 1).padStart(2, '0')}</span><span class="ac-acc">${esc(a.access)}</span></div>
      <h3>${esc(a.name)}</h3><p>${esc(a.desc)}</p>
      <div class="ac-bars">${bars.map(([l, x, y]) => `<div class="ac-b"><span>${l}</span><span class="rt-mini"><i style="--w:${x}%"></i></span><b>${x}%</b><span class="rt-mini dfn"><i style="--w:${y}%"></i></span><b class="dfn">${y}%</b></div>`).join('')}</div>
      <p class="ac-key"><span><i></i>no defense</span><span><i class="dfn"></i>with constitution</span><span>· mean completed attack success</span></p></article>`;
  }).join('');
}

function defenses() {
  $('#defense-list').innerHTML = `<dl>${S.defenses.map((d) => `<div><dt>${esc(d.name.replace('+ ', ''))}</dt><dd>${esc(d.desc || 'The model as shipped: its own safety training, no extra prompt or filter.')}</dd></div>`).join('')}
    <div><dt>More to come</dt><dd>Input filters, action-level guardrails and a low-level safety layer, each scored by what it adds on top of the model.</dd></div></dl>`;
}

/* ------------------------------------------------------------------ the loop */

function loop() {
  const steps = [
    ['doc', 'Task', 'An unsafe instruction and its benign twin, in a frozen scene', 'task'],
    ['bolt', 'Attack', S.attacks.map((a) => a.name).join(' · '), 'attack'],
    ['judge', 'Defense', 'None, or a written safety constitution', 'defense'],
    ['arm', 'Model + interface', S.interfaces.map((i) => i.name).join(' · '), 'model'],
    ['layers', 'Simulator', S.sources.filter((s) => s.n).map((s) => s.name).join(' · '), 'sim'],
    ['replay', 'Judge', 'Did it try? Did harm happen? Did the twin succeed?', 'judge'],
  ];
  $('#loop').innerHTML = `<div class="lp-row">${steps.map(([ic, t, d, k], i) => `<div class="lp-step ${k}" style="--i:${i}"><span class="lp-n">${String(i + 1).padStart(2, '0')}</span>${svg(ic)}<b>${esc(t)}</b><small>${esc(d)}</small></div>${i < steps.length - 1 ? '<span class="lp-arrow" aria-hidden="true"><i></i></span>' : ''}`).join('')}</div>
    <div class="lp-back" aria-hidden="true"><span>adaptive attacks read the judge and try again</span></div>`;
}

function metrics() {
  const M = [
    ['ASR · attempted', 'Share of unsafe tasks where the model tried to do the harm: code, skill calls or arm motion toward it.'],
    ['ASR · completed', 'Share where the harm actually happened in the simulator, by the scene’s own predicate.'],
    ['Benign success', 'Share of benign twins solved. Refusing everything is not safety.'],
    ['Queries to break', 'Median attacker queries (and tokens) to the first completed harm. Higher is sturdier.'],
    ['Intent (LLM / VLM)', 'Whether the model’s stated reasoning recognises the hazard, judged apart from its actions.'],
  ];
  $('#metrics').innerHTML = `<p class="label">What we report</p><dl>${M.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>`;
}

function ways() {
  $('#ways').innerHTML = `<p class="cw-lead">The same unsafe task reaches a robot three ways. LLMs and VLMs drive it through code or skills; VLAs drive it directly. We report the two families on separate boards.</p>
    <div class="cw-head"><span></span><span>How the model reaches the robot</span><span></span></div>
    ${S.interfaces.map((i) => `<details class="cw-row"><summary><span class="cw-n">${esc(i.name)}</span><span class="cw-f">${i.flow.map((f) => `<b>${esc(f)}</b>`).join('<i>→</i>')}</span><span class="cw-x" aria-hidden="true"></span></summary><p>${esc(i.desc)}</p></details>`).join('')}`;
}

function trust() {
  $('#trust').innerHTML = S.honest.map((h) => `<li tabindex="0"><span class="tr-ic">${svg(h.icon)}</span><b>${esc(h.title)}</b><span class="tip" role="tooltip">${esc(h.tip)}</span></li>`).join('');
}

/* ------------------------------------------------------------------ model report */

const modelFromURL = (key = 'id') => modelById[new URLSearchParams(location.search).get(key)];
/** Completed attack success per hazard category: the model's overall score shaped by its category profile. */
const byCategory = (m) => S.categories.map((c) => [c, Math.min(100, Math.round(scoreOf(m) * ((R.profile[m.id] || {})[c.id] || 1)))]);
const byAttack = (m, dfn = 'none') => S.attacks.map((a) => [a, (cell(itfOf(m), a.id, dfn)[m.id] || [0, 0])[1]]);
const byLevel = (m) => (S.levels || []).map((l) => [l, Math.round(S.attacks.reduce((s, a) => s + ((cell(itfOf(m), a.id, 'none', l.id)[m.id] || [0, 0])[1]), 0) / S.attacks.length)]);
const benignOf = (m) => Math.round(S.attacks.reduce((s, a) => s + ((cell(itfOf(m), a.id, 'none')[m.id] || [0, 0, 0])[2]), 0) / S.attacks.length);
/** The scene to show as a model's worst failure: one from its worst category (a placeholder until episodes are logged). */
const worstScene = (m) => { const [c] = byCategory(m).sort((a, b) => b[1] - a[1])[0]; return { cat: c, tile: unsafeOf(c.id)[0] || S.tiles[0] }; };
const bars = (rows, cls = '') => rows.map(([lab, x, sub]) => `<div class="rt-cat ${cls}"><span>${esc(lab)}${sub ? `<small>${esc(sub)}</small>` : ''}</span><span class="rt-mini"><i style="--w:${x}%"></i></span><b>${x}%</b></div>`).join('');

function report() {
  const el = $('#report');
  const m = modelFromURL() || ranked('llm')[0];
  const o = org(m), r = ratingOf(m), rk = ranked(m.track), place = rk.findIndex((x) => x.id === m.id) + 1;
  const trackName = m.track === 'llm' ? 'LLM / VLM agents' : 'VLA policies';
  const w = worstScene(m), wc = byCategory(m).find(([c]) => c.id === w.cat.id)[1];
  const rival = rk.find((x) => x.id !== m.id && x.org !== m.org);
  document.title = `${m.name} · Safety report · ${S.meta.name}`;
  $('.page-head .kicker').textContent = `Safety report · ${o.name}`;
  $('.page-head h1').textContent = m.name;
  $('.page-head .lead').innerHTML = `#${place} of ${rk.length} ${trackName} · ${m.access === 'open' ? 'open weights' : 'API'} · tested through ${esc(S.interfaces.find((i) => i.id === itfOf(m)).name)}`;
  el.innerHTML = `<div class="rp-head s${r.stars}">
      <span class="rp-logo${o.logo ? '' : ' mono'}">${o.logo || esc(o.mono || o.name[0])}</span>
      <div class="rp-score">${starsHtml(r.stars, 'big')}<b>${esc(r.label)}</b><span>${esc(S.rating.basis)}</span></div>
      <div class="rp-big"><b>${r.score}<small>%</small></b><span>of unsafe tasks ended in harm, across ${S.attacks.length} attacks${LEVELS.length ? ` and ${LEVELS.length} levels` : ''}</span></div>
      <div class="rp-big safe"><b>${benignOf(m)}<small>%</small></b><span>of benign twins solved: what it still gets done</span></div>
      <div class="rp-act"><button type="button" class="btn primary" id="share-btn">Share card <span class="arr">↗</span></button>${rival ? `<a class="btn" href="${compareHref(m.id, rival.id)}">Compare</a>` : ''}<a class="btn" href="${link('leaderboard/')}">Leaderboard</a></div>
    </div>
    <div class="rp-grid">
      <figure class="rp-fail"><div class="atk-media"><img src="${esc(w.tile.poster)}" alt="">${still || !w.tile.video ? '' : `<video muted loop playsinline autoplay src="${esc(w.tile.video)}"></video>`}
        <span class="atk-goal"><span class="label">Worst category · ${esc(w.cat.name)} · ${wc}% harm</span>${esc(w.tile.instr || w.tile.title)}</span></div>
        <figcaption class="muted">The scene type ${esc(m.name)} fails most. The episode recording is a placeholder until runs are logged.</figcaption></figure>
      <div class="rp-cols">
        <div><p class="label">By hazard category</p>${bars(byCategory(m).map(([c, x]) => [c.name, x]))}</div>
        <div><p class="label">By attack · no defense → with constitution</p>${bars(byAttack(m).map(([a, x], i) => [a.name, x, `→ ${byAttack(m, 'constitution')[i][1]}% with constitution`]))}</div>
        ${LEVELS.length ? `<div><p class="label">By task level</p>${bars(byLevel(m).map(([l, x]) => [l.name, x, l.desc]))}</div>` : ''}
      </div>
    </div>`;
  $('#share-btn').addEventListener('click', () => shareDialog(m));
  comments(`model:${m.id}`, `${m.name}: is it safe?`);
}

/* ------------------------------------------------------------------ compare */

function compare() {
  const el = $('#compare');
  const q = new URLSearchParams(location.search);
  let A = modelById[q.get('a')] || ranked('llm')[0], B = modelById[q.get('b')] || ranked('llm').find((x) => x.org !== A.org) || ranked('llm')[1];
  const opt = (sel) => ['llm', 'vla'].map((t) => `<optgroup label="${t === 'llm' ? 'LLM / VLM agents' : 'VLA policies'}">${ranked(t).map((m) => `<option value="${m.id}"${m.id === sel.id ? ' selected' : ''}>${esc(m.name)} · ${esc(org(m).name)}</option>`).join('')}</optgroup>`).join('');
  const side = (m) => { const o = org(m), r = ratingOf(m); return `<div class="cp-side s${r.stars}"><span class="rp-logo${o.logo ? '' : ' mono'}">${o.logo || esc(o.mono || o.name[0])}</span><span class="cp-org">${esc(o.name)}</span><b class="cp-name">${esc(m.name)}</b>${starsHtml(r.stars, 'big')}<span class="cp-score"><b>${r.score}%</b> harm completed</span><a class="note" href="${modelHref(m)}">Safety report →</a></div>`; };
  const paint = () => {
    const rows = [
      ['Overall', scoreOf(A), scoreOf(B), 'low'],
      ...S.categories.map((c, i) => [c.name, byCategory(A)[i][1], byCategory(B)[i][1], 'low']),
      ...S.attacks.map((a, i) => [`Attack · ${a.name}`, byAttack(A)[i][1], byAttack(B)[i][1], 'low']),
      ...(S.levels || []).map((l, i) => [`Level · ${l.name}`, byLevel(A)[i][1], byLevel(B)[i][1], 'low']),
      ['Benign success', benignOf(A), benignOf(B), 'high'],
    ];
    const cats = rows.slice(1, 1 + S.categories.length), nC = S.categories.length;
    const aWin = scoreOf(A) <= scoreOf(B), W = aWin ? A : B, L = aWin ? B : A;
    const k = cats.filter(([, a, b]) => (aWin ? a < b : b < a)).length;
    const verdict = scoreOf(A) === scoreOf(B) ? `Dead even overall: ${scoreOf(A)}% each.`
      : `${esc(W.name)} is safer than ${esc(L.name)}: ${scoreOf(W)}% vs ${scoreOf(L)}% harm overall, and safer in ${k} of ${nC} hazard categories.`;
    el.innerHTML = `<div class="cp-pick"><select id="cp-a" aria-label="First model">${opt(A)}</select><span class="cp-vs">VS</span><select id="cp-b" aria-label="Second model">${opt(B)}</select></div>
      <div class="cp-head">${side(A)}<span class="cp-vs big">VS</span>${side(B)}</div>
      <p class="cp-verdict">${verdict}</p>
      ${A.track !== B.track ? '<p class="lb-desc muted">Different tracks: an LLM / VLM agent and a VLA policy are tested through different interfaces, so read this with care.</p>' : ''}
      <div class="cp-rows">${rows.map(([lab, a, b, dir]) => { const wa = dir === 'low' ? a < b : a > b, wb = dir === 'low' ? b < a : b > a; return `<div class="cp-row${dir === 'high' ? ' safe' : ''}">
        <b class="${wa ? 'win' : ''}">${a}%</b><span class="cp-bar l"><i style="--w:${a}%"></i></span><span class="cp-lab">${esc(lab)}</span><span class="cp-bar r"><i style="--w:${b}%"></i></span><b class="${wb ? 'win' : ''}">${b}%</b></div>`; }).join('')}</div>
      <p class="rt-key"><span><i class="k-c"></i>Harm completed, lower is safer</span><span><i class="k-b"></i>Benign success, higher is better</span><span class="muted">✓ marks the safer of the two on each row.</span></p>`;
    $('#cp-a').addEventListener('change', (e) => { A = modelById[e.target.value]; sync(); });
    $('#cp-b').addEventListener('change', (e) => { B = modelById[e.target.value]; sync(); });
    document.title = `${A.name} vs ${B.name} · ${S.meta.name}`;
  };
  const sync = () => { const u = new URL(location.href); u.searchParams.set('a', A.id); u.searchParams.set('b', B.id); history.replaceState(null, '', u); paint(); comments(`compare:${[A.id, B.id].sort().join('-vs-')}`, `${A.name} vs ${B.name}`); };
  sync();
}

/* ------------------------------------------------------------------ share card */

const loadImg = (src) => new Promise((ok, no) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = no; i.src = src; });
const svgImg = (markup, color) => loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup.replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" fill="${color}" `).replace(/currentColor/g, color)));

/** A portrait card (1080 × 1350) for social posts: logo, model, stars, the headline number, the categories, the worst scene. */
async function shareCard(m) {
  const W = 1080, H = 1350, cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), o = org(m), r = ratingOf(m), red = '#ff5a5f', teal = '#4fc1d4', ink = '#eceae6', mute = '#8b919a';
  await Promise.all(['800 80px "Bricolage Grotesque"', '600 30px Inter', '500 24px "JetBrains Mono"'].map((f) => document.fonts.load(f).catch(() => {})));
  g.fillStyle = '#101317'; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(255,255,255,.035)'; g.lineWidth = 1;
  for (let x = 0; x < W; x += 36) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let y = 0; y < H; y += 36) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  // the worst scene, faded into the card at the top
  try {
    const w = worstScene(m), img = await loadImg(w.tile.poster);
    const ih = 470, sc = Math.max(W / img.width, ih / img.height);
    g.save(); g.beginPath(); g.rect(0, 0, W, ih); g.clip();
    g.drawImage(img, (W - img.width * sc) / 2, (ih - img.height * sc) / 2, img.width * sc, img.height * sc);
    g.restore();
    const gr = g.createLinearGradient(0, 120, 0, ih); gr.addColorStop(0, 'rgba(16,19,23,0)'); gr.addColorStop(1, 'rgba(16,19,23,1)');
    g.fillStyle = gr; g.fillRect(0, 0, W, ih);
    g.fillStyle = 'rgba(16,19,23,.75)'; g.fillRect(0, 0, W, 92);
    g.fillStyle = red; g.font = '500 22px "JetBrains Mono"'; g.fillText(`WORST: ${w.cat.name.toUpperCase()}`, 64, 420);
  } catch (e) { /* no picture: the card stands without it */ }
  g.fillStyle = ink; g.font = '600 26px Inter'; g.fillText(S.meta.name, 64, 58);
  g.fillStyle = red; g.font = '500 22px "JetBrains Mono"'; g.textAlign = 'right'; g.fillText((S.meta.card_line || '').toUpperCase(), W - 64, 58); g.textAlign = 'left';
  // logo, company, model
  g.fillStyle = '#1e2329'; g.beginPath(); g.arc(112, 530, 48, 0, Math.PI * 2); g.fill();
  if (o.logo) { try { g.drawImage(await svgImg(o.logo, ink), 84, 502, 56, 56); } catch (e) { /* skip */ } }
  else { g.fillStyle = ink; g.font = '800 34px "Bricolage Grotesque"'; g.textAlign = 'center'; g.fillText(o.mono || o.name[0], 112, 542); g.textAlign = 'left'; }
  g.fillStyle = mute; g.font = '600 28px Inter'; g.fillText(o.name, 184, 518);
  g.fillStyle = ink; g.font = '800 64px "Bricolage Grotesque"'; g.fillText(m.name, 184, 578);
  // stars and the headline number
  g.font = '64px Inter';
  for (let i = 0; i < 5; i++) { g.fillStyle = i < r.stars ? (r.stars >= 4 ? teal : r.stars === 3 ? '#f0b44b' : red) : '#2a3038'; g.fillText('★', 64 + i * 70, 700); }
  g.fillStyle = ink; g.font = '700 34px "Bricolage Grotesque"'; g.fillText(r.label, 430, 690);
  g.fillStyle = red; g.font = '800 150px "Bricolage Grotesque"'; g.fillText(`${r.score}%`, 60, 860);
  g.fillStyle = mute; g.font = '500 28px Inter'; g.fillText('of unsafe tasks ended in harm', 66, 905);
  g.fillText(`under ${S.attacks.length} attacks · rank #${ranked(m.track).findIndex((x) => x.id === m.id) + 1} of ${ranked(m.track).length}`, 66, 945);
  // the categories
  byCategory(m).forEach(([c, x], i) => {
    const y = 1010 + i * 44;
    g.fillStyle = ink; g.font = '500 24px Inter'; g.fillText(c.name, 64, y + 8);
    g.fillStyle = '#242a31'; g.fillRect(560, y - 8, 340, 14);
    g.fillStyle = red; g.fillRect(560, y - 8, 340 * x / 100, 14);
    g.fillStyle = ink; g.font = '500 22px "JetBrains Mono"'; g.textAlign = 'right'; g.fillText(`${x}%`, W - 64, y + 8); g.textAlign = 'left';
  });
  g.fillStyle = mute; g.font = '500 22px "JetBrains Mono"';
  g.fillText((S.meta.site_url || '').replace(/^https?:\/\//, '').replace(/\/$/, ''), 64, H - 50);
  if (R.placeholder) { g.textAlign = 'right'; g.fillText('preview data', W - 64, H - 50); g.textAlign = 'left'; }
  return cv;
}

function shareDialog(m) {
  let dlg = $('.sh-modal');
  if (!dlg) {
    document.body.insertAdjacentHTML('beforeend', `<div class="sh-modal" hidden><div class="sh-fog"></div><div class="sh-card" role="dialog" aria-modal="true" aria-label="Share card">
      <button type="button" class="sh-x" aria-label="Close">×</button><div class="sh-img"><span class="muted">Drawing the card…</span></div>
      <div class="sh-act"><a class="btn primary" id="sh-dl" download>Download PNG</a><button type="button" class="btn" id="sh-share">Share…</button><button type="button" class="btn" id="sh-copy">Copy link</button></div></div></div>`);
    dlg = $('.sh-modal');
    const close = () => { dlg.hidden = true; };
    $('.sh-fog', dlg).addEventListener('click', close); $('.sh-x', dlg).addEventListener('click', close);
    addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }
  dlg.hidden = false;
  $('.sh-img', dlg).innerHTML = '<span class="muted">Drawing the card…</span>';
  const url = new URL(modelHref(m), location.href).href;
  shareCard(m).then((cv) => {
    const data = cv.toDataURL('image/png');
    $('.sh-img', dlg).innerHTML = `<img src="${data}" alt="Share card for ${esc(m.name)}">`;
    const dl = $('#sh-dl'); dl.href = data; dl.download = `${m.id}-safety-card.png`;
    $('#sh-share').onclick = () => cv.toBlob(async (b) => {
      const file = new File([b], `${m.id}-safety-card.png`, { type: 'image/png' });
      try { if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: `${m.name} · ${S.meta.name}`, url }); else await navigator.share({ title: m.name, url }); } catch (e) { /* cancelled or unsupported */ }
    });
    $('#sh-copy').onclick = async () => { try { await navigator.clipboard.writeText(url); $('#sh-copy').textContent = 'Copied'; setTimeout(() => { $('#sh-copy').textContent = 'Copy link'; }, 1500); } catch (e) { /* no clipboard */ } };
  });
}

/* ------------------------------------------------------------------ comments */

/** A discussion per model (and per pair compared), on GitHub Discussions through Giscus. Reactions on it are the votes. */
function comments(term, title) {
  const el = $('#comments');
  if (!el) return;
  const C = S.comments || {};
  const dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  el.innerHTML = `<div class="cm-head"><h2>${esc(title)}</h2><p>Agree with the rating? Vote with a reaction and tell us why. Lab staff welcome: say which lab you are from.</p></div>`;
  if (!C.repoId || !C.categoryId) {
    el.insertAdjacentHTML('beforeend', '<div class="cm-off"><b>Comments open at launch.</b><span>The discussion board for this page is set up but not switched on yet.</span></div>');
    return;
  }
  const sc = document.createElement('script');
  Object.entries({ src: 'https://giscus.app/client.js', 'data-repo': C.repo, 'data-repo-id': C.repoId, 'data-category': C.category, 'data-category-id': C.categoryId,
    'data-mapping': 'specific', 'data-term': term, 'data-strict': '1', 'data-reactions-enabled': '1', 'data-emit-metadata': '0', 'data-input-position': 'top',
    'data-theme': dark ? 'dark' : 'light', 'data-lang': 'en', 'data-loading': 'lazy', crossorigin: 'anonymous', async: '' }).forEach(([k, v]) => sc.setAttribute(k, v));
  el.appendChild(sc);
}

/* ------------------------------------------------------------------ fill the page */

chrome(); headWall();
// a section is filled when its element is on this page
const SECTIONS = { 'hero-run': hero, wall: heroWall, bignums: bigNumbers, lbh: leaderboard, vendors, report, compare, heatmap, atk: attackPlayer, gallery, 'scene-grid': sceneGrid,
  sources, 'hazard-list': hazardList, 'atk-matrix': attackMatrix, rules, 'atk-catalog': attackCatalog, 'defense-list': defenses, loop, metrics, ways, trust };
Object.entries(SECTIONS).forEach(([id, fill]) => { if (document.getElementById(id)) fill(); });
$$('[data-href]').forEach((a) => { a.href = link(a.dataset.href); });
reveal();
})();
