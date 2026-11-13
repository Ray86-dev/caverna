/* Iconos dibujados a medida (SVG), al estilo de los motivos de la cerámica griega. */
(function () {
  var i, rays = '', P = {
    flame: '<path d="M25 3c2 9 12 13 12 25a13 13 0 0 1-26 0c0-6 3-9 6-13 0 5 2 7 4 7 2-6 0-12 4-19z"/>',
    drop: '<path d="M24 3c8 11 14 18 14 27a14 14 0 0 1-28 0c0-9 6-16 14-27z"/>',
    wind: '<path class="s" d="M5 17h23a6 6 0 1 0-6-6M5 26h32a6 6 0 1 1-6 6M5 35h15a5 5 0 1 1-5 5"/>',
    leaf: '<path class="s" d="M24 45V12"/><ellipse cx="24" cy="8" rx="4" ry="6.5"/><ellipse cx="15" cy="17" rx="4" ry="8" transform="rotate(-38 15 17)"/><ellipse cx="33" cy="17" rx="4" ry="8" transform="rotate(38 33 17)"/><ellipse cx="14" cy="30" rx="4" ry="8" transform="rotate(-42 14 30)"/><ellipse cx="34" cy="30" rx="4" ry="8" transform="rotate(42 34 30)"/>',
    atom: '<g class="s3"><ellipse cx="24" cy="24" rx="21" ry="8"/><ellipse cx="24" cy="24" rx="21" ry="8" transform="rotate(60 24 24)"/><ellipse cx="24" cy="24" rx="21" ry="8" transform="rotate(120 24 24)"/></g><circle cx="24" cy="24" r="4.5"/>',
    bolt: '<path d="M29 2 9 27h12l-4 19 22-27H27z"/>',
    duel: '<path class="s" d="M10 40 38 10M38 40 10 10"/><path d="M44 4l-12 2 10 10zM4 4l2 12L16 6z"/>',
    hand: '<path d="M13 27V13a3 3 0 0 1 6 0v9h1.500V7a3 3 0 0 1 6 0v15H28V10a3 3 0 0 1 6 0v14h1.500v-7a3 3 0 0 1 6 0v14c0 9-6 15-14 15h-3c-6 0-9-3-12-8L7 31a3 3 0 0 1 5-3.400z"/>',
    eye: '<path fill-rule="evenodd" d="M2 24c6-11 13-15 22-15s16 4 22 15c-6 11-13 15-22 15S8 35 2 24zm22-10a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><circle cx="24" cy="24" r="5"/>',
    temple: '<path d="M24 3 45 15H3z"/><path d="M5 18h38v3H5zM8 23h5v15H8zM17 23h5v15h-5zM26 23h5v15h-5zM35 23h5v15h-5zM3 40h42v5H3z"/>',
    phone: '<path fill-rule="evenodd" d="M15 2h18a4 4 0 0 1 4 4v36a4 4 0 0 1-4 4H15a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4zm1 6v28h16V8zm8 31a2.200 2.200 0 1 0 0 4.400 2.200 2.200 0 0 0 0-4.400z"/>',
    check: '<path class="s" d="M8 26l11 11 21-25"/>',
    cross: '<path class="s" d="M11 11l26 26M37 11 11 37"/>',
    glass: '<path fill-rule="evenodd" d="M9 3h30v5h-3c0 8-4 12-8 16 4 4 8 8 8 16h3v5H9v-5h3c0-8 4-12 8-16-4-4-8-8-8-16H9zm8 5c0 5 3 8 7 12 4-4 7-7 7-12z"/>',
    amphora: '<path d="M18 2h12v3h-2v6c1.500.700 2.600 1.800 3.400 3.200C37 15 40 22 40 28c0 7-5 12.500-10.500 14.500L31 45h3v2H14v-2h3l1.500-2.500C13 40.500 8 35 8 28c0-6 3-13 8.600-13.800.800-1.400 1.900-2.500 3.400-3.200V5h-2z"/>',
    lens: '<circle class="s" cx="20" cy="20" r="13"/><path class="s" d="M30 30l13 13"/>',
    coin: '<path fill-rule="evenodd" d="M24 3a21 21 0 1 0 0 42 21 21 0 0 0 0-42zm0 6a15 15 0 1 1 0 30 15 15 0 0 1 0-30z"/><path d="M21 15h6v18h-6z"/>',
    sphere: '<circle cx="24" cy="24" r="20"/>',
    ask: '<path d="M16 16c0-6 4-9 9-9s9 3 9 8c0 8-8 8-8 15h-5c0-9 7-10 7-15 0-2-1-3-3-3s-4 1-4 4zm5 19h6v6h-6z"/>',
    star: '<path d="M24 3l6 14 15 1-12 10 4 15-13-8-13 8 4-15L3 18l15-1z"/>',
    scroll: '<path fill-rule="evenodd" d="M12 5h26a5 5 0 0 1 0 10h-2v28H10V10a5 5 0 0 1 2-5zm4 14v3h14v-3zm0 8v3h14v-3zm0 8v3h9v-3z"/>'
  };
  for (i = 0; i < 12; i++) rays += '<path d="M24 1l3.200 9h-6.400z" transform="rotate(' + i * 30 + ' 24 24)"/>';
  P.sun = '<circle cx="24" cy="24" r="10"/>' + rays;

  function ic(name, cls) { return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 48 48" aria-hidden="true">' + (P[name] || P.sphere).replace(/(\d)\.(\d)00/g, '$1.$2') + '</svg>'; }
  function coin(name, color, cls) { return '<span class="coin' + (cls ? ' ' + cls : '') + '" style="--tc:' + color + '">' + ic(name) + '</span>'; }
  function laurel() {
    var h = '', k, s, a, x, y;
    for (s = -1; s <= 1; s += 2) for (k = 0; k < 9; k++) {
      a = (18 + k * 17) * Math.PI / 180; x = 100 + s * 84 * Math.sin(a); y = 100 + 84 * Math.cos(a);
      h += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="6" ry="16" transform="rotate(' + (s * (112 - (18 + k * 17))).toFixed(0) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"/>';
    }
    return '<svg class="laurel" viewBox="0 0 200 200" aria-hidden="true" fill="currentColor"><path d="M40 176q60 22 120 0" fill="none" stroke="currentColor" stroke-width="4"/>' + h + '</svg>';
  }
  window.Art = { ic: ic, coin: coin, laurel: laurel, raw: function (name) { return (P[name] || P.sphere).replace(/(\d)\.(\d)00/g, '$1.$2'); } };
})();
