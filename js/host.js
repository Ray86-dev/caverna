/* Pantalla principal (PIM). Es la autoridad del juego: los móviles solo envían respuestas. */
(function () {
  'use strict';
  var C = window.CONTENT, Sfx = window.Sfx, Net = window.Net, Art = window.Art, S3 = window.Scene3D || { on: false };
  var root = document.documentElement;
  var ROM = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'], GL = ['Α', 'Β', 'Γ', 'Δ'];
  var LS = 'caverna-host-v3', LSR = 'caverna-roster';
  var PTS_WHO = [1500, 1000, 600, 300];
  var S, demo = /[?&]demo/.test(location.search), botT = [], pubT = null, lastSec = -1, fxMode = 'embers';
  var stage = document.getElementById('stage'), bar = document.getElementById('bar'), menu = document.getElementById('menu'), ov = document.getElementById('ov');

  function now() { return Date.now(); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function randCode() { var L = 'ABCDEFGHJKLMNPRSTUVWXYZ', s = ''; for (var i = 0; i < 4; i++) s += pick(L); return s; }
  function team(k) { return C.teams[k]; }
  function fallos(n) { return n + (n === 1 ? ' fallo' : ' fallos'); }
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

  /* ---------- estado ---------- */
  function mk(n, g) { return { n: n, g: g || '', out: false, team: -1, cid: '', seen: 0, pts: 0, bot: false, st: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]] }; }
  function storedRoster() { try { return JSON.parse(localStorage.getItem(LSR) || '[]'); } catch (e) { return []; } }
  function fresh() {
    return { code: randCode(), roster: storedRoster().map(function (x) { return mk(x[0], x[1]); }), nTeams: 0, teamsMade: false, phase: 'lobby', steps: [], idx: -1, sub: '', deadline: 0, paused: 0, ans: {}, cur: {}, score: [0, 0, 0, 0, 0], t0: 0, qlog: [], orac: [], v: 0 };
  }
  function save() { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) {} }
  function readHash() {
    var m = location.hash.match(/r=([^&]+)/); if (!m) return;
    try {
      var b = m[1].replace(/-/g, '+').replace(/_/g, '/'); while (b.length % 4) b += '=';
      var arr = JSON.parse(decodeURIComponent(escape(atob(b))));
      if (Array.isArray(arr)) localStorage.setItem(LSR, JSON.stringify(arr));
    } catch (e) {}
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  }
  function present() { var a = []; S.roster.forEach(function (r, i) { if (!r.out) a.push(i); }); return a; }
  function members(k) { var a = []; S.roster.forEach(function (r, i) { if (!r.out && r.team === k) a.push(i); }); return a; }
  function isActive(i) { var r = S.roster[i]; return !r.out && r.team >= 0 && (r.bot || (!!r.cid && (now() - r.seen < 45000 || !!S.ans[i]))); }
  function actives() { return present().filter(isActive); }
  function autoTeams() { var n = present().length; return n >= 17 ? 5 : n >= 12 ? 4 : n >= 6 ? 3 : 2; }
  function smallestTeam() { var best = 0, bn = 1e9; for (var k = 0; k < S.nTeams; k++) { var n = members(k).length; if (n < bn) { bn = n; best = k; } } return best; }

  function makeTeams() {
    if (!S.nTeams) S.nTeams = autoTeams();
    var by = {}; present().forEach(function (i) { var g = S.roster[i].g || '?'; (by[g] = by[g] || []).push(i); });
    var order = []; Object.keys(by).sort(function (a, b) { return by[b].length - by[a].length; }).forEach(function (g) { order = order.concat(shuffle(by[g])); });
    var off = Math.floor(Math.random() * S.nTeams);
    order.forEach(function (i, k) { S.roster[i].team = (k + off) % S.nTeams; });
    S.roster.forEach(function (r) { if (r.out) r.team = -1; });
    S.teamsMade = true;
  }

  /* ---------- pasos ---------- */
  function buildSteps() {
    var st = [], k;
    function intro(i) { st.push({ type: 'intro', r: i + 1 }); }
    function mix(o) { var idx = shuffle(o.map(function (_, i) { return i; })); return { opts: idx.map(function (i) { return o[i]; }), correct: idx.indexOf(0) }; }
    intro(0);
    C.quiz.forEach(function (q) { var m = mix(q.o); st.push({ type: 'mcq', kind: 'quiz', r: 1, t: q.t, q: q.q, opts: m.opts, correct: m.correct, e: q.e, secs: 20 }); });
    st.push({ type: 'scores', r: 1 });
    intro(1);
    C.duels.forEach(function (d) { d.items.forEach(function (it) { st.push({ type: 'mcq', kind: 'duel', r: 2, t: d.t, q: it.s, opts: d.sides, icons: d.icons, correct: it.a, e: it.e, secs: 7 }); }); });
    st.push({ type: 'scores', r: 2 });
    intro(2);
    var bo = shuffle(C.boards.map(function (_, i) { return i; }));
    for (k = 0; k < S.nTeams; k++) st.push({ type: 'board', r: 3, team: k, b: bo[k % bo.length], t: C.boards[bo[k % bo.length]].t, secs: 75 });
    st.push({ type: 'scores', r: 3 });
    intro(3);
    C.bulos.forEach(function (b) { st.push({ type: 'mcq', kind: 'bulo', r: 4, t: b.t, q: b.s, opts: C.buloOpts, correct: b.a, e: b.e, k: b.k, secs: 50 }); });
    st.push({ type: 'scores', r: 4 });
    intro(4);
    C.polls.forEach(function (p) { st.push({ type: 'poll', r: 5, t: p.t, q: p.q, opts: p.o, think: p.think, theme: p.theme, secs: 30 }); });
    st.push({ type: 'scores', r: 5 });
    intro(5);
    C.whoami.forEach(function (w) { st.push({ type: 'who', r: 6, t: w.t, a: C.names.indexOf(w.a), clues: w.clues, secs: 11 }); });
    st.push({ type: 'podium', r: 6 }); st.push({ type: 'report', r: 6 }); st.push({ type: 'bye', r: 6 });
    return st;
  }
  function step() { return S.steps[S.idx] || { type: 'lobby' }; }

  function start() {
    if (present().length && !S.teamsMade) makeTeams();
    if (!S.nTeams) S.nTeams = 2;
    if (demo) S.roster.forEach(function (r) { if (!r.out && !r.cid) r.bot = true; });
    S.steps = buildSteps(); S.phase = 'play'; S.t0 = now(); S.gid = Math.random().toString(36).slice(2, 8); S.score = [0, 0, 0, 0, 0]; S.qlog = []; S.orac = [];
    S.roster.forEach(function (r) { r.pts = 0; r.st = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]; });
    Sfx.gong(); go(0);
  }

  function go(i) {
    if (i < 0 || i >= S.steps.length) return;
    botT.forEach(clearTimeout); botT = [];
    S.idx = i; S.ans = {}; S.cur = {}; S.paused = 0; S.deadline = 0;
    var st = step();
    if (st.type === 'mcq' || st.type === 'poll') { S.sub = 'open'; S.cur.total = st.secs * 1000; S.deadline = now() + S.cur.total; }
    else if (st.type === 'who') { S.sub = 'open'; S.cur.clue = 0; S.cur.total = st.secs * 1000; S.deadline = now() + S.cur.total; }
    else if (st.type === 'board') { S.sub = 'ready'; }
    else S.sub = 'show';
    if (st.type === 'podium') S.phase = 'end';
    music(); render(); pub(); bots();
    if (st.type === 'intro') Sfx.whoosh();
    if (st.type === 'scores') Sfx.reveal();
    if (st.type === 'podium') { if (S3.on) { var fe = document.getElementById('flash'); fe.className = ''; void fe.offsetWidth; fe.className = 'go'; } Sfx.drum(1.6); setTimeout(function () { Sfx.fanfare(); fxMode = 'confetti'; }, 1700); }
  }
  function music() {
    var st = step(), k = null;
    if (S.phase === 'lobby') k = 'lobby';
    else if (S.sub === 'open') k = st.kind === 'duel' || st.type === 'board' ? 'fast' : st.type === 'poll' ? 'calm' : 'think';
    else if (st.type === 'poll') k = 'calm';
    Sfx.loop(k);
    fxMode = st.type === 'poll' && st.theme === 'matrix' ? 'matrix' : (st.type === 'podium' || st.type === 'bye') ? 'confetti' : 'embers';
    document.documentElement.style.setProperty('--lum', S.phase === 'lobby' ? 0 : Math.min(1, ((st.r || 1) - 1) / 5));
  }

  function next() {
    Sfx.init();
    var st = step();
    if (S.phase === 'lobby') return start();
    if (S.paused) return togglePause();
    if (st.type === 'board') { if (S.sub === 'ready') return startBoard(); if (S.sub === 'open') return finishBoard(); }
    if (S.sub === 'open') return timeUp(true);
    if (S.idx < S.steps.length - 1) go(S.idx + 1);
  }
  function nextLabel() {
    var st = step();
    if (S.phase === 'lobby') return 'Empezar';
    if (S.paused) return 'Reanudar';
    if (st.type === 'board' && S.sub === 'ready') return '¡Ya!';
    if (st.type === 'board' && S.sub === 'open') return 'Terminar';
    if (S.sub === 'open') return st.type === 'poll' ? 'Ver resultado' : 'Resolver ya';
    if (st.type === 'bye') return 'Fin';
    return 'Siguiente';
  }
  function togglePause() {
    if (S.sub !== 'open' || !S.deadline) return;
    if (S.paused) { S.deadline = now() + S.paused; S.paused = 0; music(); }
    else { S.paused = Math.max(500, S.deadline - now()); Sfx.loop(null); }
    renderBar(); pub();
  }
  function addTime() { if (S.sub === 'open' && S.deadline) { if (S.paused) S.paused += 10000; else S.deadline += 10000; S.cur.total += 10000; pub(); } }
  function skipRound() { for (var i = S.idx + 1; i < S.steps.length; i++) { var t = S.steps[i].type; if (t === 'intro' || t === 'podium') return go(i); } }

  /* ---------- respuestas ---------- */
  function accept(ri, val, idx) {
    var st = step(), r = S.roster[ri];
    if (idx !== S.idx || !r || S.ans[ri] || S.phase === 'lobby') return;
    val = parseInt(val, 10); if (isNaN(val) || val < 0) return;
    if (st.type === 'mcq' || st.type === 'poll') { if (S.sub !== 'open' || val >= st.opts.length) return; }
    else if (st.type === 'who') { if (S.sub !== 'open' || val >= C.names.length) return; }
    else if (st.type === 'board') { if (r.team === st.team || val > 2) return; if (!(S.sub === 'ready' || (S.sub === 'open' && now() - S.cur.t0 < 12000))) return; }
    else return;
    S.ans[ri] = { v: val, left: S.paused || Math.max(0, S.deadline - now()), clue: S.cur.clue || 0 };
    Sfx.pop(); live(); pubSoon();
    if (st.type !== 'board' && S.sub === 'open') {
      var act = actives(); if (act.length && act.every(function (i) { return S.ans[i]; })) {
        if (st.type === 'who') setTimeout(function () { if (S.idx === idx && S.sub === 'open') reveal(); }, 700);
        else if (!S.paused) S.deadline = Math.min(S.deadline, now() + 700);
      }
    }
  }
  function teamGain(pts, skip) {
    var g = [];
    for (var k = 0; k < S.nTeams; k++) {
      var m = members(k).filter(isActive);
      if (!m.length || k === skip) { g.push(0); continue; }
      var s = 0; m.forEach(function (i) { s += pts[i] || 0; });
      g.push(Math.round(s / m.length / 10) * 10);
    }
    return g;
  }
  function applyGain(g) { g.forEach(function (x, k) { S.score[k] += x; }); S.cur.gain = g; }
  function timeUp(force) {
    var st = step();
    if (st.type === 'who' && !force && S.cur.clue < st.clues.length - 1) {
      S.cur.clue++; S.deadline = now() + S.cur.total; Sfx.reveal(); render(); pub(); return;
    }
    if (st.type === 'board') return finishBoard();
    reveal();
  }
  function reveal() {
    var st = step(), pts = {}, ok = 0, n = 0, counts = [];
    if (S.sub !== 'open') return;
    S.paused = 0;
    Object.keys(S.ans).forEach(function (i) {
      var a = S.ans[i], r = S.roster[i]; n++;
      counts[a.v] = (counts[a.v] || 0) + 1;
      if (st.type === 'poll') { pts[i] = 200; return; }
      var good = a.v === (st.type === 'who' ? st.a : st.correct), frac = Math.min(1, a.left / (st.secs * 1000));
      r.st[st.t][1]++;
      if (good) {
        ok++; r.st[st.t][0]++;
        pts[i] = st.type === 'who' ? PTS_WHO[a.clue] : st.kind === 'quiz' ? Math.round(60 + 40 * frac) * 10 : st.kind === 'duel' ? Math.round(30 + 20 * frac) * 10 : 1000;
      } else pts[i] = 0;
    });
    Object.keys(pts).forEach(function (i) { S.roster[i].pts += pts[i]; });
    S.cur.res = pts; S.cur.counts = counts; S.cur.n = n; S.cur.ok = ok;
    applyGain(teamGain(pts));
    if (st.type !== 'poll') S.qlog.push({ q: st.q || ('¿Quién soy? ' + st.clues[3]), a: st.type === 'who' ? C.names[st.a] : st.opts[st.correct], t: st.t, ok: ok, n: n });
    S.sub = 'reveal';
    if (st.kind === 'duel') S.cur.auto = now() + 4200;
    if (st.type === 'poll') Sfx.reveal(); else if (n && ok >= n / 2) { Sfx.ok(); if (S3.on) S3.flare(); } else Sfx.bad();
    music(); render(); pub();
  }

  /* ---------- robots (modo ensayo) ---------- */
  function bots() {
    var st = step(), idx = S.idx;
    S.roster.forEach(function (r, i) {
      if (!r.bot || r.out) return;
      var val, delay;
      if (st.type === 'mcq') { val = Math.random() < 0.68 ? st.correct : Math.floor(Math.random() * st.opts.length); delay = st.secs * 1000 * (0.15 + Math.random() * 0.6); }
      else if (st.type === 'poll') { val = Math.floor(Math.random() * st.opts.length); delay = 1500 + Math.random() * 9000; }
      else if (st.type === 'who') { val = Math.random() < 0.7 ? st.a : Math.floor(Math.random() * C.names.length); delay = st.secs * 1000 * (0.3 + Math.random() * 3.2); }
      else if (st.type === 'board') { val = Math.floor(Math.random() * 3); delay = 800 + Math.random() * 5000; }
      else return;
      botT.push(setTimeout(function () { accept(i, val, idx); }, delay));
    });
  }

  /* ---------- red ---------- */
  function pubStep() {
    var st = step(), p = { type: st.type, r: st.r }, rv = S.sub === 'reveal';
    if (S.phase === 'lobby') return { type: 'lobby' };
    if (st.type === 'intro') { var R = C.rounds[st.r - 1]; p.title = R.title; p.sub2 = R.sub; p.icon = R.icon; }
    if (st.type === 'mcq') { p.kind = st.kind; p.q = st.q; p.opts = st.opts; p.icons = st.icons; if (rv) { p.correct = st.correct; p.e = st.e; } }
    if (st.type === 'poll') { p.q = st.q; p.opts = st.opts; if (rv) { p.counts = S.cur.counts; p.orac = S.cur.orac || []; } }
    if (st.type === 'who') { p.clues = st.clues.slice(0, rv ? 4 : S.cur.clue + 1); p.names = C.names; p.worth = PTS_WHO[S.cur.clue || 0]; if (rv) p.correct = st.a; }
    if (st.type === 'board') { p.team = st.team; p.title = C.boards[st.b].title; p.bet = S.sub === 'ready' || (S.sub === 'open' && now() - S.cur.t0 < 12000); if (rv) { p.err = S.cur.err; p.bucket = S.cur.bucket; p.bpts = S.cur.bpts; } }
    if (st.type === 'podium' || st.type === 'report' || st.type === 'bye') { p.type = 'end'; p.rank = ranking(); p.temas = C.temas; }
    return p;
  }
  function ranking() { var a = []; for (var k = 0; k < S.nTeams; k++) a.push(k); return a.sort(function (x, y) { return S.score[y] - S.score[x]; }); }
  function pub() {
    S.v++; save(); renderTop();
    var end = S.phase === 'end';
    Net.send('st', {
      v: S.v, gid: S.gid || '', now: now(), phase: S.phase, idx: S.idx, sub: S.sub, deadline: S.paused ? 0 : S.deadline, left: S.paused, total: S.cur.total || 0,
      step: pubStep(), nT: S.nTeams, made: S.teamsMade, sc: S.score.slice(0, Math.max(S.nTeams, 1)),
      tm: C.teams.map(function (t) { return [t.name, t.icon, t.color]; }),
      ro: S.roster.map(function (r) { return [r.n, r.team, r.cid ? r.cid.slice(0, 8) : (r.bot ? 'bot' : ''), r.out ? 1 : 0, r.pts, end ? r.st : 0]; }),
      ans: Object.keys(S.ans).map(Number), res: S.sub === 'reveal' ? (S.cur.res || {}) : null, gain: S.sub === 'reveal' ? (S.cur.gain || null) : null
    });
  }
  function pubSoon() { if (!pubT) pubT = setTimeout(function () { pubT = null; pub(); }, 350); }
  function byCid(cid) { for (var i = 0; i < S.roster.length; i++) if (S.roster[i].cid === cid) return i; return -1; }
  function onMsg(m) {
    if (!m || !m.cid) return;
    var ri = byCid(m.cid), r;
    if (ri >= 0) S.roster[ri].seen = now();
    if (m.k === 'claim') {
      r = S.roster[m.i]; if (!r || r.out) return;
      if (r.cid && r.cid !== m.cid && now() - r.seen < 60000) return pubSoon();
      if (ri >= 0 && ri !== m.i) S.roster[ri].cid = '';
      r.cid = m.cid; r.seen = now(); r.bot = false;
      if (S.teamsMade && r.team < 0) r.team = smallestTeam();
      Sfx.pop(); if (S.phase === 'lobby') render(); pubSoon();
    } else if (m.k === 'new') {
      var name = String(m.name || '').replace(/[<>]/g, '').trim().slice(0, 18); if (!name || ri >= 0) return pubSoon();
      var ex = -1; S.roster.forEach(function (x, i) { if (!x.cid && x.n.toLowerCase() === name.toLowerCase()) ex = i; });
      if (ex < 0) { S.roster.push(mk(name, '')); ex = S.roster.length - 1; }
      r = S.roster[ex]; r.out = false; r.cid = m.cid; r.seen = now(); r.bot = false;
      if (S.teamsMade && r.team < 0) r.team = smallestTeam();
      Sfx.pop(); if (S.phase === 'lobby') render(); pubSoon();
    } else if (m.k === 'free') {
      if (ri >= 0) { S.roster[ri].cid = ''; if (S.phase === 'lobby') render(); pubSoon(); }
    } else if (m.k === 'ans') {
      if (ri >= 0) accept(ri, m.val, m.idx);
    } else if (m.k === 'hi') { pubSoon(); }
  }

  /* ---------- pintar ---------- */
  function coinT(k, cls) { return Art.coin(team(k).icon, team(k).color, cls); }
  function renderTop() {
    var st = step(), rl = document.getElementById('rl'), h = '';
    if (S.phase === 'lobby') rl.innerHTML = 'Sala <b>' + S.code + '</b>';
    else {
      var R = C.rounds[(st.r || 1) - 1], inR = S.steps.filter(function (x) { return x.r === st.r && (x.type !== 'intro' && x.type !== 'scores' && x.type !== 'podium' && x.type !== 'report' && x.type !== 'bye'); });
      var pos = inR.indexOf(st);
      rl.innerHTML = Art.ic(R.icon) + ' Ronda ' + ROM[st.r] + ' <small>' + esc(R.title) + (pos >= 0 ? ' · ' + (pos + 1) + ' de ' + inR.length : '') + '</small>';
    }
    if (S.teamsMade || S.phase !== 'lobby') for (var k = 0; k < S.nTeams; k++) h += '<div class="chip' + (S.sub === 'reveal' && S.cur.gain && S.cur.gain[k] > 0 ? ' bump' : '') + '">' + coinT(k) + fmt(S.score[k]) + '</div>';
    document.getElementById('chips').innerHTML = h;
    renderMeta();
  }
  function renderMeta() {
    var c = 0; S.roster.forEach(function (r, i) { if (!r.out && r.cid && now() - r.seen < 45000) c++; });
    var el = S.t0 ? Math.floor((now() - S.t0) / 1000) : 0, mm = Math.floor(el / 60), ss = el % 60;
    document.getElementById('meta').innerHTML = '<span><span class="dot ' + Net.status + '"></span></span><span>' + Art.ic('phone') + c + '</span>' + (S.t0 && S.phase !== 'lobby' ? '<span>' + Art.ic('glass') + mm + ':' + (ss < 10 ? '0' : '') + ss + '</span>' : '');
  }
  function renderBar() {
    bar.innerHTML = '<button class="b" data-a="menu">Menú</button>' +
      (S.sub === 'open' && S.deadline ? '<button class="b" data-a="pause">' + (S.paused ? 'Seguir' : 'Pausa') + '</button><button class="b" data-a="plus">+10 s</button>' : '') +
      (S.phase !== 'lobby' ? '<button class="b" data-a="orac">' + Art.ic('temple') + ' Oráculo</button>' : '') +
      '<div class="sp"></div><button class="b go" data-a="next">' + nextLabel() + '</button>';
  }
  function timerHtml() { return '<div id="tbar"><i></i></div>'; }
  function liveCount() { var a = actives().length, n = Object.keys(S.ans).length; return '<div class="count"><b id="lc">' + n + '</b> / ' + Math.max(a, n) + '<br>respuestas</div>'; }
  function live() { var e = document.getElementById('lc'); if (e) e.textContent = Object.keys(S.ans).length; }
  function gainsHtml() {
    if (!S.cur.gain) return ''; var h = '<div class="gains">';
    S.cur.gain.forEach(function (g, k) { h += '<div class="gain" style="animation-delay:' + (k * 0.08) + 's">' + coinT(k) + '+' + g + '</div>'; });
    return h + '</div>';
  }
  function playUrl() { return location.href.replace(/[?#].*$/, '').replace(/host\.html$/, '') + '?s=' + S.code; }

  function render() {
    var st = step(), f = { lobby: vLobby, intro: vIntro, mcq: vMcq, board: vBoard, poll: vPoll, who: vWho, scores: vScores, podium: vPodium, report: vReport, bye: vBye }[S.phase === 'lobby' ? 'lobby' : st.type];
    lastSec = -1; closeMenu();
    sync3d(); f(st); renderTop(); renderBar();
  }

  function vLobby() {
    var qr = '';
    try { var q = window.qrcode(0, 'M'); q.addData(playUrl()); q.make(); qr = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }).replace(/fill="white"/g, 'fill="#f2e4c9"').replace(/fill="black"/g, 'fill="#14100c"'); } catch (e) {}
    var u = playUrl().replace(/^https?:\/\//, '').replace(/\?s=.*/, '');
    var h = '<div class="lobby"><div class="l"><div class="gr">ΦΙΛΟΣΟΦΙΑ</div><h1>Sal de la <em>caverna</em></h1><div class="rule">' + Art.ic('sun') + '</div><div class="qr">' + qr + '</div>' +
      '<div class="url">Escanea el código o entra en <b>' + esc(u) + '</b><br>y escribe la clave de la sala</div><div class="code">' + S.code + '</div></div><div class="r">';
    h += '<div class="tools"><button class="b sm" data-a="teams">' + (S.teamsMade ? 'Volver a sortear' : 'Sortear equipos') + '</button><span>Equipos</span>';
    [2, 3, 4, 5].forEach(function (n) { h += '<button class="b sm' + ((S.nTeams || autoTeams()) === n ? ' sel' : '') + '" data-a="nt" data-n="' + n + '">' + n + '</button>'; });
    h += '<div class="sp"></div><button class="b sm" data-a="list">Lista</button><button class="b sm' + (demo ? ' sel' : '') + '" data-a="demo">Ensayo</button></div>';
    var cols, groups = [];
    if (S.teamsMade) { for (var k = 0; k < S.nTeams; k++) groups.push({ title: coinT(k) + ' ' + team(k).name, color: team(k).color, ids: members(k) }); var outs = []; S.roster.forEach(function (r, i) { if (r.out) outs.push(i); }); if (outs.length) groups.push({ title: 'Ausentes', color: '#4a3a2a', ids: outs }); cols = Math.min(3, groups.length); }
    else { var by = {}; S.roster.forEach(function (r, i) { var g = r.g ? '4.º ' + r.g : 'Jugadores'; (by[g] = by[g] || []).push(i); }); Object.keys(by).sort().forEach(function (g) { groups.push({ title: g, color: '#cf5f2e', ids: by[g] }); }); cols = Math.max(1, Math.min(2, groups.length)); }
    h += '<div class="groups" style="--cols:' + cols + '">';
    groups.forEach(function (g) {
      h += '<div class="grp" style="--tc:' + g.color + '"><h3>' + g.title + '<small>' + g.ids.length + '</small></h3><div class="names">';
      g.ids.forEach(function (i) { var r = S.roster[i]; h += '<button class="nm' + (r.out ? ' out' : r.cid ? ' in' : (demo ? ' bot' : '')) + '" data-a="nm" data-i="' + i + '">' + (r.cid && !r.out ? Art.ic('phone') : '') + esc(r.n) + '</button>'; });
      h += '</div></div>';
    });
    if (!S.roster.length) h += '<div class="grp"><h3>Esperando jugadores</h3><div class="hint">Cada alumno entra con su móvil y escribe su nombre.</div></div>';
    h += '</div><div class="hint">Toca un nombre para marcarlo como ausente (o para liberar su móvil si alguien se equivocó). Quien no tenga móvil juega igual: responde con su equipo y sale a la pantalla.</div></div></div>';
    stage.innerHTML = h;
  }

  function vIntro(st) {
    var R = C.rounds[st.r - 1];
    stage.innerHTML = '<div class="center intro"><div class="kick">Ronda ' + ROM[R.n] + ' de VI</div><div class="seal">' + Art.coin(R.icon, 'var(--clay)') + '</div><h1>' + esc(R.title) + '</h1><div class="sub">' + esc(R.sub) + '</div><ul>' + R.how.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
  }

  function vMcq(st) {
    var rv = S.sub === 'reveal', h = rv ? '' : timerHtml(), cnt = S.cur.counts || [];
    function cls(i) { return rv ? (i === st.correct ? ' yes' : ' no') : ''; }
    function nn(i) { return rv ? '<span class="n">' + (cnt[i] || 0) + '</span>' : ''; }
    if (st.kind === 'duel') {
      h += '<div class="duel"><div class="st">' + esc(st.q) + '</div><div class="vs">' +
        '<div class="sd fa' + cls(0) + '">' + Art.ic(st.icons[0]) + st.opts[0] + nn(0) + '</div>' +
        '<div class="mid">' + (rv ? '' : '<div class="tnum" id="tn"></div>') + liveCount() + '</div>' +
        '<div class="sd fb' + cls(1) + '">' + Art.ic(st.icons[1]) + st.opts[1] + nn(1) + '</div></div>' +
        (rv ? '<div class="expl" style="text-align:center;border-left:0">' + esc(st.e) + '</div>' : '<div class="expl" style="visibility:hidden">.</div>') + '</div>';
    } else if (st.kind === 'bulo') {
      var stamp = rv ? ['<div class="stamp" style="color:#4f7a1f">Verdad</div>', '<div class="stamp" style="color:#b22a1a">Falso</div>', '<div class="stamp" style="color:#946200">No comprobable</div>'][st.correct] : '';
      h += '<div class="post' + (rv ? ' rv' : '') + '"><div class="fw">Mensaje reenviado muchas veces</div><div class="tx">' + esc(st.q) + '</div></div><div class="stampw">' + stamp + '</div>';
      h += '<div class="opts three">' + st.opts.map(function (o, i) { return '<div class="opt' + cls(i) + '"><span class="lt">' + Art.ic(['check', 'cross', 'ask'][i]) + '</span>' + esc(o) + nn(i) + '</div>'; }).join('') + '</div>';
      h += rv ? '<div class="expl">' + esc(st.e) + '<small>' + esc(st.k) + '</small></div>' + gainsHtml() : '<div class="row"><div class="tnum" id="tn"></div>' + liveCount() + '<div class="count">' + Art.ic('lens') + ' Se puede buscar<br>y discutir en equipo</div></div>';
    } else {
      h += '<div class="q"><div class="tx"><span class="tag">Tema ' + st.t + ' · ' + C.temas[st.t] + '</span>' + esc(st.q) + '</div><div class="side">' + (rv ? '<div class="tnum">' + (S.cur.n ? Math.round(100 * S.cur.ok / S.cur.n) : 0) + '%</div><div class="count">de aciertos</div>' : '<div class="tnum" id="tn"></div>' + liveCount()) + '</div></div>';
      h += '<div class="opts">' + st.opts.map(function (o, i) { return '<div class="opt' + cls(i) + '"><span class="lt">' + GL[i] + '</span>' + esc(o) + nn(i) + '</div>'; }).join('') + '</div>';
      if (rv) h += '<div class="expl">' + esc(st.e) + '</div>' + gainsHtml();
    }
    stage.innerHTML = h;
  }

  /* ----- tablero táctil ----- */
  var drags = {}, picked = null;
  function vBoard(st) {
    var T = team(st.team), B = C.boards[st.b];
    if (S.sub === 'ready') {
      stage.innerHTML = '<div class="center ready"><div class="kick">Turno de tablero</div><div class="seal">' + coinT(st.team) + '</div><h2 style="color:' + T.color + '">Equipo ' + T.name + ', a la pantalla</h2><div class="who">' + members(st.team).map(function (i) { return esc(S.roster[i].n); }).join(' · ') + '</div>' +
        '<p>Tablero: <b>' + esc(B.title) + '</b> · ' + B.cards.length + ' tarjetas · ' + st.secs + ' segundos</p><p>' + Art.ic('phone') + ' Los demás equipos apuestan en el móvil cuántos fallos tendrán. ' + liveCount().replace('<br>respuestas', ' apuestas') + '</p></div>';
      return;
    }
    if (S.sub === 'reveal') { stage.innerHTML = '<div class="center"><div class="big">' + coinT(st.team) + '+' + (S.cur.bpts || 0) + '</div><div class="sub">' + fallos(S.cur.err || 0) + '</div>' + gainsHtml() + '</div>'; return; }
    if (S3.on && S3.board) {
      var order = shuffle(B.cards.map(function (_, i) { return i; })), counts = B.bins.map(function (_, bi) { return B.cards.filter(function (c) { return c[1] === bi; }).length; });
      stage.innerHTML = timerHtml() + '<div class="board b3"><div class="bhead" id="bh"><h2>' + coinT(st.team) + esc(B.title) + '</h2><div class="er" id="er">Fallos: 0</div><div class="tnum" id="tn"></div></div><div id="pad3d"></div><div id="bsum"></div></div>';
      S3.board.start({ bins: B.bins, cards: B.cards.map(function (c) { return c[0]; }), order: order, counts: counts }, drop3d);
      S3.setMode('table', st.r);
      return;
    }
    var n = B.bins.length, cols = n <= 6 ? n : 4;
    var h = timerHtml() + '<div class="board"><div class="bhead" id="bh"><h2>' + coinT(st.team) + esc(B.title) + '</h2><div class="er" id="er">Fallos: 0</div><div class="tnum" id="tn"></div></div><div class="bins" style="grid-template-columns:repeat(' + cols + ',1fr)">';
    B.bins.forEach(function (b, i) { h += '<div class="bin" data-b="' + i + '"><h4>' + esc(b) + '</h4></div>'; });
    h += '</div><div class="tray" id="tray">';
    shuffle(B.cards.map(function (_, i) { return i; })).forEach(function (i) { h += '<div class="card" data-c="' + i + '">' + esc(B.cards[i][0]) + '</div>'; });
    stage.innerHTML = h + '</div></div>';
    drags = {}; picked = null;
  }
  function drop3d(ci, bi) {
    var st = step(), B = C.boards[st.b]; if (S.sub !== 'open' || st.type !== 'board') return false;
    if (B.cards[ci][1] === bi) { S.cur.placed++; Sfx.ok(); if (S.cur.placed >= B.cards.length) setTimeout(finishBoard, 800); save(); return true; }
    S.cur.err++; Sfx.bad(); var e = document.getElementById('er'); if (e) e.textContent = 'Fallos: ' + S.cur.err; save(); return false;
  }
  function startBoard() { var st = step(); S.sub = 'open'; S.cur.t0 = now(); S.cur.err = 0; S.cur.placed = 0; S.cur.total = st.secs * 1000; S.deadline = now() + S.cur.total; Sfx.gong(); music(); render(); pub(); setTimeout(function () { if (step() === st && S.sub === 'open') pub(); }, 12500); }
  function attempt(card, binEl) {
    var st = step(), B = C.boards[st.b], ci = +card.getAttribute('data-c'), bi = +binEl.getAttribute('data-b');
    if (S.sub !== 'open' || card.parentNode.id !== 'tray') return;
    if (B.cards[ci][1] === bi) {
      card.className = 'card'; card.style.transform = ''; binEl.appendChild(card); S.cur.placed++; Sfx.ok();
      if (S.cur.placed >= B.cards.length) setTimeout(finishBoard, 500);
    } else {
      S.cur.err++; Sfx.bad(); binEl.classList.add('shake'); setTimeout(function () { binEl.classList.remove('shake'); }, 400);
      var e = document.getElementById('er'); if (e) e.textContent = 'Fallos: ' + S.cur.err;
    }
    save();
  }
  function finishBoard() {
    var st = step(), B = C.boards[st.b]; if (S.sub !== 'open' || st.type !== 'board') return;
    var left = S.paused || Math.max(0, S.deadline - now()), all = S.cur.placed >= B.cards.length;
    var pts = Math.max(0, S.cur.placed * 200 - S.cur.err * 50) + (all ? Math.round(left / 1000) * 10 : 0);
    pts = Math.round(pts / 10) * 10;
    var bucket = S.cur.err === 0 ? 0 : S.cur.err <= 2 ? 1 : 2, bp = {};
    Object.keys(S.ans).forEach(function (i) { bp[i] = S.ans[i].v === bucket ? 300 : 0; S.roster[i].pts += bp[i]; });
    var g = teamGain(bp, st.team); g[st.team] = pts; applyGain(g);
    members(st.team).forEach(function (i) { S.roster[i].pts += Math.round(pts / 40) * 10; });
    S.cur.res = bp; S.cur.bucket = bucket; S.cur.bpts = pts; S.paused = 0; S.sub = 'reveal';
    S.qlog.push({ q: 'Tablero «' + B.title + '» (equipo ' + team(st.team).name + ')', a: fallos(S.cur.err), t: st.t, ok: Math.max(0, S.cur.placed - S.cur.err), n: B.cards.length, board: true });
    /* colocar lo que falte, para que se vea la solución */
    var s3 = document.getElementById('bsum');
    if (s3) {
      if (S3.board) S3.board.finish(B.cards.map(function (c) { return c[1]; }));
      s3.innerHTML = '<div class="big">' + coinT(st.team) + '+' + pts + ' puntos</div><div class="count" style="font-size:1.6rem;margin-top:.6rem">' + S.cur.placed + ' de ' + B.cards.length + ' colocadas · ' + fallos(S.cur.err) + (all ? ' · bonus de tiempo +' + Math.round(left / 1000) * 10 : '') + ' · Apuesta ganadora: ' + ['0 fallos', '1 o 2 fallos', '3 o más'][bucket] + '</div>' + gainsHtml();
      var tn3 = document.getElementById('tn'); if (tn3) tn3.textContent = ''; var tb3 = document.getElementById('tbar'); if (tb3) tb3.style.display = 'none';
    }
    var tray = document.getElementById('tray');
    if (tray) {
      [].slice.call(tray.querySelectorAll('.card')).forEach(function (c) { var bi = B.cards[+c.getAttribute('data-c')][1], bin = stage.querySelector('.bin[data-b="' + bi + '"]'); c.className = 'card late'; c.style.cssText = ''; if (bin) bin.appendChild(c); });
      tray.innerHTML = '<div style="text-align:center"><div class="big">' + coinT(st.team) + '+' + pts + ' puntos</div><div class="count" style="font-size:1.6rem;margin-top:.6rem">' + S.cur.placed + ' de ' + B.cards.length + ' colocadas · ' + fallos(S.cur.err) + (all ? ' · bonus de tiempo +' + Math.round(left / 1000) * 10 : '') + ' · Apuesta ganadora: ' + ['0 fallos', '1 o 2 fallos', '3 o más'][bucket] + '</div>' + gainsHtml() + '</div>';
      var tn = document.getElementById('tn'); if (tn) tn.textContent = ''; var tb0 = document.getElementById('tbar'); if (tb0) tb0.style.display = 'none';
    } else if (!s3) render();
    if (all && S.cur.err <= 1) Sfx.fanfare(); else Sfx.reveal();
    music(); renderTop(); renderBar(); pub();
  }
  stage.addEventListener('pointerdown', function (e) {
    var c = e.target.closest ? e.target.closest('.card') : null;
    if (c && c.parentNode.id === 'tray' && S.sub === 'open') {
      Sfx.init(); drags[e.pointerId] = { el: c, x: e.clientX, y: e.clientY, moved: false };
      try { c.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault(); return;
    }
    var b = e.target.closest ? e.target.closest('.bin') : null;
    if (b && picked && picked.parentNode && picked.parentNode.id === 'tray') { var p = picked; picked = null; p.classList.remove('pick'); attempt(p, b); }
  });
  stage.addEventListener('pointermove', function (e) {
    var d = drags[e.pointerId]; if (!d) return;
    var dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.moved && Math.abs(dx) + Math.abs(dy) > 12) { d.moved = true; d.el.classList.add('drag'); }
    if (d.moved) {
      d.el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.06)';
      d.el.style.pointerEvents = 'none'; var u = document.elementFromPoint(e.clientX, e.clientY); d.el.style.pointerEvents = '';
      var b = u && u.closest ? u.closest('.bin') : null;
      if (d.tgt && d.tgt !== b) d.tgt.classList.remove('tgt'); if (b) b.classList.add('tgt'); d.tgt = b;
    }
  });
  function endDrag(e) {
    var d = drags[e.pointerId]; if (!d) return; delete drags[e.pointerId];
    try { d.el.releasePointerCapture(e.pointerId); } catch (_) {}
    if (d.tgt) d.tgt.classList.remove('tgt');
    if (!d.moved) { if (picked) picked.classList.remove('pick'); if (picked === d.el) picked = null; else { picked = d.el; d.el.classList.add('pick'); Sfx.pop(); } return; }
    d.el.style.pointerEvents = 'none'; var u = document.elementFromPoint(e.clientX, e.clientY); d.el.style.pointerEvents = '';
    d.el.classList.remove('drag'); d.el.style.transform = '';
    var b = u && u.closest ? u.closest('.bin') : null; if (b && e.type !== 'pointercancel') attempt(d.el, b);
  }
  ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach(function (ev) {
    stage.addEventListener(ev, function (e) {
      if (!S3.on || !S3.board || !S3.board.active) return;
      if (ev === 'pointerdown') { if (e.target.id !== 'pad3d') return; Sfx.init(); try { e.target.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault(); }
      S3.board.pointer(ev.replace('pointer', ''), e.pointerId, e.clientX, e.clientY);
    });
  });
  stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', endDrag);

  /* ----- ágora ----- */
  function vPoll(st) {
    var rv = S.sub === 'reveal', cnt = S.cur.counts || [], n = S.cur.n || 0;
    var cols = st.theme === 'matrix' ? ['#c8372d', '#2f6fb0'] : st.theme === 'gattaca' ? ['var(--ok)', 'var(--bad)', 'var(--gold)'] : ['var(--clay)', 'var(--sea)'];
    var h = (rv ? '' : timerHtml()) + '<div class="poll"><div class="m"><div class="pq">' + esc(st.q) + '</div>';
    st.opts.forEach(function (o, i) {
      var who = (S.cur.orac || []).filter(function (x) { return x.o === i; }).map(function (x) { return '<em>' + Art.ic('temple') + esc(S.roster[x.ri].n) + '</em>'; }).join('');
      h += '<div class="pbar" style="--oc:' + cols[i] + '"><i data-w="' + (rv && n ? Math.round(100 * (cnt[i] || 0) / n) : 0) + '"></i><span>' + esc(o) + '</span>' + who + (rv ? '<b>' + (cnt[i] || 0) + '</b>' : '') + '</div>';
    });
    h += rv ? '' : '<div class="row"><div class="tnum" id="tn"></div>' + liveCount().replace('respuestas', 'votos') + '</div>';
    h += '</div><div class="s"><h3>' + (rv ? 'Para pensarlo en voz alta' : 'Vota lo que pienses de verdad') + '</h3>';
    if (rv) {
      h += '<ul>' + st.think.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><button class="b" data-a="orac2" style="border-color:var(--gold);color:var(--gold)">' + Art.ic('temple') + ' Que elija el oráculo</button><h3 style="margin-top:.8rem">Buena razón: +300 al equipo</h3><div class="stars">';
      for (var k = 0; k < S.nTeams; k++) h += '<button class="b sm" data-a="star" data-k="' + k + '">' + coinT(k) + ' +300</button>';
      h += '</div>';
    } else h += '<p>Aquí no hay respuesta correcta.</p><p>Después del voto, el oráculo de Delfos elegirá a alguien de cada bando para que dé <b>una razón</b>.</p><p>Ve pensando la tuya.</p>';
    stage.innerHTML = h + '</div></div>';
    if (rv) setTimeout(function () { [].forEach.call(stage.querySelectorAll('.pbar i'), function (e) { e.style.width = e.getAttribute('data-w') + '%'; }); }, 60);
  }
  function oracle(cands, why, done) {
    if (!cands.length) return done && done(-1);
    var fresh = cands.filter(function (i) { return S.orac.indexOf(i) < 0; }); if (fresh.length) cands = fresh;
    var ri = pick(cands), el = document.createElement('div'), n = 0, all = present();
    el.className = 'orc' + (S3.on ? ' o3d' : ''); if (S3.on) { S3.oracle(true); document.body.classList.add('orc3'); } el.innerHTML = '<div class="seal">' + Art.coin('temple', 'var(--gold)') + '</div><div class="kick">El oráculo de Delfos elige a</div><div class="n"></div><div class="w">' + esc(why || '') + '</div><div class="gr">ΓΝΩΘΙ ΣΑΥΤΟΝ · conócete a ti mismo</div>';
    ov.appendChild(el); Sfx.drum(1.8);
    var nm = el.querySelector('.n'), iv = setInterval(function () {
      nm.textContent = S.roster[pick(all)].n; Sfx.tick(n % 2); if (S3.on) S3.oraclePulse();
      if (++n > 18) {
        clearInterval(iv); nm.textContent = S.roster[ri].n; nm.className = 'n done'; S.orac.push(ri); Sfx.ok(); if (S3.on) S3.oracleBurst(); Sfx.say('El oráculo elige a ' + S.roster[ri].n.replace(/\./g, ''));
        var close = function () { if (el.parentNode) { el.parentNode.removeChild(el); if (done) done(ri); setTimeout(function () { if (!ov.querySelector('.orc')) { document.body.classList.remove('orc3'); if (S3.on) S3.oracle(false); } }, 80); } };
        el.onclick = close; setTimeout(close, 3400);
      }
    }, 100);
  }
  function oraclePoll() {
    var st = step(), o = 0; S.cur.orac = [];
    (function nextOne() {
      if (o >= st.opts.length) { render(); pub(); return; }
      var c = Object.keys(S.ans).map(Number).filter(function (i) { return S.ans[i].v === o && !S.roster[i].out; }), oi = o++;
      if (!c.length) return nextOne();
      oracle(c, 'Defiende: ' + st.opts[oi], function (ri) { if (ri >= 0) S.cur.orac.push({ ri: ri, o: oi }); nextOne(); });
    })();
  }

  /* ----- quién soy ----- */
  function vWho(st) {
    var rv = S.sub === 'reveal', name = C.names[st.a], cl = S.cur.clue || 0, RN = ['I', 'II', 'III', 'IV'];
    var h = (rv ? '' : timerHtml()) + '<div class="who6' + (S3.on ? ' w3' + (rv ? ' rvl' : '') : '') + '"><div class="av">' +
      (rv ? (S3.on ? '<div class="kick">Era</div><div class="nm6">' + name + '</div>' : '<div class="wreath">' + Art.laurel() + '<span>' + name + '</span></div>') + '<div class="count"><b>' + (S.cur.ok || 0) + '</b> / ' + (S.cur.n || 0) + ' aciertos</div>' : (S3.on ? '' : '<div class="urn">' + Art.ic('amphora') + '<b>?</b></div>') + '<div class="pts">' + fmt(PTS_WHO[cl]) + '<small>puntos si aciertas ahora · un solo intento</small></div><div class="tnum" id="tn" style="font-size:3.6rem"></div>' + liveCount()) + '</div><div class="clues">';
    st.clues.forEach(function (c, i) { h += i <= cl || rv ? '<div class="clue"><b>' + RN[i] + '</b><span>«' + esc(c) + '»</span></div>' : '<div class="clue wait"><b>' + RN[i] + '</b><span>Pista por ' + fmt(PTS_WHO[i]) + ' puntos</span></div>'; });
    stage.innerHTML = h + (rv ? gainsHtml() : '') + '</div></div>';
  }

  /* ----- escena 3D ----- */
  function prog3d(r) {
    var mx = Math.max.apply(null, S.score.slice(0, S.nTeams).concat([1])), frac = Math.max(0, Math.min(1, r / 6)), a = [];
    for (var k = 0; k < S.nTeams; k++) a.push(S.score[k] / mx * frac);
    return a;
  }
  function sync3d() {
    var st = step(), lobby = S.phase === 'lobby', t = st.type, end = t === 'podium' || t === 'report' || t === 'bye', sc;
    S3.onFrame = null;
    if (!S3.on) { root.style.setProperty('--scrim', 0); return; }
    if (S.teamsMade || !lobby) S3.setTeams(S.nTeams, C.teams);
    var b3 = t === 'board' && S.sub !== 'ready' && !!S3.board && (S.sub === 'open' || S3.board.active);
    if (S3.board && S3.board.active && !b3) S3.board.stop();
    S3.setMode(lobby ? 'lobby' : t === 'scores' ? 'scores' : end ? 'out' : b3 ? 'table' : t === 'who' ? 'who' : 'play', st.r || 1);
    if (t === 'who') S3.who((S.cur.clue || 0) + 1, S.sub === 'reveal', C.names[st.a]);
    sc = lobby ? 0.2 : t === 'intro' ? 0.42 : (t === 'scores' || t === 'podium') ? 0 : t === 'bye' ? 0.3 : t === 'report' ? 0.82 : (t === 'board' && S.sub === 'ready') ? 0.5 : 0.76;
    if (b3) sc = S.sub === 'open' ? 0 : 0.55; if (t === 'who') sc = 0.08;
    root.style.setProperty('--scrim', sc);
    if (lobby) S3.setProgress([], true);
    else if (end) S3.setPodium(ranking().slice(0, 3));
    else if (t !== 'scores') S3.setProgress(prog3d((st.r || 1) - 1), true);
  }
  function labels(kind, n) {
    S3.onFrame = function () {
      for (var i = 0; i < n; i++) { var e = document.getElementById('lab' + i), p = S3.project(kind, i); if (e && p) { e.style.left = p.x + 'px'; e.style.top = p.y + 'px'; e.style.visibility = 'visible'; } }
    };
  }

  /* ----- clasificación ----- */
  function vScores(st) {
    var k, h;
    if (S3.on) {
      h = '<div class="topt"><div class="kick">Clasificación · Ronda ' + ROM[st.r] + ' de VI</div></div>';
      for (k = 0; k < S.nTeams; k++) h += '<div class="lab3d" id="lab' + k + '" style="visibility:hidden;--tc:' + team(k).color + '"><b>' + fmt(S.score[k]) + '</b><u>' + team(k).name + '</u><small>' + members(k).map(function (i) { return esc(S.roster[i].n); }).join(', ') + '</small></div>';
      stage.innerHTML = h; S3.setProgress(prog3d(st.r - 1), true); labels('coin', S.nTeams);
      setTimeout(function () { if (step() === st) S3.setProgress(prog3d(st.r)); }, 900);
      return;
    }
    var mx = Math.max.apply(null, S.score.slice(0, S.nTeams).concat([1])), frac = Math.min(1, st.r / 6);
    h = '<div class="climb"><div class="sunb">' + Art.ic('sun') + 'El mundo real' + Art.ic('sun') + '</div><div class="cols">';
    for (k = 0; k < S.nTeams; k++) h += '<div class="col" style="--tc:' + team(k).color + '"><div class="track"><div class="climber" data-h="' + (S.score[k] / mx * frac * 78) + '">' + coinT(k) + '<b>' + fmt(S.score[k]) + '</b></div></div><div class="tn">' + team(k).name + '</div><div class="tm">' + members(k).map(function (i) { return esc(S.roster[i].n); }).join(', ') + '</div></div>';
    stage.innerHTML = h + '</div><div class="cavef">El fondo de la caverna</div></div>';
    setTimeout(function () { [].forEach.call(stage.querySelectorAll('.climber'), function (e) { e.style.bottom = e.getAttribute('data-h') + '%'; }); }, 80);
  }
  function vPodium() {
    var rk = ranking(), ord = [rk[1], rk[0], rk[2]], hs = [12.5, 16.5, 10], md = ['II', 'I', 'III'], w = team(rk[0]), h;
    var top = present().filter(function (i) { return S.roster[i].pts > 0; }).sort(function (a, b) { return S.roster[b].pts - S.roster[a].pts; }).slice(0, 3);
    var mvp = top.length ? '<div class="kick" style="font-size:1.1rem">Mentes más despiertas</div><div class="mvp">' + top.map(function (i, j) { return '<div><i>' + ['I', 'II', 'III'][j] + '</i> ' + esc(S.roster[i].n) + ' · ' + fmt(S.roster[i].pts) + '</div>'; }).join('') + '</div>' : '';
    if (S3.on) {
      h = '<div class="topt" style="text-shadow:none"><div class="kick" style="color:#7a3a14">Sale de la caverna</div><h1 style="color:#14100c">Equipo <em style="color:' + w.color + ';text-shadow:0 .12rem 0 #14100c,0 0 1.5rem rgba(255,255,255,.6)">' + w.name + '</em></h1></div>';
      rk.slice(0, 3).forEach(function (k, j) { h += '<div class="lab3d" id="lab' + j + '" style="visibility:hidden;--tc:' + team(k).color + '"><i>' + ['I', 'II', 'III'][j] + '</i><u style="color:#fff">' + team(k).name + '</u><b>' + fmt(S.score[k]) + '</b></div>'; });
      stage.innerHTML = h + (mvp ? '<div class="bott">' + mvp + '</div>' : ''); labels('pod', Math.min(3, rk.length));
      return;
    }
    h = '<div class="center"><div class="kick">Sale de la caverna</div><h1>Equipo <em style="color:' + w.color + '">' + w.name + '</em></h1><div class="pod">';
    ord.forEach(function (k, j) { if (k === undefined) return; h += '<div class="pl" style="height:' + hs[j] + 'rem;animation-delay:' + [0.6, 1.4, 0][j] + 's">' + coinT(k) + '<u>' + team(k).name + '</u><small>' + fmt(S.score[k]) + '</small><i>' + md[j] + '</i></div>'; });
    stage.innerHTML = h + '</div>' + mvp + '</div>';
  }
  function vReport() {
    var t = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];
    S.qlog.forEach(function (q) { if (!q.board) { t[q.t][0] += q.ok; t[q.t][1] += q.n; } });
    var h = '<div class="rep"><div class="bx"><h3>Cómo lo lleva la clase, tema a tema</h3>';
    for (var i = 1; i <= 4; i++) { var p = t[i][1] ? Math.round(100 * t[i][0] / t[i][1]) : 0; h += '<div class="tb">Tema ' + i + ' · ' + C.temas[i] + '<b>' + (t[i][1] ? p + '%' : '—') + '</b><div class="bg"><i class="' + (p < 50 ? 'low' : p < 70 ? 'mid' : '') + '" style="width:' + p + '%"></i></div></div>'; }
    h += '<div class="hint" style="margin-top:auto">' + Art.ic('phone') + ' Cada uno tiene en su móvil su informe personal: qué tema domina y cuál le conviene repasar.</div></div><div class="bx"><h3>Lo que más costó · para repasar ahora</h3>';
    var worst = S.qlog.filter(function (q) { return q.n >= 1 && !q.board && q.ok / q.n < 0.9; }).sort(function (a, b) { return a.ok / a.n - b.ok / b.n; }).slice(0, 4);
    worst.forEach(function (q) { h += '<div class="fail">' + esc(q.q.length > 150 ? q.q.slice(0, 150) + '…' : q.q) + '<br><b>' + esc(q.a) + '</b> <span style="color:var(--dim)">(' + Math.round(100 * q.ok / q.n) + '% de aciertos)</span></div>'; });
    if (!worst.length) h += '<div class="hint" style="font-size:1.6rem">' + (S.qlog.length ? 'Nada por debajo del 90 % de aciertos. Van sobrados.' : 'Sin datos de móviles en esta partida.') + '</div>';
    stage.innerHTML = h + '</div></div>';
  }
  function vBye() {
    stage.innerHTML = '<div class="center"><div class="seal" style="font-size:4.5rem">' + Art.coin('sun', 'var(--gold)') + '</div><blockquote>«Una vida sin examen no es vida»</blockquote><div class="kick">Sócrates · Apología</div><div class="sub" style="max-width:62rem">No hablaba de este examen, pero para este también vale: comprueba si lo que crees saber aguanta una pregunta.</div><h1 style="font-size:3rem;margin-top:.6rem">Mucha <em>suerte</em></h1></div>';
  }

  /* ---------- menú y acciones ---------- */
  function closeMenu() { menu.className = ''; }
  function openMenu() {
    var h = '<h4>Puntos a mano</h4>';
    for (var k = 0; k < S.nTeams; k++) h += '<div class="tr"><span>' + coinT(k) + team(k).name + ' · ' + fmt(S.score[k]) + '</span><button class="b sm" data-a="pt" data-k="' + k + '" data-n="-100">−100</button><button class="b sm" data-a="pt" data-k="' + k + '" data-n="100">+100</button><button class="b sm" data-a="pt" data-k="' + k + '" data-n="300">+300</button></div>';
    h += '<h4>Partida</h4><div class="g"><button class="b sm" data-a="back">Atrás</button><button class="b sm" data-a="skip">Saltar ronda</button><button class="b sm" data-a="snd">Sonido: ' + (Sfx.on ? 'sí' : 'no') + '</button><button class="b sm" data-a="fs">Pantalla completa</button><button class="b sm" data-a="g3d">Escena 3D: ' + (S3.on ? 'sí' : 'no') + '</button><button class="b sm" data-a="reset" style="color:var(--bad)">Nueva partida</button></div>';
    menu.innerHTML = h; menu.className = 'on';
  }
  function modal(html) { ov.innerHTML = '<div class="modal"><div class="in">' + html + '</div></div>'; }
  function editList() {
    modal('<b>Lista de clase</b><span class="hint">Un nombre por línea. Opcional: «;A» o «;B» para indicar el grupo y mezclarlos en los equipos. La lista solo se guarda en este navegador.</span><textarea id="ta">' + esc(S.roster.map(function (r) { return r.n + (r.g ? ';' + r.g : ''); }).join('\n')) + '</textarea><div style="display:flex;gap:1rem;justify-content:flex-end"><button class="b sm" data-a="mclose">Cancelar</button><button class="b sm go" style="min-width:0" data-a="msave">Guardar</button></div>');
  }
  function act(a, d) {
    Sfx.init();
    if (a === 'next') next();
    else if (a === 'menu') { if (menu.className) closeMenu(); else openMenu(); }
    else if (a === 'pause') togglePause();
    else if (a === 'plus') addTime();
    else if (a === 'skip') { closeMenu(); skipRound(); }
    else if (a === 'back') { closeMenu(); if (S.idx > 0) go(S.idx - 1); }
    else if (a === 'snd') { Sfx.toggle(); openMenu(); }
    else if (a === 'g3d') { if (S3.toggle) S3.toggle(); closeMenu(); }
    else if (a === 'fs') { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) {} closeMenu(); }
    else if (a === 'reset') { modal('<b>¿Empezar una partida nueva?</b><span class="hint">Se borran los puntos. La lista y el código de sala se mantienen.</span><div style="display:flex;gap:1rem;justify-content:flex-end"><button class="b sm" data-a="mclose">Cancelar</button><button class="b sm" data-a="reset2" style="color:var(--bad)">Sí, nueva partida</button></div>'); closeMenu(); }
    else if (a === 'reset2') { var code = S.code, ro = S.roster; S = fresh(); S.code = code; S.roster = ro.map(function (r) { var x = mk(r.n, r.g); x.out = r.out; x.cid = r.cid; x.seen = r.seen; return x; }); ov.innerHTML = ''; fxMode = 'embers'; music(); render(); pub(); }
    else if (a === 'pt') { S.score[+d.k] = Math.max(0, S.score[+d.k] + (+d.n)); Sfx.pop(); openMenu(); pub(); if (step().type === 'scores') render(); }
    else if (a === 'star') { S.score[+d.k] += 300; Sfx.ok(); pub(); }
    else if (a === 'orac') { closeMenu(); oracle(present(), '', null); }
    else if (a === 'orac2') oraclePoll();
    else if (a === 'teams') { Sfx.drum(0.8); S.nTeams = S.nTeams || autoTeams(); makeTeams(); render(); pub(); }
    else if (a === 'nt') { S.nTeams = +d.n; if (S.teamsMade) makeTeams(); render(); pub(); }
    else if (a === 'demo') { demo = !demo; render(); }
    else if (a === 'list') editList();
    else if (a === 'mclose') ov.innerHTML = '';
    else if (a === 'resume') { ov.innerHTML = ''; }
    else if (a === 'msave') {
      var rows = document.getElementById('ta').value.split('\n').map(function (l) { var p = l.split(';'); return [p[0].trim().slice(0, 18), (p[1] || '').trim().toUpperCase().slice(0, 2)]; }).filter(function (x) { return x[0]; });
      localStorage.setItem(LSR, JSON.stringify(rows)); S.roster = rows.map(function (x) { return mk(x[0], x[1]); }); S.teamsMade = false; S.nTeams = 0; ov.innerHTML = ''; render(); pub();
    }
    else if (a === 'nm') {
      var r = S.roster[+d.i];
      if (r.cid && !r.out) r.cid = ''; else { r.out = !r.out; r.cid = ''; r.team = r.out ? -1 : (S.teamsMade ? smallestTeam() : -1); }
      render(); pub();
    }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-a]') : null;
    if (b) { act(b.getAttribute('data-a'), { k: b.getAttribute('data-k'), n: b.getAttribute('data-n'), i: b.getAttribute('data-i') }); return; }
    if (menu.className && !menu.contains(e.target)) closeMenu();
  });
  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'TEXTAREA' || ov.firstChild) return;
    if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'Enter' || e.key === 'PageDown') { e.preventDefault(); next(); }
    else if (e.key === 'p' || e.key === 'P') togglePause();
  });

  /* ---------- reloj ---------- */
  function tick() {
    var n = now(), st = step();
    if (S.sub === 'open' && S.deadline) {
      var left = S.paused || (S.deadline - n), tb = document.querySelector('#tbar i'), tn = document.getElementById('tn'), sec = Math.max(0, Math.ceil(left / 1000));
      if (tb) { tb.style.transform = 'scaleX(' + Math.max(0, Math.min(1, left / S.cur.total)) + ')'; tb.parentNode.className = sec <= 5 ? 'hot' : ''; }
      if (tn) { tn.textContent = sec; tn.className = 'tnum' + (sec <= 5 ? ' hot' : ''); }
      if (sec !== lastSec && !S.paused) { if (sec <= 5 && sec > 0 && lastSec !== -1) Sfx.tick(sec <= 2); lastSec = sec; }
      if (!S.paused && n >= S.deadline) timeUp();
    }
    if (S.cur.auto && n >= S.cur.auto) { S.cur.auto = 0; if (S.idx < S.steps.length - 1) go(S.idx + 1); }
  }

  /* ---------- fondo animado ---------- */
  (function fx() {
    var cv = document.getElementById('fx'), g = cv.getContext('2d'), P = [], cols = [], last = 0;
    function size() { cv.width = innerWidth; cv.height = innerHeight; cols = []; }
    addEventListener('resize', size); size();
    function frame(t) {
      requestAnimationFrame(frame); if (t - last < 40) return; last = t;
      var W = cv.width, H = cv.height, i, p;
      if (fxMode === 'matrix') {
        var fs = Math.max(14, Math.round(H / 45)); if (!cols.length) for (i = 0; i < W / fs; i++) cols.push(Math.random() * H / fs);
        g.fillStyle = 'rgba(20,16,12,.14)'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(60,200,110,.22)'; g.font = fs + 'px monospace';
        for (i = 0; i < cols.length; i++) { g.fillText(String.fromCharCode(0x30A0 + Math.random() * 96), i * fs, cols[i] * fs); if (cols[i] * fs > H && Math.random() > 0.96) cols[i] = 0; cols[i]++; }
        return;
      }
      g.clearRect(0, 0, W, H); cols = [];
      var conf = fxMode === 'confetti', max = conf ? 110 : 0;
      if (P.length < max && Math.random() < (conf ? 0.9 : 0.25)) P.push(conf ? { x: Math.random() * W, y: -10, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4, s: 5 + Math.random() * 8, c: pick(['#e3b24a', '#cf5f2e', '#f2e4c9', '#e58a52', '#97a84a']), a: 1, conf: 1 } : { x: Math.random() * W, y: H + 5, vx: (Math.random() - 0.5) * 0.6, vy: -(0.5 + Math.random() * 1.4), s: 1.5 + Math.random() * 2.5, c: '#ffb347', a: 0.7 });
      for (i = P.length - 1; i >= 0; i--) {
        p = P[i]; p.x += p.vx; p.y += p.vy; if (!p.conf) p.a -= 0.004;
        if (p.a <= 0 || p.y > H + 20 || p.y < -20 || (p.conf && !conf)) { P.splice(i, 1); continue; }
        g.globalAlpha = Math.max(0, p.a); g.fillStyle = p.c;
        if (p.conf) g.fillRect(p.x, p.y, p.s, p.s * 0.6); else { g.beginPath(); g.arc(p.x, p.y, p.s, 0, 6.3); g.fill(); }
      }
      g.globalAlpha = 1;
    }
    requestAnimationFrame(frame);
  })();

  /* ---------- arranque ---------- */
  readHash();
  if (S3.init) { S3.init(document.getElementById('gl')); S3.onChange = function () { if (S) render(); }; }
  var old = null; try { old = JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) {}
  if (old && old.code && old.roster && now() - (old.savedAt || old.t0 || now()) < 6 * 3600 * 1000 && old.phase !== 'lobby') {
    S = old; S.paused = 0; S.cur = S.cur || {};
    var st0 = step();
    if (st0.type === 'board' && S.sub === 'open') { S.sub = 'ready'; S.ans = {}; S.cur = {}; }
    else if (S.sub === 'open' && S.deadline) { S.cur.total = S.cur.total || 20000; S.deadline = now() + Math.min(S.cur.total, 15000); }
    S.cur.auto = 0;
  } else {
    S = fresh();
    if (old && old.phase === 'lobby' && old.code) { S.code = old.code; }
  }
  Net.on('c', onMsg);
  Net.onStatus = function () { renderMeta(); if (Net.status === 'on') pub(); };
  Net.connect(S.code);
  music(); render();
  setInterval(tick, 100);
  setInterval(function () { S.savedAt = now(); pub(); }, 2500);
  setInterval(renderMeta, 1000);
  document.addEventListener('pointerdown', function once() { Sfx.init(); music(); document.removeEventListener('pointerdown', once); });
  try { if (navigator.wakeLock) { var wl = function () { navigator.wakeLock.request('screen').catch(function () {}); }; wl(); document.addEventListener('visibilitychange', function () { if (!document.hidden) wl(); }); } } catch (e) {}
  window.addEventListener('beforeunload', function (e) { if (S.phase === 'play') { e.preventDefault(); e.returnValue = ''; } });
})();
