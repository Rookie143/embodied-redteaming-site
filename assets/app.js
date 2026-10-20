/* Embodied Red Teaming: the home page. Everything it shows comes from data/site.js (text, models, media) and
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
  const links = [['#leaderboard', 'Leaderboard'], ['#breaks', 'Hazards'], ['#attacks', 'Attacks'], ['#scenarios', 'Scenarios'], ['#how', 'Method']];
  $('#nav').outerHTML = `<nav class="nav always" aria-label="Sections">
    <a class="wordmark" href="#top"><span class="mark" aria-hidden="true">${MARK}</span>${esc(S.meta.name)}</a>
    <div class="nav-links">${links.map(([h, l]) => `<a href="${h}">${l}</a>`).join('')}</div>
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
    <div><a class="wordmark" href="#top"><span class="mark" aria-hidden="true">${MARK}</span>${esc(S.meta.name)}</a>
      <div class="prov">Results updated ${esc(d)}${S.meta.placeholder ? ' · placeholder data' : ''}</div>
      <div class="copy">© 2026 ${esc(S.meta.name)} · layout after <a class="link" href="https://www.embodied-first-exam.ai/">Embodied First Exam</a> (MIT)</div></div>
    <div><h5>The arena</h5><ul><li><a href="#leaderboard">Leaderboard</a></li><li><a href="#breaks">Hazards</a></li><li><a href="#attacks">Attacks</a></li></ul></div>
    <div><h5>Method</h5><ul><li><a href="#scenarios">Scenarios</a></li><li><a href="#how">The loop</a></li><li><a href="#how">Metrics</a></li></ul></div>
    <div><h5>Community</h5><ul><li><a data-gh>GitHub</a></li><li><a data-gh>Submit an attack</a></li></ul></div>
  </div></footer>`;
  $$('footer [data-gh]').forEach((el) => { if (GH) el.href = GH; else el.classList.add('soon'); });
  if (S.meta.placeholder || R.placeholder) {
    const b = $('#ph-badge');
    b.hidden = false;
    b.innerHTML = '<i></i>Preview · placeholder numbers and media';
  }
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
    return `<a class="wt${cat ? ' hz' : ''}" tabindex="-1" href="#scenarios"><img src="${esc(t.poster)}" alt="" loading="lazy" decoding="async">${video}
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
const cell = (itf, atk, dfn) => R.cells[`${itf}|${atk}|${dfn}`] || {};

function leaderboard() {
  const el = $('#lbh');
  const st = { track: 'llm', itf: 'cap', atk: 'robopair', dfn: 'none', open: null };
  const seg = (name, opts, cur, label) => `<div class="seg" data-k="${name}" role="group" aria-label="${label}">${opts.map(([v, l]) =>
    `<button type="button" data-v="${v}" aria-pressed="${v === cur}" class="${v === cur ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const controls = () => {
    const itfs = S.interfaces.filter((i) => i.track === st.track);
    return `<div class="lbh-top rt-top">
      ${seg('track', [['llm', 'LLM / VLM agents'], ['vla', 'VLA policies']], st.track, 'Track')}
      ${itfs.length > 1 ? seg('itf', itfs.map((i) => [i.id, i.name]), st.itf, 'Robot interface') : `<span class="rt-fixed">${esc(itfs[0].name)}</span>`}
    </div>
    <div class="lbh-top rt-top rt-sub">
      <span class="label">Attack</span>${seg('atk', S.attacks.map((a) => [a.id, a.name]), st.atk, 'Attack')}
      <span class="label">Defense</span>${seg('dfn', S.defenses.map((d) => [d.id, d.name]), st.dfn, 'Defense')}
    </div>
    <p class="lb-desc" id="lbh-desc"></p>`;
  };
  el.innerHTML = `<div class="rt-controls"></div>
    <div class="lbh-chart"><div class="lbh-ax"><div class="lbh-axis"><span></span><span class="lbh-ticks" aria-hidden="true">${[0, 25, 50, 75, 100].map((t) => `<i style="left:${t}%">${t}%</i>`).join('')}</span><span class="lbh-n">ASR ↓</span><span class="lbh-n">Benign ↑</span></div></div>
    <div class="lbh-rows"></div></div>
    <div class="rt-key"><span><i class="k-c"></i>Harm completed</span><span><i class="k-a"></i>Harm attempted, not completed</span><span><i class="k-b"></i>Benign twin solved</span><span class="muted">Ranked by completed attack success, lowest first. Click a model for its hazard profile.</span></div>`;
  const paintControls = () => {
    $('.rt-controls', el).innerHTML = controls();
    const a = S.attacks.find((x) => x.id === st.atk), d = S.defenses.find((x) => x.id === st.dfn), i = S.interfaces.find((x) => x.id === st.itf);
    $('#lbh-desc').innerHTML = `<b>${esc(a.name)}.</b> ${esc(a.desc)} ${d.desc ? `<b>${esc(d.name.replace('+ ', ''))}.</b> ${esc(d.desc)}` : ''} <span class="muted">Interface: ${esc(i.name)} · ${int(S.totals.unsafe_tasks)} unsafe tasks.</span>`;
  };
  const rowsEl = $('.lbh-rows', el);
  const row = (m, v, k) => {
    const [att, comp, ben, q] = v;
    return `<button type="button" class="lbh-row${st.open === m.id ? ' on' : ''}" data-id="${m.id}" style="--i:${k}" aria-expanded="${st.open === m.id}" aria-label="${esc(m.name)}, place ${k + 1}: harm completed in ${comp}% of unsafe tasks, attempted in ${att}%">
      <span class="rk r${k + 1}">${k + 1}</span>${markOf(m)}
      <span class="lbh-name"><span class="lbh-nl"><b>${esc(m.name)}</b><span class="lbh-set">${esc(org(m).name)} · ${m.access === 'open' ? 'open weights' : 'API'}</span></span></span>
      <span class="lbh-track"><span class="lbh-a" style="--w:${att}%"></span><span class="lbh-s" style="--w:${comp}%"></span></span>
      <span class="lbh-val"><b>${comp}<small>%</small></b><em>tried ${att}%</em></span>
      <span class="lbh-ben" style="--b:${ben}%"><i></i><b>${ben}%</b></span>
    </button>${st.open === m.id ? detail(m, v) : ''}`;
  };
  const detail = (m, v) => {
    const [att, comp, ben, q] = v, prof = R.profile[m.id] || {};
    const worst = S.attacks.map((a) => [a, (cell(st.itf, a.id, st.dfn)[m.id] || [0, 0])[1]]).sort((x, y) => y[1] - x[1]);
    return `<div class="rt-detail">
      <div class="rt-dcol"><p class="label">By hazard category · completed</p>
        ${S.categories.map((c) => { const x = Math.min(100, Math.round(comp * (prof[c.id] || 1))); return `<div class="rt-cat"><span>${esc(c.name)}</span><span class="rt-mini"><i style="--w:${x}%"></i></span><b>${x}%</b></div>`; }).join('')}</div>
      <div class="rt-dcol"><p class="label">By attack · completed</p>
        ${worst.map(([a, x]) => `<div class="rt-cat${a.id === st.atk ? ' cur' : ''}"><span>${esc(a.name)}</span><span class="rt-mini"><i style="--w:${x}%"></i></span><b>${x}%</b></div>`).join('')}</div>
      <dl class="rt-stats">
        <div><dt>${att}%</dt><dd>ASR, attempted</dd></div><div><dt>${comp}%</dt><dd>ASR, completed</dd></div>
        <div><dt>${ben}%</dt><dd>Benign success</dd></div><div><dt>${q}</dt><dd>Median queries to break</dd></div>
      </dl></div>`;
  };
  const paintRows = (animate) => {
    const v = cell(st.itf, st.atk, st.dfn);
    const ms = S.models.filter((m) => m.track === st.track && v[m.id]).sort((a, b) => v[a.id][1] - v[b.id][1] || v[a.id][0] - v[b.id][0]);
    // FLIP: rows that stay slide from their old place to the new one
    const before = new Map($$('.lbh-row', rowsEl).map((r) => [r.dataset.id, r.getBoundingClientRect().top]));
    rowsEl.innerHTML = ms.map((m, k) => row(m, v[m.id], k)).join('');
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
      if (k === 'track') st.open = null;
      paintControls(); repaint();
      return;
    }
    const r = e.target.closest('.lbh-row');
    if (r) { st.open = st.open === r.dataset.id ? null : r.dataset.id; paintRows(false); }
  });
  paintControls(); paintRows(false);
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

function gallery() {
  const el = $('#gallery');
  const firstOf = (c) => S.tiles.find((t) => t.cat === c);
  const card = (img, video, title, sub, tag, href) => `<a class="g-item"${href ? ` href="${esc(href)}" target="_blank" rel="noopener"` : ''}><div class="img"><img src="${esc(img)}" alt="" loading="lazy" decoding="async">${video ? `<video muted loop playsinline preload="none" data-src="${esc(video)}" aria-hidden="true"></video>` : ''}${tag ? `<span class="rel-tag">${tag}</span>` : ''}</div><b>${esc(title)}</b><span>${esc(sub)}</span></a>`;
  const cats = S.categories.map((c) => { const t = firstOf(c.id); return t ? card(t.poster, t.video, c.name, c.desc, `<i aria-hidden="true">⚠</i>${esc(c.code)}`) : ''; }).join('');
  const srcs = S.sources.map((s) => card(s.poster, s.video, s.name, `${s.n ? `${s.n} tasks · ` : ''}${s.body} · ${s.desc}`, '', s.url)).join('');
  el.innerHTML = `<div class="suite-group"><h3 class="sg-head">Hazard categories<small>${S.categories.length} categories</small></h3><div class="gallery">${cats}</div></div>
    <div class="suite-group"><h3 class="sg-head">Where the tasks come from<small>${S.sources.length} sources</small></h3><div class="gallery">${srcs}</div></div>`;
  const canHover = matchMedia('(hover: hover) and (pointer: fine)');
  $$('.g-item', el).forEach((a) => {
    const v = $('video[data-src]', a);
    if (!v) return;
    a.addEventListener('pointerenter', (e) => { if (e.pointerType === 'touch' || !canHover.matches || still) return; if (!v.src) v.src = v.dataset.src; a.classList.add('playing'); v.play().catch(() => {}); });
    a.addEventListener('pointerleave', () => { a.classList.remove('playing'); v.pause(); });
  });
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
  const M = [
    ['ASR · attempted', 'Share of unsafe tasks where the model tried to do the harm: code, skill calls or arm motion toward it.'],
    ['ASR · completed', 'Share where the harm actually happened in the simulator, by the scene’s own predicate.'],
    ['Benign success', 'Share of benign twins solved. Refusing everything is not safety.'],
    ['Queries to break', 'Median attacker queries (and tokens) to the first completed harm. Higher is sturdier.'],
    ['Intent (LLM / VLM)', 'Whether the model’s stated reasoning recognises the hazard, judged apart from its actions.'],
  ];
  $('#metrics').innerHTML = `<p class="label">What we report</p><dl>${M.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>`;
  $('#ways').innerHTML = `<p class="cw-lead">The same unsafe task reaches a robot three ways. LLMs and VLMs drive it through code or skills; VLAs drive it directly. We report the two families on separate boards.</p>
    <div class="cw-head"><span></span><span>How the model reaches the robot</span><span></span></div>
    ${S.interfaces.map((i) => `<details class="cw-row"><summary><span class="cw-n">${esc(i.name)}</span><span class="cw-f">${i.flow.map((f) => `<b>${esc(f)}</b>`).join('<i>→</i>')}</span><span class="cw-x" aria-hidden="true"></span></summary><p>${esc(i.desc)}</p></details>`).join('')}`;
  $('#trust').innerHTML = S.honest.map((h) => `<li tabindex="0"><span class="tr-ic">${svg(h.icon)}</span><b>${esc(h.title)}</b><span class="tip" role="tooltip">${esc(h.tip)}</span></li>`).join('');
}

chrome(); hero(); heroWall(); bigNumbers(); leaderboard(); heatmap(); attackPlayer(); gallery(); loop(); reveal();
})();
