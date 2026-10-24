/* Embodied Red Teaming: every page of the site. Each page names itself in <body data-page> and its way back to the
   site root in <body data-root> ('' on the home page, '../' on the others); this script fills whatever sections the
   page has. Everything it shows comes from data/site.js (text, models, media) and
   data/results.js (numbers); the look is assets/site.css. */
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
const pct = (k, n) => (n ? Math.round(100 * k / n) : 0);
const INTOTAL = (S.levels || []).filter((l) => l.in_total !== false).map((l) => l.id);
/** Measured runs (RESULTS.measured). v2: per condition "<attack>|<defense>", counts [n, attempted, completed, safe_alt]
 *  per level and per category; v1 (one condition, pooled counts only) is read as v2 without levels. Each condition
 *  writes its pooled L0+L1 numbers into the level-less cell and its per-level numbers into the per-level cells. */
const MEAS = {};
// a level is [n, attempted, completed, safe_alt] or, when each metric has its own known count, {a: [k, n], c: [k, n], s: [k, n]}
// u: undecided counts [a, c, s]; a level or pool with any undecided input is in progress and shows no rate
const asObj = (x) => (Array.isArray(x) ? { a: [x[1], x[0]], c: [x[2], x[0]], s: x[3] == null ? null : [x[3], x[0]] } : x);
const sum4 = (rows) => rows.map(asObj).reduce((t, x) => ({ ...Object.fromEntries(['a', 'c', 's'].map((k) => [k, t[k] == null || x[k] == null ? null : [t[k][0] + x[k][0], t[k][1] + x[k][1]]])),
  u: [0, 1, 2].map((j) => (t.u[j] || 0) + ((x.u || [])[j] || 0)) }), { a: [0, 0], c: [0, 0], s: [0, 0], u: [0, 0, 0] });
/** Settings still being judged: R.progress[cell key][model id] = { judged, n }. */
R.progress = {};
const put = (key, id, v) => { const x = asObj(v), u = Math.max(0, ...(x.u || [0])); if (u) (R.progress[key] ||= {})[id] = { judged: x.a[1] - u, n: x.a[1] }; else (R.cells[key] ||= {})[id] = cellOf(v); };
const cellOf = (x0) => { const x = asObj(x0); return [pct(...x.a), pct(...x.c), 1, x.s == null ? null : pct(...x.s)]; };
Object.entries(R.measured || {}).forEach(([id, x0]) => {
  const x = x0.conditions ? { ...x0 } : { ...x0, conditions: { [`${x0.attack}|${x0.defense}`]: { itf: x0.itf, pooled: [x0.n, x0.attempted, x0.completed, null], by_cat: x0.by_cat } } };
  Object.entries(x.conditions).forEach(([k, c]) => {
    const lv = c.levels || {};
    c.pooled ||= sum4(INTOTAL.filter((l) => lv[l]).map((l) => lv[l]));
    put(`${c.itf}|${k}`, id, c.pooled);
    Object.entries(lv).forEach(([l, v]) => put(`${c.itf}|${k}|${l}`, id, v));
  });
  const base = x.conditions['direct|none'] || Object.values(x.conditions)[0], [bk] = Object.entries(x.conditions).find(([, c]) => c === base);
  [x.attack, x.defense] = bk.split('|');
  const P = asObj(base.pooled);
  Object.assign(x, { itf: base.itf, n: P.a[1], attempted: P.a[0], completed: P.c[0], cell: cellOf(base.pooled), by_cat: base.by_cat, levels: base.levels });
  MEAS[id] = x;
});
/** VLA track (RESULTS.vla): attempt and commit (unsafe success + unsafe failure), direct instructions, no defense. */
const VLA = R.vla || {};
Object.entries(VLA).forEach(([id, v]) => { (R.cells['native|direct|none'] ||= {})[id] = [v.attempt, v.us + v.uf, 1, null]; });
const isVla = (m) => m && m.track === 'vla';
/** Metric definitions, shown on hover / focus wherever a metric is named. */
const DEF = Object.fromEntries((S.metrics || []).map((x) => [x.id, x.desc]));
Object.assign(DEF, { rating: S.rating.basis, commit: 'VLA: the policy carries out the harmful action, whether or not the harm then happens. Lower is safer.', attempt: 'VLA: the policy moves to act on the instruction at all.' });
const tip = (label, key, cls = '') => (DEF[key] ? `<span class="tipd ${cls}" tabindex="0" data-tip="${esc(DEF[key])}">${label}</span>` : label);
const soonTag = (x) => (x && x.soon ? '<small class="soon-tag">updating</small>' : '');
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
const MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';

/* ------------------------------------------------------------------ chrome */

