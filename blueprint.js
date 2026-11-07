// Always open a page at its top, unless a #link points inside it
try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
if (!location.hash) { window.scrollTo(0, 0); window.addEventListener('load', function () { window.scrollTo(0, 0); }); }
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';

  // Grips at corners and midpoints of each sheet, like a selected object in CAD
  document.querySelectorAll('.sheet').forEach(function (el) {
    [[0,0],[50,0],[100,0],[0,50],[100,50],[0,100],[50,100],[100,100]].forEach(function (p) {
      var g = document.createElement('span');
      g.className = 'grip'; g.style.left = p[0] + '%'; g.style.top = p[1] + '%';
      el.appendChild(g);
    });
  });

  if (reduce) return;

  // Linework that draws itself once a sheet comes into view (the border is always there)
  var frames = document.querySelectorAll('.sheet, .cover');
  frames.forEach(function (el) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'trace'); svg.setAttribute('aria-hidden', 'true');
    var r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', '0'); r.setAttribute('y', '0');
    r.setAttribute('width', '100%'); r.setAttribute('height', '100%');
    svg.appendChild(r); el.appendChild(svg);
    var len = 2 * (el.offsetWidth + el.offsetHeight);
    svg.style.setProperty('--len', len);
    r.style.setProperty('--len', len);
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('drawn'); io.unobserve(e.target); } });
    }, { threshold: 0.2 });
    frames.forEach(function (el) { io.observe(el); });
  }

  // Crosshair cursor, only for a mouse or pen
  if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
    var x = document.createElement('div'); x.className = 'xhair'; x.setAttribute('aria-hidden', 'true');
    x.innerHTML = '<span class="h"></span><span class="v"></span><span class="box"></span>';
    document.body.appendChild(x); document.body.classList.add('has-xhair');
    var h = x.querySelector('.h'), v = x.querySelector('.v'), b = x.querySelector('.box');
    var px = 0, py = 0, raf = 0;
    function draw() {
      raf = 0;
      h.style.top = py + 'px'; v.style.left = px + 'px';
      b.style.left = px + 'px'; b.style.top = py + 'px';
    }
    window.addEventListener('pointermove', function (e) {
      px = e.clientX; py = e.clientY; x.classList.add('on');
      if (!raf) raf = requestAnimationFrame(draw);
    }, { passive: true });
    document.addEventListener('pointerleave', function () { x.classList.remove('on'); });
    window.addEventListener('blur', function () { x.classList.remove('on'); });
  }

  // Command line: copy email and print the result
  var out = document.querySelector('.cmd .prev');
  document.querySelectorAll('.cmdbtn[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      function done(ok) { if (out) out.textContent = ok ? 'Command: COPY_EMAIL · copied ' + text : 'Command: ' + text + ' (select to copy)'; }
      try { navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); }); }
      catch (e) { done(false); }
    });
  });
})();

