/* Top ribbon (desktop): MODIFY tools for the home board sheets, and VIEW tools on every page.
   MOVE, STRETCH (the sheet reflows like a phone screen), ROTATE, MIRROR, RESTORE.
   AutoCAD hot grips: click a corner grip, Enter cycles Stretch > Move > Rotate > Mirror, click to place, Esc cancels.
   The arrangement is saved in this browser and comes back on the next visit. */
(function () {
  var wide = window.matchMedia('(min-width: 1024px)');
  var html = document.documentElement;
  var wrap = document.querySelector('main.wrap');
  var board = !!wrap && !html.classList.contains('is-layout');
  var sheets = board ? Array.prototype.slice.call(wrap.querySelectorAll(':scope > .cover, :scope > .sheet')) : [];
  if (!sheets.length) board = false;
  var KEY = 'ebru-board-v2', TIP = 'ebru-board-tip';
  function store(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  var ICON = {
    select: '<path d="M5 3l10 6.5-4.2 1.1L13.5 16l-2 1-2.7-5.4L5.5 14.5z"/>',
    move: '<path d="M10 2v16M2 10h16M10 2 7.5 4.5M10 2l2.5 2.5M10 18l-2.5-2.5M10 18l2.5-2.5M2 10l2.5-2.5M2 10l2.5 2.5M18 10l-2.5-2.5M18 10l-2.5 2.5"/>',
    stretch: '<path d="M2.5 5h8v10h-8z" stroke-dasharray="2 1.6"/><path d="M10.5 10h7M15 7.5l2.5 2.5-2.5 2.5"/>',
    rotate: '<path d="M16 10a6 6 0 1 1-1.8-4.3"/><path d="M15.5 2.5v3.6h-3.6"/><path d="M7 13l3-6 3 6z"/>',
    mirror: '<path d="M10 2v16" stroke-dasharray="2 1.6"/><path d="M7.5 5 2.5 15h5z"/><path d="M12.5 5l5 10h-5z"/>',
    restore: '<path d="M4 7h8a4.5 4.5 0 0 1 0 9H7"/><path d="M4 7l3-3M4 7l3 3"/>',
    zoom: '<circle cx="8.5" cy="8.5" r="5.5"/><path d="M12.5 12.5 18 18M8.5 6v5M6 8.5h5"/>',
    layiso: '<path d="M10 3 2 7l8 4 8-4z"/><path d="M2 10.5l8 4 8-4" stroke-dasharray="2 1.6"/><path d="M2 14l8 4 8-4" stroke-dasharray="2 1.6"/>',
    layuniso: '<path d="M10 3 2 7l8 4 8-4z"/><path d="M2 10.5l8 4 8-4M2 14l8 4 8-4"/>',
    grid: '<path d="M2 2h16v16H2zM2 7.3h16M2 12.7h16M7.3 2v16M12.7 2v16"/>'
  };
  var MOD = [
    ['select', 'Select', 'Esc', 'SELECT  Sheets work as normal: open links, read, scroll.'],
    ['move', 'Move', 'M', 'MOVE  Drag a sheet. Sheets can overlap; the one you pick comes to the front.'],
    ['stretch', 'Stretch', 'S', 'STRETCH  Drag a corner grip. The sheet reflows like a phone or a tablet screen.'],
    ['rotate', 'Rotate', 'RO', 'ROTATE  Drag around a sheet. Snaps every 15°, hold Shift for free.'],
    ['mirror', 'Mirror', 'MI', 'MIRROR  Select a sheet, then pick two points for the mirror line. Enter flips it in place.']
  ];
  function svg(k) { return '<svg viewBox="0 0 20 20" aria-hidden="true">' + ICON[k] + '</svg>'; }
  function btn(k, label, key, extra, big) {
    return '<button type="button" class="rb-btn' + (big ? ' rb-big' : '') + (extra || '') + '" data-k="' + k + '" title="' + label + (key ? ' (' + key + ')' : '') + '">' + svg(k) + '<span>' + label + '</span></button>';
  }
  ICON.help = '<circle cx="10" cy="10" r="7.5"/><path d="M7.6 7.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.6"/><circle cx="10" cy="14.6" r=".4"/>';
  ICON.bulb = '<path d="M7 13.5a5 5 0 1 1 6 0V15H7z"/><path d="M7.5 17h5"/>';
  function panel(label, body, cls) { return '<section class="rb-panel' + (cls ? ' ' + cls : '') + '"><div class="rb-body">' + body + '</div><h6>' + label + '</h6></section>'; }
  var HELP = '<span class="rb-menu rb-help" hidden>' +
      (board ? '<p><b>Grips</b> Hover a sheet: blue squares sit on its corners. Drag one to stretch. Click one so it turns red, then <kbd>Enter</kbd> cycles Stretch, Move, Rotate, Mirror. Click to place, <kbd>Esc</kbd> to cancel.</p><p><b>Mirror</b> Select a sheet, then click two points for the mirror line (15° snaps, <kbd>Shift</kbd> for free). <kbd>Enter</kbd> flips it in place.</p>' +
      '<p><b>Modify</b> Move <kbd>M</kbd>, Stretch <kbd>S</kbd>, Rotate <kbd>RO</kbd>, Mirror <kbd>MI</kbd>. Restore puts every sheet back. Your layout is saved in this browser.</p>' : '') +
      '<p><b>Layers</b> Each sheet is drawn on the steps of my method. Pick one to isolate it; Layuniso shows all again.</p>' +
      '<p><b>View</b> Zoom enlarges the drawing nearest the centre. Grid turns the blueprint grid on and off.</p>' +
      '<p><b>Command line</b> Type at the bottom: EMAIL, CV, CASE, THESIS, APP, BUS, LINKEDIN, GITHUB.</p></span>';

  // ---------- Ribbon ----------
  var rb = document.createElement('div');
  rb.className = 'ribbon'; rb.setAttribute('role', 'toolbar'); rb.setAttribute('aria-label', 'Drawing tools');
  rb.innerHTML =
    (board ? panel('Modify', btn('move', 'Move', 'M') + btn('rotate', 'Rotate', 'RO') + btn('mirror', 'Mirror', 'MI') +
      btn('stretch', 'Stretch', 'S') + btn('select', 'Select', 'Esc') + btn('restore', 'Restore', '', ' rb-restore'), 'rb-mod') : '') +
    panel('Layers', '<span class="rb-drop"><button type="button" class="rb-layer" data-k="layiso" title="Isolate one layer">' + svg('bulb') +
      '<i class="rb-sw"></i><span class="rb-lname">All layers</span><em>▾</em></button><span class="rb-menu rb-lmenu" hidden></span></span>' +
      '<span class="rb-row">' + btn('layiso', 'Layiso', '') + btn('layuniso', 'Layuniso', '') + '</span>', 'rb-lay') +
    panel('View', btn('zoom', 'Zoom', 'Z', '', true) + btn('grid', 'Grid', '', ' on', true)) +
    panel('Help', '<span class="rb-drop">' + btn('help', 'Help', 'F1', '', true) + HELP + '</span>') +
    panel('Command', '<p class="rb-prompt" aria-live="polite"></p>', 'rb-cmdp') +
    '<button type="button" class="rb-x" title="Close the toolbar" aria-label="Close the toolbar">×</button>';
  document.body.appendChild(rb);
  var reopen = document.createElement('button');
  reopen.type = 'button'; reopen.className = 'rb-open'; reopen.textContent = 'Tools ▾'; reopen.title = 'Show the toolbar';
  document.body.appendChild(reopen);
  function closed(v) {
    html.classList.toggle('rb-closed', v);
    store('ebru-ribbon-open', v ? null : '1');
  }
  rb.querySelector('.rb-x').addEventListener('click', function () { closed(true); });
  reopen.addEventListener('click', function () { closed(false); });
  if (!load('ebru-ribbon-open')) html.classList.add('rb-closed');   // starts closed; Tools opens it
  var prompt = rb.querySelector('.rb-prompt'), menu = rb.querySelector('.rb-lmenu'), help = rb.querySelector('.rb-help'), lname = rb.querySelector('.rb-lname');
  function say(t, hot) { prompt.textContent = t; prompt.classList.toggle('hot', !!hot); }
  function run(c) { if (window.BP) window.BP.run(c); }

  function fill() {
    var L = (window.BP && window.BP.layers) || [];
    menu.innerHTML = L.map(function (l) { return '<button type="button" data-l="' + l + '">' + l + '</button>'; }).join('');
  }
  rb.addEventListener('click', function (e) {
    var l = e.target.closest('[data-l]');
    if (l) { run('LAYISO ' + l.dataset.l); lname.textContent = l.dataset.l.charAt(0) + l.dataset.l.slice(1).toLowerCase(); rb.querySelector('.rb-layer').classList.add('iso'); menu.hidden = true; return; }
    var b = e.target.closest('.rb-btn, .rb-layer'); if (!b) return;
    var k = b.dataset.k;
    if (k === 'zoom') run('ZOOM');
    else if (k === 'layiso') { fill(); help.hidden = true; menu.hidden = !menu.hidden; }
    else if (k === 'help') { menu.hidden = true; help.hidden = !help.hidden; }
    else if (k === 'layuniso') { run('LAYUNISO'); lname.textContent = 'All layers'; rb.querySelector('.rb-layer').classList.remove('iso'); }
    else if (k === 'grid') { var g = window.BP && window.BP.grid(); b.classList.toggle('on', !!g); }
    else if (k === 'restore') restore();
    else pick(k);
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.rb-drop')) { menu.hidden = true; help.hidden = true; } });
  document.addEventListener('keydown', function (e) { if (e.key === 'F1' && wide.matches) { e.preventDefault(); help.hidden = !help.hidden; } });

  function sync() {
    rb.hidden = !wide.matches;
    html.classList.toggle('has-ribbon', wide.matches);
    if (!wide.matches && on) leave();
  }
  if (wide.addEventListener) wide.addEventListener('change', sync);
  sync();
  say(board ? 'Hover a sheet and drag a corner grip, or pick a Modify tool.' : 'Zoom into a drawing, or isolate one layer of the method.');

  if (!board) { window.BPTools = { cmd: function () { return 'Modify works on the home board.'; } }; return; }

  // ---------- Board editing ----------
  var on = false, tool = 'select', order = sheets.slice(), st = new Map(), holders = [], used = 0;

  sheets.forEach(function (s) {
    var skin = document.createElement('div'); skin.className = 'bp-skin';
    skin.innerHTML = '<i class="bp-g" data-c="nw"></i><i class="bp-g" data-c="ne"></i><i class="bp-g" data-c="sw"></i><i class="bp-g" data-c="se"></i><b class="bp-ang"></b>';
    s.appendChild(skin);
    skin.addEventListener('pointerdown', down);
  });
  function apply(s) {
    var o = st.get(s);
    s.style.left = o.x + 'px'; s.style.top = o.y + 'px'; s.style.width = o.w + 'px';
    s.style.transform = 'rotate(' + o.r + 'deg) scaleX(' + (o.f ? -1 : 1) + ')';
    s.classList.toggle('bp-narrow', o.w < 640);
    s.classList.toggle('bp-tiny', o.w < 460);
  }
  function stack() { order.forEach(function (s, i) { s.style.zIndex = 10 + i; }); }
  function front(s) { order.splice(order.indexOf(s), 1); order.push(s); stack(); }
  function save() {
    used++;
    store(KEY, JSON.stringify({
      s: sheets.map(function (s) { var o = st.get(s); return [Math.round(o.x), Math.round(o.y), Math.round(o.w), Math.round(o.r * 10) / 10, o.f ? 1 : 0]; }),
      z: order.map(function (s) { return sheets.indexOf(s); })
    }));
  }

  function enter(saved) {
    if (on || !wide.matches) return;
    on = true;
    var wr = wrap.getBoundingClientRect();
    var rects = sheets.map(function (s) { return s.getBoundingClientRect(); });
    html.classList.add('bp-edit');
    sheets.forEach(function (s, i) {
      var r = rects[i];
      var h = document.createElement('div'); h.className = 'bp-holder'; h.style.height = r.height + 'px';
      s.parentNode.insertBefore(h, s); holders.push(h);
      var o = { x: r.left - wr.left, y: r.top - wr.top, w: r.width, r: 0, f: false };
      o.home = { x: o.x, y: o.y, w: o.w };
      if (saved && saved.s[i]) {
        var v = saved.s[i], vw = document.documentElement.clientWidth;
        o.w = Math.max(320, Math.min(1500, v[2])); o.r = v[3]; o.f = !!v[4];
        // keep every sheet reachable, even if the window is smaller than last time
        o.x = Math.max(-wr.left - o.w + 120, Math.min(vw - wr.left - 120, v[0]));
        o.y = Math.max(0, v[1]);
      }
      st.set(s, o);
      apply(s);
    });
    if (saved && saved.z && saved.z.length === sheets.length) order = saved.z.map(function (i) { return sheets[i]; });
    stack();
  }
  function leave() {
    if (!on) return;
    on = false; hot && cancelHot(); mir && cancelMir();
    sheets.forEach(function (s) {
      ['left', 'top', 'width', 'transform', 'zIndex'].forEach(function (p) { s.style[p] = ''; });
      s.classList.remove('bp-narrow', 'bp-tiny', 'bp-anim');
    });
    holders.forEach(function (h) { h.remove(); }); holders = [];
    html.classList.remove('bp-edit');
    order = sheets.slice();
  }
  function restore() {
    store(KEY, null);
    if (!on) { say('Everything is already in its place.'); return; }
    if (hot) cancelHot();
    if (mir) cancelMir();
    sheets.forEach(function (s) {
      var o = st.get(s); s.classList.add('bp-anim');
      o.x = o.home.x; o.y = o.home.y; o.w = o.home.w; o.r = 0; o.f = false; apply(s);
    });
    order = sheets.slice(); stack();
    say('Restored. Every sheet is back in its place.');
    setTimeout(function () { leave(); pick('select', true); }, 520);
  }
  function pick(t, quiet) {
    tool = t;
    if (t !== 'select') enter();
    html.setAttribute('data-bp-tool', t);
    rb.querySelectorAll('.rb-mod [data-k]').forEach(function (b) {
      if (b.dataset.k !== 'restore') b.setAttribute('aria-pressed', b.dataset.k === t ? 'true' : 'false');
    });
    if (!quiet) say(MOD.filter(function (x) { return x[0] === t; })[0][3]);
  }

  // ---------- Dragging ----------
  var drag = null;
  function down(e) {
    if (e.button !== 0 || hot || mir) return;
    var c = e.target.dataset && e.target.dataset.c;
    if (tool === 'select' && !c) return;
    e.preventDefault();
    enter();   // grips work from Select too: the board switches to free layout on first touch
    var skin = e.currentTarget, s = skin.parentNode, o = st.get(s);
    front(s);
    if (!c && tool === 'mirror') { startMir(s); return; }
    if (!c && tool === 'stretch') { say('STRETCH  Grab one of the blue corner grips.'); return; }
    var r = s.getBoundingClientRect();
    drag = { s: s, o: o, c: c, mode: c ? 'stretch' : tool, x0: e.clientX, y0: e.clientY, ox: o.x, oy: o.y, ow: o.w, or: o.r,
      cx: r.left + r.width / 2, cy: r.top + r.height / 2, moved: false };
    drag.a0 = Math.atan2(e.clientY - drag.cy, e.clientX - drag.cx);
    skin.setPointerCapture(e.pointerId);
    skin.addEventListener('pointermove', move);
    skin.addEventListener('pointerup', up);
    skin.addEventListener('pointercancel', up);
    s.classList.add('bp-active');
  }
  function shape(d, mode, x, y, shift) {
    var o = d.o, dx = x - d.x0, dy = y - d.y0;
    if (mode === 'move') { o.x = d.ox + dx; o.y = d.oy + dy; o.w = d.ow; o.r = d.or; }
    else if (mode === 'stretch') {
      var rad = d.or * Math.PI / 180, lx = dx * Math.cos(rad) + dy * Math.sin(rad);
      if (o.f) lx = -lx;
      var west = d.c === 'nw' || d.c === 'sw';
      var w = Math.max(320, Math.min(1500, d.ow + (west ? -lx : lx)));
      o.w = w; o.x = west ? d.ox + (d.ow - w) : d.ox; o.y = d.oy; o.r = d.or;
      d.s.querySelector('.bp-ang').textContent = Math.round(w) + ' px';
    }
    else if (mode === 'rotate') {
      var a = Math.atan2(y - d.cy, x - d.cx), deg = d.or + (a - d.a0) * 180 / Math.PI;
      if (!shift) deg = Math.round(deg / 15) * 15;
      deg = ((deg % 360) + 540) % 360 - 180;
      o.r = deg; o.x = d.ox; o.y = d.oy; o.w = d.ow;
      d.s.querySelector('.bp-ang').textContent = Math.round(deg) + '°';
    }
    apply(d.s);
  }
  function move(e) {
    if (!drag) return;
    if (!drag.moved && Math.abs(e.clientX - drag.x0) + Math.abs(e.clientY - drag.y0) < 4) return;
    drag.moved = true;
    shape(drag, drag.mode, e.clientX, e.clientY, e.shiftKey);
  }
  function up(e) {
    if (!drag) return;
    var k = e.currentTarget, d = drag;
    k.removeEventListener('pointermove', move); k.removeEventListener('pointerup', up); k.removeEventListener('pointercancel', up);
    d.s.classList.remove('bp-active');
    drag = null;
    if (d.moved) save();
    else if (d.c) startHot(d, e);   // a click on a grip, without dragging: the grip turns hot
  }

  // ---------- Hot grips (AutoCAD multifunction grips) ----------
  var HOT = ['stretch', 'move', 'rotate', 'mirror'], hot = null;
  function startHot(d, e) {
    var g = d.s.querySelector('.bp-g[data-c="' + d.c + '"]'), gr = g.getBoundingClientRect();
    hot = d; hot.i = 0; hot.g = g; hot.x0 = gr.left + gr.width / 2; hot.y0 = gr.top + gr.height / 2;
    hot.a0 = Math.atan2(hot.y0 - d.cy, hot.x0 - d.cx); hot.f0 = d.o.f; hot.px = e.clientX; hot.py = e.clientY;
    g.classList.add('hot'); d.s.classList.add('bp-active');
    hotPrompt();
    document.addEventListener('pointermove', hotMove);
    document.addEventListener('pointerdown', hotDown, true);
  }
  function hotPrompt() { say('** ' + HOT[hot.i].toUpperCase() + ' **  ' + (HOT[hot.i] === 'mirror' ? 'The mirror line runs from the red grip to your mouse. Click to place.' : 'Move the mouse, click to place.') + ' Enter: next mode. Esc: cancel.', true); }
  function hotShow(shift) {
    var m = HOT[hot.i], o = hot.o;
    if (m === 'mirror') {
      var o0 = { x: hot.ox, y: hot.oy, w: hot.ow, r: hot.or, f: hot.f0 }, p2 = snap(hot.x0, hot.y0, hot.px, hot.py, shift);
      if (Math.hypot(p2[0] - hot.x0, p2[1] - hot.y0) < 8) { axis(null); Object.assign(o, o0); apply(hot.s); }
      else { axis(hot.x0, hot.y0, p2[0], p2[1]); mirrorAcross(hot.s, o0, hot.x0, hot.y0, p2[0], p2[1]); }
    }
    else { axis(null); o.f = hot.f0; shape(hot, m, hot.px, hot.py, shift); }
  }
  function hotMove(e) { hot.px = e.clientX; hot.py = e.clientY; hotShow(e.shiftKey); }
  function hotDown(e) {
    if (e.target.closest('.ribbon')) return;
    e.preventDefault(); e.stopPropagation();
    endHot(); save();
  }
  function endHot() {
    document.removeEventListener('pointermove', hotMove);
    document.removeEventListener('pointerdown', hotDown, true);
    hot.g.classList.remove('hot'); hot.s.classList.remove('bp-active');
    hot = null; axis(null); pick(tool);
  }
  function cancelHot() {
    var o = hot.o; o.x = hot.ox; o.y = hot.oy; o.w = hot.ow; o.r = hot.or; o.f = hot.f0; apply(hot.s);
    endHot();
  }
  // ---------- Mirror with a mirror line (pick two points, like AutoCAD) ----------
  var ax = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  ax.setAttribute('class', 'bp-axis');
  ax.innerHTML = '<line class="ext"/><line class="seg"/><circle r="4"/>';
  document.body.appendChild(ax);
  function axis(x1, y1, x2, y2) {
    if (x1 === null) { ax.classList.remove('on'); return; }
    var a = Math.atan2(y2 - y1, x2 - x1), L = 4000, c = Math.cos(a), sn = Math.sin(a), ls = ax.querySelectorAll('line');
    ls[0].setAttribute('x1', x1 - c * L); ls[0].setAttribute('y1', y1 - sn * L); ls[0].setAttribute('x2', x1 + c * L); ls[0].setAttribute('y2', y1 + sn * L);
    ls[1].setAttribute('x1', x1); ls[1].setAttribute('y1', y1); ls[1].setAttribute('x2', x2); ls[1].setAttribute('y2', y2);
    var ci = ax.querySelector('circle'); ci.setAttribute('cx', x1); ci.setAttribute('cy', y1);
    ax.classList.add('on');
  }
  function snap(x1, y1, x, y, free) {
    var a = Math.atan2(y - y1, x - x1), l = Math.hypot(x - x1, y - y1);
    if (!free) a = Math.round(a / (Math.PI / 12)) * (Math.PI / 12);   // 15° steps, Shift for free
    return [x1 + Math.cos(a) * l, y1 + Math.sin(a) * l];
  }
  function mirrorAcross(s, o0, x1, y1, x2, y2) {
    var wr = wrap.getBoundingClientRect(), o = st.get(s), h = s.offsetHeight;
    var px = x1 - wr.left, py = y1 - wr.top, th = Math.atan2(y2 - y1, x2 - x1), dx = Math.cos(th), dy = Math.sin(th);
    var cx = o0.x + o0.w / 2, cy = o0.y + h / 2, vx = cx - px, vy = cy - py, k = vx * dx + vy * dy;
    var nx = px + 2 * k * dx - vx, ny = py + 2 * k * dy - vy;
    o.w = o0.w; o.x = nx - o0.w / 2; o.y = ny - h / 2; o.f = !o0.f;
    var r = 2 * th * 180 / Math.PI - o0.r + 180;
    o.r = Math.round((((r % 360) + 540) % 360 - 180) * 10) / 10;
    apply(s);
  }
  var mir = null;
  function startMir(s) {
    var o = st.get(s);
    mir = { s: s, o0: { x: o.x, y: o.y, w: o.w, r: o.r, f: o.f }, step: 1 };
    s.classList.add('bp-active');
    say('MIRROR  Specify first point of mirror line. (Enter: flip in place, Esc: cancel)', true);
    document.addEventListener('pointerdown', mirDown, true);
    document.addEventListener('pointermove', mirMove);
  }
  function mirMove(e) {
    if (!mir || mir.step !== 2) return;
    var p = snap(mir.x1, mir.y1, e.clientX, e.clientY, e.shiftKey);
    axis(mir.x1, mir.y1, p[0], p[1]);
    if (Math.hypot(p[0] - mir.x1, p[1] - mir.y1) > 8) mirrorAcross(mir.s, mir.o0, mir.x1, mir.y1, p[0], p[1]);
  }
  function mirDown(e) {
    if (e.target.closest('.ribbon')) return;
    e.preventDefault(); e.stopPropagation();
    if (mir.step === 1) { mir.x1 = e.clientX; mir.y1 = e.clientY; mir.step = 2; axis(mir.x1, mir.y1, mir.x1 + 1, mir.y1); say('MIRROR  Specify second point of mirror line. Snaps every 15°, Shift for free.', true); return; }
    var p = snap(mir.x1, mir.y1, e.clientX, e.clientY, e.shiftKey);
    if (Math.hypot(p[0] - mir.x1, p[1] - mir.y1) < 8) return;
    mirrorAcross(mir.s, mir.o0, mir.x1, mir.y1, p[0], p[1]);
    endMir(); save(); say('MIRROR  Done. Click another sheet to mirror it.');
  }
  function endMir() {
    document.removeEventListener('pointerdown', mirDown, true);
    document.removeEventListener('pointermove', mirMove);
    mir.s.classList.remove('bp-active'); mir = null; axis(null);
  }
  function quickFlip() {
    var s = mir.s, o = st.get(s);
    Object.assign(o, mir.o0); o.f = !o.f; s.classList.add('bp-anim'); apply(s);
    setTimeout(function () { s.classList.remove('bp-anim'); }, 420);
    endMir(); save(); say('MIRROR  Flipped in place. Click another sheet to mirror it.');
  }
  function cancelMir() { Object.assign(st.get(mir.s), mir.o0); apply(mir.s); endMir(); pick(tool); }

  document.addEventListener('keydown', function (e) {
    var typing0 = /INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || '');
    if (mir && !typing0) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); quickFlip(); return; }
      if (e.key === 'Escape') { cancelMir(); return; }
    }
    var typing = /INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || '');
    if (hot && (e.key === 'Enter' || e.key === ' ') && !typing) { e.preventDefault(); hot.i = (hot.i + 1) % HOT.length; hotShow(e.shiftKey); hotPrompt(); }
    else if (e.key === 'Escape') { if (hot) cancelHot(); else if (on && tool !== 'select') pick('select'); }
  });

  // ---------- The two-minute tip ----------
  var t0 = Date.now();
  var tipTimer = setInterval(function () {
    if (load(TIP)) { clearInterval(tipTimer); return; }
    if (Date.now() - t0 < 120000 || !wide.matches) return;
    clearInterval(tipTimer); store(TIP, '1');
    var tip = document.createElement('div'); tip.className = 'rb-tip'; tip.setAttribute('role', 'status');
    tip.innerHTML = '<b>Tip, straight from AutoCAD</b><span>Click a corner grip once so it turns red. Press <kbd>Enter</kbd> to switch between Stretch, Move, Rotate and Mirror, click to place it, <kbd>Esc</kbd> to cancel.</span><button type="button" aria-label="Close tip">×</button>';
    document.body.appendChild(tip);
    if (tool === 'select') pick('move');
    tip.querySelector('button').addEventListener('click', function () { tip.remove(); });
    setTimeout(function () { tip.remove(); }, 20000);
  }, 5000);

  window.addEventListener('resize', function () { if (on && !wide.matches) leave(); });

  window.BPTools = {
    cmd: function (t) {
      if (!wide.matches) return 'MODIFY works on a wider screen.';
      if (t === 'restore') { restore(); return 'Restored.'; }
      if (t === 'modify') t = 'move';
      pick(t); return MOD.filter(function (x) { return x[0] === t; })[0][3];
    }
  };

  // Bring back last visit's arrangement
  var saved = null;
  try { saved = JSON.parse(load(KEY) || 'null'); } catch (e) { saved = null; }
  try { localStorage.removeItem('ebru-board-v1'); } catch (e) {}
  if (saved && saved.s && saved.s.length !== sheets.length) { saved = null; store(KEY, null); }
  if (saved && saved.s && wide.matches) {
    var go = function () { enter(saved); pick('select', true); say('Welcome back: your sheets are where you left them. RESTORE puts everything back.', true); };
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
  } else pick('select', true);
})();
