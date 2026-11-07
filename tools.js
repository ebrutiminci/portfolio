/* MODIFY: a tiny AutoCAD-style toolbar for the sheets on the home board (desktop only).
   MOVE, STRETCH (resize the width, the sheet reflows like on a phone), ROTATE, MIRROR, RESTORE. */
(function () {
  var wrap = document.querySelector('main.wrap');
  if (!wrap || document.documentElement.classList.contains('is-layout')) return;
  var sheets = Array.prototype.slice.call(wrap.querySelectorAll(':scope > .sheet'));
  if (!sheets.length) return;
  var wide = window.matchMedia('(min-width: 1024px)');

  var ICON = {
    move: '<path d="M10 2v16M2 10h16M10 2 7.5 4.5M10 2l2.5 2.5M10 18l-2.5-2.5M10 18l2.5-2.5M2 10l2.5-2.5M2 10l2.5 2.5M18 10l-2.5-2.5M18 10l-2.5 2.5"/>',
    stretch: '<path d="M2.5 5h8v10h-8z" stroke-dasharray="2 1.6"/><path d="M10.5 10h7M15 7.5l2.5 2.5-2.5 2.5"/>',
    rotate: '<path d="M16 10a6 6 0 1 1-1.8-4.3"/><path d="M15.5 2.5v3.6h-3.6"/><path d="M7 13l3-6 3 6z"/>',
    mirror: '<path d="M10 2v16" stroke-dasharray="2 1.6"/><path d="M7.5 5 2.5 15h5z"/><path d="M12.5 5l5 10h-5z"/>',
    restore: '<path d="M4 7h8a4.5 4.5 0 0 1 0 9H7"/><path d="M4 7l3-3M4 7l3 3"/>',
    close: '<path d="M5 5l10 10M15 5 5 15"/>'
  };
  var TOOLS = [
    ['move', 'Move', 'M', 'Drag a sheet to move it. Sheets can overlap; the one you pick comes to the front.'],
    ['stretch', 'Stretch', 'S', 'Drag a corner grip. The sheet reflows like a phone or a tablet screen.'],
    ['rotate', 'Rotate', 'RO', 'Drag around a sheet to rotate it. Snaps every 15°, hold Shift for free.'],
    ['mirror', 'Mirror', 'MI', 'Click a sheet to mirror it. Click again to flip it back.']
  ];
  function svg(k) { return '<svg viewBox="0 0 20 20" aria-hidden="true">' + ICON[k] + '</svg>'; }

  var pal = document.createElement('div');
  pal.className = 'bp-tools'; pal.hidden = true; pal.setAttribute('role', 'toolbar'); pal.setAttribute('aria-label', 'Modify the sheets');
  pal.innerHTML = '<p class="bp-title">Modify</p>' +
    TOOLS.map(function (t) {
      return '<button type="button" class="bp-btn" data-tool="' + t[0] + '" title="' + t[1] + ' (' + t[2] + ')">' + svg(t[0]) + '<span>' + t[1] + '</span><kbd>' + t[2] + '</kbd></button>';
    }).join('') +
    '<hr><button type="button" class="bp-btn bp-restore" title="Put every sheet back">' + svg('restore') + '<span>Restore</span></button>' +
    '<button type="button" class="bp-btn bp-close" title="Restore and close the toolbar">' + svg('close') + '<span>Close</span></button>' +
    '<p class="bp-prompt" aria-live="polite"></p>';
  document.body.appendChild(pal);
  var prompt = pal.querySelector('.bp-prompt');

  var toggle = document.createElement('button');
  toggle.type = 'button'; toggle.className = 'sb-modify'; toggle.textContent = 'MODIFY'; toggle.title = 'Move, stretch, rotate and mirror the sheets';
  var bar = document.querySelector('.statusbar');
  if (bar) bar.insertBefore(toggle, bar.querySelector('.sb-mode'));

  var legend = wrap.querySelector(':scope > .legend');
  var tryBtn = document.createElement('button');
  tryBtn.type = 'button'; tryBtn.className = 'bp-try';
  tryBtn.innerHTML = svg('stretch') + '<span>Try MODIFY: move, stretch, rotate the sheets</span>';
  if (legend) legend.appendChild(tryBtn);

  var on = false, tool = 'move', order = sheets.slice(), st = new Map(), holders = [];

  function apply(s) {
    var o = st.get(s);
    s.style.left = o.x + 'px'; s.style.top = o.y + 'px'; s.style.width = o.w + 'px';
    s.style.transform = 'rotate(' + o.r + 'deg) scaleX(' + (o.f ? -1 : 1) + ')';
    s.classList.toggle('bp-narrow', o.w < 640);
    s.classList.toggle('bp-tiny', o.w < 460);
  }
  function stack() { order.forEach(function (s, i) { s.style.zIndex = 10 + i; }); }
  function front(s) { order.splice(order.indexOf(s), 1); order.push(s); stack(); }

  function enter() {
    if (on || !wide.matches) return;
    on = true;
    var wr = wrap.getBoundingClientRect();
    var rects = sheets.map(function (s) { return s.getBoundingClientRect(); });
    document.documentElement.classList.add('bp-edit');
    sheets.forEach(function (s, i) {
      var r = rects[i];
      var h = document.createElement('div'); h.className = 'bp-holder'; h.style.height = r.height + 'px';
      s.parentNode.insertBefore(h, s); holders.push(h);
      var o = { x: r.left - wr.left, y: r.top - wr.top, w: r.width, r: 0, f: false };
      o.home = { x: o.x, y: o.y, w: o.w };
      st.set(s, o);
      var skin = document.createElement('div'); skin.className = 'bp-skin';
      skin.innerHTML = '<i class="bp-g" data-c="nw"></i><i class="bp-g" data-c="ne"></i><i class="bp-g" data-c="sw"></i><i class="bp-g" data-c="se"></i><b class="bp-ang"></b>';
      s.appendChild(skin);
      skin.addEventListener('pointerdown', down);
      apply(s);
    });
    stack();
    pal.hidden = false; toggle.classList.add('on'); toggle.setAttribute('aria-pressed', 'true');
    pick(tool);
  }
  function leave() {
    if (!on) return;
    on = false;
    sheets.forEach(function (s) {
      var k = s.querySelector('.bp-skin'); if (k) k.remove();
      ['left', 'top', 'width', 'transform', 'zIndex'].forEach(function (p) { s.style[p] = ''; });
      s.classList.remove('bp-narrow', 'bp-tiny', 'bp-anim');
    });
    holders.forEach(function (h) { h.remove(); }); holders = [];
    document.documentElement.classList.remove('bp-edit');
    pal.hidden = true; toggle.classList.remove('on'); toggle.setAttribute('aria-pressed', 'false');
  }
  function restore(then) {
    if (!on) return;
    sheets.forEach(function (s) {
      var o = st.get(s);
      s.classList.add('bp-anim');
      o.x = o.home.x; o.y = o.home.y; o.w = o.home.w; o.r = 0; o.f = false;
      apply(s);
    });
    order = sheets.slice(); stack();
    say('Restored. Every sheet is back in its place.');
    setTimeout(function () { sheets.forEach(function (s) { s.classList.remove('bp-anim'); }); if (then) then(); }, 520);
  }
  function pick(t) {
    tool = t;
    document.documentElement.setAttribute('data-bp-tool', t);
    pal.querySelectorAll('[data-tool]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.tool === t ? 'true' : 'false'); });
    var d = TOOLS.filter(function (x) { return x[0] === t; })[0];
    say(d[1].toUpperCase() + '  ' + d[3]);
  }
  function say(t) { prompt.textContent = t; }

  var drag = null;
  function down(e) {
    if (e.button !== 0) return;
    var s = e.currentTarget.parentNode, o = st.get(s);
    e.preventDefault();
    front(s);
    if (tool === 'mirror') { s.classList.add('bp-anim'); o.f = !o.f; apply(s); setTimeout(function () { s.classList.remove('bp-anim'); }, 420); return; }
    var c = e.target.dataset && e.target.dataset.c;
    if (tool === 'stretch' && !c) { say('STRETCH  Grab one of the blue corner grips.'); return; }
    var r = s.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    drag = { s: s, o: o, c: c, x0: e.clientX, y0: e.clientY, ox: o.x, oy: o.y, ow: o.w, or: o.r,
      a0: Math.atan2(e.clientY - cy, e.clientX - cx), cx: cx, cy: cy };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.addEventListener('pointermove', move);
    e.currentTarget.addEventListener('pointerup', up);
    e.currentTarget.addEventListener('pointercancel', up);
    s.classList.add('bp-active');
  }
  function move(e) {
    if (!drag) return;
    var d = drag, o = d.o, dx = e.clientX - d.x0, dy = e.clientY - d.y0;
    if (tool === 'move') { o.x = d.ox + dx; o.y = d.oy + dy; }
    else if (tool === 'stretch') {
      var rad = d.or * Math.PI / 180, lx = dx * Math.cos(rad) + dy * Math.sin(rad);
      if (o.f) lx = -lx;
      var west = d.c === 'nw' || d.c === 'sw';
      var w = Math.max(320, Math.min(1500, d.ow + (west ? -lx : lx)));
      o.w = w;
      // keep the opposite edge where it was (for an unrotated sheet)
      o.x = west ? d.ox + (d.ow - w) : d.ox;
      d.s.querySelector('.bp-ang').textContent = Math.round(w) + ' px';
    }
    else if (tool === 'rotate') {
      var a = Math.atan2(e.clientY - d.cy, e.clientX - d.cx), deg = d.or + (a - d.a0) * 180 / Math.PI;
      if (!e.shiftKey) deg = Math.round(deg / 15) * 15;
      deg = ((deg % 360) + 540) % 360 - 180;
      o.r = deg;
      d.s.querySelector('.bp-ang').textContent = Math.round(deg) + '°';
    }
    apply(d.s);
  }
  function up(e) {
    if (!drag) return;
    var k = e.currentTarget;
    k.removeEventListener('pointermove', move); k.removeEventListener('pointerup', up); k.removeEventListener('pointercancel', up);
    drag.s.classList.remove('bp-active');
    drag = null;
  }

  pal.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tool) pick(b.dataset.tool);
    else if (b.classList.contains('bp-restore')) restore();
    else if (b.classList.contains('bp-close')) restore(leave);
  });
  toggle.addEventListener('click', function () { if (on) restore(leave); else enter(); });
  tryBtn.addEventListener('click', function () { enter(); pal.querySelector('[data-tool="move"]').focus(); });
  window.addEventListener('resize', function () { if (on) leave(); });
  function sync() { toggle.hidden = !wide.matches; tryBtn.hidden = !wide.matches; if (!wide.matches) leave(); }
  if (wide.addEventListener) wide.addEventListener('change', sync); sync();

  window.BPTools = {
    cmd: function (t) {
      if (!wide.matches) return 'MODIFY works on a wider screen.';
      if (t === 'modify') { if (on) restore(leave); else enter(); return on ? 'MODIFY on. Pick a tool on the left.' : 'MODIFY closed.'; }
      if (t === 'restore') { restore(); return 'Restored.'; }
      enter(); pick(t); return t.toUpperCase() + ': ' + TOOLS.filter(function (x) { return x[0] === t; })[0][3];
    }
  };
})();
