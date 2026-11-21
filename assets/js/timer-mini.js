(function () {
  'use strict';
  const stage = document.getElementById('fxStage');
  const openBtn = document.getElementById('fxMini');
  if (!stage || !openBtn) return;

  const stageHome = stage.parentNode;
  const stageAnchor = stage.nextSibling;

  const KEY_FLAG = 'nexa.fx.mini';
  const KEY_POS = 'nexa.fx.miniPos';
  const KEY_BPOS = 'nexa.fx.miniBubblePos';
  const FIXED_W = 560;
  const FIXED_H = 340;
  const KEY_SIZE = 'nexa.fx.miniSize';
  const KEY_MAX = 'nexa.fx.miniMax';
  const RATIO = FIXED_W / FIXED_H;
  const MIN_W = 440;
  const L = (en, ar) => (document.documentElement.lang === 'ar' ? ar : en);

  const bar = document.createElement('div');
  bar.className = 'nx-mini-bar';
  bar.innerHTML =
    '<span class="nx-grip" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' +
    '<span class="nx-lbl" id="nxMiniLbl"></span>' +
    '<button type="button" id="nxMiniHide" aria-label=""><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button>' +
    '<button type="button" id="nxMiniOpen" aria-label=""><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
    '<button type="button" id="nxMiniX" aria-label="">&times;</button>';
  stage.append(bar);
  const rz = document.createElement('span');
  rz.className = 'nx-rz';
  rz.setAttribute('aria-hidden', 'true');
  stage.append(rz);

  const hideMini = bar.querySelector('#nxMiniHide');
  const openMini = bar.querySelector('#nxMiniOpen');
  const closeMini = bar.querySelector('#nxMiniX');
  const lblEl = bar.querySelector('#nxMiniLbl');

  const bubble = document.createElement('button');
  bubble.type = 'button';
  bubble.className = 'nx-bubble';
  bubble.id = 'nxBubble';
  bubble.innerHTML = '<span id="nxBubbleT">--:--</span>';
  document.body.appendChild(bubble);
  const bubbleT = bubble.querySelector('#nxBubbleT');

  const getFlag = () => {
    try { return localStorage.getItem(KEY_FLAG) === '1'; } catch (e) { return false; }
  };
  const setFlag = v => {
    try { v ? localStorage.setItem(KEY_FLAG, '1') : localStorage.removeItem(KEY_FLAG); } catch (e) {}
  };
  const onFocusView = () => location.hash === '#/focus';
  const isFloating = () => stage.classList.contains('fx-mini-float');
  const isCollapsed = () => bubble.classList.contains('show');

  const labels = () => {
    openBtn.setAttribute('aria-label', L('Minimize timer', 'تصغير المؤقت'));
    openBtn.title = L('Minimize timer', 'تصغير المؤقت');
    hideMini.setAttribute('aria-label', L('Hide', 'إخفاء'));
    hideMini.title = L('Hide', 'إخفاء');
    closeMini.setAttribute('aria-label', L('Close', 'إغلاق'));
    closeMini.title = L('Close', 'إغلاق');
    openMini.setAttribute('aria-label', L('Back to timer', 'العودة إلى المؤقت'));
    openMini.title = L('Back to timer', 'العودة إلى المؤقت');
    bubble.setAttribute('aria-label', L('Show timer', 'إظهار المؤقت'));
    bubble.title = L('Show timer', 'إظهار المؤقت');
  };

  const ring = stage.querySelector('.fx-ring');
  const fxT = document.getElementById('fxT');
  const fxL = document.getElementById('fxL');
  const fitInner = () => {
    if (!isFloating() || !ring) return;
    const mid = stage.querySelector('.fx-mid');
    if (!mid) return;
    const topH = stage.querySelector('.fx-top').offsetHeight;
    const ctl = stage.querySelector('.fx-ctl');
    const reserved = topH + (ctl ? ctl.offsetHeight : 0) + 24;
    const availH = Math.max(60, stage.clientHeight - reserved);
    const availW = mid.clientWidth - 20;
    const digits = stage.dataset.skin === 'digits';
    if (digits) {
      ring.style.width = Math.min(availW, 1200) + 'px';
      const fontSize = Math.max(100, Math.min(availH * 2.34, availW * .81, 1400));
      if (fxT) fxT.style.fontSize = Math.round(fontSize) + 'px';
    } else {
      const ringSize = Math.max(60, Math.min(availW, availH, 900));
      ring.style.width = ringSize + 'px';
      const len = Math.max(readTime().length, 5);
      const fontSize = Math.max(14, Math.min(ringSize * .3, (ringSize * 1.15) / len));
      if (fxT) fxT.style.fontSize = Math.round(fontSize) + 'px';
    }
  };
  const unfitInner = () => {
    if (!ring) return;
    ring.style.width = '';
    if (fxT) fxT.style.fontSize = '';
  };

  const readTime = () => {
    if (!fxT) return '--:--';
    if (fxT._c) return fxT._c.map(c => (c._ch !== undefined ? c._ch : '')).join('');
    return fxT.textContent.trim();
  };
  const syncLabel = () => {
    lblEl.textContent = fxL ? fxL.textContent.trim() : '';
    bubbleT.textContent = readTime();
  };

  const place = (x, y) => {
    const w = stage.offsetWidth, h = stage.offsetHeight;
    x = Math.max(8, Math.min(x, innerWidth - w - 8));
    y = Math.max(8, Math.min(y, innerHeight - h - 8));
    stage.style.left = x + 'px';
    stage.style.top = y + 'px';
    try { localStorage.setItem(KEY_POS, JSON.stringify({ x, y })); } catch (e) {}
  };
  const placeBubble = (x, y) => {
    const w = bubble.offsetWidth, h = bubble.offsetHeight;
    x = Math.max(8, Math.min(x, innerWidth - w - 8));
    y = Math.max(8, Math.min(y, innerHeight - h - 8));
    bubble.style.left = x + 'px';
    bubble.style.top = y + 'px';
    try { localStorage.setItem(KEY_BPOS, JSON.stringify({ x, y })); } catch (e) {}
  };
  const readMax = () => {
    let m = null;
    try { m = JSON.parse(localStorage.getItem(KEY_MAX) || 'null'); } catch (e) {}
    return m && m.w > 0 && m.h > 0 ? m : { w: 900, h: 900 / RATIO };
  };
  const recordMax = () => {
    if (isFloating() || !onFocusView()) return;
    const w = stage.offsetWidth, h = stage.offsetHeight;
    if (w > 200 && h > 120) {
      try { localStorage.setItem(KEY_MAX, JSON.stringify({ w, h })); } catch (e) {}
    }
  };
  const maxWidth = () => {
    const m = readMax();
    return Math.max(MIN_W, Math.min(m.w, m.h * RATIO, innerWidth - 16, (innerHeight - 16) * RATIO));
  };
  const clampW = w => Math.round(Math.max(Math.min(MIN_W, innerWidth - 16), Math.min(w, maxWidth())));
  const savedW = () => {
    let v = FIXED_W;
    try {
      const n = parseFloat(localStorage.getItem(KEY_SIZE));
      if (n > 0) v = n;
    } catch (e) {}
    return v;
  };
  const setSize = w => {
    w = clampW(w);
    stage.style.width = w + 'px';
    stage.style.height = Math.round(w / RATIO) + 'px';
    return w;
  };
  const applyFixedSize = () => {
    setSize(savedW());
    fitInner();
    requestAnimationFrame(() => requestAnimationFrame(fitInner));
  };
  const restoreGeometry = () => {
    let p = null;
    try { p = JSON.parse(localStorage.getItem(KEY_POS) || 'null'); } catch (e) {}
    applyFixedSize();
    if (p && typeof p.x === 'number' && typeof p.y === 'number') place(p.x, p.y);
    else place(innerWidth - stage.offsetWidth - 16, innerHeight - stage.offsetHeight - 96);
  };
  const restoreBubblePos = () => {
    let p = null;
    try { p = JSON.parse(localStorage.getItem(KEY_BPOS) || 'null'); } catch (e) {}
    if (p && typeof p.x === 'number' && typeof p.y === 'number') placeBubble(p.x, p.y);
    else placeBubble(innerWidth - 146, innerHeight - 110);
  };

  let drag = null;
  bar.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('button')) return;
    drag = { dx: e.clientX - stage.offsetLeft, dy: e.clientY - stage.offsetTop, id: e.pointerId };
    try { bar.setPointerCapture(e.pointerId); } catch (err) {}
    bar.classList.add('dragging');
  });
  bar.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    place(e.clientX - drag.dx, e.clientY - drag.dy);
  });
  const endDrag = e => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    bar.classList.remove('dragging');
  };
  bar.addEventListener('pointerup', endDrag);
  bar.addEventListener('pointercancel', endDrag);

  let rdrag = null;
  rz.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    rdrag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, w: stage.offsetWidth };
    try { rz.setPointerCapture(e.pointerId); } catch (err) {}
    stage.classList.add('nx-resizing');
  });
  rz.addEventListener('pointermove', e => {
    if (!rdrag || e.pointerId !== rdrag.id) return;
    const dx = e.clientX - rdrag.sx, dy = e.clientY - rdrag.sy;
    let w = rdrag.w + (dx + dy * RATIO) / 2;
    setSize(w);
    place(stage.offsetLeft, stage.offsetTop);
    fitInner();
  });
  const endResize = e => {
    if (!rdrag || e.pointerId !== rdrag.id) return;
    rdrag = null;
    stage.classList.remove('nx-resizing');
    place(stage.offsetLeft, stage.offsetTop);
    try { localStorage.setItem(KEY_SIZE, String(stage.offsetWidth)); } catch (err) {}
    fitInner();
  };
  rz.addEventListener('pointerup', endResize);
  rz.addEventListener('pointercancel', endResize);

  let bdrag = null;
  bubble.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    bdrag = { dx: e.clientX - bubble.offsetLeft, dy: e.clientY - bubble.offsetTop, id: e.pointerId, moved: false, sx: e.clientX, sy: e.clientY };
    try { bubble.setPointerCapture(e.pointerId); } catch (err) {}
  });
  bubble.addEventListener('pointermove', e => {
    if (!bdrag || e.pointerId !== bdrag.id) return;
    if (!bdrag.moved && (Math.abs(e.clientX - bdrag.sx) > 5 || Math.abs(e.clientY - bdrag.sy) > 5)) {
      bdrag.moved = true;
      bubble.classList.add('dragging');
    }
    if (bdrag.moved) placeBubble(e.clientX - bdrag.dx, e.clientY - bdrag.dy);
  });
  const endBubbleDrag = e => {
    if (!bdrag || e.pointerId !== bdrag.id) return;
    const moved = bdrag.moved;
    bdrag = null;
    bubble.classList.remove('dragging');
    if (!moved) expand();
  };
  bubble.addEventListener('pointerup', endBubbleDrag);
  bubble.addEventListener('pointercancel', endBubbleDrag);

  let lastView = '#/home';

  const collapse = () => {
    bubble.classList.add('show');
    restoreBubblePos();
    stage.style.display = 'none';
  };
  const expand = () => {
    bubble.classList.remove('show');
    stage.style.display = '';
  };

  let ro = null;
  const engage = () => {
    document.body.appendChild(stage);
    stage.classList.add('fx-mini-float');
    restoreGeometry();
    if (window.ResizeObserver && !ro) {
      ro = new ResizeObserver(() => fitInner());
      ro.observe(stage);
    }
    syncLabel();
    requestAnimationFrame(() => requestAnimationFrame(fitInner));
  };
  const disengage = () => {
    expand();
    if (ro) {
      ro.disconnect();
      ro = null;
    }
    stage.classList.remove('fx-mini-float');
    stage.style.left = stage.style.top = stage.style.width = stage.style.height = '';
    unfitInner();
    stageHome.insertBefore(stage, stageAnchor);
  };

  const refresh = () => {
    const show = !onFocusView() && getFlag();
    if (onFocusView() && !isFloating()) requestAnimationFrame(() => requestAnimationFrame(recordMax));
    if (show && !isFloating()) engage();
    else if (!show && isFloating()) disengage();
  };

  openBtn.addEventListener('click', () => {
    recordMax();
    setFlag(true);
    location.hash = lastView;
    refresh();
  });
  hideMini.addEventListener('click', collapse);
  openMini.addEventListener('click', () => {
    location.hash = '#/focus';
  });
  closeMini.addEventListener('click', () => {
    setFlag(false);
    refresh();
  });
  addEventListener('hashchange', () => {
    if (onFocusView()) {
      setFlag(false);
    } else {
      lastView = location.hash || '#/home';
    }
    refresh();
  });
  addEventListener('resize', () => {
    recordMax();
    if (isFloating()) {
      applyFixedSize();
      place(stage.offsetLeft, stage.offsetTop);
    }
    if (isCollapsed()) placeBubble(bubble.offsetLeft, bubble.offsetTop);
  });
  addEventListener('nexa:lang', () => { labels(); syncLabel(); });
  setInterval(() => { if (isFloating() || isCollapsed()) syncLabel(); }, 500);

  labels();
  refresh();
})();
