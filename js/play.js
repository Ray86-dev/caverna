/* Vista del móvil: mando de juego. */
(function () {
  'use strict';
  var Net = window.Net, Art = window.Art, m = document.getElementById('m');
  var qs = location.search, code = ((qs.match(/[?&]s=([A-Za-z]{4})/) || [])[1] || '').toUpperCase(), slot = (qs.match(/[?&]p=(\w+)/) || [])[1] || '';
  var GL = ['Α', 'Β', 'Γ', 'Δ'], ROM = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];
  var gid = '', G = null, me = -1, offset = 0, mine = {}, pend = -1, claim = null, lastKey = '', t0 = Date.now(), lastMsg = 0, wantNew = false;
  var cid = '', fwT = 0;
  try { cid = localStorage.getItem('caverna-cid' + slot) || ''; } catch (e) {}
  if (!cid) { cid = Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 6); try { localStorage.setItem('caverna-cid' + slot, cid); } catch (e) {} }
  try { var sv = JSON.parse(sessionStorage.getItem('caverna-mine' + slot) || 'null'); if (sv && sv.code === code) { mine = sv.mine || {}; gid = sv.gid || ''; } } catch (e) {}

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function send(o) { o.cid = cid; return Net.send('c', o); }
  function keepMine() { try { sessionStorage.setItem('caverna-mine' + slot, JSON.stringify({ code: code, mine: mine, gid: gid })); } catch (e) {} }
  function buzz(n) { try { if (navigator.vibrate) navigator.vibrate(n); } catch (e) {} }
  function coinT(k) { return Art.coin(G.tm[k][1], G.tm[k][2]); }
  function title() { return '<div class="gr">ΦΙΛΟΣΟΦΙΑ</div><h1>Sal de la <em>caverna</em></h1>'; }

  function header() {
    var hd = document.getElementById('hd');
    if (!G || me < 0) { hd.className = ''; return; }
    var r = G.ro[me], T = r[1] >= 0 ? G.tm[r[1]] : null;
    hd.className = 'on';
    document.getElementById('he').innerHTML = T ? coinT(r[1]) : Art.coin('sun', 'var(--line)');
    document.getElementById('hn').textContent = r[0];
    document.getElementById('ht').textContent = T ? 'Equipo ' + T[0] + ' · ' + fmt(G.sc[r[1]] || 0) + ' puntos' : 'Esperando equipo…';
    document.getElementById('hp').textContent = fmt(r[4]);
  }
  function answered() { return G && (mine[G.idx] !== undefined); }
  function answer(v) { if (!G || answered()) return; mine[G.idx] = v; keepMine(); pend = -1; send({ k: 'ans', idx: G.idx, val: v }); buzz(30); render(true); }
  function verdict(ans, good, okTxt, koTxt, extra) {
    return '<div class="c"><div class="res ' + (!ans ? '' : good ? 'ok' : 'ko') + '"><div class="b">' + (!ans ? 'Sin respuesta' : good ? Art.ic('check') + okTxt : Art.ic('cross') + koTxt) + '</div><small>' + extra + '</small></div></div>';
  }

  function render(force) {
    var h = '', st = G ? G.step : null, key;
    header();
    if (!code) { key = 'code'; if (key !== lastKey) { m.innerHTML = '<div class="c">' + title() + '<p>Escribe la clave de 4 letras que aparece en la pantalla</p><input class="code" id="ci" maxlength="4" autocomplete="off" autocapitalize="characters"><button class="go" data-a="code">Entrar</button></div>'; lastKey = key; } return; }
    if (!G) { key = 'wait' + (Date.now() - t0 > 9000 ? 2 : 1); if (key !== lastKey) { m.innerHTML = '<div class="c"><div class="xl">' + Art.ic('amphora') + '</div><div class="kick">Sala ' + esc(code) + '</div><h2>Entrando…</h2>' + (key === 'wait2' ? '<p>No encuentro la sala. ¿Está la clave bien escrita?</p><button class="lnk" data-a="recode">Cambiar la clave</button>' : '') + '</div>'; lastKey = key; } return; }
    if (me < 0) {
      var free = []; G.ro.forEach(function (r, i) { if (!r[3] && !r[2]) free.push(i); });
      key = 'join|' + free.join(',') + '|' + wantNew + '|' + (claim ? 1 : 0);
      if (key === lastKey) return; lastKey = key;
      if (claim) { m.innerHTML = '<div class="c"><div class="xl">' + Art.ic('glass') + '</div><h2>Entrando…</h2></div>'; return; }
      if (wantNew || !free.length) { m.innerHTML = '<div class="c">' + title() + '<p>Escribe tu nombre</p><input id="ni" maxlength="16" autocomplete="off"><button class="go" data-a="new">Entrar</button>' + (free.length ? '<button class="lnk" data-a="list">Volver a la lista</button>' : '') + '</div>'; return; }
      h = '<div class="kick" style="text-align:center;padding:10px 0 4px">¿Quién eres?</div><div class="names">';
      free.forEach(function (i) { h += '<button class="nm" data-a="claim" data-i="' + i + '">' + esc(G.ro[i][0]) + '</button>'; });
      m.innerHTML = h + '</div><button class="lnk" data-a="wantnew">No estoy en la lista</button>'; return;
    }
    var r = G.ro[me], my = mine[G.idx], ans = my !== undefined, rv = G.sub === 'reveal', res = G.res ? G.res[me] : undefined;
    var chosen = st.orac && st.orac.some(function (x) { return x.ri === me; });
    key = [G.phase, G.idx, G.sub, ans, pend, st.clues ? st.clues.length : 0, st.bet, chosen, r[1], G.made, st.type, st.party].join('|');
    if (key === lastKey && !force) return; lastKey = key;

    if (st.type === 'lobby') {
      var T = r[1] >= 0 ? G.tm[r[1]] : null, mates = [];
      if (T) G.ro.forEach(function (x, i) { if (x[1] === r[1] && !x[3] && i !== me) mates.push(x[0]); });
      h = '<div class="c"><div class="seal">' + (T ? coinT(r[1]) : Art.coin('check', 'var(--ok)')) + '</div><div class="kick">Dentro</div><h2>' + esc(r[0]) + '</h2>' + (T ? '<h1>Equipo <em style="color:' + T[2] + '">' + T[0] + '</em></h1><p>Con ' + esc(mates.join(', ')) + '</p>' : '<p>Mira la pantalla: enseguida se sortean los equipos.</p>') + '<button class="lnk" data-a="free">No soy ' + esc(r[0]) + '</button></div>';
    } else if (st.type === 'intro') {
      h = '<div class="c"><div class="kick">Ronda ' + ROM[st.r] + ' de VI</div><div class="seal">' + Art.coin(st.icon, 'var(--clay)') + '</div><h1>' + esc(st.title) + '</h1><p>' + esc(st.sub2) + '</p></div>';
    } else if (st.type === 'mcq') {
      if (rv) {
        var good = ans && my === st.correct;
        h = verdict(ans, good, '+' + (res || 0), 'Fallo', '<b>' + esc(st.opts[st.correct]) + '</b><br>' + esc(st.e));
        if (good) buzz(80);
      } else if (ans) h = sent(st.opts[my]);
      else if (st.kind === 'duel') {
        h = '<div class="q qt">' + esc(st.q) + '</div><div class="os two">';
        st.opts.forEach(function (o, i) { h += '<button class="o ' + (i ? 'fb' : 'fa') + '" data-a="ans" data-i="' + i + '">' + Art.ic(st.icons[i]) + esc(o) + '</button>'; });
        h += '</div>';
      } else {
        var bl = st.kind === 'bulo';
        h = '<div class="q' + (bl ? ' qt' : '') + '">' + esc(st.q) + '</div><div class="os">';
        st.opts.forEach(function (o, i) { h += '<button class="o" data-a="ans" data-i="' + i + '"><span class="lt">' + (bl ? Art.ic(['check', 'cross', 'ask'][i]) : GL[i]) + '</span>' + esc(o) + '</button>'; });
        h += '</div>' + (bl ? '<p style="text-align:center">Puedes buscar en internet y hablarlo con tu equipo. Aquí no cuenta la velocidad.</p>' : '');
      }
    } else if (st.type === 'poll') {
      if (rv) h = '<div class="c">' + (chosen ? '<div class="orc">' + Art.ic('temple') + 'El oráculo te ha elegido.<br>Te toca dar una razón.</div>' : '<div class="xl">' + Art.ic('temple') + '</div>') + (ans ? '<div class="res"><div class="lbl">Tu voto</div><div class="v">' + esc(st.opts[my]) + '</div></div>' : '') + '<p>Escucha las razones. ¿Alguna te hace cambiar de idea?</p></div>';
      else if (ans) h = '<div class="c"><div class="xl">' + Art.ic('check') + '</div><h2>Voto enviado</h2><div class="res"><div class="v" style="margin:0">' + esc(st.opts[my]) + '</div></div><p>Prepara tu razón: el oráculo puede elegirte.</p></div>';
      else {
        var pc = st.opts.length === 3 ? ['#6f8a35', '#b9321f', '#b98a1f'] : /ROJA/.test(st.opts[0]) ? ['#c8372d', '#2f6fb0'] : ['#b9521f', '#2f7ea6'];
        h = '<div class="q">' + esc(st.q) + '</div><div class="os">'; st.opts.forEach(function (o, i) { h += '<button class="o col" style="--oc:' + pc[i] + '" data-a="ans" data-i="' + i + '">' + esc(o) + '</button>'; }); h += '</div>';
      }
    } else if (st.type === 'who') {
      if (rv) { var g2 = ans && my === st.correct; h = verdict(ans, g2, '+' + (res || 0), 'No era ' + esc(st.names[my] || ''), 'Era <b>' + esc(st.names[st.correct]) + '</b>'); if (g2) buzz(80); }
      else if (ans) h = sent(st.names[my]);
      else {
        h = st.clues.map(function (c, i) { return '<div class="clue"><b>' + ['I', 'II', 'III', 'IV'][i] + '</b><span>«' + esc(c) + '»</span></div>'; }).join('');
        h += '<p style="text-align:center">Ahora vale <b style="color:var(--gold)">' + fmt(st.worth) + '</b> puntos · un solo intento</p><div class="grid">';
        st.names.forEach(function (n, i) { h += '<button class="nm' + (pend === i ? ' sel' : '') + '" data-a="pend" data-i="' + i + '">' + esc(n) + '</button>'; });
        h += '</div>' + (pend >= 0 ? '<button class="go" data-a="ans" data-i="' + pend + '">Confirmar: ' + esc(st.names[pend]) + '</button>' : '');
      }
    } else if (st.type === 'board') {
      var T2 = G.tm[st.team], mineTeam = r[1] === st.team, B = ['0 fallos', '1 o 2 fallos', '3 o más'];
      if (rv) h = '<div class="c"><div class="seal">' + coinT(st.team) + '</div><h2>Equipo ' + T2[0] + '</h2><p>' + st.err + (st.err === 1 ? ' fallo' : ' fallos') + ' · +' + st.bpts + ' puntos</p>' + (mineTeam ? '' : ans ? '<div class="res ' + (my === st.bucket ? 'ok' : 'ko') + '"><div class="b">' + (my === st.bucket ? Art.ic('check') + '+300' : Art.ic('cross') + 'Apuesta fallida') + '</div><small>Apostaste: ' + B[my] + '</small></div>' : '') + '</div>';
      else if (mineTeam) h = '<div class="c"><div class="xl">' + Art.ic('hand') + '</div><h1>A la <em>pantalla</em></h1><p>Le toca a tu equipo. Deja el móvil y sal a colocar las tarjetas.<br>Tablero: ' + esc(st.title) + '</p></div>';
      else if (ans) h = sent('Apuesta: ' + B[my]);
      else if (st.bet) { h = '<div class="q">El equipo ' + T2[0] + ' sale a la pantalla con «' + esc(st.title) + '». ¿Cuántos fallos tendrá?<small>Acertar la apuesta: +300</small></div><div class="os">'; B.forEach(function (o, i) { h += '<button class="o cen" data-a="ans" data-i="' + i + '">' + o + '</button>'; }); h += '</div>'; }
      else h = '<div class="c"><div class="xl">' + Art.ic('eye') + '</div><h2>Apuestas cerradas</h2><p>Mira la pantalla… y repasa mientras tanto.</p></div>';
    } else if (st.type === 'scores') {
      h = '<div class="c"><div class="kick">Clasificación</div>' + scores() + '</div>';
    } else if (st.type === 'end') {
      h = '<div class="c" style="justify-content:flex-start">' + (st.party ? '<div class="kick" style="padding-top:6px">Fiesta final</div><button class="go" data-a="fw" style="font-size:22px;padding:22px 10px;width:100%;touch-action:manipulation">' + Art.ic('sun') + ' ¡Lanza un cohete!</button><p style="margin:0">Sale en la pantalla con tu nombre</p>' : '') + '<div class="kick" style="padding-top:6px">Tu informe</div><h2>' + fmt(r[4]) + ' puntos</h2>';
      var stt = r[5] || [], best = -1, worst = -1, bp = -1, wp = 2;
      for (var t = 1; t <= 4; t++) {
        var x = stt[t] || [0, 0], p = x[1] ? x[0] / x[1] : -1, pc2 = Math.round(Math.max(0, p) * 100);
        if (p >= 0) { if (p > bp) { bp = p; best = t; } if (p < wp) { wp = p; worst = t; } }
        h += '<div class="tb">Tema ' + t + ' · ' + esc(st.temas[t]) + '<span>' + (x[1] ? x[0] + '/' + x[1] : '—') + '</span><div class="bg"><i class="' + (pc2 < 50 ? 'low' : pc2 < 70 ? 'mid' : '') + '" style="width:' + pc2 + '%"></i></div></div>';
      }
      if (best > 0) h += '<div class="tip">Tu punto fuerte: <b>tema ' + best + '</b>.' + (worst > 0 && wp < 0.85 && worst !== best ? '<br>Antes del examen, dale un repaso al <b>tema ' + worst + ' (' + esc(st.temas[worst]) + ')</b>.' : '<br>Lo llevas muy bien. Un último vistazo al vocabulario y listo.') + '</div>';
      h += scores() + '<p class="qt" style="font-size:18px;color:var(--slip)">«Una vida sin examen no es vida»</p><p>Mucha suerte.</p></div>';
    }
    m.innerHTML = h;
  }
  function sent(txt) { return '<div class="c"><div class="xl">' + Art.ic('check') + '</div><h2>Enviado</h2><div class="res"><div class="v" style="margin:0">' + esc(txt) + '</div></div><p>Mira la pantalla</p></div>'; }
  function scores() {
    var r = G.ro[me], ord = G.sc.map(function (_, k) { return k; }).slice(0, G.nT).sort(function (a, b) { return G.sc[b] - G.sc[a]; });
    return '<div class="sc">' + ord.map(function (k, j) { return '<div class="' + (k === r[1] ? 'me' : '') + '"><i>' + ROM[j + 1] + '</i>' + coinT(k) + '<span>' + G.tm[k][0] + '</span><b>' + fmt(G.sc[k]) + '</b></div>'; }).join('') + '</div>';
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
    else if (a === 'fw') { if (Date.now() - fwT > 600) { fwT = Date.now(); send({ k: 'fw' }); buzz(40); b.style.transform = 'scale(.94)'; setTimeout(function () { b.style.transform = ''; }, 130); } }
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