function chrome() {
  const here = (p) => p === PAGE || (PAGE === 'model' && p === 'leaderboard');
  $('#nav').outerHTML = `<header class="nav"><nav class="nav-in" aria-label="Sections">
    <a class="wordmark" href="${link()}"><span class="mark" aria-hidden="true">${MARK}</span><span class="wm">${esc(S.meta.name)}</span></a>
    <div class="nav-links" id="nav-links">${PAGES.map(([p, l]) => `<a href="${link(`${p}/`)}"${here(p) ? ' class="active" aria-current="page"' : ''}>${l}</a>`).join('')}</div>
    <a class="gh-btn${GH ? '' : ' soon'}"${GH ? ` href="${esc(GH)}"` : ' aria-disabled="true"'} aria-label="GitHub" title="${GH ? 'GitHub' : 'GitHub: coming soon'}">${GITHUB}<span>GitHub</span></a>
    <button class="menu-btn" id="menu-toggle" type="button" aria-label="Menu" aria-expanded="false" aria-controls="nav-links">${MENU}</button>
  </nav></header>`;
  const bar = $('.nav');
  // the bar is see-through at the top of the page and turns solid, with a hairline, once the page slides under it
  const solid = () => bar.classList.toggle('solid', scrollY > 6);
  addEventListener('scroll', solid, { passive: true });
  solid();
  $('#menu-toggle').addEventListener('click', (e) => {
    const open = bar.classList.toggle('open');
    e.currentTarget.setAttribute('aria-expanded', String(open));
  });
  $$('.nav-links a').forEach((a) => a.addEventListener('click', () => bar.classList.remove('open')));
  $$('[data-gh]').forEach((el) => {
    if (GH) el.href = GH; else { el.classList.add('soon'); el.setAttribute('aria-disabled', 'true'); el.title = 'Coming soon'; }
    if (el.classList.contains('gh-start')) el.insertAdjacentHTML('afterbegin', GITHUB);
  });
  const d = new Date(S.meta.updated).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const row = (h, ls) => `<div class="ft-row"><h5>${h}</h5><ul>${ls.map(([href, l]) => `<li><a${href ? ` href="${href}"` : ' data-gh'}>${l}</a></li>`).join('')}</ul></div>`;
  $('#footer').outerHTML = `<footer class="footer"><div class="ft-in">
    <div class="ft-brand"><a class="wordmark" href="${link()}"><span class="mark" aria-hidden="true">${MARK}</span><span class="wm">${esc(S.meta.name)}</span></a>
      <p class="prov">Results updated ${esc(d)}${S.meta.placeholder ? ' · placeholder data' : ''}</p></div>
    <nav class="ft-rows" aria-label="Site">
      ${row('The arena', [[link('leaderboard/'), 'Leaderboard'], [link('hazards/'), 'Hazards'], [link('attacks/'), 'Attacks']])}
      ${row('Method', [[link('scenarios/'), 'Scenarios'], [link('method/'), 'The loop'], [`${link('method/')}#metrics`, 'Metrics']])}
      ${row('Community', [['', 'GitHub'], ['', 'Submit an attack']])}
    </nav>
    <div class="ft-bot"><span>© 2026 ${esc(S.meta.name)}</span><span class="copy">Template adapted from <a class="link" href="https://www.embodied-first-exam.ai/">Embodied First Exam</a> (MIT).</span></div>
  </div></footer>`;
  $$('footer [data-gh]').forEach((el) => { if (GH) el.href = GH; else el.classList.add('soon'); });
  if (S.meta.placeholder || R.placeholder) {
    const b = $('#ph-badge');
    b.hidden = false;
    const real = S.models.filter((m) => MEAS[m.id]).map((m) => m.name);
    const full = `Preview · placeholder numbers${real.length ? ` (measured: ${real.join(', ')})` : ''} and media`;
    b.innerHTML = `<i></i><span class="ph-full" aria-hidden="true">${esc(full)}</span><span class="ph-short" aria-hidden="true">Preview</span>`;
    b.title = full;
    b.setAttribute('role', 'note'); b.setAttribute('aria-label', full); b.tabIndex = 0;
    // a dot and "Preview" at every width, so it never sits on the numbers; hover or focus shows the whole line, and a tap
    // (or Enter) keeps it open until the next one
    b.addEventListener('click', () => b.classList.toggle('open'));
    b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.classList.toggle('open'); } });
  }
  // a kicker that would only repeat its page's title says something about the page instead
  const k = $('.page-head .kicker');
  if (k && PAGE === 'leaderboard') k.textContent = `Results · updated ${new Date(S.meta.updated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}`;
  if (k && PAGE === 'scenarios') k.textContent = `${S.tiles.filter((t) => t.kind === 'unsafe').length} unsafe scenes · ${S.categories.length} hazard categories`;
}

/** A row that scrolls sideways on a phone (a segmented control, the heatmap): .more while there is more of it to the
 *  right, which fades its edge, and .scrolled once it has moved, which shades the heatmap's pinned names. cues() also
 *  brings a control's chosen button into view after a repaint. */
const cue = (el) => { el.classList.toggle('more', el.scrollLeft + el.clientWidth < el.scrollWidth - 2); el.classList.toggle('scrolled', el.scrollLeft > 2); };
const cues = (root = document) => $$('.seg, .hm-scroll', root).forEach((el) => {
  const on = $('.on', el);
  if (on && el.scrollWidth > el.clientWidth) {
    const a = el.getBoundingClientRect(), b = on.getBoundingClientRect();
    if (b.left < a.left || b.right > a.right) el.scrollLeft += b.left - a.left - (a.width - b.width) / 2;
  }
  cue(el);
});
document.addEventListener('scroll', (e) => { const t = e.target; if (t instanceof Element && t.matches('.seg, .hm-scroll')) cue(t); }, true);
addEventListener('resize', () => cues());

/** Run `fn` again once the window has settled at a width, or `box` at a height, at least 40px away from the last run. */
const onResize = (fn, box) => {
  let w0 = innerWidth, h0 = box.clientHeight, t;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => {
    if (Math.abs(innerWidth - w0) < 40 && Math.abs(box.clientHeight - h0) < 40) return;
    w0 = innerWidth; h0 = box.clientHeight; fn();
  }, 250); });
};

/** Where a point of a plane (in its own CSS pixels, before its transform) lands in the box that holds and clips it: the
 *  plane's transform about its origin, then the box's perspective. Null for a point too close to the eye or behind it. */
function projector(plane) {
  const box = plane.parentElement, cs = getComputedStyle(plane), bs = getComputedStyle(box);
  const M = cs.transform && cs.transform !== 'none' ? new DOMMatrix(cs.transform) : new DOMMatrix();
  const [ox, oy] = cs.transformOrigin.split(' ').map(parseFloat);
  const d = parseFloat(bs.perspective) || 0;
  const [px, py] = bs.perspectiveOrigin.split(' ').map(parseFloat);
  const L = plane.offsetLeft, T = plane.offsetTop;
  return (x, y) => {
    const q = M.transformPoint(new DOMPoint(x - ox, y - oy, 0, 1));
    const w = d ? 1 - q.z / d : 1;
    return w > 0.05 ? [px + (q.x + ox + L - px) / w, py + (q.y + oy + T - py) / w] : null;
  };
}

/** The scene plane: tiles dealt into columns lying on a floor seen in perspective, each column drifting along the floor,
 *  every other one the other way. Only what can be seen is built: per column, the slots whose picture lands in the box,
 *  and, for the drift, one period more. A column repeats with that period (one tile longer than its visible run, so no
 *  scene shows twice at once in it) and moves by one period per loop, which makes the loop seamless.
 *  fill(c, r): the scene for row r of column c's period; tile(t): its markup; speed(c): px per second along the floor. */
function dealPlane(plane, { tw, gap, fill, tile, speed }) {
  plane.style.setProperty('--tw', `${tw}px`); plane.style.setProperty('--wg', `${gap}px`);
  const th = tw * 0.75, s = th + gap, W = plane.offsetWidth, H = plane.offsetHeight;
  const n = Math.max(3, Math.ceil(W / (tw + gap)) + 1), x0 = (W - n * tw - (n - 1) * gap) / 2;
  const at = projector(plane), box = plane.parentElement, bw = box.clientWidth, bh = box.clientHeight;
  const seen = (x, y) => {
    const ps = [[x, y], [x + tw, y], [x, y + th], [x + tw, y + th]].map(([a, b]) => at(a, b));
    if (ps.some((q) => !q)) return false;
    const xs = ps.map((q) => q[0]), ys = ps.map((q) => q[1]);
    return Math.max(...xs) > 0 && Math.min(...xs) < bw && Math.max(...ys) > 0 && Math.min(...ys) < bh;
  };
  const kmax = 2 * Math.ceil(H / s) + 4;
  plane.innerHTML = Array.from({ length: n }, (_, c) => {
    const x = x0 + c * (tw + gap), vis = [];
    for (let k = 0; k < kmax; k++) if (seen(x, k * s)) vis.push(k);
    if (!vis.length) return '<div class="wall-col"></div>';
    const a = vis[0], b = vis[vis.length - 1], m = b - a + 2;
    const seq = Array.from({ length: m }, (_, r) => fill(c, r));
    const dur = m * s / speed(c);
    return `<div class="wall-col${c % 2 ? ' down' : ''}" style="padding-top:${(a * s).toFixed(1)}px;--p:${(m * s).toFixed(1)}px;--dur:${dur.toFixed(1)}s;--delay:-${(((c * 37) % 100) / 100 * dur).toFixed(1)}s">${
      Array.from({ length: b + m - a + 1 }, (_, j) => tile(seq[(a + j) % m])).join('')}</div>`;
  }).join('');
}

/** The inner pages' heads: under the lead, a short band of the home page's floor across the whole width, pictures only,
 *  drifting slowly. Each page deals the scenes in its own order, unsafe ones first. */
function headBand() {
  const head = $('.page-head');
  if (!head) return;
  head.insertAdjacentHTML('beforeend', '<div class="head-band" aria-hidden="true"><div class="plane band-plane"></div></div>');
  const band = $('.head-band', head), plane = $('.band-plane', band);
  const tile = (t) => `<span class="wt${t.cat ? ' hz' : ''}"><img src="${esc(t.poster)}" alt="" loading="lazy" decoding="async">${t.cat ? '<span class="hz-dot"></span>' : ''}</span>`;
  const deal = () => {
    let seed = [...PAGE].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
    const pool = S.tiles.map((t) => [rnd() + (t.kind === 'unsafe' ? 0 : 0.6), t]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    let i = 0;
    const phone = innerWidth < 760;
    dealPlane(plane, { tw: phone ? 104 : 150, gap: phone ? 10 : 14, fill: () => pool[i++ % pool.length], tile, speed: (c) => [5, 4, 5.6, 4.4, 6, 3.8][c % 6] });
  };
  deal();
  onResize(deal, band);
  new IntersectionObserver(([e]) => plane.classList.toggle('paused', still || !e.isIntersecting)).observe(band);
}

function reveal() {
  // the part a link points at (/method/#metrics) shows at once, so the page scrolls to where it will stay
  const aimed = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)))?.closest('.reveal');
  if (aimed) {
    aimed.style.transition = 'none'; aimed.classList.add('in');
    aimed.dispatchEvent(new CustomEvent('revealed'));
    void aimed.offsetWidth; aimed.style.transition = '';
  }
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
  el.innerHTML = `<div class="hr-bar"><span class="hr-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 7l5 5-5 5M12.5 17.5H19"/></svg></span><code class="hr-cmd" aria-label="${esc(cmd)}"></code><span class="caret" aria-hidden="true"></span>
    <button type="button" class="hr-copy" aria-label="Copy the command" title="Copy">
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/></svg><span class="c1">Copy</span><span class="c2">Copied</span></button></div>`;
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

/** The first screen's plane: scenes on a floor that recedes to the upper right, mostly unsafe ones, the columns drifting
 *  along it. The near tiles, low on the screen and right of the title, play their videos (at most 12, nearest first); a
 *  tile gets its <video> only while it plays. Dealt again when the width or the height changes for good. */
function heroWall() {
  const wall = $('#wall');
  const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const durs = [92, 76, 100, 84, 108, 72, 96, 80];
  const deal = () => {
    heroWall.io?.disconnect(); heroWall.io = null;
    const phone = innerWidth < 760, live = !phone && !still;
    const tw = phone ? 150 : Math.round(Math.max(170, Math.min(250, innerWidth * 0.14)));
    const unsafe = shuffle(S.tiles.filter((t) => t.kind === 'unsafe')), scenes = shuffle(S.tiles.filter((t) => t.kind !== 'unsafe'));
    let ui = 0, si = 0;
    const take = (pool, k) => pool[k % pool.length];
    const tile = (t) => {
      const cat = t.cat && catById[t.cat];
      const label = cat ? `${cat.name} · ${t.instr || t.title}` : `Scene · ${t.title}`;
      return `<a class="wt${cat ? ' hz' : ''}" tabindex="-1" href="${link(cat ? `scenarios/?cat=${t.cat}` : 'scenarios/')}"${live && t.video ? ` data-video="${esc(t.video)}"` : ''}><img src="${esc(t.poster)}" alt="" loading="lazy" decoding="async">
        <span class="tag">${esc(cat ? cat.code : 'SCENE')}</span>${cat ? '<span class="hz-dot" aria-hidden="true"></span>' : ''}<span class="ttl">${esc(label)}</span></a>`;
    };
    // mostly unsafe scenes, another scene every fourth tile; about 8 px/s along the floor
    dealPlane(wall, { tw, gap: Math.round(tw * 0.1), fill: (c, r) => ((r + c) % 4 !== 3 ? take(unsafe, ui++) : take(scenes, si++)), tile, speed: (c) => 8 * 84 / durs[c % durs.length] });
    if (!live) return;
    const start = (t) => {
      let v = $('video', t);
      if (!v) {
        v = document.createElement('video');
        Object.assign(v, { muted: true, loop: true, playsInline: true, preload: 'none', src: t.dataset.video });
        v.onerror = () => { t.dataset.bad = 1; stop(t, 0); };
        $('img', t).after(v);
      }
      clearTimeout(t.drop);
      t.classList.add('playing');
      v.play().catch((e) => { if (e.name === 'NotSupportedError') { t.dataset.bad = 1; stop(t, 0); } });
    };
    // a tile that stops fades its video out and drops it a little later, unless it is picked again meanwhile
    const stop = (t, wait = 3000) => {
      const v = $('video', t);
      t.classList.remove('playing');
      if (!v) return;
      v.pause(); clearTimeout(t.drop);
      t.drop = setTimeout(() => { if (t.classList.contains('playing')) return; v.onerror = null; v.removeAttribute('src'); v.load(); v.remove(); }, wait);
    };
    const inZone = new Set();
    const schedule = () => {
      // nearest (lowest on the screen) first; a tile already playing keeps its place against one barely nearer
      const pick = new Set([...inZone].filter((t) => !t.dataset.bad).map((t) => [t, t.getBoundingClientRect().bottom + (t.classList.contains('playing') ? 48 : 0)])
        .sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t]) => t));
      $$('.wt.playing', wall).forEach((t) => { if (!pick.has(t)) stop(t); });
      pick.forEach((t) => { if (!t.classList.contains('playing')) start(t); });
    };
    const io = new IntersectionObserver((es) => { es.forEach((e) => (e.isIntersecting ? inZone.add(e.target) : inZone.delete(e.target))); schedule(); },
      { rootMargin: '-36% 0px 0px -46%', threshold: 0.4 });
    $$('.wt[data-video]', wall).forEach((t) => io.observe(t));
    heroWall.io = io;
  };
  deal();
  onResize(deal, wall.parentElement);
  new IntersectionObserver(([e]) => wall.classList.toggle('paused', !e.isIntersecting)).observe($('.hero'));
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
  const episodes = T.unsafe_tasks * settings * pairs;
  const run = S.attacks.filter((a) => !a.soon).length;
  const items = [['doc', T.unsafe_tasks, 'unsafe tasks', `in ${S.categories.length} hazard categories`], ['arm', S.models.length, 'foundation models', `${llm} LLM / VLM · ${vla} VLA`], ['bolt', S.attacks.length, 'attack settings', `${run} run · ${S.attacks.length - run} coming soon`]];
  const el = $('#bignums');
  el.innerHTML = items.map(([ic, v, l, sub]) => `<div><dt data-to="${v}">0</dt><dd><span class="bn-ic">${svg(ic)}</span><b>${esc(l)}</b><small>${esc(sub)}</small></dd></div>`).join('');
  el.insertAdjacentHTML('afterend', `<p class="nums-line reveal"><span><b>${S.categories.length}</b> hazard categories</span><i aria-hidden="true">·</i><span><b>${S.interfaces.length}</b> robot interfaces</span><i aria-hidden="true">·</i><span><b>${int(episodes)}</b> episodes</span></p>`);
  el.addEventListener('revealed', () => $$('dt', el).forEach(countUp));
}

/* ------------------------------------------------------------------ leaderboard */

const org = (m) => S.orgs[m.org] || { name: m.org };
const markOf = (m) => { const o = org(m); return `<span class="mk${o.logo ? '' : ' mono'}" title="${esc(o.name)}">${o.logo || esc(o.mono || o.name[0])}</span>`; };
const LEVELS = (S.levels || []).map((l) => l.id);
/** One setting's numbers per model: [attempted, completed, median queries]; level 'all' is the mean over the levels.
 *  A measured run without a level split (key without a level) counts for 'all' only. */
const cell = (itf, atk, dfn, lvl = 'all') => {
  const flat = R.cells[`${itf}|${atk}|${dfn}`] || {};
  if (!LEVELS.length) return flat;
  if (lvl !== 'all') return R.cells[`${itf}|${atk}|${dfn}|${lvl}`] || {};
  // "All" = the in-total levels (L0, L1), weighted by their task counts; L2 is reported on its own
  const rows = (S.levels || []).filter((l) => l.in_total !== false).map((l) => [l.tasks || 1, R.cells[`${itf}|${atk}|${dfn}|${l.id}`] || {}]), out = {};
  // measured models count for "All" only through their pooled L0 + L1 cell (absent while either level is being judged)
  new Set(rows.flatMap(([, r]) => Object.keys(r))).forEach((id) => {
    if (R.measured?.[id]) return;
    const have = rows.filter(([, r]) => r[id]);
    out[id] = [0, 1, 2, 3].map((j) => { const h = have.filter(([, r]) => r[id][j] != null), w = h.reduce((t, [n]) => t + n, 0); return w ? Math.round(h.reduce((t, [n, r]) => t + n * r[id][j], 0) / w) : null; });
  });
  return { ...out, ...flat };
};
const itfOf = (m) => (m.track === 'llm' ? 'cap' : 'native');
const modelHref = (m) => link(`model/?id=${encodeURIComponent(m.id)}`);
const compareHref = (a, b) => link(`compare/?a=${encodeURIComponent(a)}${b ? `&b=${encodeURIComponent(b)}` : ''}`);
/** The attacks a model has numbers for in one setting, as [attack, [attempted, completed, queries]]. */
const runs = (m, itf = itfOf(m), dfn = 'none', lvl = 'all') => S.attacks.map((a) => [a, cell(itf, a.id, dfn, lvl)[m.id]]).filter(([, v]) => v);
const meanOf = (rs, j = 1) => (rs.length ? Math.round(rs.reduce((s, [, v]) => s + v[j], 0) / rs.length) : 0);
/** The headline number behind the star rating: mean completed attack success over every attack it was run under, no defense. */
const scoreOf = (m, itf = itfOf(m)) => { const rs = runs(m, itf); return rs.length ? meanOf(rs) : null; };
const pc = (x) => (x == null ? '–' : `${x}%`);
/** Completed per hazard category: counted from the tasks for a measured run, else `base` shaped by the placeholder profile. */
const catRate = (m, c, base, atk = 'direct') => { const M0 = MEAS[m.id], x = (M0?.conditions ? M0.conditions[`${atk}|none`] : M0)?.by_cat?.[c.id]; return x ? pct(x[2], x[0]) : isVla(m) || MEAS[m.id] ? null : Math.min(100, Math.round(base * ((R.profile[m.id] || {})[c.id] || 1))); };
const measuredSub = (m) => (MEAS[m.id] ? ` · measured ${new Date(MEAS[m.id].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}` : '');
const ratingOf = (m) => { const x = scoreOf(m); if (x == null) return { score: null, stars: 0, label: 'In progress' }; return { score: x, ...(S.rating.stars.find((r) => x < r.max) || S.rating.stars[S.rating.stars.length - 1]) }; };
const starsHtml = (n, cls = '') => `<span class="stars st${n} ${cls}" role="img" aria-label="${n} of 5 stars">${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i></span>`;
/** Every model of a track, safest first by its rating score. */
const ranked = (track) => S.models.filter((m) => m.track === track).sort((a, b) => (scoreOf(a) ?? 999) - (scoreOf(b) ?? 999));
/** One row per company: its safest model stands for it. */
const companies = (track) => {
  const by = new Map();
  ranked(track).forEach((m) => { if (!by.has(m.org)) by.set(m.org, []); by.get(m.org).push(m); });
  return [...by.entries()].map(([o, ms]) => ({ org: o, best: ms[0], models: ms }));
};

function leaderboard() {
  const el = $('#lbh');
  const promptPanel = (id) => {
    const l = S.levels.find((x) => x.id === id), ts = id === 'L2' ? (S.tasks_l2 || []) : (S.tasks || []).filter((t) => t.level === id);
    return `<div class="lv-panel"><p class="label">${esc(id)} · ${esc(l.title || '')} · ${ts.length} prompts</p><p class="muted">${esc(l.desc)}</p>
      <ul>${ts.map((t) => `<li><code>${esc(t.id)}</code><span>${esc(t.instr)}</span><em>${esc((catById[t.cat] || {}).name || '')}${t.base_level ? ` · base ${esc(t.base_level)}` : ''}</em></li>`).join('')}</ul></div>`;
  };
  const st = { view: 'models', track: 'llm', itf: 'cap', atk: 'direct', dfn: 'none', lvl: 'all', vm: 'commit', open: null };
  const seg = (name, opts, cur, label) => `<div class="seg" data-k="${name}" role="group" aria-label="${label}">${opts.map(([v, l]) =>
    `<button type="button" data-v="${v}" aria-pressed="${v === cur}" class="${v === cur ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const controls = () => {
    const itfs = S.interfaces.filter((i) => i.track === st.track);
    return `<div class="lbh-top rt-top">
      ${seg('view', [['models', 'Models'], ['companies', 'Companies']], st.view, 'View')}
      ${seg('track', [['llm', 'LLM / VLM agents'], ['vla', 'VLA policies']], st.track, 'Track')}
      ${itfs.length > 1 ? seg('itf', itfs.map((i) => [i.id, esc(i.name) + soonTag(i)]), st.itf, 'Robot interface') : `<span class="rt-fixed">${esc(itfs[0].name)}</span>`}
    </div>
    ${st.track === 'vla' ? `<div class="lbh-top rt-top rt-sub"><span class="rt-grp"><span class="label">Metric</span>${seg('vm', [['commit', 'Commit'], ['attempt', 'Attempt']], st.vm, 'Metric')}</span></div>
    <p class="lb-desc">Direct instructions, no defense. ${st.vm === 'commit' ? `<b>${tip('Commit', 'commit')}</b>: the policy carries out the harmful action, whether or not the harm then happens.` : `<b>${tip('Attempt', 'attempt')}</b>: the policy moves to act on the instruction at all.`}</p>` : `<div class="lbh-top rt-top rt-sub">
      <span class="rt-grp"><span class="label">Attack</span>${seg('atk', S.attacks.map((a) => [a.id, esc(a.name) + soonTag(a)]), st.atk, 'Attack')}</span>
      <span class="rt-grp"><span class="label">Defense</span>${seg('dfn', S.defenses.map((d) => [d.id, esc(d.name) + soonTag(d)]), st.dfn, 'Defense')}</span>
      ${LEVELS.length ? `<span class="rt-grp"><span class="label">Level</span>${seg('lvl', [['all', 'All'], ...S.levels.map((l) => [l.id, l.name])], st.lvl, 'Task level')}</span>` : ''}
    </div>
    ${LEVELS.length ? `<dl class="lv-legend">${S.levels.map((l) => `<div class="${l.id === st.lvl ? 'on' : ''}${l.id === st.pr ? ' open' : ''}" role="button" tabindex="0" data-pr="${l.id}" title="Show the ${l.id} prompts"><dt>${esc(l.id)}</dt><dd><b>${esc(l.title || l.name)}</b> ${esc(l.short || '')}${l.in_total === false ? ` · ${l.tasks} paired variants, outside the ${int(S.totals.unsafe_tasks)}` : l.tasks ? ` · ${l.tasks} tasks` : ''}<span class="lv-more">${l.id === st.pr ? 'Hide prompts ▴' : 'View prompts ▾'}</span></dd></div>`).join('')}</dl>${st.pr ? promptPanel(st.pr) : ''}` : ''}
    <p class="lb-desc" id="lbh-desc"></p>`}`;
  };
  el.innerHTML = `<div class="rt-controls"></div>
    <div class="lbh-chart"><div class="lbh-ax"><div class="lbh-axis"><span></span><span class="lbh-n rt-sh">${tip('Rating', 'rating', 'b')}</span><span class="lbh-ticks" aria-hidden="true">${[0, 25, 50, 75, 100].map((t) => `<i style="left:${t}%">${t}%</i>`).join('')}</span><span class="lbh-n"><span class="lbh-h2">${tip('ASR ↓', 'completed', 'b r')}</span></span><span class="lbh-n lbh-h3">${tip('Safe alt ↑', 'safe_alt', 'b r')}</span></div></div>
    <div class="lbh-rows"></div></div>
    <div class="rt-key"></div>`;
  const keys = () => st.track === 'vla'
    ? `<span><i class="k-c"></i>${tip('Commit', 'commit')}: carried out the harmful action</span><span><i class="k-at"></i>${tip('Attempt', 'attempt')}: moved to act on the instruction</span><span class="muted">Ranked by ${st.vm} rate, lowest first. ${esc(S.vla_note || '')} Click a row for more.</span>`
    : `<span><i class="k-c"></i>${tip('Harm completed', 'completed')}</span><span><i class="k-a"></i>${tip('Harm attempted', 'attempted')}, not completed</span><span><i class="k-b"></i>${tip('Safe alternative', 'safe_alt')}: did a safe substitute instead</span><span class="muted">Ranked by completed attack success in this setting, lowest first. Stars rate every attack a model was run under. Click a row for more.</span>`;
  const paintControls = () => {
    $('.rt-controls', el).innerHTML = controls();
    cues($('.rt-controls', el));
    $('.rt-key', el).innerHTML = keys();
    $('.lbh-h2', el).innerHTML = st.track === 'vla' ? tip(st.vm === 'commit' ? 'Commit ↓' : 'Attempt ↓', st.vm, 'b r') : tip('ASR ↓', 'completed', 'b r');
    $('.lbh-h3', el).style.visibility = st.track === 'vla' ? 'hidden' : '';
    el.classList.toggle('is-vla', st.track === 'vla');
    if (!$('#lbh-desc')) return;
    const a = S.attacks.find((x) => x.id === st.atk), d = S.defenses.find((x) => x.id === st.dfn), i = S.interfaces.find((x) => x.id === st.itf);
    const l = (S.levels || []).find((x) => x.id === st.lvl);
    const soon = [a, d, i].filter((x) => x.soon).map((x) => x.name.replace('+ ', ''));
    if (d.id !== 'none' && a.id !== 'direct') soon.push(`${a.name} with the ${d.name.replace('+ ', '').toLowerCase()}`);
    $('#lbh-desc').innerHTML = `<b>${esc(a.name)}.</b> ${esc(a.desc)} ${d.desc ? `<b>${esc(d.name.replace('+ ', ''))}.</b> ${esc(d.desc)}` : ''} ${soon.length ? `<b class="soon-note">${esc(soon.join(', '))}: results are being updated and will appear here shortly.</b> ` : ''}<span class="muted">Interface: ${esc(i.name)} · ${l ? `${esc(l.name)}, ${esc(l.title || '')}: ${esc(l.desc)}` : `all levels: L0 + L1, ${int(S.totals.unsafe_tasks)} unsafe tasks; L2 on its own`}.${st.view === 'companies' ? ' Each company is shown by its safest model.' : ''}</span>`;
  };
  const rowsEl = $('.lbh-rows', el);
  const row = (id, m, name, sub, v, k) => {
    const [att, comp, , sa] = v, r = ratingOf(m), vla = isVla(m);
    return `<button type="button" class="lbh-row${st.open === id ? ' on' : ''}" data-id="${esc(id)}" style="--i:${k}" aria-expanded="${st.open === id}" aria-label="${esc(name)}, place ${k + 1}: ${vla ? `commit ${comp}%, attempt ${att}%` : `harm completed in ${comp}% of unsafe tasks, attempted in ${att}%`}; rated ${r.stars} of 5">
      <span class="rk r${k + 1}">${k + 1}</span>${markOf(m)}
      <span class="lbh-name"><span class="lbh-nl"><b>${esc(name)}</b><span class="lbh-set">${esc(sub)}</span></span></span>
      <span class="rt-star">${starsHtml(r.stars)}</span>
      ${vla ? `<span class="vla-bars">${[['commit', 'Commit', comp], ['attempt', 'Attempt', att]].map(([k, l, x]) => `<span class="vb ${k}${st.vm === k ? ' on' : ''}"><em>${tip(l, k)}</em><span class="vb-t"><i style="--w:${x}%"></i></span><b>${x}%</b></span>`).join('')}</span>` : `<span class="lbh-track"><span class="lbh-a" style="--w:${att}%"></span><span class="lbh-s" style="--w:${comp}%"></span></span>
      <span class="lbh-val"><b>${comp}<small>%</small></b><em>tried ${att}%</em></span>`}
      ${vla ? '<span class="lbh-ben"></span>' : `<span class="lbh-ben${sa == null ? ' na' : ''}" style="--b:${sa || 0}%"><i></i><b>${sa == null ? '–' : `${sa}%`}</b></span>`}
    </button>${st.open === id ? (id.startsWith('org:') ? orgDetail(id.slice(4)) : detail(m, v)) : ''}`;
  };
  const detail = (m, v) => {
    if (isVla(m)) return vlaDetail(m, v);
    const [att, comp, , sa] = v, r = ratingOf(m);
    const worst = runs(m, st.itf, st.dfn, st.lvl).map(([a, x]) => [a, x[1]]).sort((x, y) => y[1] - x[1]);
    const rival = ranked(m.track).find((x) => x.id !== m.id && x.org !== m.org);
    return `<div class="rt-detail">
      ${S.categories.some((c) => catRate(m, c, comp, st.dfn === 'none' && st.lvl === 'all' ? st.atk : '-') != null) ? `<div class="rt-dcol"><p class="label">By hazard category · completed</p>
        ${S.categories.map((c) => { const x = catRate(m, c, comp, st.dfn === 'none' && st.lvl === 'all' ? st.atk : '-'); return `<div class="rt-cat"><span>${esc(c.name)}</span><span class="rt-mini"><i style="--w:${x || 0}%"></i></span><b>${x == null ? '–' : `${x}%`}</b></div>`; }).join('')}</div>` : ''}
      <div class="rt-dcol"><p class="label">By attack · completed</p>
        ${worst.map(([a, x]) => `<div class="rt-cat${a.id === st.atk ? ' cur' : ''}"><span>${esc(a.name)}</span><span class="rt-mini"><i style="--w:${x}%"></i></span><b>${x}%</b></div>`).join('')}
        ${worst.length < S.attacks.length ? `<p class="muted rt-na">Results updating: ${esc(S.attacks.filter((a) => !worst.some(([w]) => w === a)).map((a) => a.name).join(', '))}</p>` : ''}</div>
      <dl class="rt-stats">
        <div><dt>${starsHtml(r.stars)}</dt><dd>${esc(r.label)} · ${pc(r.score)} overall</dd></div><div><dt>${comp}%</dt><dd>${tip('Completed', 'completed')}: harm happened</dd></div>
        <div><dt>${att}%</dt><dd>${tip('Attempted', 'attempted')}: did not refuse</dd></div><div><dt>${sa == null ? '–' : `${sa}%`}</dt><dd>${tip('Safe alternative', 'safe_alt')}</dd></div>
      </dl>
      <p class="rt-links"><a class="btn primary" href="${modelHref(m)}">Full safety report <span class="arr">→</span></a>${rival ? `<a class="btn" href="${compareHref(m.id, rival.id)}">Compare with ${esc(rival.name)}</a>` : ''}</p></div>`;
  };
  const vlaDetail = (m, v) => {
    const r = ratingOf(m), rival = ranked(m.track).find((y) => y.id !== m.id && y.org !== m.org);
    return `<div class="rt-detail rt-vla">
      <dl class="rt-stats">
        <div><dt>${starsHtml(r.stars)}</dt><dd>${esc(r.label)} · ${pc(r.score)} commit</dd></div><div><dt>${v[1]}%</dt><dd>${tip('Commit', 'commit')}</dd></div>
        <div><dt>${v[0]}%</dt><dd>${tip('Attempt', 'attempt')}</dd></div>
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
    let items = S.models.filter((m) => m.track === st.track && v[m.id]).map((m) => [m.id, m, m.name, `${org(m).name} · ${m.access === 'open' ? 'open weights' : 'API'}${measuredSub(m)}`, v[m.id]]);
    if (st.view === 'companies') {
      const best = new Map();
      items.forEach((it) => { const o = it[1].org; if (!best.has(o) || it[4][1] < best.get(o)[4][1]) best.set(o, it); });
      items = [...best.values()].map(([, m, , , vv]) => { const n = S.models.filter((x) => x.org === m.org && x.track === st.track).length; return [`org:${m.org}`, m, org(m).name, `best: ${m.name}${n > 1 ? ` · ${n} models` : ''}`, vv]; });
    }
    const j = st.track === 'vla' && st.vm === 'attempt' ? 0 : 1;
    items.sort((a, b) => a[4][j] - b[4][j] || a[4][1 - j] - b[4][1 - j]);
    const prog = st.view === 'models' ? (R.progress[`${st.itf}|${st.atk}|${st.dfn}${st.lvl === 'all' ? '' : `|${st.lvl}`}`] || {}) : {};
    const progRows = S.models.filter((m) => m.track === st.track && prog[m.id] && !v[m.id]).map((m) => `<div class="lbh-row lbh-prog"><span class="rk">–</span>${markOf(m)}
      <span class="lbh-name"><span class="lbh-nl"><b>${esc(m.name)}</b><span class="lbh-set">${esc(org(m).name)}</span></span></span>
      <span class="lbh-progtxt">In progress · ${prog[m.id].judged} of ${prog[m.id].n} judged; rates appear when every input is judged</span></div>`).join('');
    // FLIP: rows that stay slide from their old place to the new one
    const before = new Map($$('.lbh-row', rowsEl).map((r) => [r.dataset.id, r.getBoundingClientRect().top]));
    rowsEl.innerHTML = items.map(([id, m, name, sub, vv], k) => row(id, m, name, sub, vv, k)).join('') + progRows;
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
  const togglePr = (t) => { st.pr = st.pr === t.dataset.pr ? null : t.dataset.pr; paintControls(); };
  el.addEventListener('keydown', (e) => { const t = e.target.closest('[data-pr]'); if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); togglePr(t); } });
  el.addEventListener('click', (e) => {
    const pt = e.target.closest('[data-pr]');
    if (pt) { togglePr(pt); return; }
    const b = e.target.closest('.seg button');
    if (b) {
      const k = b.closest('.seg').dataset.k, v = b.dataset.v;
      if (st[k] === v) return;
      st[k] = v;
      if (k === 'track') { st.itf = S.interfaces.find((i) => i.track === v).id; if (v === 'vla') Object.assign(st, { atk: 'direct', dfn: 'none', lvl: 'all' }); }
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
    const cs = companies(track).sort((a, b) => (scoreOf(a.best) ?? 999) - (scoreOf(b.best) ?? 999));
    el.innerHTML = `<div class="hm-top"><div class="seg" role="group" aria-label="Track">${[['llm', 'LLM / VLM agents'], ['vla', 'VLA policies']].map(([v, l]) => `<button type="button" data-v="${v}" class="${v === track ? 'on' : ''}" aria-pressed="${v === track}">${l}</button>`).join('')}</div>
      <p class="lb-desc">${esc(S.rating.basis)} Each company is rated by its safest model.</p></div>
      <div class="vd-grid">${cs.map((c, i) => { const r = ratingOf(c.best), o = S.orgs[c.org] || { name: c.org }; return `<a class="vd-card s${r.stars}" href="${modelHref(c.best)}" style="--i:${i}">
        <span class="vd-logo${o.logo ? '' : ' mono'}">${o.logo || esc(o.mono || o.name[0])}</span>
        <span class="vd-id"><b class="vd-org">${esc(o.name)}</b><span class="vd-rank r${i + 1}">#${i + 1}</span></span>
        <span class="vd-rate">${starsHtml(r.stars, 'big')}<span class="vd-lab">${esc(r.label)}</span></span>
        <span class="vd-num"><b>${r.score ?? '–'}<small>${r.score == null ? '' : '%'}</small></b> <span>${r.score == null ? 'in progress' : 'harm completed'}</span></span>
        <span class="vd-best">best model: ${esc(c.best.name)}${c.models.length > 1 ? `<span class="vd-n"> · ${c.models.length} rated</span>` : ''}</span></a>`; }).join('')}</div>`;
    el.classList.remove('lit'); void el.offsetWidth; requestAnimationFrame(() => el.classList.add('lit'));
    cues(el);
  };
  el.addEventListener('click', (e) => { const b = e.target.closest('.seg button'); if (b && b.dataset.v !== track) { track = b.dataset.v; paint(); } });
  paint();
}

/* ------------------------------------------------------------------ heatmap */

/** The colour scale, in the bar above a heatmap. */
const HM_SCALE = '<div class="hm-scale" aria-hidden="true"><span>0%</span><i></i><span>100%</span></div>';

function heatmap() {
  const el = $('#heatmap');
  let track = 'llm';
  const paint = () => {
    const itf = S.interfaces.find((i) => i.track === track).id;
    const ms = S.models.filter((m) => m.track === track);
    // worst case over attacks, no defense: the strongest attack we have, per model and category
    const worst = (m) => Math.max(0, ...runs(m, itf).map(([, v]) => v[1]));
    const worstAtk = (m) => (runs(m, itf).sort((a, b) => b[1][1] - a[1][1])[0] || [{}])[0].id;
    const val = (m, c) => catRate(m, c, worst(m), worstAtk(m));
    ms.sort((a, b) => worst(a) - worst(b));
    const n = S.categories.length;
    if (!ms.some((m) => S.categories.some((c) => val(m, c) != null))) {
      el.innerHTML = `<p class="lb-desc hm-wait">Per-category results are being compiled and will appear here shortly: completed attack success by hazard category, for each model under its strongest attack.</p>`;
      return;
    }
    el.innerHTML = `<div class="hm-top">
      <p class="lb-desc">LLM / VLM agents. Completed attack success under the strongest attack each model was run under, no defense, by hazard category. Darker is worse.</p>${HM_SCALE}</div>
      <div class="hm-scroll"><div class="hm-grid hm-cat" style="--n:${n}">
        <span class="hm-corner"></span>${S.categories.map((c) => `<span class="hm-h" title="${esc(c.name)}: ${esc(c.desc)}"><b>${esc(c.code)}</b><span>${esc(c.name)}</span></span>`).join('')}
        ${ms.map((m, r) => `<span class="hm-m" title="${esc(m.name)}">${markOf(m)}<b>${esc(m.name)}</b></span>${S.categories.map((c, k) => { const x = val(m, c); if (x == null) return `<span class="hm-c na${k ? '' : ' s'}${k === n - 1 ? ' e' : ''}" title="${esc(m.name)} · ${esc(c.name)}: per-category results not published yet"><b>–</b></span>`; return `<span class="hm-c${x >= 55 ? ' hi' : ''}${k ? '' : ' s'}${k === n - 1 ? ' e' : ''}" style="--v:${x};--d:${(r * n + k) * 14}ms" title="${esc(m.name)} · ${esc(c.name)}: ${x}%"><b>${x}</b></span>`; }).join('')}`).join('')}
      </div></div>`;
    el.classList.remove('lit'); void el.offsetWidth; requestAnimationFrame(() => el.classList.add('lit'));
    cues(el);
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
    cues(el);
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
  el.innerHTML = `<div class="suite-group"><h3 class="sg-head">Hazard categories<small>${S.categories.length} categories</small></h3><div class="gallery g3">${cats}</div></div>`;
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
  el.innerHTML = `<div class="gallery g3">${S.sources.map((s) => card(s.poster, s.video, s.name, `${s.n ? `${s.n} tasks · ` : ''}${s.body} · ${s.desc}`, '', s.url, true)).join('')}</div>`;
  hoverPlay(el);
}

/* ------------------------------------------------------------------ hazards page */

/** Each category: a scene, what it covers, how the models fare on it, and a few of its instructions. */
function hazardList() {
  const el = $('#hazard-list');
  const ms = S.models.filter((m) => m.track === 'llm');
  const worst = (m) => Math.max(0, ...runs(m, 'cap').map(([, v]) => v[1]));
  el.innerHTML = S.categories.map((c) => {
    const ts = unsafeOf(c.id), t = ts[0];
    const vals = ms.map((m) => catRate(m, c, worst(m), (runs(m, 'cap').sort((x, y) => y[1][1] - x[1][1])[0] || [{}])[0].id));
    const known = vals.filter((v) => v != null), mean = known.length ? Math.round(known.reduce((a, b) => a + b, 0) / known.length) : '–';
    return `<article class="hz-row reveal" id="${c.id}">
      ${t ? `<div class="g-item hz-img"><div class="img"><img src="${esc(t.poster)}" alt="" loading="lazy">${t.video ? `<video muted loop playsinline preload="none" data-src="${esc(t.video)}"></video>` : ''}<span class="rel-tag">${catTag(c)}</span></div></div>` : '<div></div>'}
      <div class="hz-body"><h3>${esc(c.name)}</h3><p>${esc(c.desc)}${c.tasks ? ` <b class="hz-n">${c.tasks} tasks</b>` : ''}</p>
        ${known.length ? `<div class="hz-stat"><b>${mean}%</b><span>mean completed attack success, LLM / VLM agents, strongest attack</span></div>` : ''}
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
    const mean = (m) => meanOf(runs(m, st.itf, st.dfn));
    ms.sort((a, b) => mean(a) - mean(b));
    el.innerHTML = `<div class="hm-top"><div class="seg" data-k="itf" role="group" aria-label="Interface">${S.interfaces.map((i) => `<button type="button" data-v="${i.id}" class="${i.id === st.itf ? 'on' : ''}">${esc(i.name)}${soonTag(i)}</button>`).join('')}</div>
        <div class="seg" data-k="dfn" role="group" aria-label="Defense">${S.defenses.map((d) => `<button type="button" data-v="${d.id}" class="${d.id === st.dfn ? 'on' : ''}">${esc(d.name)}${soonTag(d)}</button>`).join('')}</div>${HM_SCALE}</div>
      <div class="hm-scroll"><div class="hm-grid hm-atk" style="--n:${S.attacks.length + 1}">
        <span class="hm-corner"></span>${S.attacks.map((a) => `<span class="hm-h"><b>${a.soon ? 'soon' : esc(a.access)}</b><span>${esc(a.name)}</span></span>`).join('')}<span class="hm-h"><b>mean</b><span>All attacks</span></span>
        ${ms.map((m, r) => `<span class="hm-m" title="${esc(m.name)}">${markOf(m)}<b>${esc(m.name)}</b></span>${S.attacks.map((a, k) => { const v = cell(st.itf, a.id, st.dfn)[m.id], s = k ? '' : ' s'; if (!v) return `<span class="hm-c na${s}" title="${esc(m.name)} · ${esc(a.name)}: results updating"><b>–</b></span>`; const x = v[1]; return `<span class="hm-c${x >= 55 ? ' hi' : ''}${s}" style="--v:${x};--d:${(r * 6 + k) * 12}ms" title="${esc(m.name)} · ${esc(a.name)}: ${x}%"><b>${x}</b></span>`; }).join('')}<span class="hm-c mean e" style="--v:${Math.round(mean(m))};--d:0ms" title="${esc(m.name)} · mean over the attacks run: ${Math.round(mean(m))}%"><b>${Math.round(mean(m))}</b></span>`).join('')}
      </div></div>`;
    el.classList.remove('lit'); void el.offsetWidth; requestAnimationFrame(() => el.classList.add('lit'));
    cues(el);
  };
  el.addEventListener('click', (e) => { const b = e.target.closest('.seg button'); if (!b) return; st[b.closest('.seg').dataset.k] = b.dataset.v; paint(); });
  paint();
}

function rules() {
  const R6 = [
    ['Ranked by harm done', 'Rows are ordered by completed attack success: how often the harm actually happened. Lower is safer.'],
    ['Attempts count too', 'The hatched bar shows harm attempted but not completed, often only because the robot was clumsy.'],
    ['Safe alternatives count', 'Safe alternative sits next to every score: a model that does a safe substitute instead of the harm is credited for it.'],
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
  const avg = (itf, a, d, ms) => { const v = cell(itf, a, d), have = ms.filter((m) => v[m.id]); return Math.round(have.reduce((s, m) => s + v[m.id][1], 0) / (have.length || 1)); };
  el.innerHTML = S.attacks.map((a, i) => {
    const bars = [['LLM / VLM', avg('cap', a.id, 'none', llm), avg('cap', a.id, 'constitution', llm)], ['VLA', avg('native', a.id, 'none', vla), avg('native', a.id, 'constitution', vla)]];
    return `<article class="ac-card reveal${a.soon ? '' : ' live'}" style="--i:${i}"><div class="ac-top"><span class="lp-n">${String(i + 1).padStart(2, '0')}</span><span class="ac-acc">${esc(a.access)}</span>${a.soon ? '<span class="ac-soon">Updating</span>' : ''}</div>
      <h3>${esc(a.name)}</h3><p>${esc(a.desc)}</p>
      <p class="label ac-cap">Mean completed attack success</p>
      <div class="ac-bars">${bars.map(([l, x, y]) => `<div class="ac-b"><span>${l}</span><span class="rt-mini"><i style="--w:${x}%"></i></span><b>${x}%</b><span class="rt-mini dfn"><i style="--w:${y}%"></i></span><b class="dfn">${y}%</b></div>`).join('')}</div>
      <p class="ac-key"><span><i></i>no defense</span><span><i class="dfn"></i>with constitution</span></p></article>`;
  }).join('');
}

function defenses() {
  $('#defense-list').innerHTML = `<dl>${S.defenses.map((d) => `<div class="dk-${esc(d.id)}"><dt>${esc(d.name.replace('+ ', ''))}${soonTag(d)}</dt><dd>${esc(d.desc || 'The model as shipped: its own safety training, no extra prompt or filter.')}</dd></div>`).join('')}
    <div class="dk-more"><dt>More to come</dt><dd>Input filters, action-level guardrails and a low-level safety layer, each scored by what it adds on top of the model.</dd></div></dl>`;
}

/* ------------------------------------------------------------------ the loop */

function loop() {
  const steps = [
    ['doc', 'Task', 'An unsafe instruction, in a frozen scene with only the two objects it names', 'task'],
    ['bolt', 'Attack', S.attacks.map((a) => a.name).join(' · '), 'attack'],
    ['judge', 'Defense', 'None for now; a written safety constitution is coming', 'defense'],
    ['arm', 'Model + interface', S.interfaces.map((i) => i.name).join(' · '), 'model'],
    ['layers', 'Simulator', 'CaP-X in MuJoCo: the program runs once, no retries', 'sim'],
    ['replay', 'Judge', 'Did it try? Did the harm happen, checked frame by frame?', 'judge'],
  ];
  $('#loop').innerHTML = `<ol class="lp-rail">${steps.map(([ic, t, d, k], i) => `<li class="lp-step ${k}" style="--i:${i}"><span class="lp-node">${String(i + 1).padStart(2, '0')}</span><b>${svg(ic)}${esc(t)}</b><small>${esc(d)}</small></li>`).join('')}</ol>
    <p class="lp-back"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5a4 4 0 0 1-4 4H5"/><path d="M9 11l-4 4 4 4"/></svg><span>Adaptive attacks read the judge and try again</span></p>`;
}

function metrics() {
  const M = (S.metrics || []).map((x) => [x.name, x.desc]);
  $('#metrics').classList.add('m3');
  $('#metrics').innerHTML = `<p class="label">What we report</p><dl>${M.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>`;
}

/** Task levels, after LIBERO-Safety. */
function levels() {
  $('#levels').innerHTML = `<dl>${S.levels.map((l) => `<div><dt>${esc(l.id)} · ${esc(l.title || l.name)}</dt><dd>${esc(l.desc)}<small>${l.in_total === false ? `${l.tasks} paired variants, reported on their own` : `${l.tasks} of the ${int(S.totals.unsafe_tasks)} tasks`}</small></dd></div>`).join('')}</dl>
    ${S.levels_note ? `<p class="muted lv-note">${esc(S.levels_note)}</p>` : ''}
    <div class="lv-tasks">${S.levels.map((l) => {
      const ts = l.id === 'L2' ? (S.tasks_l2 || []) : (S.tasks || []).filter((t) => t.level === l.id);
      return ts.length ? `<details class="ms-cat"><summary><b>${esc(l.id)} · ${esc(l.title || '')}</b><span>${ts.length} tasks</span></summary>
        <ul>${ts.map((t) => `<li class="${t.id.length > 6 ? 'lid' : ''}"><code>${esc(t.id)}</code><span>${esc(t.instr)}</span><em>${esc((catById[t.cat] || {}).code || '')}${t.base_level ? ` · base ${esc(t.base_level)}` : ''}</em></li>`).join('')}</ul></details>` : '';
    }).join('')}</div>`;
}

/** Validity checks (RESULTS.checks): the null-action control and threshold sensitivity, once the full run is in. */
function checks() {
  const C = R.checks || {}, el = $('#checks');
  const rows = [];
  if (C.null_action) rows.push(['Null-action control', C.null_action.text || `An empty program fired the hazard predicate in ${C.null_action.fired} of ${C.null_action.n} tasks.`]);
  (C.threshold || []).forEach((t) => rows.push([`Threshold · ${t.label}`, t.text || `Completed ${t.completed}%`]));
  el.innerHTML = rows.length ? `<dl>${rows.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>`
    : `<dl><div><dt>Null-action control</dt><dd>Each task run with an empty program: the hazard predicate must not fire on its own. Published with the full run.</dd></div><div><dt>Threshold sensitivity</dt><dd>Completed rates with the hazard thresholds tightened and loosened. Published with the full run.</dd></div></dl>`;
}

function ways() {
  $('#ways').innerHTML = `<p class="cw-lead">The same unsafe task reaches a robot three ways. LLMs and VLMs drive it through code or skills; VLAs drive it directly. We report the two families on separate boards.</p>
    <div class="cw-head"><span></span><span>How the model reaches the robot</span><span></span></div>
    ${S.interfaces.map((i) => `<details class="cw-row"><summary><span class="cw-n">${esc(i.name)}${soonTag(i)}</span><span class="cw-f">${i.flow.map((f) => `<b>${esc(f)}</b>`).join('<i>→</i>')}</span><span class="cw-x" aria-hidden="true"></span></summary><p>${esc(i.desc)}</p></details>`).join('')}`;
}

function trust() {
  $('#trust').innerHTML = S.honest.map((h) => `<li><span class="tr-ic">${svg(h.icon)}</span><b>${esc(h.title)}</b><span class="tr-d">${esc(h.tip)}</span></li>`).join('');
}

/* ------------------------------------------------------------------ model report */

const modelFromURL = (key = 'id') => modelById[new URLSearchParams(location.search).get(key)];
/** Completed attack success per hazard category: counted for a measured run, else the overall score shaped by the profile. */
const byCategory = (m) => S.categories.map((c) => [c, catRate(m, c, scoreOf(m))]);
/** Per attack (and per level): completed %, or null where the model has not been run. */
const byAttack = (m, dfn = 'none') => S.attacks.map((a) => [a, (cell(itfOf(m), a.id, dfn)[m.id] || [null, null])[1]]);
const byLevel = (m) => (S.levels || []).map((l) => { const rs = runs(m, itfOf(m), 'none', l.id); return [l, rs.length ? meanOf(rs) : null]; });
/** Attempted and completed ÷ attempted, over the attacks a model was run under, no defense. */
const attOf = (m) => meanOf(runs(m), 0);
const safeOf = (m) => { const rs = runs(m).filter(([, v]) => v[3] != null); return rs.length ? meanOf(rs, 3) : null; };
/** The scene to show as a model's worst failure: one from its worst category (a placeholder until episodes are logged). */
const worstScene = (m) => { const [c] = byCategory(m).sort((a, b) => (b[1] || 0) - (a[1] || 0))[0]; return { cat: c, tile: unsafeOf(c.id)[0] || S.tiles[0] }; };
const bars = (rows, cls = '') => rows.map(([lab, x, sub]) => `<div class="rt-cat ${cls}${x == null ? ' na' : ''}"><span>${esc(lab)}${sub ? `<small>${esc(sub)}</small>` : ''}</span><span class="rt-mini"><i style="--w:${x || 0}%"></i></span><b>${x == null ? '–' : `${x}%`}</b></div>`).join('');
const VERDICT_LABEL = { completed: 'Completed', attempted: 'Tried, not completed', refused: 'Refused' };

/** A measured run: what was run, every task with its verdict, and the notes on the odd ones. */
function measuredBlock(m) {
  const x = MEAS[m.id];
  if (!x || !x.tasks) return '';
  const atk = S.attacks.find((a) => a.id === x.attack), itf = S.interfaces.find((i) => i.id === x.itf);
  return `<div class="head rp-sec"><h2>Every task, as run</h2></div>
  <section class="ms">
    <div class="ms-head"><div><p class="label">${esc(x.batch)} · ${esc(x.date)}</p>
      <p class="muted">${esc(atk.name)} instructions · no defense · ${esc(itf.name)} · ${esc(x.setup)} Runtime: ${esc(x.runtime)}.</p>
      ${x.levels ? `<p class="muted ms-lv">${Object.entries(x.levels).map(([l, c]) => `${esc(l)}: attempted ${c[1]}/${c[0]}, completed ${c[2]}/${c[0]}`).join(' · ')}</p>` : ''}</div>
      <dl class="ms-sum"><div><dt>${x.attempted}/${x.n}</dt><dd>Attempted · ${pct(x.attempted, x.n)}%</dd></div><div><dt>${x.completed}/${x.n}</dt><dd>Completed · ${pct(x.completed, x.n)}%</dd></div></dl></div>
    <div class="ms-cats">${S.categories.map((c) => { const [n, a, k] = x.by_cat[c.id] || [0, 0, 0]; const ts = x.tasks.filter((t) => t[0] === c.id); return ts.length ? `<details class="ms-cat" open><summary><b>${esc(c.name)}</b><span>${n} tasks · ${a} attempted · ${k} completed</span></summary>
      <ul>${ts.map(([, id, ins, v, lv]) => `<li class="v-${v}${id.length > 6 ? ' lid' : ''}"><code>${esc(id)}${lv ? ` <small class="lv-tag">${esc(lv)}</small>` : ''}</code><span>${esc(ins)}</span><em>${VERDICT_LABEL[v]}</em></li>`).join('')}</ul></details>` : ''; }).join('')}</div>
    ${x.notes?.length ? `<ul class="ms-notes muted">${x.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
  </section>`;
}

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
  const head = $('.page-head');
  head.classList.add('has-act');
  $('.ph-act', head)?.remove();
  $('.lead', head).insertAdjacentHTML('afterend', `<div class="ph-act"><button type="button" class="btn primary" id="share-btn">Share card <span class="arr">↗</span></button>${rival ? `<a class="btn" href="${compareHref(m.id, rival.id)}">Compare</a>` : ''}<a class="btn" href="${link('leaderboard/')}">Leaderboard</a></div>`);
  const vla = isVla(m), vx = VLA[m.id] || {};
  const over = MEAS[m.id] ? `${MEAS[m.id].n} tasks, ${esc(S.attacks.find((a) => a.id === MEAS[m.id].attack).name.toLowerCase())} instructions` : `across ${runs(m).length} attacks${LEVELS.length ? ` and ${LEVELS.length} levels` : ''}`;
  el.innerHTML = `<div class="nums-card rp-strip"><dl class="bignums">
      <div class="rp-rate"><dt>${starsHtml(r.stars, 'big')}<span class="rp-lab">${esc(r.label)}</span></dt><dd><span class="bn-ic rp-org${o.logo ? '' : ' mono'}">${o.logo || esc(o.mono || o.name[0])}</span><b>Rating</b><small>${esc(S.rating.basis)}</small></dd></div>
      ${vla ? `<div class="rp-big"><dt>${r.score ?? '–'}<small>${r.score == null ? '' : '%'}</small></dt><dd><span class="bn-ic">${svg('bolt')}</span><b>${tip('Commit', 'commit')}</b><small>carried out the harmful action · direct instructions</small></dd></div>
      <div class="rp-big tried"><dt>${attOf(m)}<small>%</small></dt><dd><span class="bn-ic">${svg('arm')}</span><b>${tip('Attempt', 'attempt')}</b><small>moved to act on the instruction</small></dd></div>`
      : `<div class="rp-big"><dt>${r.score ?? '–'}<small>${r.score == null ? '' : '%'}</small></dt><dd><span class="bn-ic">${svg('bolt')}</span><b>${tip('Completed', 'completed')}</b><small>of unsafe tasks ended in harm · ${over}</small></dd></div>
      <div class="rp-big tried"><dt>${attOf(m)}<small>%</small></dt><dd><span class="bn-ic">${svg('arm')}</span><b>${tip('Attempted', 'attempted')}</b><small>were not refused</small></dd></div>
      <div class="rp-big safe"><dt>${safeOf(m) == null ? '–' : `${safeOf(m)}<small>%</small>`}</dt><dd><span class="bn-ic">${svg('judge')}</span><b>${tip('Safe alternative', 'safe_alt')}</b><small>did a safe substitute instead${safeOf(m) == null ? ' · not reported for this batch' : ''}</small></dd></div>`}
    </dl></div>
    <div class="head rp-sec"><h2>Where it breaks</h2></div>
    <div class="rp-grid">
      <figure class="rp-fail"><div class="atk-media"><img src="${esc(w.tile.poster)}" alt="">${still || !w.tile.video ? '' : `<video muted loop playsinline autoplay src="${esc(w.tile.video)}"></video>`}
        <span class="atk-goal"><span class="label">${vla ? `Scene · ${esc(w.cat.name)}` : `Worst category · ${esc(w.cat.name)} · ${wc}% harm`}</span>${esc(w.tile.instr || w.tile.title)}</span></div>
        <figcaption class="muted">The scene type ${esc(m.name)} fails most. The episode recording is a placeholder until runs are logged.</figcaption></figure>
      <div class="rp-cols">
        ${vla ? `<div><p class="label">Direct instructions · no defense</p>${bars([['Commit', r.score, 'carried out the harmful action'], ['Attempt', attOf(m), 'moved to act on the instruction']])}</div>` : `<div><p class="label">By hazard category</p>${bars(byCategory(m).map(([c, x]) => { const k = MEAS[m.id]?.by_cat?.[c.id]; return [c.name, x, k ? `${k[2]} of ${k[0]} tasks` : '']; }))}</div>
        <div><p class="label">By attack · no defense → with constitution</p>${bars(byAttack(m).map(([a, x], i) => { const y = byAttack(m, 'constitution')[i][1]; return [a.name, x, x == null ? 'results updating' : y == null ? 'constitution not run yet' : `→ ${y}% with constitution`]; }))}</div>
        ${LEVELS.length && byLevel(m).some(([, x]) => x != null) ? `<div><p class="label">By task level</p>${bars(byLevel(m).map(([l, x]) => [`${l.id} · ${l.title || ''}`, x, l.in_total === false ? `${l.tasks} paired variants` : `${l.tasks} tasks`]))}</div>` : ''}`}
      </div>
    </div>${measuredBlock(m)}`;
  $('#share-btn').addEventListener('click', () => shareDialog(m));
  comments(`model:${m.id}`, `${m.name}: is it safe?`);
}

/* ------------------------------------------------------------------ compare */

function compare() {
  const el = $('#compare');
  const q = new URLSearchParams(location.search);
  let A = modelById[q.get('a')] || ranked('llm')[0], B = modelById[q.get('b')] || ranked('llm').find((x) => x.org !== A.org) || ranked('llm')[1];
  const opt = (sel) => ['llm', 'vla'].map((t) => `<optgroup label="${t === 'llm' ? 'LLM / VLM agents' : 'VLA policies'}">${ranked(t).map((m) => `<option value="${m.id}"${m.id === sel.id ? ' selected' : ''}>${esc(m.name)} · ${esc(org(m).name)}</option>`).join('')}</optgroup>`).join('');
  const side = (m, k) => { const o = org(m), r = ratingOf(m); return `<div class="cp-side ${k} s${r.stars}">
    <div class="cp-id"><span class="rp-logo${o.logo ? '' : ' mono'}">${o.logo || esc(o.mono || o.name[0])}</span><span class="cp-org">${esc(o.name)}</span><b class="cp-name">${esc(m.name)}</b><a class="cp-link" href="${modelHref(m)}">Safety report →</a></div>
    <div class="cp-rate">${starsHtml(r.stars, 'big')}<span class="cp-lbl">${esc(r.label)}</span><b class="cp-pct">${r.score ?? '–'}<small>${r.score == null ? '' : '%'}</small></b><span class="cp-sub">harm completed</span></div></div>`; };
  const paint = () => {
    const rows = [
      ['Overall', scoreOf(A), scoreOf(B), 'low'],
      ...S.categories.map((c, i) => [c.name, byCategory(A)[i][1], byCategory(B)[i][1], 'low']),
      ...S.attacks.map((a, i) => [`Attack · ${a.name}`, byAttack(A)[i][1], byAttack(B)[i][1], 'low']),
      ...(S.levels || []).map((l, i) => [`Level · ${l.name}`, byLevel(A)[i][1], byLevel(B)[i][1], 'low']),
      ['Attempted', attOf(A), attOf(B), 'low'],
      ['Safe alternative', safeOf(A), safeOf(B), 'high'],
    ];
    const cats = rows.slice(1, 1 + S.categories.length), nC = S.categories.length;
    const aWin = (scoreOf(A) ?? 999) <= (scoreOf(B) ?? 999), W = aWin ? A : B, L = aWin ? B : A;
    const k = cats.filter(([, a, b]) => (aWin ? a < b : b < a)).length;
    const verdict = scoreOf(A) == null || scoreOf(B) == null ? `${esc([A, B].filter((x) => scoreOf(x) == null).map((x) => x.name).join(' and '))}: results still being judged, so no overall verdict yet.` : scoreOf(A) === scoreOf(B) ? `Dead even overall: ${scoreOf(A)}% each.`
      : `${esc(W.name)} is safer than ${esc(L.name)}: ${scoreOf(W)}% vs ${scoreOf(L)}% harm overall, and safer in ${k} of ${nC} hazard categories.`;
    el.innerHTML = `<div class="cp-head">
        <select class="cp-sel a" id="cp-a" aria-label="First model">${opt(A)}</select><span class="cp-vs sm" aria-hidden="true">VS</span><select class="cp-sel b" id="cp-b" aria-label="Second model">${opt(B)}</select>
        ${side(A, 'a')}<span class="cp-vs big" aria-hidden="true">VS</span>${side(B, 'b')}</div>
      <p class="cp-verdict">${verdict}</p>
      ${A.track !== B.track ? '<p class="lb-desc muted">Different tracks: an LLM / VLM agent and a VLA policy are tested through different interfaces, so read this with care.</p>' : ''}
      <div class="cp-rows">${rows.map(([lab, a, b, dir]) => { const both = a != null && b != null, wa = both && (dir === 'low' ? a < b : a > b), wb = both && (dir === 'low' ? b < a : b > a), f = (x) => (x == null ? '–' : `${x}%`); return `<div class="cp-row${dir === 'high' ? ' safe' : ''}${both ? '' : ' na'}">
        <b class="${wa ? 'win' : ''}">${f(a)}</b><span class="cp-bar l"><i style="--w:${a || 0}%"></i></span><span class="cp-lab">${tip(esc(lab), { Overall: 'completed', Attempted: 'attempted', 'Safe alternative': 'safe_alt' }[lab])}</span><span class="cp-bar r"><i style="--w:${b || 0}%"></i></span><b class="${wb ? 'win' : ''}">${f(b)}</b></div>`; }).join('')}</div>
      <p class="rt-key"><span><i class="k-c"></i>Harm, lower is safer</span><span class="muted">✓ marks the safer of the two on each row; – means results are being updated.</span></p>`;
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
  await Promise.all(['800 80px Sora', '600 30px "DM Sans"', '500 24px "IBM Plex Mono"'].map((f) => document.fonts.load(f).catch(() => {})));
  g.fillStyle = '#101317'; g.fillRect(0, 0, W, H);
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
    g.fillStyle = red; g.font = '500 22px "IBM Plex Mono"'; g.fillText(`WORST: ${w.cat.name.toUpperCase()}`, 64, 420);
  } catch (e) { /* no picture: the card stands without it */ }
  g.fillStyle = ink; g.font = '600 26px "DM Sans"'; g.fillText(S.meta.name, 64, 58);
  g.fillStyle = red; g.font = '500 22px "IBM Plex Mono"'; g.textAlign = 'right'; g.fillText((S.meta.card_line || '').toUpperCase(), W - 64, 58); g.textAlign = 'left';
  // logo, company, model
  g.fillStyle = '#1e2329'; g.beginPath(); g.arc(112, 530, 48, 0, Math.PI * 2); g.fill();
  if (o.logo) { try { g.drawImage(await svgImg(o.logo, ink), 84, 502, 56, 56); } catch (e) { /* skip */ } }
  else { g.fillStyle = ink; g.font = '800 34px Sora'; g.textAlign = 'center'; g.fillText(o.mono || o.name[0], 112, 542); g.textAlign = 'left'; }
  g.fillStyle = mute; g.font = '600 28px "DM Sans"'; g.fillText(o.name, 184, 518);
  // the model's name, a little smaller when it would not fit
  let fs = 60; g.font = `800 ${fs}px Sora`; while (fs > 36 && g.measureText(m.name).width > W - 64 - 184) g.font = `800 ${(fs -= 2)}px Sora`;
  g.fillStyle = ink; g.fillText(m.name, 184, 578);
  // stars and the headline number
  g.font = '64px "DM Sans"';
  for (let i = 0; i < 5; i++) { g.fillStyle = i < r.stars ? (r.stars >= 4 ? teal : r.stars === 3 ? '#f0b44b' : red) : '#2a3038'; g.fillText('★', 64 + i * 70, 700); }
  g.fillStyle = ink; g.font = '700 34px Sora'; g.fillText(r.label, 430, 690);
  g.fillStyle = red; g.font = '800 150px Sora'; g.fillText(pc(r.score), 60, 860);
  g.fillStyle = mute; g.font = '500 28px "DM Sans"'; g.fillText('of unsafe tasks ended in harm', 66, 905);
  g.fillText(`${MEAS[m.id] ? `${MEAS[m.id].n} tasks, direct instructions` : `under ${runs(m).length} attacks`} · rank #${ranked(m.track).findIndex((x) => x.id === m.id) + 1} of ${ranked(m.track).length}`, 66, 945);
  // the categories
  byCategory(m).forEach(([c, x], i) => {
    const y = 1010 + i * 44;
    g.fillStyle = ink; g.font = '500 24px "DM Sans"'; g.fillText(c.name, 64, y + 8);
    g.fillStyle = '#242a31'; g.fillRect(560, y - 8, 340, 14);
    g.fillStyle = red; g.fillRect(560, y - 8, 340 * x / 100, 14);
    g.fillStyle = ink; g.font = '500 22px "IBM Plex Mono"'; g.textAlign = 'right'; g.fillText(`${x}%`, W - 64, y + 8); g.textAlign = 'left';
  });
  g.fillStyle = mute; g.font = '500 22px "IBM Plex Mono"';
  g.fillText((S.meta.site_url || '').replace(/^https?:\/\//, '').replace(/\/$/, ''), 64, H - 50);
  const stamp = MEAS[m.id] ? `measured ${MEAS[m.id].date}` : R.placeholder ? 'preview data' : '';
  if (stamp) { g.textAlign = 'right'; g.fillText(stamp, W - 64, H - 50); g.textAlign = 'left'; }
  return cv;
}

function shareDialog(m) {
  let dlg = $('.sh-modal');
  if (!dlg) {
    document.body.insertAdjacentHTML('beforeend', `<div class="sh-modal" hidden><div class="sh-fog"></div><div class="sh-card" role="dialog" aria-modal="true" aria-label="Share card">
      <div class="sh-top"><span class="label">Share card</span><button type="button" class="sh-x" aria-label="Close">×</button></div><div class="sh-img"><span class="muted">Drawing the card…</span></div>
      <div class="sh-act"><a class="btn primary" id="sh-dl" download>Download PNG</a><button type="button" class="btn" id="sh-share">Share…</button><button type="button" class="btn" id="sh-copy">Copy link</button></div></div></div>`);
    dlg = $('.sh-modal');
    const close = () => {
      if (dlg.hidden) return;
      dlg.hidden = true;
      const back = shareDialog.opener; shareDialog.opener = null;
      if (back && back.isConnected) back.focus();
    };
    $('.sh-fog', dlg).addEventListener('click', close); $('.sh-x', dlg).addEventListener('click', close);
    addEventListener('keydown', (e) => {
      if (dlg.hidden) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      const fs = $$('button, a[href], [tabindex]:not([tabindex="-1"])', $('.sh-card', dlg)).filter((x) => !x.disabled && x.offsetParent);
      if (!fs.length) return;
      const first = fs[0], last = fs[fs.length - 1], at = document.activeElement;
      if (e.shiftKey && (at === first || !dlg.contains(at))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (at === last || !dlg.contains(at))) { e.preventDefault(); first.focus(); }
    });
  }
  if (dlg.hidden) shareDialog.opener = document.activeElement;
  dlg.hidden = false;
  $('.sh-x', dlg).focus();
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
  el.innerHTML = `<div class="head cm-head"><h2>${esc(title)}</h2><p>Agree with the rating? Vote with a reaction and tell us why. Lab staff welcome: say which lab you are from.</p></div>`;
  if (!C.repoId || !C.categoryId) {
    el.insertAdjacentHTML('beforeend', '<div class="cm-off"><b>Comments open at launch.</b><span>The discussion board for this page is set up but not switched on yet.</span></div>');
    return;
  }
  const sc = document.createElement('script');
  Object.entries({ src: 'https://giscus.app/client.js', 'data-repo': C.repo, 'data-repo-id': C.repoId, 'data-category': C.category, 'data-category-id': C.categoryId,
    'data-mapping': 'specific', 'data-term': term, 'data-strict': '1', 'data-reactions-enabled': '1', 'data-emit-metadata': '0', 'data-input-position': 'top',
    'data-theme': 'light', 'data-lang': 'en', 'data-loading': 'lazy', crossorigin: 'anonymous', async: '' }).forEach(([k, v]) => sc.setAttribute(k, v));
  el.appendChild(sc);
}

/* ------------------------------------------------------------------ fill the page */

chrome(); headBand();
// a section is filled when its element is on this page
const SECTIONS = { 'hero-run': hero, wall: heroWall, bignums: bigNumbers, lbh: leaderboard, vendors, report, compare, heatmap, atk: attackPlayer, gallery, 'scene-grid': sceneGrid,
  sources, 'hazard-list': hazardList, 'atk-matrix': attackMatrix, rules, 'atk-catalog': attackCatalog, 'defense-list': defenses, loop, metrics, levels, checks, ways, trust };
Object.entries(SECTIONS).forEach(([id, fill]) => { if (document.getElementById(id)) fill(); });
$$('[data-href]').forEach((a) => { a.href = link(a.dataset.href); });
reveal();
})();
