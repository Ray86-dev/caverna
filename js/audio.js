/* Música y efectos generados con WebAudio: sin archivos, sin derechos de autor. */
(function () {
  var ctx = null, master = null, loopTimer = null, step = 0, nextT = 0, loopKind = null;
  var A = window.Sfx = { on: true };

  A.init = function () {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      var C = window.AudioContext || window.webkitAudioContext;
      ctx = new C(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    } catch (e) { ctx = null; }
  };
  A.toggle = function () { A.on = !A.on; if (master) master.gain.value = A.on ? 0.5 : 0; return A.on; };

  function tone(f, t, d, type, v, slideTo) {
    if (!ctx) return;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v || 0.2, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.05);
  }
  function noise(t, d, v, hp) {
    if (!ctx) return;
    var n = Math.floor(ctx.sampleRate * d), b = ctx.createBuffer(1, n, ctx.sampleRate), ch = b.getChannelData(0);
    for (var i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = hp || 6000; g.gain.value = v || 0.1;
    s.buffer = b; s.connect(f); f.connect(g); g.connect(master); s.start(t);
  }
  function now() { return ctx ? ctx.currentTime : 0; }
  function seq(notes, dur, type, v) { var t = now(); notes.forEach(function (f, i) { if (f) tone(f, t + i * dur, dur * 1.6, type, v); }); }

  A.ok = function () { seq([523, 659, 784, 1047], 0.08, 'triangle', 0.25); };
  A.bad = function () { var t = now(); tone(196, t, 0.3, 'sawtooth', 0.18, 98); };
  A.pop = function () { tone(880, now(), 0.06, 'sine', 0.15); };
  A.tick = function (hi) { tone(hi ? 1320 : 990, now(), 0.05, 'square', 0.08); };
  A.gong = function () { var t = now(); tone(110, t, 2.2, 'sine', 0.4); tone(164.8, t, 1.8, 'sine', 0.2); tone(221, t, 1.4, 'triangle', 0.12); noise(t, 0.4, 0.08, 1500); };
  A.whoosh = function () { var t = now(); tone(200, t, 0.35, 'sine', 0.15, 1200); noise(t, 0.3, 0.05, 3000); };
  A.reveal = function () { seq([392, 523, 659], 0.09, 'square', 0.1); };
  A.fanfare = function () {
    var t = now(), m = [523, 523, 523, 659, 784, 0, 659, 784, 1047];
    m.forEach(function (f, i) { if (f) { tone(f, t + i * 0.14, 0.3, 'square', 0.14); tone(f / 2, t + i * 0.14, 0.3, 'triangle', 0.14); } });
    tone(1047, t + 1.26, 1.2, 'triangle', 0.2); tone(784, t + 1.26, 1.2, 'triangle', 0.15); tone(659, t + 1.26, 1.2, 'triangle', 0.15);
  };
  A.drum = function (secs) { var t = now(); for (var i = 0; i < secs * 16; i++) noise(t + i / 16, 0.05, 0.05 + 0.1 * (i / (secs * 16)), 800); };

  /* Bucle musical: 'think' (preguntas), 'fast' (duelos y tablero), 'calm' (ágora), 'lobby' */
  var SC = [110, 130.8, 146.8, 164.8, 196, 220, 261.6, 293.7, 329.6, 392];
  var LOOPS = {
    lobby: { bpm: 96, bass: [0, -1, 0, -1, 3, -1, 3, -1, 2, -1, 2, -1, 4, -1, 3, -1], lead: [5, -1, 7, 8, -1, 7, 5, -1, 6, -1, 8, 9, -1, 8, 6, -1], hat: 2, kick: 4 },
    think: { bpm: 112, bass: [0, 0, -1, 0, -1, 0, 3, -1, 0, 0, -1, 0, -1, 2, 1, -1], lead: [-1, -1, 5, -1, -1, -1, 6, -1, -1, -1, 5, -1, -1, 8, -1, -1], hat: 2, kick: 4 },
    fast: { bpm: 138, bass: [0, 0, 5, 0, 0, 5, 0, 3, 0, 0, 5, 0, 2, 2, 4, 4], lead: [5, -1, 5, 8, -1, 5, -1, 6, 5, -1, 5, 9, -1, 8, 6, -1], hat: 1, kick: 2 },
    calm: { bpm: 80, bass: [0, -1, -1, -1, 3, -1, -1, -1, 2, -1, -1, -1, 1, -1, -1, -1], lead: [5, -1, 6, -1, 8, -1, 6, -1, 7, -1, 5, -1, 6, -1, -1, -1], hat: 0, kick: 0 }
  };
  function sched() {
    if (!ctx || !loopKind) return;
    var L = LOOPS[loopKind], sp = 60 / L.bpm / 4;
    while (nextT < ctx.currentTime + 0.15) {
      var i = step % 16, b = L.bass[i], l = L.lead[i];
      if (b >= 0) tone(SC[b] / 2, nextT, sp * 1.8, 'triangle', 0.16);
      if (l >= 0) tone(SC[l] * 2, nextT, sp * 1.5, loopKind === 'calm' ? 'sine' : 'square', loopKind === 'calm' ? 0.08 : 0.035);
      if (L.hat && i % L.hat === 0) noise(nextT, 0.03, 0.025, 7000);
      if (L.kick && i % L.kick === 0) tone(120, nextT, 0.12, 'sine', 0.3, 40);
      step++; nextT += sp;
    }
  }
  A.loop = function (kind) {
    kind = kind || null;
    if (kind === loopKind && loopTimer) return;
    loopKind = kind;
    if (loopTimer) { clearInterval(loopTimer); loopTimer = null; }
    if (!ctx || !loopKind) return;
    step = 0; nextT = ctx.currentTime + 0.05; loopTimer = setInterval(sched, 50);
  };

  A.say = function (text) {
    try {
      if (!A.on || !window.speechSynthesis) return;
      var u = new SpeechSynthesisUtterance(text); u.lang = 'es-ES'; u.rate = 0.95; u.pitch = 0.7;
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    } catch (e) {}
  };
})();
