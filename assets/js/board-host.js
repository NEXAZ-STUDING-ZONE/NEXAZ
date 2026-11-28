
(function (W) {
  'use strict';
  var VER = '1', loading = null;
  var isAr = function () { return document.documentElement.lang === 'ar'; };
  var theme = function () { return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'; };

  function addCss(h) {
    return new Promise(function (ok) {
      if (document.querySelector('link[data-gn]')) return ok();
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = h; l.dataset.gn = '1';
      l.onload = l.onerror = function () { ok(); }; document.head.appendChild(l);
    });
  }
  function addJs(src) {
    return new Promise(function (ok, no) {
      var s = document.createElement('script'); s.src = src; s.async = true;
      s.onload = function () { ok(); }; s.onerror = function () { no(new Error('load ' + src)); };
      document.head.appendChild(s);
    });
  }
  function load() {
    return loading || (loading = Promise.all([addCss('assets/css/board.css?v=' + VER), addJs('assets/js/board-engine.js?v=' + VER)]).then(function () {
      addJs('assets/js/board-stickers.js?v=' + VER).catch(function () {});
    }).catch(function (e) { loading = null; throw e; }));
  }

  var dbp = null;
  function db() {
    return dbp || (dbp = new Promise(function (ok, no) {
      var r = indexedDB.open('nexa-gn', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { dbp = null; no(r.error); };
    }));
  }
  function kvGet(k) {
    return db().then(function (d) {
      return new Promise(function (ok) {
        var q = d.transaction('kv').objectStore('kv').get(k);
        q.onsuccess = function () { ok(q.result == null ? null : q.result); };
        q.onerror = function () { ok(null); };
      });
    }).catch(function () { return null; });
  }
  function kvSet(k, v) {
    return db().then(function (d) {
      return new Promise(function (ok) {
        var t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k);
        t.oncomplete = function () { ok(true); }; t.onerror = t.onabort = function () { ok(false); };
      });
    }).catch(function () { return false; });
  }

const BG={},bgImg=s=>BG[s]||(BG[s]=new Promise((res,rej)=>{const m=new Image();m.onload=()=>res(m);m.onerror=rej;m.src=s}));
function paper(i,cv,w,p,fl){var x=cv.getContext('2d'),s=w/p.w,h=cv.height,W=cv.width,bd=function(){GN.drawBorder(x,W,h,p.bd,s)},bc=p.bgc||'#ffffff',lm=/^#[0-9a-f]{6}$/i.test(bc)?(parseInt(bc.substr(1,2),16)*.299+parseInt(bc.substr(3,2),16)*.587+parseInt(bc.substr(5,2),16)*.114)/255:1;x.fillStyle=bc;x.fillRect(0,0,W,h);if(p.paper==='custom'&&p.bg)return bgImg(p.bg).then(function(m){x.drawImage(m,0,0,W,h);bd()});
 x.strokeStyle=lm<.45?'rgba(255,255,255,.18)':'#cfd8e6';x.fillStyle=lm<.45?'rgba(255,255,255,.4)':'#b9c3d4';x.lineWidth=Math.max(1,s);var t=p.paper||'blank',g=40*s,k;
 if(t==='lined'){for(k=g*1.5;k<h;k+=g){x.beginPath();x.moveTo(0,k);x.lineTo(W,k);x.stroke()}}
 else if(t==='grid'){for(k=g;k<W;k+=g){x.beginPath();x.moveTo(k,0);x.lineTo(k,h);x.stroke()}for(k=g;k<h;k+=g){x.beginPath();x.moveTo(0,k);x.lineTo(W,k);x.stroke()}}
 else if(t==='dots'){for(var a=g;a<W;a+=g)for(var b=g;b<h;b+=g){x.beginPath();x.arc(a,b,1.6*s,0,7);x.fill()}}
 bd()}


  var board = null, boardHost = null, boardFull = false;

  function setFull(on) {
    boardFull = !!on;
    if (!boardHost) return;
    var sec = boardHost.parentNode;
    if (sec) sec.classList.toggle('board-expanded', boardFull);
    boardHost.classList.toggle('gn-full', boardFull);
    if (board) { board.g.setIcon(boardFull ? 'back' : 'expand'); setTimeout(function () { board.g.fit(); }, 60); }
  }

  function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
  function elFs(el, fallback) {
    if (fsEl() === el) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    var req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req) { if (fallback) fallback(); return; }
    try {
      var r = req.call(el);
      if (r && r.catch) r.catch(function () { if (fallback) fallback(); });
    } catch (e) { if (fallback) fallback(); }
  }
  function shown() { return boardFull || fsEl() === boardHost || !!(boardHost && boardHost.offsetParent); }
  function syncFs() {
    var f = fsEl();
    if (board) board.g.setFs(f === boardHost);
    if (pdf) pdf.g.setFs(f === pdf.host);
  }
  document.addEventListener('fullscreenchange', syncFs);
  document.addEventListener('webkitfullscreenchange', syncFs);
  async function mountBoard(host) {
    boardHost = host;
    if (board && board.root.isConnected) { board.g.fit(); return; }
    await load();
    var d = await kvGet('board');
    if (!d) {
      try { d = JSON.parse(localStorage.getItem('gn:board:v1') || 'null'); } catch (e) { d = null; }
    }
    var PW = 900, PH = 1200;
    var p = d && d.pages && d.pages.length ? d.pages : [{ w: PW, h: PH, paper: 'blank' }];
    var it = d && d.items && d.items.length === p.length ? d.items : p.map(function () { return []; });
    host.replaceChildren();
    var root = document.createElement('div'); host.appendChild(root);
    var g = W.GN(root, {
      board: 1, lang: isAr() ? 'ar' : 'en', title: isAr() ? 'السبورة الذكية' : 'Smart Board',
      pages: p, items: it, base: paper, maxPx: 24e6,
      save: function (items, pages) { kvSet('board', { items: items, pages: pages }); },
      onBack: function () { setFull(!boardFull); },
      onFs: function () { elFs(boardHost, function () { setFull(!boardFull); }); }
    });
    g.setTheme(theme());
    board = { g: g, root: root };
    if (boardFull) g.setIcon('back');
    setTimeout(function () { g.fit(); }, 60);
  }
  function fitBoard() { if (board) setTimeout(function () { board.g.fit(); }, 50); }

  var pdf = null;
  var cancels = new WeakMap();
  var dead = new WeakSet(), q = [], running = 0, MAXR = 2;
  function pump() {
    while (running < MAXR && q.length) {
      var j = q.shift(); running++;
      j().then(done, done);
    }
  }
  var clT = 0, curDoc = null;
  function done() {
    running--; pump();
    if (!running && !q.length && curDoc) {
      clearTimeout(clT);
      clT = setTimeout(function () {
        if (running || q.length || !curDoc) return;
        try { Promise.resolve(curDoc.cleanup()).catch(function () {}); } catch (e) {}
      }, 800);
    }
  }
  function enqueue(job) {
    return new Promise(function (res, rej) {
      q.push(function () { return job().then(res, rej); });
      pump();
    });
  }
  function pdfBaseFor(doc) {
    curDoc = doc;
    return function (i, cv, w, p) {
      var prev = cancels.get(cv); if (prev) { try { prev.cancel(); } catch (e) {} cancels.delete(cv); }
      dead.delete(cv);
      return enqueue(function () {
        if (dead.has(cv) || cv.width <= 1) return Promise.resolve();
        return doc.getPage(p.pdf).then(function (pg) {
          if (dead.has(cv) || cv.width <= 1) { try { pg.cleanup(); } catch (e) {} return; }
          var v1 = pg.getViewport({ scale: 1 });
          var vp = pg.getViewport({ scale: cv.width / v1.width });
          var x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height);
          var t = pg.render({ canvasContext: x, viewport: vp }); cancels.set(cv, t);
          return t.promise.then(function () {
            if (cancels.get(cv) === t) cancels.delete(cv);
            try { pg.cleanup(); } catch (e) {}
          }, function (e) {
            try { pg.cleanup(); } catch (x2) {}
            throw e;
          });
        });
      });
    };
  }
  function dropRender(cv) {
    dead.add(cv);
    var t = cancels.get(cv); if (t) { try { t.cancel(); } catch (e) {} cancels.delete(cv); }
  }
  function sizeOf(pg) { var v = pg.getViewport({ scale: 1 }); var r = { w: v.width, h: v.height }; try { pg.cleanup(); } catch (e) {} return r; }
  async function firstSizes(doc, k) {
    var out = new Array(k), CH = 12;
    for (var s0 = 0; s0 < k; s0 += CH) {
      var js = [];
      for (var j = s0; j < Math.min(k, s0 + CH); j++) js.push(doc.getPage(j + 1).then((function (jj) { return function (pg) { out[jj] = sizeOf(pg); }; })(j)));
      await Promise.all(js);
    }
    return out;
  }
  async function refineSizes(doc, g, from) {
    var n = doc.numPages, CH = 10;
    for (var s0 = from; s0 < n; s0 += CH) {
      if (!pdf || pdf.g !== g) return;
      var upd = [];
      for (var j = s0; j < Math.min(n, s0 + CH); j++) {
        try { var sz = sizeOf(await doc.getPage(j + 1)); upd.push({ i: j, w: sz.w, h: Math.round(900 * sz.h / sz.w), pw: sz.w, ph: sz.h }); } catch (e) {}
      }
      if (!pdf || pdf.g !== g) return;
      g.setSizes(upd);
      await new Promise(function (r) { setTimeout(r, 40); });
    }
  }
  async function mountPdf(host, o) {
    await load();
    if (pdf) closePdf();
    var doc = o.doc, n = doc.numPages, K = Math.min(n, 25);
    var first = await firstSizes(doc, K);
    if (o.onProgress) o.onProgress(1);
    var saved = await kvGet('pdf:' + o.fileId);
    var items = [];
    for (var i = 0; i < n; i++) items.push(saved && saved.items && Array.isArray(saved.items[i]) ? saved.items[i] : []);
    var pages = [];
    for (var i2 = 0; i2 < n; i2++) { var s2 = first[i2] || first[0]; pages.push({ w: 900, h: Math.round(900 * s2.h / s2.w), pw: s2.w, ph: s2.h, paper: 'blank', pdf: i2 + 1 }); }
    host.replaceChildren();
    var root = document.createElement('div'); host.appendChild(root);
    var key = 'pdf:' + o.fileId;
    var g = W.GN(root, {
      lang: isAr() ? 'ar' : 'en', title: o.title || '', pages: pages, items: items, fixed: 1, maxPx: 5e6,
      base: pdfBaseFor(doc), drop: dropRender, exportName: (o.title || 'document').replace(/\.pdf$/i, '').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 60),
      save: function (it) { kvSet(key, { items: it, n: n }); },
      onBack: function () { o.onBack && o.onBack(); },
      onFs: function () { elFs(host); }
    });
    g.setTheme(theme());
    pdf = { g: g, root: root, host: host, o: o };
    setTimeout(function () {
      g.fit();
      if (o.startPage > 1) g.goPage(o.startPage - 1);
    }, 60);
    if (n > K) setTimeout(function () { refineSizes(doc, g, K); }, 400);
    return g;
  }
  function closePdf() {
    if (!pdf) return 0;
    var page = 1;
    try { page = pdf.g.getPage() + 1; pdf.g.flush(); pdf.g.destroy(); } catch (e) {}
    pdf.root.remove(); pdf = null; curDoc = null; clearTimeout(clT);
    return page;
  }

  new MutationObserver(function () {
    if (board) board.g.setTheme(theme());
    if (pdf) pdf.g.setTheme(theme());
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  addEventListener('resize', function () { if (board && shown()) board.g.fit(); if (pdf) pdf.g.fit(); });
  addEventListener('nexa:lang', function () {
    if (board) {
      board.g.flush(); board.g.destroy(); board.root.remove(); board = null;
      if (boardHost && shown()) mountBoard(boardHost);
    }
    if (pdf) {
      var o = pdf.o, host = pdf.host, pg = pdf.g.getPage() + 1;
      pdf.g.flush(); pdf.g.destroy(); pdf.root.remove(); pdf = null;
      o.startPage = pg; mountPdf(host, o);
    }
  });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && boardFull && !/^(INPUT|TEXTAREA)$/.test((e.target || {}).tagName || '')) setFull(false); });
  addEventListener('pagehide', function () { if (board) board.g.flush(); if (pdf) pdf.g.flush(); });

  addEventListener('hashchange', function () {
    if (boardFull && location.hash.indexOf('#/smartboard') !== 0) setFull(false);
  });

  W.NXGN = {
    load: load, mountBoard: mountBoard, fitBoard: fitBoard, mountPdf: mountPdf, closePdf: closePdf,
    active: function () { return !!pdf; }
  };
})(window);
