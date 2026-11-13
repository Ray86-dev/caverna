/* Escena 3D (three.js). Cinco decorados: la caverna de Platón, el exterior con el templo, la mesa de tablillas
   (tablero táctil), el busto del «¿quién soy?» y la cámara del oráculo de Delfos.
   Si el equipo no puede con ella, se apaga sola y queda la interfaz plana. */
(function () {
  'use strict';
  var T = window.THREE, Art = window.Art;
  var S = window.Scene3D = { on: false, onFrame: null, onChange: null, forced: /[?&]3d=force/.test(location.search), off: /[?&]3d=0/.test(location.search) };
  var R, scene, cam, cv, lastT = 0, tm = 0, mode = 'lobby', stage = 1, lum = 0, flare = 0, curG = '', oracleOn = false, prevMode = ['lobby', 1];
  var STEPS = 34, SH = 0.75, SD = 1.6, Z0 = 2, TOPY = STEPS * SH, TOPZ = Z0 - STEPS * SD, LANE = 7.3;
  var OY = 300, ORY = -150, WHY = -300, TAY = -600;
  var GROUP = { lobby: 'cave', play: 'cave', scores: 'cave', out: 'out', table: 'tab', who: 'who', oracle: 'ora' };
  var caveG, outG, tabG, whoG, oraG, fire, fireSpr = [], exitPt, glow1, glow2, amb, sun, hemi, dust, shadows = [], coins = [], podCoins = [], plinths = [], teamSig = '';
  var pos = new T.Vector3(0, 4.2, 7), yaw = 0, pitch = 0.2, tPos = new T.Vector3(), tLook = new T.Vector3(), snapCam = true;
  var fps = { n: 0, t: 0, pr: 1, bad: 0 }, V = new T.Vector3(), V2 = new T.Vector3();
  var fogCave = new T.FogExp2(0x0d0906, 0.0125), fogOut = new T.FogExp2(0xcfe0ea, 0.0011), fogDark = new T.FogExp2(0x070504, 0.012);
  var gFire, gGold, gTeal;

  function rock(c) { return new T.MeshStandardMaterial({ color: c, roughness: 1, metalness: 0, flatShading: true }); }
  function nz(x, y, z) { return Math.sin(x * 0.21 + 1.3) * Math.cos(y * 0.27 + 0.5) * 2.4 + Math.sin(z * 0.33 + x * 0.11) * 1.8 + Math.sin(x * 0.9 + 2) * Math.sin(y * 0.8 + z * 0.7) * 0.9; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function ctex(w, h, draw, fonts) { var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'); draw(x, w, h); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8; if (fonts && S.fontP) S.fontP.then(function () { x.clearRect(0, 0, w, h); draw(x, w, h); t.needsUpdate = true; }); return t; }
  function svgImg(name, color, cb) {
    var im = new Image();
    im.onload = function () { cb(im); };
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 48 48"><style>.s{fill:none;stroke:' + color + ';stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.s3{fill:none;stroke:' + color + ';stroke-width:2.6}</style><g fill="' + color + '">' + Art.raw(name) + '</g></svg>');
  }
  function glowTex(inner, outer) {
    return ctex(128, 128, function (g) { var gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, inner); gr.addColorStop(0.35, outer); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  }
  function sprite(tex, sx, sy, op) { var m = new T.SpriteMaterial({ map: tex, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: op, fog: false }); var s = new T.Sprite(m); s.scale.set(sx, sy, 1); return s; }
  function add(g, mesh, x, y, z) { mesh.position.set(x || 0, y || 0, z || 0); g.add(mesh); return mesh; }
  function wrap(c, text, maxW) { var words = String(text).split(' '), lines = [], cur = ''; words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }); if (cur) lines.push(cur); return lines; }
  function brazier(g, x, y, z, s) {
    var st = new T.MeshStandardMaterial({ color: 0x5a4127, roughness: 0.6, metalness: 0.6 });
    add(g, new T.Mesh(new T.CylinderGeometry(0.12 * s, 0.3 * s, 3 * s, 6), st), x, y + 1.5 * s, z);
    add(g, new T.Mesh(new T.CylinderGeometry(0.75 * s, 0.3 * s, 0.5 * s, 10), st), x, y + 3.2 * s, z);
    var f = sprite(gFire, 2.2 * s, 3.4 * s, 0.9); f.position.set(x, y + 4.4 * s, z); f.userData = { b: y + 4.4 * s, p: rnd(0, 6), s: s }; g.add(f); return f;
  }
  function flick(f, k) { var s = f.userData.s * (1 + Math.sin(tm * 13 + f.userData.p * 2) * 0.16) * k; f.scale.set(2.2 * s, 3.4 * s, 1); f.position.y = f.userData.b + Math.sin(tm * 9 + f.userData.p) * 0.15; }

  /* ================= la caverna ================= */
  function buildCave() {
    var g, m, i, p, v = new T.Vector3(), r, mesh;
    caveG = new T.Group(); scene.add(caveG);
    g = new T.IcosahedronGeometry(1, 7); p = g.attributes.position;
    for (i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).normalize(); r = 62 + nz(v.x * 30, v.y * 30, v.z * 30) * 1.7; p.setXYZ(i, v.x * r * 1.25, v.y * r * 0.62, v.z * r * 1.45); }
    g.computeVertexNormals(); m = rock(0x46321f); m.side = T.BackSide; add(caveG, new T.Mesh(g, m), 0, 12, -14);
    g = new T.PlaneGeometry(240, 240, 34, 34); g.rotateX(-Math.PI / 2); p = g.attributes.position;
    for (i = 0; i < p.count; i++) { var fx = p.getX(i), fz = p.getZ(i); p.setY(i, (Math.abs(fx) < 20 && fz < 24 ? 0 : nz(fx * 0.7, 3, fz * 0.7) * 0.35) - 0.45); }
    g = g.toNonIndexed(); g.computeVertexNormals(); caveG.add(new T.Mesh(g, rock(0x3d2d20)));
    var sg = new T.BoxGeometry(34, SH, SD + 0.02), sm = new T.MeshStandardMaterial({ color: 0x9a8062, roughness: 0.95, flatShading: true }), sm2 = new T.MeshStandardMaterial({ color: 0x8a7155, roughness: 0.95, flatShading: true });
    for (i = 0; i < STEPS; i++) add(caveG, new T.Mesh(sg, i % 2 ? sm : sm2), 0, i * SH + SH / 2 - 0.4, Z0 - i * SD - SD / 2);
    add(caveG, new T.Mesh(new T.BoxGeometry(34, 1, 14), sm), 0, TOPY - 0.9, TOPZ - 7);
    var dg = new T.DodecahedronGeometry(1, 0), rm = rock(0x4c3929), rm2 = rock(0x66503a);
    for (i = 0; i < 64; i++) {
      var k = Math.random() * STEPS, side = i % 2 ? 1 : -1; mesh = add(caveG, new T.Mesh(dg, i % 3 ? rm : rm2), side * rnd(17.5, 22), k * SH + rnd(-0.5, 1.2), Z0 - k * SD);
      mesh.scale.set(rnd(1.6, 4.2), rnd(1.4, 3.6), rnd(1.6, 4)); mesh.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3));
    }
    for (i = 0; i < 70; i++) {
      var x = rnd(-58, 58), z = rnd(-78, 46), e = 1 - (x / 77) * (x / 77) - ((z + 14) / 90) * ((z + 14) / 90); if (e < 0.15) continue;
      var top = 12 + 38 * Math.sqrt(e) - 0.5, len = rnd(4, 13), up = i % 4 === 0;
      if (up && (Math.abs(x) < 24)) continue;
      if (!up && Math.abs(x) < 9 && z < -30) continue;
      mesh = new T.Mesh(new T.ConeGeometry(rnd(0.6, 1.9), len, 6), i % 2 ? rm : rm2);
      if (up) mesh.position.set(x, len / 2 - 0.6, z); else { mesh.position.set(x, top - len / 2 + 1, z); mesh.rotation.x = Math.PI; }
      caveG.add(mesh);
    }
    var pt = ctex(256, 336, function (c, w, h) {
      var gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.55, '#fff1c9'); gr.addColorStop(1, '#f2b869');
      c.fillStyle = gr; c.beginPath(); c.moveTo(0, h); c.lineTo(0, w / 2); c.arc(w / 2, w / 2, w / 2, Math.PI, 0); c.lineTo(w, h); c.closePath(); c.fill();
    });
    add(caveG, new T.Mesh(new T.PlaneGeometry(13, 17), new T.MeshBasicMaterial({ map: pt, transparent: true, fog: false })), 0, TOPY + 8.1, TOPZ - 9);
    var col = new T.CylinderGeometry(1.1, 1.3, 15, 10), cm = new T.MeshStandardMaterial({ color: 0xb09a78, roughness: 0.9, flatShading: true });
    [-8, 8].forEach(function (cx) { add(caveG, new T.Mesh(col, cm), cx, TOPY + 7.1, TOPZ - 8.5); });
    add(caveG, new T.Mesh(new T.BoxGeometry(20, 1.6, 3), cm), 0, TOPY + 15.4, TOPZ - 8.5);
    for (i = 0; i < 26; i++) { var a = i / 25 * Math.PI, rr = 12.5 + rnd(0, 3); mesh = add(caveG, new T.Mesh(dg, rm), Math.cos(a) * rr, TOPY + 2 + Math.sin(a) * (rr + 4), TOPZ - 8 + rnd(-1, 1)); mesh.scale.set(rnd(2, 4.5), rnd(2, 4.5), rnd(2, 4)); mesh.rotation.set(rnd(0, 3), rnd(0, 3), 0); }
    var gt = glowTex('rgba(255,244,214,1)', 'rgba(255,196,110,.45)');
    glow1 = sprite(gt, 46, 46, 0.5); glow1.position.set(0, TOPY + 8, TOPZ - 7); caveG.add(glow1);
    glow2 = sprite(gt, 110, 90, 0.18); glow2.position.set(0, TOPY + 6, TOPZ - 4); caveG.add(glow2);
    exitPt = new T.PointLight(0xffe0a6, 1.2, 150, 1.4); exitPt.position.set(0, TOPY + 9, TOPZ + 2); caveG.add(exitPt);
    var fx0 = 0, fz0 = 9;
    for (i = 0; i < 10; i++) { var fa = i / 10 * 6.283; mesh = add(caveG, new T.Mesh(dg, rock(0x2e241c)), fx0 + Math.cos(fa) * 2, 0, fz0 + Math.sin(fa) * 2); mesh.scale.set(0.7, 0.55, 0.7); mesh.rotation.y = fa; }
    for (i = 0; i < 4; i++) { var fs = sprite(gFire, 3, 4.6, 0.8); fs.position.set(fx0 + rnd(-0.5, 0.5), 1.5 + i * 0.5, fz0 + rnd(-0.4, 0.4)); fs.userData.b = fs.position.y; fs.userData.p = rnd(0, 6); fireSpr.push(fs); caveG.add(fs); }
    fire = new T.PointLight(0xff7a2c, 1.9, 95, 1.3); fire.position.set(fx0, 3, fz0); caveG.add(fire);
    g = new T.PlaneGeometry(110, 46, 34, 14); p = g.attributes.position;
    for (i = 0; i < p.count; i++) p.setZ(i, nz(p.getX(i) * 0.6, p.getY(i) * 0.6, 4) * 0.42);
    g = g.toNonIndexed(); g.computeVertexNormals(); mesh = add(caveG, new T.Mesh(g, rock(0x7a5c3e)), 0, 15, 35); mesh.rotation.y = Math.PI;
    ['amphora', 'temple', 'hand', 'sun', 'leaf', 'bolt', 'flame', 'amphora', 'eye'].forEach(function (name, j) {
      var c = document.createElement('canvas'); c.width = 192; c.height = 384; var tex = new T.CanvasTexture(c);
      svgImg(name, '#000', function (im) { var x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(90, 170, 12, 214); x.drawImage(im, 0, 0, 192, 192); tex.needsUpdate = true; });
      var mm = new T.Mesh(new T.PlaneGeometry(7, 14), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.62, depthWrite: false, color: 0x000000 }));
      mm.rotation.y = Math.PI; mm.userData = { x: 52 - j * 11.5 + rnd(-2, 2), ph: rnd(0, 6), s: rnd(0.7, 1) }; mm.scale.set(mm.userData.s, mm.userData.s, 1); shadows.push(mm); caveG.add(mm);
    });
    var n = 420, arr = new Float32Array(n * 3);
    for (i = 0; i < n; i++) { arr[i * 3] = rnd(-34, 34); arr[i * 3 + 1] = rnd(0, 40); arr[i * 3 + 2] = rnd(-60, 34); }
    g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(arr, 3));
    dust = new T.Points(g, new T.PointsMaterial({ map: gGold, size: 0.5, transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false })); caveG.add(dust);
  }

  /* ================= el exterior ================= */
  function buildOut() {
    var g, i, mesh, p, c = new T.Color(), top = new T.Color(0x2f7fd0), hor = new T.Color(0xfde6b8);
    outG = new T.Group(); outG.position.y = OY; scene.add(outG);
    g = new T.SphereGeometry(520, 28, 14); p = g.attributes.position; var cols = [];
    for (i = 0; i < p.count; i++) { var t = Math.max(0, Math.min(1, p.getY(i) / 300)); c.copy(hor).lerp(top, Math.pow(t, 0.55)); cols.push(c.r, c.g, c.b); }
    g.setAttribute('color', new T.Float32BufferAttribute(cols, 3)); outG.add(new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false })));
    var sp = sprite(glowTex('rgba(255,255,240,1)', 'rgba(255,214,130,.5)'), 150, 150, 1); sp.position.set(-70, 60, -230); outG.add(sp);
    mesh = add(outG, new T.Mesh(new T.CircleGeometry(900, 40), new T.MeshStandardMaterial({ color: 0x2c7fae, roughness: 0.3, metalness: 0.25 })), 0, -7, 0); mesh.rotation.x = -Math.PI / 2;
    var marble = new T.MeshStandardMaterial({ color: 0xd9c8a6, roughness: 0.85 }), marbleF = new T.MeshStandardMaterial({ color: 0xd4c29e, roughness: 0.85, flatShading: true }), floorM = new T.MeshStandardMaterial({ color: 0xb9a57f, roughness: 0.95 });
    add(outG, new T.Mesh(new T.CylinderGeometry(27, 30, 7, 56), floorM), 0, -3.5, 0);
    for (i = 0; i < 3; i++) add(outG, new T.Mesh(new T.BoxGeometry(30 - i * 1.6, 0.6, 12 - i * 1.4), marble), 0, 0.3 + i * 0.6, -14);
    for (i = 0; i < 6; i++) { add(outG, new T.Mesh(new T.CylinderGeometry(0.85, 1.02, 11, 14), marbleF), -11 + i * 4.4, 7.3, -11.2); add(outG, new T.Mesh(new T.BoxGeometry(2.3, 0.5, 2.3), marble), -11 + i * 4.4, 13, -11.2); }
    add(outG, new T.Mesh(new T.BoxGeometry(26, 1.5, 4.4), marble), 0, 14, -12.2);
    var sh = new T.Shape(); sh.moveTo(-13.6, 0); sh.lineTo(13.6, 0); sh.lineTo(0, 4.4); sh.closePath();
    add(outG, new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 4.4, bevelEnabled: false }), marble), 0, 14.75, -14.4);
    add(outG, new T.Mesh(new T.BoxGeometry(24, 12, 1), new T.MeshStandardMaterial({ color: 0xd9c9a8, roughness: 0.9 })), 0, 7.5, -16.6);
    [[0, 4.6], [-5.4, 3.2], [5.4, 2.2]].forEach(function (d) { add(outG, new T.Mesh(new T.BoxGeometry(4.2, d[1], 4.2), marble), d[0], d[1] / 2, 4); add(outG, new T.Mesh(new T.BoxGeometry(4.8, 0.4, 4.8), marble), d[0], d[1] + 0.2, 4); plinths.push({ x: d[0], y: d[1] + 0.4 }); });
    sun = new T.DirectionalLight(0xfff0d2, 0.95); sun.position.set(-55, OY + 60, 45); sun.target.position.set(0, OY, 0); scene.add(sun); scene.add(sun.target);
    hemi = new T.HemisphereLight(0xbfdcff, 0x8a7350, 0.42); scene.add(hemi);
  }

  /* ================= monedas de equipo ================= */
  function coinMesh(t) {
    var c = document.createElement('canvas'); c.width = c.height = 256; var tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding;
    var x = c.getContext('2d');
    x.fillStyle = t.color; x.beginPath(); x.arc(128, 128, 128, 0, 6.3); x.fill();
    x.strokeStyle = 'rgba(20,16,12,.8)'; x.lineWidth = 7; x.beginPath(); x.arc(128, 128, 104, 0, 6.3); x.stroke(); x.lineWidth = 3; x.beginPath(); x.arc(128, 128, 117, 0, 6.3); x.stroke();
    svgImg(t.icon, '#14100c', function (im) { x.drawImage(im, 58, 58, 140, 140); tex.needsUpdate = true; });
    var face = new T.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.45, roughness: 0.45, metalness: 0.25 });
    var edge = new T.MeshStandardMaterial({ color: t.color, emissive: t.color, emissiveIntensity: 0.25, roughness: 0.4, metalness: 0.4 });
    var g = new T.CylinderGeometry(2.4, 2.4, 0.42, 48); g.rotateY(Math.PI / 2); g.rotateX(Math.PI / 2);
    return new T.Mesh(g, [edge, face, face]);
  }
  S.setTeams = function (n, list) {
    if (!S.on) return; var sig = n + '|' + list.slice(0, n).map(function (t) { return t.icon + t.color; }).join(',');
    if (sig === teamSig) return; teamSig = sig;
    coins.forEach(function (c) { caveG.remove(c.m); }); coins = [];
    for (var k = 0; k < n; k++) { var m = coinMesh(list[k]); caveG.add(m); coins.push({ m: m, p: 0, t: 0, x: (k - (n - 1) / 2) * LANE, team: list[k], ph: k * 1.3 }); }
  };
  S.setProgress = function (arr, snap) { coins.forEach(function (c, k) { c.t = Math.max(0, Math.min(1, arr[k] || 0)); if (snap) c.p = c.t; }); };
  S.setPodium = function (rank) {
    if (!S.on) return; var sig = rank.join(','); if (S._pod === sig && podCoins.length) return; S._pod = sig;
    podCoins.forEach(function (m) { outG.remove(m); }); podCoins = [];
    rank.forEach(function (k, j) { if (k === undefined || !coins[k] || !plinths[j]) return; var m = coinMesh(coins[k].team); m.scale.set(0.7, 0.7, 0.7); m.position.set(plinths[j].x, plinths[j].y + 2.2, 4); m.userData.j = j; outG.add(m); podCoins.push(m); });
  };
  S.setMode = function (m, st) { if (!S.on) return; if (oracleOn) { prevMode = [m, st || 1]; return; } mode = m; stage = st || 1; };
  S.flare = function () { flare = 1; };
  S.project = function (kind, i) {
    var o = kind === 'pod' ? podCoins[i] : (coins[i] && coins[i].m); if (!o || !cam) return null;
    o.getWorldPosition(V); V.y -= 2.4 * o.scale.x + (kind === 'pod' ? 0.2 : 0.3); V.project(cam);
    return { x: (V.x * 0.5 + 0.5) * window.innerWidth, y: (-V.y * 0.5 + 0.5) * window.innerHeight };
  };

  /* ================= el oráculo de Delfos ================= */
  var O = { energy: 0, burst: 0, vap: null, spark: null, light: null, sv: [] };
  function buildOracle() {
    var i, a, m, bronze = new T.MeshStandardMaterial({ color: 0xb8823c, roughness: 0.38, metalness: 0.85, side: T.DoubleSide }), stone = rock(0x3a2d22), colM = new T.MeshStandardMaterial({ color: 0x8d7a5e, roughness: 0.9, flatShading: true });
    oraG = new T.Group(); oraG.position.y = ORY; scene.add(oraG);
    add(oraG, new T.Mesh(new T.CylinderGeometry(17, 17, 0.8, 28), stone), 0, -0.4, 0);
    add(oraG, new T.Mesh(new T.CylinderGeometry(5.2, 5.6, 0.5, 24), rock(0x4b3a2b)), 0, 0.25, 0);
    for (i = 0; i < 9; i++) { a = (198 + i * 18) * Math.PI / 180; add(oraG, new T.Mesh(new T.CylinderGeometry(0.95, 1.1, 15, 12), colM), Math.cos(a) * 13, 7.5, Math.sin(a) * 13); add(oraG, new T.Mesh(new T.BoxGeometry(2.6, 0.6, 2.6), colM), Math.cos(a) * 13, 15.2, Math.sin(a) * 13); }
    m = add(oraG, new T.Mesh(new T.TorusGeometry(13, 0.7, 6, 40, Math.PI), colM), 0, 15.9, 0); m.rotation.set(Math.PI / 2, 0, Math.PI);
    /* trípode */
    for (i = 0; i < 3; i++) { a = i * 2.094 + 0.52; var b0 = new T.Vector3(Math.cos(a) * 2.5, 0.5, Math.sin(a) * 2.5), b1 = new T.Vector3(Math.cos(a) * 1.4, 6.5, Math.sin(a) * 1.4), dv = b1.clone().sub(b0); m = add(oraG, new T.Mesh(new T.CylinderGeometry(0.11, 0.17, dv.length(), 6), bronze), (b0.x + b1.x) / 2, (b0.y + b1.y) / 2, (b0.z + b1.z) / 2); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dv.normalize()); }
    m = add(oraG, new T.Mesh(new T.TorusGeometry(1.55, 0.13, 8, 28), bronze), 0, 6.35, 0); m.rotation.x = Math.PI / 2;
    m = add(oraG, new T.Mesh(new T.TorusGeometry(1.95, 0.07, 6, 24), bronze), 0, 3.4, 0); m.rotation.x = Math.PI / 2;
    add(oraG, new T.Mesh(new T.SphereGeometry(1.55, 20, 10, 0, 6.3, Math.PI / 2, Math.PI / 2), bronze), 0, 6.35, 0);
    /* grieta y ónfalo */
    m = add(oraG, new T.Mesh(new T.CircleGeometry(1.5, 20), new T.MeshBasicMaterial({ color: 0x7dffd8, fog: false })), 0, 0.52, 0); m.rotation.x = -Math.PI / 2;
    O.glow = sprite(gTeal, 9, 9, 0.6); O.glow.position.set(0, 1.2, 0); oraG.add(O.glow);
    O.glow2 = sprite(gTeal, 7, 7, 0.4); O.glow2.position.set(0, 7.2, 0); oraG.add(O.glow2);
    m = add(oraG, new T.Mesh(new T.SphereGeometry(1.25, 14, 10), rock(0x9c8a6c)), -6.2, 1.6, 2.4); m.scale.set(1, 1.35, 1);
    brazier(oraG, -9.5, 0, 5, 1.1); brazier(oraG, 9.5, 0, 5, 1.1);
    O.fires = oraG.children.filter(function (c) { return c.isSprite && c.userData.b; });
    O.light = new T.PointLight(0x74ffd2, 1.3, 70, 1.4); O.light.position.set(0, 5, 0.5); oraG.add(O.light);
    O.warm = new T.PointLight(0xff9440, 0.9, 80, 1.3); O.warm.position.set(0, 9, 13); oraG.add(O.warm);
    /* vapores */
    var n = 150, arr = new Float32Array(n * 3), g = new T.BufferGeometry();
    for (i = 0; i < n; i++) O.sv.push({ a: rnd(0, 6.28), y: rnd(0, 15), r: rnd(0.15, 1), sp: rnd(0.6, 1.5) });
    g.setAttribute('position', new T.BufferAttribute(arr, 3));
    O.vap = new T.Points(g, new T.PointsMaterial({ map: gTeal, size: 2.3, transparent: true, opacity: 0.34, blending: T.AdditiveBlending, depthWrite: false })); oraG.add(O.vap);
    var n2 = 90, arr2 = new Float32Array(n2 * 3), g2 = new T.BufferGeometry(); O.sp = [];
    for (i = 0; i < n2; i++) O.sp.push({ v: new T.Vector3(), p: new T.Vector3(0, -99, 0) });
    g2.setAttribute('position', new T.BufferAttribute(arr2, 3));
    O.spark = new T.Points(g2, new T.PointsMaterial({ map: gGold, size: 0.9, transparent: true, opacity: 0.95, blending: T.AdditiveBlending, depthWrite: false })); oraG.add(O.spark);
  }
  function updOracle(dt) {
    var i, p = O.vap.geometry.attributes.position, e = O.energy, q;
    O.energy *= Math.exp(-dt * 1.4); O.burst *= Math.exp(-dt * 1.6);
    for (i = 0; i < O.sv.length; i++) {
      q = O.sv[i]; q.y += dt * q.sp * (1.6 + e * 5); q.a += dt * (0.9 + e * 4) * (i % 2 ? 1 : -1);
      if (q.y > 16) { q.y = 0; q.r = rnd(0.15, 1); }
      var rr = q.r * (0.5 + q.y * 0.16 + Math.sin(q.y * 0.9 + q.a) * 0.3);
      p.setXYZ(i, Math.cos(q.a) * rr, 0.5 + q.y, Math.sin(q.a) * rr);
    }
    p.needsUpdate = true; O.vap.material.opacity = 0.26 + e * 0.3; O.vap.material.size = 2.2 + e * 1.2;
    p = O.spark.geometry.attributes.position;
    for (i = 0; i < O.sp.length; i++) { q = O.sp[i]; if (q.p.y > -50) { q.v.y -= dt * 7; q.p.addScaledVector(q.v, dt); if (q.p.y < 0.3) q.p.y = -99; } p.setXYZ(i, q.p.x, q.p.y, q.p.z); }
    p.needsUpdate = true;
    var fl = 0.85 + Math.sin(tm * 9) * 0.08 + Math.sin(tm * 21) * 0.06;
    O.light.intensity = (1.2 + e * 2.2 + O.burst * 3) * fl; O.light.color.setHex(O.burst > 0.25 ? 0xffe2a0 : 0x74ffd2);
    O.glow.material.opacity = 0.5 + e * 0.4; O.glow2.material.opacity = 0.3 + e * 0.5 + O.burst * 0.4; var gs = 7 + e * 5 + O.burst * 10; O.glow2.scale.set(gs, gs, 1);
    O.warm.intensity = 0.8 * fl; O.fires.forEach(function (f) { flick(f, 1 + e * 0.3); });
  }
  S.oracle = function (v) {
    if (!S.on) return;
    if (v && !oracleOn) { prevMode = [mode, stage]; oracleOn = true; mode = 'oracle'; O.energy = 0.4; }
    else if (!v && oracleOn) { oracleOn = false; mode = prevMode[0]; stage = prevMode[1]; }
  };
  S.oraclePulse = function () { O.energy = Math.min(1.2, O.energy + 0.35); };
  S.oracleBurst = function () { O.burst = 1; O.energy = 0.5; O.sp.forEach(function (q) { var a = rnd(0, 6.28), u = rnd(2, 9); q.p.set(0, 6.6, 0); q.v.set(Math.cos(a) * u, rnd(5, 13), Math.sin(a) * u); }); };

  /* ================= ¿quién soy?: el busto ================= */
  var W = { n: 1, rv: false, name: '', attr: null, key: 0, fires: [], as: 0 };
  function buildWho() {
    var i, m, marble = new T.MeshStandardMaterial({ color: 0xe4d8c2, roughness: 0.7, flatShading: true }), stone = rock(0x3a2d22), colM = new T.MeshStandardMaterial({ color: 0x8d7a5e, roughness: 0.9, flatShading: true });
    whoG = new T.Group(); whoG.position.y = WHY; scene.add(whoG);
    add(whoG, new T.Mesh(new T.CylinderGeometry(22, 22, 0.8, 30), stone), 0, -0.4, 0);
    for (i = 0; i < 7; i++) { var a = (205 + i * 21.6) * Math.PI / 180; add(whoG, new T.Mesh(new T.CylinderGeometry(1, 1.15, 18, 10), colM), Math.cos(a) * 15, 9, Math.sin(a) * 15); }
    add(whoG, new T.Mesh(new T.CylinderGeometry(2.6, 2.9, 0.7, 10), colM), 0, 0.35, 0);
    add(whoG, new T.Mesh(new T.CylinderGeometry(1.75, 2, 3.6, 12), colM), 0, 2.5, 0);
    add(whoG, new T.Mesh(new T.BoxGeometry(4.6, 0.6, 4.6), colM), 0, 4.6, 0);
    W.bust = new T.Group(); W.bust.position.y = 4.9; whoG.add(W.bust);
    m = add(W.bust, new T.Mesh(new T.SphereGeometry(2.1, 9, 6, 0, 6.3, 0, Math.PI * 0.55), marble), 0, 0.1, 0); m.scale.set(1.15, 0.95, 0.72);
    add(W.bust, new T.Mesh(new T.CylinderGeometry(0.62, 0.82, 1.3, 8), marble), 0, 2.3, 0.05);
    m = add(W.bust, new T.Mesh(new T.IcosahedronGeometry(1.3, 1), marble), 0, 3.75, 0.1); m.scale.set(0.9, 1.12, 1);
    m = add(W.bust, new T.Mesh(new T.ConeGeometry(0.92, 1.7, 6), marble), 0, 2.75, 0.75); m.rotation.x = Math.PI + 0.25; m.scale.z = 0.7;
    m = add(W.bust, new T.Mesh(new T.TetrahedronGeometry(0.34), marble), 0, 3.7, 1.36); m.rotation.set(0.6, 0.78, 0);
    add(W.bust, new T.Mesh(new T.BoxGeometry(1.5, 0.16, 0.3), marble), 0, 4.08, 1.12);
    m = add(W.bust, new T.Mesh(new T.SphereGeometry(1.36, 8, 5, 0, 6.3, 0, Math.PI * 0.5), marble), 0, 3.95, -0.12); m.scale.set(0.98, 0.9, 1.05); m.rotation.x = -0.25;
    W.laurel = new T.Group(); W.laurel.position.set(0, 4.3, 0); W.laurel.rotation.x = -0.28; W.bust.add(W.laurel);
    var gold = new T.MeshStandardMaterial({ color: 0xe3b24a, roughness: 0.35, metalness: 0.75, emissive: 0x6a4a10, emissiveIntensity: 0.6 }); W.gold = gold;
    for (i = 0; i < 18; i++) { var la = i / 18 * 6.283; if (Math.abs(la - Math.PI * 0.5) < 0.42) continue; m = add(W.laurel, new T.Mesh(new T.SphereGeometry(0.3, 6, 4), gold), Math.cos(la) * 1.27, 0, Math.sin(la) * 1.27); m.scale.set(1.5, 0.35, 0.7); m.rotation.y = -la + 1.2; m.rotation.z = 0.5; }
    [[-5.6, 4.2], [5.6, 4.2], [-6.8, -2.6], [6.8, -2.6]].forEach(function (d, j) { var f = brazier(whoG, d[0], 0, d[1], 1.15); f.material.opacity = 0; W.fires.push(f); });
    W.keyL = new T.PointLight(0xffb060, 0.2, 60, 1.3); W.keyL.position.set(-5, 9, 8); whoG.add(W.keyL);
    W.fill = new T.PointLight(0xffd9a0, 0, 60, 1.3); W.fill.position.set(6, 6, 7); whoG.add(W.fill);
    W.rim = new T.PointLight(0x7fa6ff, 0.9, 50, 1.4); W.rim.position.set(1.5, 11, -6.5); whoG.add(W.rim);
    var n = 160, arr = new Float32Array(n * 3), g = new T.BufferGeometry();
    for (i = 0; i < n; i++) { arr[i * 3] = rnd(-14, 26); arr[i * 3 + 1] = rnd(0, 16); arr[i * 3 + 2] = rnd(-10, 12); }
    g.setAttribute('position', new T.BufferAttribute(arr, 3));
    whoG.add(new T.Points(g, new T.PointsMaterial({ map: gGold, size: 0.28, transparent: true, opacity: 0.5, blending: T.AdditiveBlending, depthWrite: false })));
  }
  function attrFor(name) {
    var g = new T.Group(), gold = W.gold, i, m;
    if (name === 'Demócrito') {
      add(g, new T.Mesh(new T.SphereGeometry(0.34, 14, 10), gold));
      for (i = 0; i < 3; i++) { var o = new T.Group(); o.rotation.set(i * 1.05, 0, i * 1.05 + 0.5); m = add(o, new T.Mesh(new T.TorusGeometry(1.25, 0.035, 6, 40), gold)); add(o, new T.Mesh(new T.SphereGeometry(0.15, 10, 8), gold), 1.25, 0, 0); o.userData.sp = 1.5 + i * 0.6; g.add(o); }
    } else if (name === 'Protágoras') {
      for (i = 0; i < 6; i++) { m = add(g, new T.Mesh(new T.CylinderGeometry(0.72, 0.72, 0.14, 24), gold), rnd(-0.1, 0.1), -0.7 + i * 0.16, rnd(-0.1, 0.1)); }
      m = add(g, new T.Mesh(new T.CylinderGeometry(0.72, 0.72, 0.14, 24), gold), 1.05, -0.2, 0.1); m.rotation.z = 1.15;
    } else if (name === 'Anaximandro') {
      var n = 260, arr = new Float32Array(n * 3), bg = new T.BufferGeometry();
      for (i = 0; i < n; i++) { V.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize().multiplyScalar(rnd(0.3, 1.35)); arr[i * 3] = V.x; arr[i * 3 + 1] = V.y; arr[i * 3 + 2] = V.z; }
      bg.setAttribute('position', new T.BufferAttribute(arr, 3)); g.add(new T.Points(bg, new T.PointsMaterial({ map: gGold, size: 0.42, transparent: true, opacity: 0.8, blending: T.AdditiveBlending, depthWrite: false })));
    } else if (name === 'Parménides') {
      add(g, new T.Mesh(new T.SphereGeometry(1.15, 40, 28), new T.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.12, metalness: 0.55, emissive: 0x3a352c })));
    } else if (name === 'Sócrates') {
      var pts = [[0.02, 0], [0.62, 0], [0.56, 0.08], [0.13, 0.16], [0.11, 0.78], [0.5, 1.02], [1.05, 1.22], [1.12, 1.45], [1.02, 1.45], [0.95, 1.3], [0.45, 1.12], [0.02, 1.02]].map(function (q) { return new T.Vector2(q[0], q[1]); });
      m = add(g, new T.Mesh(new T.LatheGeometry(pts, 28), gold), 0, -0.75, 0); gold.side = T.DoubleSide;
    } else add(g, new T.Mesh(new T.OctahedronGeometry(1), gold));
    return g;
  }
  S.who = function (n, rv, name) {
    if (!S.on) return;
    if (name !== W.name || (!rv && W.rv)) { if (W.attr) { whoG.remove(W.attr); W.attr = null; } W.as = 0; }
    W.n = n; W.name = name;
    if (rv && !W.rv) flare = 1;
    W.rv = rv;
    if (rv && !W.attr) { W.attr = attrFor(name); W.attr.position.set(-3.5, 10.9, 1.4); W.attr.scale.set(0.01, 0.01, 0.01); whoG.add(W.attr); }
  };
  function updWho(dt) {
    var k = Math.min(1, dt * 2.2), rv = W.rv, tk = rv ? 2.3 : [0.16, 0.45, 0.85, 1.25][Math.max(0, Math.min(3, W.n - 1))];
    W.key += (tk - W.key) * k; var fl = 0.9 + Math.sin(tm * 10) * 0.06 + Math.sin(tm * 23) * 0.04;
    W.keyL.intensity = W.key * fl; W.fill.intensity = (rv ? 1.1 : W.key * 0.35) * fl; W.rim.intensity = 0.9 + (rv ? 0.5 : 0);
    W.fires.forEach(function (f, i) { var on = rv || i < W.n ? 0.9 : 0; f.material.opacity += (on - f.material.opacity) * k; flick(f, 1); });
    W.bust.rotation.y = Math.sin(tm * 0.35) * 0.32 + (rv ? Math.sin(tm * 0.9) * 0.08 : 0);
    W.laurel.visible = rv; W.gold.emissiveIntensity = 0.5 + Math.sin(tm * 3) * 0.15;
    if (W.attr) { W.as += (1 - W.as) * Math.min(1, dt * 3); var s = W.as * 1.25; W.attr.scale.set(s, s, s); W.attr.rotation.y += dt * 0.9; W.attr.position.y = 10.9 + Math.sin(tm * 1.6) * 0.25; W.attr.children.forEach(function (c) { if (c.userData.sp) c.rotation.y += dt * c.userData.sp; }); }
  }

  /* ================= el tablero: mesa de tablillas ================= */
  var B = S.board = { active: false, done: false, tabs: [], bins: [], drags: {}, sel: null, onDrop: null, ray: new T.Raycaster(), objs: [] };
  var TW = 6.4, TD = 3.2, ndc = new T.Vector2(), pl = new T.Plane(new T.Vector3(0, 1, 0), 0);
  function buildTable() {
    var st = new T.MeshStandardMaterial({ color: 0x86704f, roughness: 0.95, flatShading: true }), i, m;
    tabG = new T.Group(); tabG.position.y = TAY; scene.add(tabG);
    add(tabG, new T.Mesh(new T.BoxGeometry(47, 2.4, 26.5), st), 0, -1.2, -1.7);
    [[0, -15.3, 48.6, 1.3], [0, 11.9, 48.6, 1.3], [-23.9, -1.7, 1.3, 28], [23.9, -1.7, 1.3, 28]].forEach(function (d) { add(tabG, new T.Mesh(new T.BoxGeometry(d[2], 3, d[3]), rock(0x5c4833)), d[0], -1.1, d[1]); });
    m = add(tabG, new T.Mesh(new T.PlaneGeometry(160, 120), rock(0x211811)), 0, -2.6, 0); m.rotation.x = -Math.PI / 2;
    add(tabG, new T.Mesh(new T.BoxGeometry(42.4, 0.08, 0.16), new T.MeshStandardMaterial({ color: 0xcf5f2e, roughness: 0.8 })), 0, 0.04, 1.75);
    B.fires = [brazier(tabG, -27.5, -2.6, -13, 1.5), brazier(tabG, 27.5, -2.6, -13, 1.5)];
    var l1 = new T.PointLight(0xffc98a, 1.25, 120, 1.1); l1.position.set(-14, 20, 10); tabG.add(l1);
    var l2 = new T.PointLight(0xffe2b8, 1.05, 120, 1.1); l2.position.set(15, 22, -4); tabG.add(l2);
    B.shTex = ctex(64, 64, function (c) { var gr = c.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); });
    B.sideM = new T.MeshStandardMaterial({ color: 0xcdb991, roughness: 0.9 });
  }
  function tabletTex(text) {
    return ctex(640, 320, function (c, w, h) {
      c.fillStyle = '#f2e4c9'; c.fillRect(0, 0, w, h);
      for (var i = 0; i < 260; i++) { c.fillStyle = 'rgba(120,90,50,' + rnd(0.02, 0.07) + ')'; c.fillRect(rnd(0, w), rnd(0, h), rnd(1, 4), rnd(1, 3)); }
      c.strokeStyle = 'rgba(20,16,12,.3)'; c.lineWidth = 4; c.strokeRect(14, 14, w - 28, h - 28);
      c.fillStyle = '#14100c'; c.textAlign = 'center'; c.textBaseline = 'middle';
      var fs = 68, lines;
      do { c.font = 'normal 800 ' + fs + 'px "Alegreya Sans", "Segoe UI", sans-serif'; lines = wrap(c, text, w - 70); fs -= 4; } while ((lines.length * (fs + 4) * 1.12 > h - 50 || lines.some(function (l) { return c.measureText(l).width > w - 60; })) && fs > 26);
      var lh = (fs + 4) * 1.12, y0 = h / 2 - (lines.length - 1) * lh / 2 + 3;
      lines.forEach(function (l, j) { c.fillText(l, w / 2, y0 + j * lh); });
    }, true);
  }
  function titleTex(text, wu) {
    var w = Math.round(110 * wu / 2.1);
    return ctex(w, 110, function (c) {
      c.clearRect(0, 0, w, 110); c.fillStyle = '#f3a468'; c.textAlign = 'center'; c.textBaseline = 'middle'; var fs = 74, t = String(text).toUpperCase();
      do { c.font = '800 ' + fs + 'px Cinzel, Georgia, serif'; fs -= 3; } while (c.measureText(t).width > w - 30 && fs > 20);
      c.fillText(t, w / 2, 60);
    }, true);
  }
  B.stop = function () { B.objs.forEach(function (o) { tabG.remove(o); if (o.geometry) o.geometry.dispose(); }); B.objs = []; B.tabs = []; B.bins = []; B.drags = {}; B.sel = null; B.active = false; B.done = false; };
  B.start = function (cfg, onDrop) {
    if (!S.on) return false; B.stop(); B.onDrop = onDrop; B.active = true;
    var n = cfg.bins.length, rows = n > 6 ? 2 : 1, per = Math.ceil(n / rows), bw = 42 / per, rd = 13.6 / rows, i;
    cfg.bins.forEach(function (name, i2) {
      var row = Math.floor(i2 / per), col = i2 % per, cx = -21 + bw * (col + 0.5), z0 = -12.7 + rd * row, z1 = z0 + rd;
      var mat = new T.MeshStandardMaterial({ color: 0x241a12, roughness: 1, emissive: 0x000000 });
      var m = add(tabG, new T.Mesh(new T.BoxGeometry(bw - 0.6, 0.14, rd - 0.6), mat), cx, 0.07, (z0 + z1) / 2); B.objs.push(m);
      var tp = add(tabG, new T.Mesh(new T.PlaneGeometry(bw - 1, 2.1), new T.MeshBasicMaterial({ map: titleTex(name, bw - 1), transparent: true, depthWrite: false })), cx, 0.17, z0 + 1.45); tp.rotation.x = -Math.PI / 2; B.objs.push(tp);
      var ln = add(tabG, new T.Mesh(new T.BoxGeometry(bw - 1.6, 0.02, 0.07), new T.MeshBasicMaterial({ color: 0x6a4a30 })), cx, 0.16, z0 + 2.65); B.objs.push(ln);
      var cols = Math.max(1, Math.floor((bw - 0.4) / (TW + 0.3))), cnt = (cfg.counts && cfg.counts[i2]) || 1, rws = Math.ceil(cnt / cols), us = rd - 3.4;
      B.bins.push({ i: i2, x0: cx - bw / 2, x1: cx + bw / 2, z0: z0, z1: z1, cx: cx, mat: mat, n: 0, cols: cols, zs: rws > 1 ? Math.min(TD + 0.25, (us - TD) / (rws - 1)) : 0, zf: z0 + 2.95 + TD / 2, sc: Math.min(1, (bw - 1) / TW, cols > 1 ? 1 : 1), flash: 0, fc: 0, hover: 0 });
    });
    var N = cfg.cards.length, pr = N > 5 ? Math.ceil(N / 2) : N, rw = Math.ceil(N / pr), sx = Math.min(7.6, 40 / pr);
    cfg.order.forEach(function (ci, k) {
      var r = Math.floor(k / pr), c = k % pr, inRow = r === rw - 1 ? N - pr * (rw - 1) : pr;
      var home = new T.Vector3((c - (inRow - 1) / 2) * sx, 0.2, rw > 1 ? 4.3 + r * 3.7 : 6.1);
      var top = new T.MeshStandardMaterial({ map: tabletTex(cfg.cards[ci]), roughness: 0.85, emissive: 0x000000 });
      var m = new T.Mesh(new T.BoxGeometry(TW, 0.36, TD), [B.sideM, B.sideM, top, B.sideM, B.sideM, B.sideM]); m.position.copy(home).setY(14 + k * 2); tabG.add(m); B.objs.push(m);
      var sh = new T.Mesh(new T.PlaneGeometry(TW + 1.4, TD + 1.4), new T.MeshBasicMaterial({ map: B.shTex, transparent: true, depthWrite: false, opacity: 0.5 })); sh.rotation.x = -Math.PI / 2; tabG.add(sh); B.objs.push(sh);
      B.tabs.push({ i: ci, m: m, sh: sh, top: top, home: home, tgt: home.clone(), state: 'home', shake: 0, sc: 1, base: 0 });
    });
    return true;
  };
  function ray(x, y, h) { ndc.set(x / window.innerWidth * 2 - 1, -(y / window.innerHeight) * 2 + 1); B.ray.setFromCamera(ndc, cam); pl.constant = -(TAY + h); return B.ray.ray.intersectPlane(pl, V2) ? V2 : null; }
  function binAt(x, z) { for (var i = 0; i < B.bins.length; i++) { var b = B.bins[i]; if (x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1) return b; } return null; }
  function slot(b) { var k = b.n++, c = k % b.cols, r = Math.floor(k / b.cols), span = TW * b.sc + 0.3; return new T.Vector3(b.cx + (c - (b.cols - 1) / 2) * span, 0.34 + r * 0.14, b.zf + r * b.zs); }
  function place(t, b, late) { t.state = late ? 'late' : 'placed'; t.tgt.copy(slot(b)); t.sc = b.sc; t.base = t.tgt.y; if (late) t.top.color.setHex(0xe7a373); }
  function tryDrop(t, b) {
    var ok = B.onDrop ? B.onDrop(t.i, b.i) : false;
    if (ok) { place(t, b); b.flash = 1; b.fc = 0x5f8a2a; } else { t.state = 'home'; t.tgt.copy(t.home); t.shake = 1; b.flash = 1; b.fc = 0xb5301c; }
    if (B.sel === t) B.sel = null;
  }
  B.pointer = function (type, id, x, y) {
    if (!B.active || B.done || mode !== 'table') return;
    var d = B.drags[id], p, b;
    if (type === 'down') {
      ndc.set(x / window.innerWidth * 2 - 1, -(y / window.innerHeight) * 2 + 1); B.ray.setFromCamera(ndc, cam);
      var hits = B.ray.intersectObjects(B.tabs.filter(function (t) { return t.state === 'home'; }).map(function (t) { return t.m; }), false);
      if (hits.length) {
        var t = null; B.tabs.forEach(function (q) { if (q.m === hits[0].object) t = q; });
        p = ray(x, y, 0.4); B.drags[id] = { t: t, sx: x, sy: y, moved: false, ox: p ? p.x - t.m.position.x : 0, oz: p ? p.z - t.m.position.z : 0 }; t.state = 'drag';
      } else if (B.sel) { p = ray(x, y, 0.2); b = p && binAt(p.x, p.z); if (b) tryDrop(B.sel, b); }
    } else if (type === 'move' && d) {
      if (!d.moved && Math.abs(x - d.sx) + Math.abs(y - d.sy) > 12) { d.moved = true; if (B.sel) B.sel = null; }
      if (d.moved) { p = ray(x, y, 2.4); if (p) { d.t.tgt.set(p.x - d.ox, 2.4, p.z - d.oz); b = binAt(p.x, p.z); B.bins.forEach(function (q) { q.hover = q === b ? 1 : 0; }); } }
    } else if ((type === 'up' || type === 'cancel') && d) {
      delete B.drags[id]; B.bins.forEach(function (q) { q.hover = 0; });
      if (!d.moved) { d.t.state = 'home'; d.t.tgt.copy(d.t.home); B.sel = B.sel === d.t ? null : d.t; return; }
      p = ray(x, y, 2.4); b = p && type === 'up' ? binAt(p.x, p.z) : null;
      if (b) tryDrop(d.t, b); else { d.t.state = 'home'; d.t.tgt.copy(d.t.home); }
    }
  };
  B.finish = function (sol) {
    B.done = true; B.drags = {}; B.sel = null;
    B.tabs.forEach(function (t) { if (t.state !== 'placed') { var b = B.bins[sol[t.i]]; if (b) place(t, b, true); } });
    B.bins.forEach(function (b) { b.hover = 0; });
  };
  B.probe = function (ci, bi) {
    var t = null; B.tabs.forEach(function (q) { if (q.i === ci) t = q; }); var b = B.bins[bi]; if (!t || !b) return null;
    function pj(x, y, z) { V.set(x, TAY + y, z).project(cam); return { x: (V.x * 0.5 + 0.5) * window.innerWidth, y: (-V.y * 0.5 + 0.5) * window.innerHeight }; }
    return { from: pj(t.m.position.x, t.m.position.y, t.m.position.z), to: pj(b.cx, 0.3, (b.z0 + b.z1) / 2) };
  };
  function updTable(dt) {
    var i, t, k;
    for (i = 0; i < B.tabs.length; i++) {
      t = B.tabs[i]; var drag = t.state === 'drag', sel = B.sel === t, ty = t.tgt.y + (sel ? 0.9 + Math.sin(tm * 5) * 0.12 : 0);
      k = 1 - Math.exp(-dt * (drag ? 18 : 8));
      var dx = t.tgt.x - t.m.position.x;
      t.m.position.x += dx * k; t.m.position.z += (t.tgt.z - t.m.position.z) * k; t.m.position.y += (ty - t.m.position.y) * (1 - Math.exp(-dt * 9));
      t.shake *= Math.exp(-dt * 5);
      t.m.rotation.z += ((drag ? Math.max(-0.35, Math.min(0.35, -dx * 0.12)) : 0) - t.m.rotation.z) * Math.min(1, dt * 10);
      t.m.rotation.y = Math.sin(tm * 42) * t.shake * 0.22; t.m.rotation.x = drag ? -0.12 : 0;
      var s = t.m.scale.x + ((drag ? 1.1 : t.sc) - t.m.scale.x) * Math.min(1, dt * 9); t.m.scale.set(s, 1, s);
      t.top.emissive.setHex(sel ? 0x4a3608 : 0x000000);
      var h = Math.max(0, t.m.position.y - 0.2 - t.base); t.sh.position.set(t.m.position.x + h * 0.3, t.base ? t.base - 0.165 : 0.16, t.m.position.z + h * 0.22); t.sh.material.opacity = Math.max(0.12, 0.5 - h * 0.05); var ss = s * (1 + h * 0.07); t.sh.scale.set(ss, ss, 1);
      t.m.renderOrder = drag ? 5 : 0;
    }
    for (i = 0; i < B.bins.length; i++) { var b = B.bins[i]; b.flash *= Math.exp(-dt * 3); V.setScalar(0); if (b.flash > 0.02) b.mat.emissive.setHex(b.fc).multiplyScalar(b.flash); else b.mat.emissive.setHex(0x3a2a10).multiplyScalar(b.hover); }
    B.fires.forEach(function (f) { flick(f, 1); });
  }

  /* ================= bucle ================= */
  function applyGroup(g) {
    curG = g; caveG.visible = g === 'cave'; outG.visible = g === 'out'; tabG.visible = g === 'tab'; whoG.visible = g === 'who'; oraG.visible = g === 'ora';
    sun.visible = hemi.visible = g === 'out'; scene.fog = g === 'out' ? fogOut : g === 'cave' ? fogCave : fogDark; R.setClearColor(g === 'out' ? 0xcfe0ea : g === 'cave' ? 0x0d0906 : 0x070504); snapCam = true;
  }
  function targets() {
    var f = Math.min(1, (stage - 1) / 6), a;
    if (mode === 'lobby') { tPos.set(Math.sin(tm * 0.11) * 1.5, 4.2, 7); tLook.set(0, 10, 34); }
    else if (mode === 'scores') { tPos.set(Math.sin(tm * 0.15) * 1.2, 18, 41); tLook.set(0, 11.5, -16); }
    else if (mode === 'out') { a = Math.sin(tm * 0.1) * 0.55; tPos.set(Math.sin(a) * 27, OY + 6.5, 5 + Math.cos(a) * 27); tLook.set(0, OY + 5.4, -2); }
    else if (mode === 'table') { tPos.set(0, TAY + 37, 11.5); tLook.set(0, TAY, -2.6); }
    else if (mode === 'who') { a = Math.sin(tm * 0.2) * 0.5; tPos.set(10.2 + a, WHY + 8.6, 19); tLook.set(10.2, WHY + 8.2, 0); }
    else if (mode === 'oracle') { a = Math.sin(tm * 0.25) * 2.2; tPos.set(a, ORY + 6.2, 18); tLook.set(0, ORY + 9.4, 0); }
    else { tPos.set(Math.sin(tm * 0.13) * 1.8, 7.5 + f * 5, 36 - f * 9); tLook.set(0, 12 + f * 7, -34); }
  }
  function updCave(dt) {
    var i, k, tl = mode === 'lobby' ? 0 : Math.min(1, stage / 6); lum += (tl - lum) * Math.min(1, dt * 0.8);
    var fl = 0.82 + Math.sin(tm * 11) * 0.07 + Math.sin(tm * 23.7) * 0.05 + Math.sin(tm * 5.3) * 0.06;
    fire.intensity = (1.9 + flare * 2.4) * fl; fire.position.x = Math.sin(tm * 7) * 0.25;
    exitPt.intensity = 0.7 + lum * 2.3; amb.intensity = 0.26 + lum * 0.45; glow1.material.opacity = 0.42 + lum * 0.5; glow2.material.opacity = 0.1 + lum * 0.3;
    for (i = 0; i < fireSpr.length; i++) { var s = fireSpr[i]; s.position.y = s.userData.b + Math.sin(tm * 9 + s.userData.p) * 0.25; var sc = (1 + Math.sin(tm * 13 + s.userData.p * 2) * 0.18) * (1 + flare * 0.9); s.scale.set(3 * sc, 4.6 * sc, 1); }
    for (i = 0; i < shadows.length; i++) { var m = shadows[i], u = m.userData; u.x -= dt * 2.4; if (u.x < -52) u.x += 104; m.position.set(u.x, 8 + Math.sin(tm * 1.7 + u.ph) * 0.7 + Math.sin(tm * 9 + u.ph) * 0.06 * fl, 32.7); m.material.opacity = 0.5 + fl * 0.14; }
    var dp = dust.geometry.attributes.position; for (i = 0; i < dp.count; i += 3) { var y = dp.getY(i) + dt * 0.5; dp.setY(i, y > 40 ? 0 : y); } dp.needsUpdate = true;
    for (k = 0; k < coins.length; k++) {
      var c = coins[k], dd = c.t - c.p, mv = Math.abs(dd) > 0.002; if (mv) c.p += dd * Math.min(1, dt * 1.1) + Math.sign(dd) * Math.min(Math.abs(dd), dt * 0.02);
      var st = 1 + c.p * (STEPS - 4), hop = mv ? Math.abs(Math.sin(st * Math.PI)) * 1.1 : 0;
      var cs = c.m.scale.x + ((mode === 'scores' ? 1 : 0.62) - c.m.scale.x) * Math.min(1, dt * 2); c.m.scale.set(cs, cs, cs);
      c.m.position.set(c.x, st * SH + 2.4 * cs - 0.2 + hop + Math.sin(tm * 1.6 + c.ph) * 0.12, Z0 - st * SD + 0.4); c.m.rotation.y = mv ? Math.sin(tm * 6 + c.ph) * 0.5 : Math.sin(tm * 0.9 + c.ph) * 0.22;
    }
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if (!S.on || document.hidden) { lastT = now; return; }
    var dt = Math.min(0.1, (now - lastT) / 1000 || 0.016), i; lastT = now; tm += dt; flare *= Math.exp(-dt * 2.2);
    var g = GROUP[mode] || 'cave'; if (g !== curG) applyGroup(g);
    targets();
    var dx = tLook.x - tPos.x, dy = tLook.y - tPos.y, dz = tLook.z - tPos.z, ty = Math.atan2(dx, dz), tp = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));
    if (snapCam) { pos.copy(tPos); yaw = ty; pitch = tp; snapCam = false; }
    else { var kk = 1 - Math.exp(-dt * 1.5), d = ty - yaw; while (d > Math.PI) d -= 6.2832; while (d < -Math.PI) d += 6.2832; pos.lerp(tPos, kk); yaw += d * kk; pitch += (tp - pitch) * kk; }
    cam.position.copy(pos); V.set(pos.x + Math.sin(yaw) * Math.cos(pitch), pos.y + Math.sin(pitch), pos.z + Math.cos(yaw) * Math.cos(pitch)); cam.lookAt(V);
    if (g === 'cave') updCave(dt);
    else if (g === 'out') { amb.intensity = 0.35; for (i = 0; i < podCoins.length; i++) { podCoins[i].rotation.y = Math.sin(tm * 1.1 + i) * 0.6; podCoins[i].position.y = plinths[podCoins[i].userData.j].y + 2.2 + Math.sin(tm * 1.8 + i) * 0.15; } }
    else if (g === 'tab') { amb.intensity = 0.62; updTable(dt); }
    else if (g === 'who') { amb.intensity = 0.1 + (W.rv ? 0.3 : 0); updWho(dt); }
    else if (g === 'ora') { amb.intensity = 0.2; updOracle(dt); }
    R.render(scene, cam);
    if (S.onFrame) S.onFrame();
    fps.n++; fps.t += dt;
    if (fps.t >= 2.5) {
      var f2 = fps.n / fps.t; fps.n = 0; fps.t = 0;
      if (f2 < 27 && fps.pr > 0.55) { fps.pr = Math.max(0.5, fps.pr - 0.25); R.setPixelRatio(fps.pr); }
      else if (f2 < 13 && !S.forced) { if (++fps.bad >= 2) S.toggle(false); }
      else fps.bad = 0;
    }
  }
  function size() { if (!R) return; R.setSize(window.innerWidth, window.innerHeight, false); cam.aspect = window.innerWidth / window.innerHeight; cam.updateProjectionMatrix(); }

  S.toggle = function (v) {
    if (!R) return false;
    S.on = v === undefined ? !S.on : !!v; cv.style.display = S.on ? 'block' : 'none';
    document.body.classList.toggle('g3d', S.on); if (S.on) { fps.bad = 0; snapCam = true; } else { B.stop(); oracleOn = false; }
    if (S.onChange) S.onChange(S.on); return S.on;
  };
  S.init = function (canvas) {
    if (!T || S.off) return false;
    try {
      cv = canvas; R = new T.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
      fps.pr = Math.min(window.devicePixelRatio || 1, 1.5); R.setPixelRatio(fps.pr); R.outputEncoding = T.sRGBEncoding; R.setClearColor(0x0d0906);
      scene = new T.Scene(); scene.fog = fogCave; cam = new T.PerspectiveCamera(50, 1.78, 0.5, 1400);
      amb = new T.AmbientLight(0x6a4a34, 0.3); scene.add(amb);
      gFire = glowTex('rgba(255,236,170,1)', 'rgba(255,120,30,.55)'); gGold = glowTex('rgba(255,230,180,1)', 'rgba(255,200,120,.4)'); gTeal = glowTex('rgba(210,255,240,1)', 'rgba(80,230,190,.4)');
      try { if (document.fonts && document.fonts.load) S.fontP = Promise.all([document.fonts.load('800 60px "Alegreya Sans"'), document.fonts.load('800 60px Cinzel')]).catch(function () {}); } catch (e2) {}
      buildCave(); buildOut(); buildOracle(); buildWho(); buildTable(); size(); window.addEventListener('resize', size);
      cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); S.toggle(false); });
      S.on = true; document.body.classList.add('g3d'); requestAnimationFrame(frame); return true;
    } catch (e) { S.on = false; if (canvas) canvas.style.display = 'none'; if (window.console) console.warn('3D desactivado:', e && e.message); return false; }
  };
})();