// AutoCAD-style status bar: Model = home board, Layouts = project pages
(function () {
  var meta = document.querySelector('meta[name="space"]');
  var space = meta ? meta.getAttribute('content') : 'model';
  if (space !== 'model') document.documentElement.classList.add('is-layout');
  var EMAIL = 'ebru.timinci@gmail.com';
  var home = space === 'model' ? '' : 'index.html';
  var LAYERS = ['PLAN', 'RESEARCH', 'SYNTHESIZE', 'DESIGN', 'BUILD'];

  // name: [description, url | action]
  var CMDS = {
    MODEL: ['Home board', 'index.html'], HOME: ['Home board', 'index.html'],
    CASE: ['Revolut case study', 'casestudy.html'], REVOLUT: ['Revolut case study', 'casestudy.html'],
    THESIS: ['Thesis research', 'thesis.html'],
    APP: ['UX Research App', 'app.html'],
    BUS: ['Bus widget', home + '#s3'],
    CV: ['Open CV', 'Ebru-Timinci-CV.pdf'],
    LINKEDIN: ['LinkedIn', 'https://www.linkedin.com/in/ebru-timinci/'],
    GITHUB: ['GitHub', 'https://github.com/ebrutiminci'],
    X: ['X', 'https://x.com/ebrutiminci'],
    EMAIL: ['Copy email', 'email'],
    LAYISO: ['Isolate one layer, e.g. LAYISO RESEARCH', 'layiso'],
    LAYUNISO: ['Show all layers again', 'layuniso'],
    LAYER: ['List the layers', 'layer'],
    ZOOM: ['Enlarge the drawing nearest the centre', 'zoom'],
    HELP: ['List every command', 'help']
  };
  if (space === 'model') {
    CMDS.MODIFY = ['Open the Modify toolbar: move, stretch, rotate, mirror', 'tool:modify'];
    CMDS.MOVE = ['Move a sheet', 'tool:move']; CMDS.M = CMDS.MOVE;
    CMDS.STRETCH = ['Stretch a sheet, it reflows like a phone', 'tool:stretch']; CMDS.S = CMDS.STRETCH;
    CMDS.ROTATE = ['Rotate a sheet', 'tool:rotate']; CMDS.RO = CMDS.ROTATE;
    CMDS.MIRROR = ['Mirror a sheet', 'tool:mirror']; CMDS.MI = CMDS.MIRROR;
    CMDS.RESTORE = ['Put every sheet back', 'tool:restore'];
  }
  var MENU = (space === 'model' ? ['MODIFY'] : []).concat(['EMAIL', 'CV', 'CASE', 'THESIS', 'APP', 'BUS', 'LAYISO', 'LAYUNISO', 'ZOOM', 'HELP', 'MODEL', 'LINKEDIN', 'GITHUB', 'X']);

  var bar = document.createElement('nav');
  bar.className = 'statusbar'; bar.setAttribute('aria-label', 'Pages');
  function tab(id, label, href) {
    return '<a class="sb-tab' + (space === id ? ' on' : '') + '" href="' + href + '"' + (space === id ? ' aria-current="page"' : '') + '>' + label + '</a>';
  }
  bar.innerHTML =
    '<span class="sb-menu" aria-hidden="true"><i></i><i></i><i></i></span>' +
    tab('model', 'Model', 'index.html') + tab('layout1', 'Revolut', 'casestudy.html') +
    tab('app', 'Research<span class="sb-long">&nbsp;App</span>', 'app.html') + tab('bus', 'Bus<span class="sb-long">&nbsp;Widget</span>', home + '#s3') +
    tab('layout2', 'Thesis', 'thesis.html') +
    '<span class="sb-iso" hidden></span>' +
    '<span class="sb-mode">' + (space === 'model' ? 'MODEL' : 'PAPER') + '</span>' +
    '<button type="button" class="sb-grid on" aria-pressed="true" title="Grid display">#</button>';
  var cmd = document.createElement('form');
  cmd.className = 'sb-cmd'; cmd.setAttribute('role', 'search'); cmd.setAttribute('autocomplete', 'off');
  cmd.innerHTML =
    '<span class="sb-x" aria-hidden="true">×</span><span class="sb-prompt" aria-hidden="true">&gt;_</span>' +
    '<label class="sb-vh" for="sbcmd">Type a command</label>' +
    '<input id="sbcmd" type="text" spellcheck="false" placeholder="Type a command (try EMAIL, LAYISO, HELP)">' +
    '<ul class="sb-list" role="listbox"></ul><span class="sb-out" aria-live="polite"></span>';
  document.body.appendChild(bar); document.body.appendChild(cmd);
  document.body.classList.add('has-statusbar');

  var input = cmd.querySelector('input'), list = cmd.querySelector('.sb-list'), out = cmd.querySelector('.sb-out'), iso = bar.querySelector('.sb-iso');
  function say(t, ms) { out.textContent = t; out.classList.add('show'); clearTimeout(say.t); say.t = setTimeout(function () { out.classList.remove('show'); }, ms || 2800); }

  // ---- Layers: each sheet sits on the layers its method tags name ----
  var blocks = Array.prototype.slice.call(document.querySelectorAll('.sheet, .about'));
  blocks.forEach(function (el) {
    var names = [];
    el.querySelectorAll('.tag.on').forEach(function (t) { names.push(t.textContent.trim().toUpperCase()); });
    if (!names.length) {
      var a = el.querySelector('.sheet-body > .ann, .about .ann');
      if (a) a.textContent.toUpperCase().split(/[^A-Z]+/).forEach(function (w) { if (LAYERS.indexOf(w) > -1) names.push(w); });
    }
    el.setAttribute('data-layers', names.join(' '));
  });
  function layerCount(L) { return blocks.filter(function (b) { return (' ' + b.getAttribute('data-layers') + ' ').indexOf(' ' + L + ' ') > -1; }).length; }
  function matchLayer(arg) { var m = LAYERS.filter(function (L) { return L.indexOf(arg) === 0; }); return m.length === 1 ? m[0] : null; }
  function layiso(L) {
    var first = null;
    blocks.forEach(function (b) {
      var on = (' ' + b.getAttribute('data-layers') + ' ').indexOf(' ' + L + ' ') > -1;
      b.classList.toggle('iso-off', !on); if (on && !first) first = b;
    });
    document.documentElement.classList.add('iso');
    document.querySelectorAll('.legend .tag').forEach(function (t) { t.classList.toggle('iso-pick', t.textContent.trim().toUpperCase() === L); });
    iso.hidden = false; iso.textContent = 'LAYISO: ' + L;
    say(layerCount(L) + ' sheet(s) on ' + L + '. Type LAYUNISO to show all.', 3600);
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function layuniso() {
    blocks.forEach(function (b) { b.classList.remove('iso-off'); });
    document.documentElement.classList.remove('iso');
    document.querySelectorAll('.legend .tag').forEach(function (t) { t.classList.remove('iso-pick'); });
    iso.hidden = true; say('All layers on');
  }
  // The legend tags act as a layer picker too
  document.querySelectorAll('.legend .tag').forEach(function (t) {
    t.setAttribute('role', 'button'); t.setAttribute('tabindex', '0'); t.title = 'LAYISO ' + t.textContent.trim();
    function go(e) { e.preventDefault(); var L = t.textContent.trim().toUpperCase(); if (t.classList.contains('iso-pick')) layuniso(); else layiso(L); }
    t.addEventListener('click', go);
    t.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') go(e); });
  });

  // ---- ZOOM: a lightbox carousel through the same project's drawings ----
  var lb = document.createElement('div'); lb.className = 'zoombox'; lb.hidden = true;
  lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-label', 'Enlarged drawing');
  lb.innerHTML = '<button type="button" class="zb-nav zb-prev" aria-label="Previous drawing">&#8592;</button>' +
    '<img alt=""><button type="button" class="zb-nav zb-next" aria-label="Next drawing">&#8594;</button>' +
    '<p class="zb-cap"></p><span class="zb-hint"></span>';
  document.body.appendChild(lb);
  var zset = [], zi = 0;
  function projectImages(img) {
    var scope = space === 'model' ? (img.closest('.sheet') || document) : document;
    return Array.prototype.slice.call(scope.querySelectorAll('.vp img'));
  }
  function show() {
    var img = zset[zi], big = lb.querySelector('img');
    big.src = img.currentSrc || img.src; big.alt = img.alt;
    var cap = img.closest('figure') && img.closest('figure').querySelector('figcaption');
    lb.querySelector('.zb-cap').textContent = cap ? cap.textContent : img.alt;
    var many = zset.length > 1;
    lb.classList.toggle('many', many);
    lb.querySelector('.zb-hint').textContent = (many ? (zi + 1) + ' / ' + zset.length + '  ·  \u2190 \u2192 to browse  ·  ' : '') + 'ESC or click to close';
  }
  function zoom(img) {
    if (!img) { say('No drawing on this screen to zoom'); return; }
    zset = projectImages(img); zi = Math.max(0, zset.indexOf(img)); if (!zset.length) zset = [img];
    show(); lb.hidden = false; document.documentElement.classList.add('zoomed');
  }
  function step(d) { if (zset.length < 2) return; zi = (zi + d + zset.length) % zset.length; show(); }
  function unzoom() { lb.hidden = true; document.documentElement.classList.remove('zoomed'); }
  lb.addEventListener('click', function (e) {
    if (e.target.closest('.zb-prev')) { step(-1); return; }
    if (e.target.closest('.zb-next')) { step(1); return; }
    unzoom();
  });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') unzoom();
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });
  var tx = null;
  lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 40) { step(dx < 0 ? 1 : -1); e.preventDefault(); }
  });
  document.querySelectorAll('.vp img').forEach(function (img) { img.style.cursor = 'zoom-in'; img.addEventListener('click', function () { zoom(img); }); });
  function nearestImage() {
    var best = null, bd = Infinity, cy = window.innerHeight / 2;
    document.querySelectorAll('.vp img').forEach(function (img) {
      var r = img.getBoundingClientRect(); if (r.bottom < 0 || r.top > window.innerHeight) return;
      var d = Math.abs((r.top + r.bottom) / 2 - cy); if (d < bd) { bd = d; best = img; }
    });
    return best;
  }

  // ---- Running commands ----
  function resolve(word) {
    if (CMDS[word]) return word;
    var hits = Object.keys(CMDS).filter(function (k) { return k.indexOf(word) === 0; });
    var targets = hits.map(function (k) { return CMDS[k][1]; }).filter(function (t, i, a) { return a.indexOf(t) === i; });
    if (targets.length === 1) return hits[0];
    if (hits.length > 1) { say(word + ' could be: ' + hits.join(', ')); return null; }
    say('Unknown command: ' + word + '. Type HELP'); return null;
  }
  function execute(line) {
    var parts = line.trim().toUpperCase().split(/\s+/), name = resolve(parts[0]), arg = parts[1] || '';
    if (!name) return;
    var act = CMDS[name][1];
    if (act === 'email') {
      try { navigator.clipboard.writeText(EMAIL).then(function () { say('Email copied: ' + EMAIL); }, function () { say(EMAIL); }); } catch (e) { say(EMAIL); }
    } else if (act === 'layiso') {
      var L = arg ? matchLayer(arg) : null;
      if (L) layiso(L); else { input.value = 'LAYISO '; render('LAYISO '); cmd.classList.add('open'); input.focus(); say('Pick a layer: ' + LAYERS.join(', ')); }
    } else if (act === 'layuniso') { layuniso();
    } else if (act === 'layer') { input.value = 'LAYISO '; render('LAYISO '); cmd.classList.add('open'); input.focus();
    } else if (act === 'zoom') { zoom(nearestImage());
    } else if (act === 'help') { input.value = ''; render(''); cmd.classList.add('open'); input.focus();
    } else if (act.indexOf('tool:') === 0) { if (window.BPTools) say(window.BPTools.cmd(act.slice(5)), 4000);
    } else if (/^https?:|\.pdf$/.test(act)) { var w = window.open(act, '_blank'); if (w) { try { w.opener = null; } catch (e) {} say('Opened ' + CMDS[name][0] + ' in a new tab'); } else { location.href = act; }
    } else { location.href = act; }
  }
  function render(q) {
    q = (q || '').toUpperCase();
    var items;
    if (/^LAY(ISO)?\s/.test(q) || q === 'LAYER') {
      var a = q.split(/\s+/)[1] || '';
      items = LAYERS.filter(function (L) { return L.indexOf(a) === 0; }).map(function (L) { return ['LAYISO ' + L, layerCount(L) + ' sheet(s)']; });
      items.push(['LAYUNISO', 'Show all layers']);
    } else {
      q = q.trim();
      items = MENU.filter(function (n) { return !q || n.indexOf(q) === 0; }).map(function (n) { return [n, CMDS[n][0]]; });
    }
    list.innerHTML = items.map(function (it) { return '<li role="option" data-n="' + it[0] + '"><b>' + it[0] + '</b> ' + it[1] + '</li>'; }).join('');
  }
  var history = [], hi = 0;
  input.addEventListener('focus', function () { render(input.value); cmd.classList.add('open'); });
  input.addEventListener('input', function () { render(input.value); cmd.classList.add('open'); });
  input.addEventListener('blur', function () { setTimeout(function () { cmd.classList.remove('open'); }, 150); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp' && history.length) { e.preventDefault(); hi = Math.max(0, hi - 1); input.value = history[hi]; }
    else if (e.key === 'ArrowDown' && history.length) { e.preventDefault(); hi = Math.min(history.length, hi + 1); input.value = history[hi] || ''; }
    else if (e.key === 'Escape') { input.value = ''; input.blur(); }
  });
  list.addEventListener('mousedown', function (e) {
    var li = e.target.closest('li'); if (!li) return; e.preventDefault();
    var v = li.getAttribute('data-n'); input.value = ''; cmd.classList.remove('open'); history.push(v); hi = history.length; execute(v);
  });
  cmd.addEventListener('submit', function (e) {
    e.preventDefault(); var v = input.value.trim(); input.value = '';
    if (!v) { if (history.length) v = history[history.length - 1]; else return; } // Enter on empty repeats, like AutoCAD
    history.push(v); hi = history.length; cmd.classList.remove('open'); execute(v);
  });
  var g = bar.querySelector('.sb-grid');
  g.addEventListener('click', function () { var off = document.documentElement.classList.toggle('no-grid'); g.classList.toggle('on', !off); g.setAttribute('aria-pressed', String(!off)); });
  window.BP = { run: execute, say: say, layers: LAYERS, grid: function () { g.click(); return !document.documentElement.classList.contains('no-grid'); } };
})();

// External links open in a new tab, so the viewer never blocks them
document.querySelectorAll('a[href^="http"]').forEach(function (a) { a.target = '_blank'; a.rel = 'noopener'; });
document.querySelectorAll('table.sched').forEach(function (t) {
  var heads = Array.prototype.map.call(t.querySelectorAll('thead th'), function (th) { return th.textContent.trim(); });
  t.querySelectorAll('tbody tr').forEach(function (tr) {
    Array.prototype.forEach.call(tr.children, function (td, i) { if (heads[i]) td.setAttribute('data-label', heads[i]); });
  });
});
