/* Vista del móvil: mando de juego. */
(function () {
  'use strict';
  var Net = window.Net, m = document.getElementById('m');
  var qs = location.search, code = ((qs.match(/[?&]s=([A-Za-z]{4})/) || [])[1] || '').toUpperCase(), slot = (qs.match(/[?&]p=(\w+)/) || [])[1] || '';
  var SHAPES = ['▲', '◆', '●', '■'], PTS_WHO = [1500, 1000, 600, 300];
  var gid = '', G = null, me = -1, offset = 0, mine = {}, pend = -1, claim = null, lastKey = '', t0 = Date.now(), lastMsg = 0, wantNew = false;
  var cid = '';
  try { cid = localStorage.getItem('caverna-cid' + slot) || ''; } catch (e) {}
  if (!cid) { cid = Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 6); try { localStorage.setItem('caverna-cid' + slot, cid); } catch (e) {} }
  try { var sv = JSON.parse(sessionStorage.getItem('caverna-mine' + slot) || 'null'); if (sv && sv.code === code) { mine = sv.mine || {}; gid = sv.gid || ''; } } catch (e) {}

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function send(o) { o.cid = cid; return Net.send('c', o); }
  function keepMine() { try { sessionStorage.setItem('caverna-mine' + slot, JSON.stringify({ code: code, mine: mine, gid: gid })); } catch (e) {} }
  function buzz(n) { try { if (navigator.vibrate) navigator.vibrate(n); } catch (e) {} }

  function header() {
    var hd = document.getElementById('hd');
    if (!G || me < 0) { hd.className = ''; return; }
    var r = G.ro[me], T = r[1] >= 0 ? G.tm[r[1]] : null;
    hd.className = 'on'; hd.style.setProperty('--tc', T ? T[2] : '#555');
    document.getElementById('he').textContent = T ? T[1] : '🙂';
    document.getElementById('hn').textContent = r[0];
    document.getElementById('ht').textContent = T ? 'Equipo ' + T[0] + ' · ' + fmt(G.sc[r[1]] || 0) + ' pts' : 'Esperando equipo…';
    document.getElementById('hp').textContent = fmt(r[4]);
  }
  function answered() { return G && (mine[G.idx] !== undefined); }
  function answer(v) { if (!G || answered()) return; mine[G.idx] = v; keepMine(); pend = -1; send({ k: 'ans', idx: G.idx, val: v }); buzz(30); render(true); }

  function render(force) {
    var h = '', st = G ? G.step : null, key;
    header();
    if (!code) { key = 'code'; if (key !== lastKey) { m.innerHTML = '<div class="c"><h1>SAL DE LA<br>CAVERNA</h1><p>Escribe el código de 4 letras que aparece en la pantalla</p><input class="code" id="ci" maxlength="4" autocomplete="off" autocapitalize="characters"><button class="go" data-a="code">Entrar</button></div>'; lastKey = key; } return; }
    if (!G) { key = 'wait' + (Date.now() - t0 > 9000 ? 2 : 1); if (key !== lastKey) { m.innerHTML = '<div class="c"><div class="xl">🔥</div><h2>Entrando en la sala ' + esc(code) + '…</h2>' + (key === 'wait2' ? '<p>No encuentro la sala. ¿Está el código bien escrito?</p><button class="lnk" data-a="recode">Cambiar el código</button>' : '') + '</div>'; lastKey = key; } return; }
    if (me < 0) {
      var free = []; G.ro.forEach(function (r, i) { if (!r[3] && !r[2]) free.push(i); });
      key = 'join|' + free.join(',') + '|' + wantNew + '|' + (claim ? 1 : 0);
      if (key === lastKey) return; lastKey = key;
      if (claim) { m.innerHTML = '<div class="c"><div class="xl">⏳</div><h2>Entrando…</h2></div>'; return; }
      if (wantNew || !free.length) { m.innerHTML = '<div class="c"><h1>SAL DE LA<br>CAVERNA</h1><p>Escribe tu nombre</p><input id="ni" maxlength="16" autocomplete="off"><button class="go" data-a="new">Entrar</button>' + (free.length ? '<button class="lnk" data-a="list">Volver a la lista</button>' : '') + '</div>'; return; }
      h = '<h2 style="text-align:center;padding:8px 0">¿Quién eres?</h2><div class="names">';
      free.forEach(function (i) { h += '<button class="nm" data-a="claim" data-i="' + i + '">' + esc(G.ro[i][0]) + '</button>'; });
      m.innerHTML = h + '</div><button class="lnk" data-a="wantnew">No estoy en la lista</button>'; return;
    }
    var r = G.ro[me], my = mine[G.idx], ans = my !== undefined, rv = G.sub === 'reveal', res = G.res ? G.res[me] : undefined;
    var chosen = st.orac && st.orac.some(function (x) { return x.ri === me; });
    key = [G.phase, G.idx, G.sub, ans, pend, st.clues ? st.clues.length : 0, st.bet, chosen, r[1], G.made, st.type].join('|');
    if (key === lastKey && !force) return; lastKey = key;

    if (st.type === 'lobby') {
      var T = r[1] >= 0 ? G.tm[r[1]] : null, mates = [];
      if (T) G.ro.forEach(function (x, i) { if (x[1] === r[1] && !x[3] && i !== me) mates.push(x[0]); });
      h = '<div class="c"><div class="xl">' + (T ? T[1] : '✅') + '</div><h2>¡Dentro, ' + esc(r[0]) + '!</h2>' + (T ? '<h1>Equipo ' + T[0] + '</h1><p>Con ' + esc(mates.join(', ')) + '</p>' : '<p>Mira la pantalla: enseguida se sortean los equipos.</p>') + '<button class="lnk" data-a="free">No soy ' + esc(r[0]) + '</button></div>';
    } else if (st.type === 'intro') {
      h = '<div class="c"><p>Ronda ' + st.r + ' de 6</p><div class="xl">' + st.icon + '</div><h1>' + esc(st.title) + '</h1><p>' + esc(st.sub2) + '</p></div>';
    } else if (st.type === 'mcq') {
      if (rv) {
        var good = ans && my === st.correct;
        h = '<div class="c"><div class="res ' + (!ans ? 'nu' : good ? 'ok' : 'ko') + '"><div class="b">' + (!ans ? '⏱ Sin respuesta' : good ? '✔ +' + (res || 0) : '✘ Fallo') + '</div><small><b>' + esc(st.opts[st.correct]) + '</b><br>' + esc(st.e) + '</small></div></div>';
        if (good) buzz(80);
      } else if (ans) h = sent(st.opts[my]);
      else {
        var two = st.kind === 'duel', cols = st.kind === 'bulo' ? [3, 0, 2] : [0, 1, 2, 3];
        h = '<div class="q">' + esc(st.q) + '</div><div class="os' + (two ? ' two' : '') + '">';
        st.opts.forEach(function (o, i) { h += '<button class="o" style="--oc:var(--c' + cols[i] + ')" data-a="ans" data-i="' + i + '">' + (two ? '<span class="s">' + st.icons[i] + '</span>' : st.kind === 'quiz' ? '<span class="s">' + SHAPES[i] + '</span>' : '') + esc(o) + '</button>'; });
        h += '</div>' + (st.kind === 'bulo' ? '<p style="text-align:center">🔍 Puedes buscar en internet y hablarlo con tu equipo. Aquí no cuenta la velocidad.</p>' : '');
      }
    } else if (st.type === 'poll') {
      if (rv) h = '<div class="c">' + (chosen ? '<div class="orc">🏛️ ¡El oráculo te ha elegido!<br>Te toca dar una razón.</div>' : '<div class="xl">🏛️</div>') + (ans ? '<div class="res nu"><small>Tu voto</small><div style="font-size:19px;margin-top:6px">' + esc(st.opts[my]) + '</div></div>' : '') + '<p>Escucha las razones. ¿Alguna te hace cambiar de idea?</p></div>';
      else if (ans) h = '<div class="c"><div class="xl">🗳️</div><h2>Voto enviado</h2><div class="res nu"><div style="font-size:18px">' + esc(st.opts[my]) + '</div></div><p>Prepara tu razón: el oráculo puede elegirte.</p></div>';
      else { h = '<div class="q">' + esc(st.q) + '</div><div class="os">'; st.opts.forEach(function (o, i) { h += '<button class="o" style="--oc:var(--c' + [1, 0, 2][i] + ')" data-a="ans" data-i="' + i + '">' + esc(o) + '</button>'; }); h += '</div>'; }
    } else if (st.type === 'who') {
      if (rv) { var g2 = ans && my === st.correct; h = '<div class="c"><div class="res ' + (!ans ? 'nu' : g2 ? 'ok' : 'ko') + '"><div class="b">' + (!ans ? '⏱ Sin respuesta' : g2 ? '✔ +' + (res || 0) : '✘ No era ' + esc(st.names[my])) + '</div><small>Era <b>' + esc(st.names[st.correct]) + '</b></small></div></div>'; if (g2) buzz(80); }
      else if (ans) h = sent(st.names[my]);
      else {
        h = st.clues.map(function (c, i) { return '<div class="clue"><b>' + (i + 1) + '</b>«' + esc(c) + '»</div>'; }).join('');
        h += '<p style="text-align:center">Ahora vale <b style="color:#ffd95a">' + st.worth + '</b> puntos · un solo intento</p><div class="grid">';
        st.names.forEach(function (n, i) { h += '<button class="nm' + (pend === i ? ' sel' : '') + '" data-a="pend" data-i="' + i + '">' + esc(n) + '</button>'; });
        h += '</div>' + (pend >= 0 ? '<button class="go" data-a="ans" data-i="' + pend + '">Confirmar: ' + esc(st.names[pend]) + '</button>' : '');
      }
    } else if (st.type === 'board') {
      var T2 = G.tm[st.team], mineTeam = r[1] === st.team, B = ['0 fallos', '1 o 2 fallos', '3 o más'];
      if (rv) h = '<div class="c"><div class="xl">' + T2[1] + '</div><h2>Equipo ' + T2[0] + ': ' + st.err + (st.err === 1 ? ' fallo' : ' fallos') + ' · +' + st.bpts + '</h2>' + (mineTeam ? '' : ans ? '<div class="res ' + (my === st.bucket ? 'ok' : 'ko') + '"><div class="b">' + (my === st.bucket ? '✔ +300' : '✘') + '</div><small>Apostaste: ' + B[my] + '</small></div>' : '') + '</div>';
      else if (mineTeam) h = '<div class="c"><div class="xl">🖐️</div><h1>¡A la pantalla!</h1><p>Le toca a tu equipo. Deja el móvil y sal a colocar las tarjetas.<br>Tablero: ' + esc(st.title) + '</p></div>';
      else if (ans) h = sent('Apuesta: ' + B[my]);
      else if (st.bet) { h = '<div class="q">' + T2[1] + ' El equipo ' + T2[0] + ' sale a la pantalla con «' + esc(st.title) + '». ¿Cuántos fallos tendrá?<br><span style="color:#a79fb8;font-weight:500">Acertar la apuesta: +300</span></div><div class="os">'; B.forEach(function (o, i) { h += '<button class="o" style="justify-content:center;font-size:24px;--oc:var(--c' + [3, 2, 0][i] + ')" data-a="ans" data-i="' + i + '">' + o + '</button>'; }); h += '</div>'; }
      else h = '<div class="c"><div class="xl">👀</div><h2>Apuestas cerradas</h2><p>Mira la pantalla… y repasa mientras tanto.</p></div>';
    } else if (st.type === 'scores') {
      h = '<div class="c"><h2>Clasificación</h2>' + scores() + '</div>';
    } else if (st.type === 'end') {
      h = '<div class="c" style="justify-content:flex-start"><h2>Tu informe · ' + fmt(r[4]) + ' puntos</h2>';
      var stt = r[5] || [], best = -1, worst = -1, bp = -1, wp = 2;
      for (var t = 1; t <= 4; t++) {
        var x = stt[t] || [0, 0], p = x[1] ? x[0] / x[1] : -1, pc = Math.round(Math.max(0, p) * 100);
        if (p >= 0) { if (p > bp) { bp = p; best = t; } if (p < wp) { wp = p; worst = t; } }
        h += '<div class="tb">Tema ' + t + ' · ' + esc(st.temas[t]) + ' <span style="float:right">' + (x[1] ? x[0] + '/' + x[1] : '—') + '</span><div class="bg"><i class="' + (pc < 50 ? 'low' : pc < 70 ? 'mid' : '') + '" style="width:' + pc + '%"></i></div></div>';
      }
      if (best > 0) h += '<div class="tip">💪 Tu punto fuerte: <b>tema ' + best + '</b>.' + (worst > 0 && wp < 0.85 && worst !== best ? '<br>📖 Antes del examen, dale un repaso al <b>tema ' + worst + ' (' + esc(st.temas[worst]) + ')</b>.' : '<br>🌟 Lo llevas muy bien. Un último vistazo al vocabulario y listo.') + '</div>';
      h += scores() + '<p>«Una vida sin examen no es vida». ¡Suerte! 🍀</p></div>';
    }
    m.innerHTML = h;
  }
  function sent(txt) { return '<div class="c"><div class="xl">📨</div><h2>¡Enviado!</h2><div class="res nu"><div style="font-size:18px">' + esc(txt) + '</div></div><p>Mira la pantalla</p></div>'; }
  function scores() {
    var r = G.ro[me], ord = G.sc.map(function (_, k) { return k; }).slice(0, G.nT).sort(function (a, b) { return G.sc[b] - G.sc[a]; });
    return '<div class="sc">' + ord.map(function (k, j) { return '<div class="' + (k === r[1] ? 'me' : '') + '" style="--tc:' + G.tm[k][2] + '">' + (j + 1) + '.º <span>' + G.tm[k][1] + ' ' + G.tm[k][0] + '</span>' + fmt(G.sc[k]) + '</div>'; }).join('') + '</div>';
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-a]') : null; if (!b) return;
    var a = b.getAttribute('data-a'), i = parseInt(b.getAttribute('data-i'), 10);
    if (a === 'code') { var v = document.getElementById('ci').value.trim().toUpperCase(); if (/^[A-Z]{4}$/.test(v)) location.search = '?s=' + v + (slot ? '&p=' + slot : ''); }
    else if (a === 'recode') { location.search = slot ? '?p=' + slot : ''; }
    else if (a === 'claim') { claim = { k: 'claim', i: i }; send(claim); render(); setTimeout(function () { if (me < 0) { claim = null; render(); } }, 5000); }
    else if (a === 'wantnew') { wantNew = true; render(); }
    else if (a === 'list') { wantNew = false; render(); }
    else if (a === 'new') { var n = document.getElementById('ni').value.trim(); if (n) { claim = { k: 'new', name: n }; send(claim); render(); setTimeout(function () { if (me < 0) { claim = null; render(); } }, 5000); } }
    else if (a === 'free') { send({ k: 'free' }); }
    else if (a === 'pend') { pend = pend === i ? -1 : i; render(); }
    else if (a === 'ans') answer(i);
  });

  Net.on('st', function (s) {
    offset = s.now - Date.now(); lastMsg = Date.now();
    if (G && s.idx !== G.idx) pend = -1;
    G = s; me = -1;
    for (var i = 0; i < s.ro.length; i++) if (s.ro[i][2] && s.ro[i][2] === cid.slice(0, 8)) { me = i; break; }
    if (me >= 0) { claim = null; wantNew = false; }
    if ((s.gid || '') !== gid) { gid = s.gid || ''; mine = {}; pend = -1; keepMine(); }
    render();
  });
  Net.onStatus = function (s) { if (s === 'on') send({ k: 'hi' }); };

  setInterval(function () {
    var tb = document.getElementById('tb'), bi = tb.firstChild, show = false;
    if (G && G.sub === 'open' && G.total && (G.deadline || G.left)) {
      var left = G.left || (G.deadline - (Date.now() + offset)); show = true;
      bi.style.transform = 'scaleX(' + Math.max(0, Math.min(1, left / G.total)) + ')';
    }
    tb.style.visibility = show ? 'visible' : 'hidden';
    document.getElementById('net').style.display = code && (Net.status !== 'on' || (lastMsg && Date.now() - lastMsg > 9000)) ? 'block' : 'none';
    if (!G && code) render();
  }, 200);
  setInterval(function () {
    if (!code || Net.status !== 'on') return;
    if (me < 0 && claim) send(claim);
    else if (G && me >= 0 && mine[G.idx] !== undefined && G.ans.indexOf(me) < 0 && G.sub !== 'reveal') send({ k: 'ans', idx: G.idx, val: mine[G.idx] });
    else send({ k: 'hi' });
  }, 2000);

  if (code) Net.connect(code);
  render();
  try { if (navigator.wakeLock) { var wl = function () { navigator.wakeLock.request('screen').catch(function () {}); }; wl(); document.addEventListener('visibilitychange', function () { if (!document.hidden) wl(); }); } } catch (e) {}
})();
