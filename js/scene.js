/* Escena 3D (three.js): la caverna de Platón. Hoguera, pared de sombras, escalinata hacia la luz y, fuera, el templo.
   Es solo ambientación: si el equipo no puede con ella, se apaga sola y queda el fondo plano. */
(function () {
  'use strict';
  var T = window.THREE, Art = window.Art;
  var S = window.Scene3D = { on: false, onFrame: null, onChange: null, forced: /[?&]3d=force/.test(location.search), off: /[?&]3d=0/.test(location.search) };
  var R, scene, cam, cv, lastT = 0, tm = 0, mode = 'lobby', stage = 1, lum = 0, flare = 0, raf = 0;
  var STEPS = 34, SH = 0.75, SD = 1.6, Z0 = 2, TOPY = STEPS * SH, TOPZ = Z0 - STEPS * SD, OY = 300, LANE = 7.3;
  var caveG, outG, fire, fireSpr = [], exitPt, glow1, glow2, amb, sun, hemi, dust, shadows = [], coins = [], podCoins = [], plinths = [], teamSig = '';
  var pos = new T.Vector3(0, 3.6, 13), yaw = 0, pitch = 0.2, tPos = new T.Vector3(), tLook = new T.Vector3(), snapCam = true;
  var fps = { n: 0, t: 0, pr: 1, bad: 0 }, V = new T.Vector3();
  var fogCave = new T.FogExp2(0x0d0906, 0.0125), fogOut = new T.FogExp2(0xcfe0ea, 0.0011);

  function rock(c) { return new T.MeshStandardMaterial({ color: c, roughness: 1, metalness: 0, flatShading: true }); }
  function nz(x, y, z) { return Math.sin(x * 0.21 + 1.3) * Math.cos(y * 0.27 + 0.5) * 2.4 + Math.sin(z * 0.33 + x * 0.11) * 1.8 + Math.sin(x * 0.9 + 2) * Math.sin(y * 0.8 + z * 0.7) * 0.9; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function ctex(w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t; }
  function svgImg(name, color, cb) {
    var im = new Image();
    im.onload = function () { cb(im); };
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 48 48"><style>.s{fill:none;stroke:' + color + ';stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.s3{fill:none;stroke:' + color + ';stroke-width:2.6}</style><g fill="' + color + '">' + Art.raw(name) + '</g></svg>');
  }
  function glowTex(inner, outer) {
    return ctex(128, 128, function (g) { var gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, inner); gr.addColorStop(0.35, outer); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  }
  function sprite(tex, sx, sy, op) { var m = new T.SpriteMaterial({ map: tex, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: op, fog: false }); var s = new T.Sprite(m); s.scale.set(sx, sy, 1); return s; }

  /* ---------- la caverna ---------- */
  function buildCave() {
    var g, m, i, p, v = new T.Vector3(), r, mesh;
    caveG = new T.Group(); scene.add(caveG);
    g = new T.IcosahedronGeometry(1, 7); p = g.attributes.position;
    for (i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).normalize(); r = 62 + nz(v.x * 30, v.y * 30, v.z * 30) * 1.7; p.setXYZ(i, v.x * r * 1.25, v.y * r * 0.62, v.z * r * 1.45); }
    g.computeVertexNormals(); m = rock(0x46321f); m.side = T.BackSide; mesh = new T.Mesh(g, m); mesh.position.set(0, 12, -14); caveG.add(mesh);

    g = new T.PlaneGeometry(240, 240, 34, 34); g.rotateX(-Math.PI / 2); p = g.attributes.position;
    for (i = 0; i < p.count; i++) { var fx = p.getX(i), fz = p.getZ(i); p.setY(i, (Math.abs(fx) < 20 && fz < 24 ? 0 : nz(fx * 0.7, 3, fz * 0.7) * 0.35) - 0.45); }
    g = g.toNonIndexed(); g.computeVertexNormals(); caveG.add(new T.Mesh(g, rock(0x3d2d20)));

    /* escalinata */
    var sg = new T.BoxGeometry(34, SH, SD + 0.02), sm = new T.MeshStandardMaterial({ color: 0x9a8062, roughness: 0.95, flatShading: true }), sm2 = new T.MeshStandardMaterial({ color: 0x8a7155, roughness: 0.95, flatShading: true });
    for (i = 0; i < STEPS; i++) { mesh = new T.Mesh(sg, i % 2 ? sm : sm2); mesh.position.set(0, i * SH + SH / 2 - 0.4, Z0 - i * SD - SD / 2); mesh.scale.y = 1 + i * 0.0; caveG.add(mesh); }
    mesh = new T.Mesh(new T.BoxGeometry(34, 1, 14), sm); mesh.position.set(0, TOPY - 0.9, TOPZ - 7); caveG.add(mesh);
    /* relleno bajo la escalera */
    g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute([-17, -0.5, Z0, 17, -0.5, Z0, 17, TOPY - 0.4, TOPZ, -17, -0.5, Z0, 17, TOPY - 0.4, TOPZ, -17, TOPY - 0.4, TOPZ], 3)); g.computeVertexNormals();
    var dg = new T.DodecahedronGeometry(1, 0), rm = rock(0x4c3929), rm2 = rock(0x66503a);
    for (i = 0; i < 64; i++) {
      var k = Math.random() * STEPS, side = i % 2 ? 1 : -1; mesh = new T.Mesh(dg, i % 3 ? rm : rm2);
      mesh.position.set(side * rnd(17.5, 22), k * SH + rnd(-0.5, 1.2), Z0 - k * SD); mesh.scale.set(rnd(1.6, 4.2), rnd(1.4, 3.6), rnd(1.6, 4)); mesh.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3)); caveG.add(mesh);
    }
    /* estalactitas y estalagmitas */
    for (i = 0; i < 70; i++) {
      var x = rnd(-58, 58), z = rnd(-78, 46), e = 1 - (x / 77) * (x / 77) - ((z + 14) / 90) * ((z + 14) / 90); if (e < 0.15) continue;
      var top = 12 + 38 * Math.sqrt(e) - 0.5, len = rnd(4, 13), up = i % 4 === 0;
      if (up && (Math.abs(x) < 24)) continue;
      if (!up && Math.abs(x) < 9 && z < -30) continue;
      mesh = new T.Mesh(new T.ConeGeometry(rnd(0.6, 1.9), len, 6), i % 2 ? rm : rm2);
      if (up) mesh.position.set(x, len / 2 - 0.6, z); else { mesh.position.set(x, top - len / 2 + 1, z); mesh.rotation.x = Math.PI; }
      caveG.add(mesh);
    }
    /* la salida: arco de luz */
    var pt = ctex(256, 336, function (c, w, h) {
      var gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.55, '#fff1c9'); gr.addColorStop(1, '#f2b869');
      c.fillStyle = gr; c.beginPath(); c.moveTo(0, h); c.lineTo(0, w / 2); c.arc(w / 2, w / 2, w / 2, Math.PI, 0); c.lineTo(w, h); c.closePath(); c.fill();
    });
    mesh = new T.Mesh(new T.PlaneGeometry(13, 17), new T.MeshBasicMaterial({ map: pt, transparent: true, fog: false })); mesh.position.set(0, TOPY + 8.1, TOPZ - 9); caveG.add(mesh);
    var col = new T.CylinderGeometry(1.1, 1.3, 15, 10), cm = new T.MeshStandardMaterial({ color: 0xb09a78, roughness: 0.9, flatShading: true });
    [-8, 8].forEach(function (cx) { var c2 = new T.Mesh(col, cm); c2.position.set(cx, TOPY + 7.1, TOPZ - 8.5); caveG.add(c2); });
    mesh = new T.Mesh(new T.BoxGeometry(20, 1.6, 3), cm); mesh.position.set(0, TOPY + 15.4, TOPZ - 8.5); caveG.add(mesh);
    for (i = 0; i < 26; i++) { mesh = new T.Mesh(dg, rm); var a = i / 25 * Math.PI, rr = 12.5 + rnd(0, 3); mesh.position.set(Math.cos(a) * rr, TOPY + 2 + Math.sin(a) * (rr + 4), TOPZ - 8 + rnd(-1, 1)); mesh.scale.set(rnd(2, 4.5), rnd(2, 4.5), rnd(2, 4)); mesh.rotation.set(rnd(0, 3), rnd(0, 3), 0); caveG.add(mesh); }
    var gt = glowTex('rgba(255,244,214,1)', 'rgba(255,196,110,.45)');
    glow1 = sprite(gt, 46, 46, 0.5); glow1.position.set(0, TOPY + 8, TOPZ - 7); caveG.add(glow1);
    glow2 = sprite(gt, 110, 90, 0.18); glow2.position.set(0, TOPY + 6, TOPZ - 4); caveG.add(glow2);
    exitPt = new T.PointLight(0xffe0a6, 1.2, 150, 1.4); exitPt.position.set(0, TOPY + 9, TOPZ + 2); caveG.add(exitPt);

    /* la hoguera */
    var fx0 = 0, fz0 = 9;
    for (i = 0; i < 10; i++) { mesh = new T.Mesh(dg, rock(0x2e241c)); var fa = i / 10 * 6.283; mesh.position.set(fx0 + Math.cos(fa) * 2, 0, fz0 + Math.sin(fa) * 2); mesh.scale.set(0.7, 0.55, 0.7); mesh.rotation.y = fa; caveG.add(mesh); }
    var ft = glowTex('rgba(255,236,170,1)', 'rgba(255,120,30,.55)');
    for (i = 0; i < 4; i++) { var fs = sprite(ft, 3, 4.6, 0.8); fs.position.set(fx0 + rnd(-0.5, 0.5), 1.5 + i * 0.5, fz0 + rnd(-0.4, 0.4)); fs.userData.b = fs.position.y; fs.userData.p = rnd(0, 6); fireSpr.push(fs); caveG.add(fs); }
    fire = new T.PointLight(0xff7a2c, 1.9, 95, 1.3); fire.position.set(fx0, 3, fz0); caveG.add(fire);

    /* la pared de las sombras */
    g = new T.PlaneGeometry(110, 46, 34, 14); p = g.attributes.position;
    for (i = 0; i < p.count; i++) p.setZ(i, nz(p.getX(i) * 0.6, p.getY(i) * 0.6, 4) * 0.42);
    g = g.toNonIndexed(); g.computeVertexNormals(); mesh = new T.Mesh(g, rock(0x7a5c3e)); mesh.rotation.y = Math.PI; mesh.position.set(0, 15, 35); caveG.add(mesh);
    ['amphora', 'temple', 'hand', 'sun', 'leaf', 'bolt', 'flame', 'amphora', 'eye'].forEach(function (name, j) {
      var c = document.createElement('canvas'); c.width = 192; c.height = 384; var tex = new T.CanvasTexture(c);
      svgImg(name, '#000', function (im) { var x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(90, 170, 12, 214); x.drawImage(im, 0, 0, 192, 192); x.filter = 'none'; tex.needsUpdate = true; });
      var mm = new T.Mesh(new T.PlaneGeometry(7, 14), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.62, depthWrite: false, color: 0x000000 }));
      mm.rotation.y = Math.PI; mm.userData = { x: 52 - j * 11.5 + rnd(-2, 2), ph: rnd(0, 6), s: rnd(0.7, 1) }; mm.scale.set(mm.userData.s, mm.userData.s, 1); shadows.push(mm); caveG.add(mm);
    });

    /* polvo en el aire */
    var n = 420, arr = new Float32Array(n * 3);
    for (i = 0; i < n; i++) { arr[i * 3] = rnd(-34, 34); arr[i * 3 + 1] = rnd(0, 40); arr[i * 3 + 2] = rnd(-60, 34); }
    g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(arr, 3));
    dust = new T.Points(g, new T.PointsMaterial({ map: glowTex('rgba(255,230,180,1)', 'rgba(255,200,120,.4)'), size: 0.5, transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false })); caveG.add(dust);
  }

  /* ---------- el exterior ---------- */
  function buildOut() {
    var g, i, mesh, p, c = new T.Color(), top = new T.Color(0x2f7fd0), hor = new T.Color(0xfde6b8);
    outG = new T.Group(); outG.position.y = OY; outG.visible = false; scene.add(outG);
    g = new T.SphereGeometry(520, 28, 14); p = g.attributes.position; var cols = [];
    for (i = 0; i < p.count; i++) { var t = Math.max(0, Math.min(1, p.getY(i) / 300)); c.copy(hor).lerp(top, Math.pow(t, 0.55)); cols.push(c.r, c.g, c.b); }
    g.setAttribute('color', new T.Float32BufferAttribute(cols, 3)); outG.add(new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, fog: false })));
    var sp = sprite(glowTex('rgba(255,255,240,1)', 'rgba(255,214,130,.5)'), 150, 150, 1); sp.position.set(-70, 60, -230); outG.add(sp);
    mesh = new T.Mesh(new T.CircleGeometry(900, 40), new T.MeshStandardMaterial({ color: 0x2c7fae, roughness: 0.3, metalness: 0.25 })); mesh.rotation.x = -Math.PI / 2; mesh.position.y = -7; outG.add(mesh);
    var marble = new T.MeshStandardMaterial({ color: 0xd9c8a6, roughness: 0.85 }), marbleF = new T.MeshStandardMaterial({ color: 0xd4c29e, roughness: 0.85, flatShading: true }), floorM = new T.MeshStandardMaterial({ color: 0xb9a57f, roughness: 0.95 });
    mesh = new T.Mesh(new T.CylinderGeometry(27, 30, 7, 56), floorM); mesh.position.y = -3.5; outG.add(mesh);
    for (i = 0; i < 3; i++) { mesh = new T.Mesh(new T.BoxGeometry(30 - i * 1.6, 0.6, 12 - i * 1.4), marble); mesh.position.set(0, 0.3 + i * 0.6, -14); outG.add(mesh); }
    for (i = 0; i < 6; i++) {
      mesh = new T.Mesh(new T.CylinderGeometry(0.85, 1.02, 11, 14), marbleF); mesh.position.set(-11 + i * 4.4, 7.3, -11.2); outG.add(mesh);
      mesh = new T.Mesh(new T.BoxGeometry(2.3, 0.5, 2.3), marble); mesh.position.set(-11 + i * 4.4, 13, -11.2); outG.add(mesh);
    }
    mesh = new T.Mesh(new T.BoxGeometry(26, 1.5, 4.4), marble); mesh.position.set(0, 14, -12.2); outG.add(mesh);
    var sh = new T.Shape(); sh.moveTo(-13.6, 0); sh.lineTo(13.6, 0); sh.lineTo(0, 4.4); sh.closePath();
    mesh = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 4.4, bevelEnabled: false }), marble); mesh.position.set(0, 14.75, -14.4); outG.add(mesh);
    mesh = new T.Mesh(new T.BoxGeometry(24, 12, 1), new T.MeshStandardMaterial({ color: 0xd9c9a8, roughness: 0.9 })); mesh.position.set(0, 7.5, -16.6); outG.add(mesh);
    [[0, 4.6], [-5.4, 3.2], [5.4, 2.2]].forEach(function (d) { mesh = new T.Mesh(new T.BoxGeometry(4.2, d[1], 4.2), marble); mesh.position.set(d[0], d[1] / 2, 4); outG.add(mesh); var cap = new T.Mesh(new T.BoxGeometry(4.8, 0.4, 4.8), marble); cap.position.set(d[0], d[1] + 0.2, 4); outG.add(cap); plinths.push({ x: d[0], y: d[1] + 0.4 }); });
    sun = new T.DirectionalLight(0xfff0d2, 0.95); sun.position.set(-55, OY + 60, 45); sun.target.position.set(0, OY, 0); sun.visible = false; scene.add(sun); scene.add(sun.target);
    hemi = new T.HemisphereLight(0xbfdcff, 0x8a7350, 0.42); hemi.visible = false; scene.add(hemi);
  }

  /* ---------- monedas de equipo ---------- */
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
  S.setMode = function (m, st) { if (!S.on) return; if (m !== mode && (m === 'out' || mode === 'out')) snapCam = true; mode = m; stage = st || 1; };
  S.flare = function () { flare = 1; };
  S.project = function (kind, i) {
    var o = kind === 'pod' ? podCoins[i] : (coins[i] && coins[i].m); if (!o || !cam) return null;
    o.getWorldPosition(V); V.y -= 2.4 * o.scale.x + (kind === 'pod' ? 0.2 : 0.3); V.project(cam);
    return { x: (V.x * 0.5 + 0.5) * window.innerWidth, y: (-V.y * 0.5 + 0.5) * window.innerHeight };
  };

  /* ---------- bucle ---------- */
  function targets() {
    var f = Math.min(1, (stage - 1) / 6);
    if (mode === 'lobby') { tPos.set(Math.sin(tm * 0.11) * 1.5, 4.2, 7); tLook.set(0, 10, 34); }
    else if (mode === 'scores') { tPos.set(Math.sin(tm * 0.15) * 1.2, 18, 41); tLook.set(0, 11.5, -16); }
    else if (mode === 'out') { var a = Math.sin(tm * 0.1) * 0.55; tPos.set(Math.sin(a) * 27, OY + 6.5, 5 + Math.cos(a) * 27); tLook.set(0, OY + 5.4, -2); }
    else { tPos.set(Math.sin(tm * 0.13) * 1.8, 7.5 + f * 5, 36 - f * 9); tLook.set(0, 12 + f * 7, -34); }
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!S.on || document.hidden) { lastT = now; return; }
    var dt = Math.min(0.1, (now - lastT) / 1000 || 0.016), i, k; lastT = now; tm += dt;
    var out = mode === 'out';
    if (outG.visible !== out) { outG.visible = out; caveG.visible = !out; sun.visible = hemi.visible = out; scene.fog = out ? fogOut : fogCave; R.setClearColor(out ? 0xcfe0ea : 0x0d0906); }
    targets();
    var dx = tLook.x - tPos.x, dy = tLook.y - tPos.y, dz = tLook.z - tPos.z, ty = Math.atan2(dx, dz), tp = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));
    if (snapCam) { pos.copy(tPos); yaw = ty; pitch = tp; snapCam = false; }
    else { var kk = 1 - Math.exp(-dt * 1.5), d = ty - yaw; while (d > Math.PI) d -= 6.2832; while (d < -Math.PI) d += 6.2832; pos.lerp(tPos, kk); yaw += d * kk; pitch += (tp - pitch) * kk; }
    cam.position.copy(pos); V.set(pos.x + Math.sin(yaw) * Math.cos(pitch), pos.y + Math.sin(pitch), pos.z + Math.cos(yaw) * Math.cos(pitch)); cam.lookAt(V);

    if (!out) {
      var tl = mode === 'lobby' ? 0 : Math.min(1, stage / 6); lum += (tl - lum) * Math.min(1, dt * 0.8); flare *= Math.exp(-dt * 2.2);
      var fl = 0.82 + Math.sin(tm * 11) * 0.07 + Math.sin(tm * 23.7) * 0.05 + Math.sin(tm * 5.3) * 0.06;
      fire.intensity = (1.9 + flare * 2.4) * fl; fire.position.x = Math.sin(tm * 7) * 0.25;
      exitPt.intensity = 0.7 + lum * 2.3; amb.intensity = 0.26 + lum * 0.45; glow1.material.opacity = 0.42 + lum * 0.5; glow2.material.opacity = 0.1 + lum * 0.3;
      for (i = 0; i < fireSpr.length; i++) { var s = fireSpr[i]; s.position.y = s.userData.b + Math.sin(tm * 9 + s.userData.p) * 0.25; var sc = (1 + Math.sin(tm * 13 + s.userData.p * 2) * 0.18) * (1 + flare * 0.9); s.scale.set(3 * sc, 4.6 * sc, 1); }
      for (i = 0; i < shadows.length; i++) { var m = shadows[i], u = m.userData; u.x -= dt * 2.4; if (u.x < -52) u.x += 104; m.position.set(u.x, 8 + Math.sin(tm * 1.7 + u.ph) * 0.7 + Math.sin(tm * 9 + u.ph) * 0.06 * fl, 32.7); m.material.opacity = 0.5 + fl * 0.14; }
      var dp = dust.geometry.attributes.position; for (i = 0; i < dp.count; i += 3) { var y = dp.getY(i) + dt * 0.5; dp.setY(i, y > 40 ? 0 : y); } dp.needsUpdate = true; dust.rotation.y = Math.sin(tm * 0.05) * 0.05;
      for (k = 0; k < coins.length; k++) {
        var c = coins[k], dd = c.t - c.p, mv = Math.abs(dd) > 0.002; if (mv) c.p += dd * Math.min(1, dt * 1.1) + Math.sign(dd) * Math.min(Math.abs(dd), dt * 0.02);
        var st = 1 + c.p * (STEPS - 4), hop = mv ? Math.abs(Math.sin(st * Math.PI)) * 1.1 : 0;
        var cs = c.m.scale.x + ((mode === 'scores' ? 1 : 0.62) - c.m.scale.x) * Math.min(1, dt * 2); c.m.scale.set(cs, cs, cs);
        c.m.position.set(c.x, st * SH + 2.4 * cs - 0.2 + hop + Math.sin(tm * 1.6 + c.ph) * 0.12, Z0 - st * SD + 0.4); c.m.rotation.y = mv ? Math.sin(tm * 6 + c.ph) * 0.5 : Math.sin(tm * 0.9 + c.ph) * 0.22;
      }
    } else {
      for (i = 0; i < podCoins.length; i++) { podCoins[i].rotation.y = Math.sin(tm * 1.1 + i) * 0.6; podCoins[i].position.y = plinths[podCoins[i].userData.j].y + 2.2 + Math.sin(tm * 1.8 + i) * 0.15; }
    }
    R.render(scene, cam);
    if (S.onFrame) S.onFrame();
    /* calidad adaptativa: si va lento, baja resolución; si aun así no puede, se apaga */
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
    document.body.classList.toggle('g3d', S.on); if (S.on) { fps.bad = 0; snapCam = true; }
    if (S.onChange) S.onChange(S.on); return S.on;
  };
  S.init = function (canvas) {
    if (!T || S.off) return false;
    try {
      cv = canvas; R = new T.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
      fps.pr = Math.min(window.devicePixelRatio || 1, 1.5); R.setPixelRatio(fps.pr); R.outputEncoding = T.sRGBEncoding; R.setClearColor(0x0d0906);
      scene = new T.Scene(); scene.fog = fogCave; cam = new T.PerspectiveCamera(50, 1.78, 0.5, 1400);
      amb = new T.AmbientLight(0x6a4a34, 0.45); scene.add(amb);
      buildCave(); buildOut(); size(); window.addEventListener('resize', size);
      cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); S.toggle(false); });
      S.on = true; document.body.classList.add('g3d'); raf = requestAnimationFrame(frame); return true;
    } catch (e) { S.on = false; if (canvas) canvas.style.display = 'none'; return false; }
  };
})();
