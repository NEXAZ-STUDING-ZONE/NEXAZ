(function () {
    var MIN = 1250;
    var seen = {};
    var MAX = 15000;
    var current = null;
    var token = 0;

    function ar() {
        return document.documentElement.lang === 'ar';
    }

    function wait(ms) {
        return new Promise(function (ok) { setTimeout(ok, ms); });
    }

    function frames() {
        return new Promise(function (ok) {
            requestAnimationFrame(function () { requestAnimationFrame(ok); });
        });
    }

    function poll(test, limit) {
        return new Promise(function (ok) {
            var t0 = Date.now();
            (function tick() {
                var v = false;
                try { v = test(); } catch (e) {}
                if (v || Date.now() - t0 > limit) return ok();
                setTimeout(tick, 60);
            })();
        });
    }

    function settle(view, quiet, limit) {
        return new Promise(function (ok) {
            var timer = null, cap = null, finished = false;
            var mo = new MutationObserver(function (list) {
                var real = list.some(function (m) {
                    var el = m.target.nodeType === 1 ? m.target : m.target.parentElement;
                    return !(el && el.closest('.nx-secload'));
                });
                if (real) arm();
            });
            function end() {
                if (finished) return;
                finished = true;
                clearTimeout(timer);
                clearTimeout(cap);
                mo.disconnect();
                ok();
            }
            function arm() {
                clearTimeout(timer);
                timer = setTimeout(end, quiet);
            }
            cap = setTimeout(end, limit);
            mo.observe(view, { childList: true, characterData: true, subtree: true });
            arm();
        });
    }

    function filled(sel, limit) {
        return poll(function () {
            var e = document.querySelector(sel);
            return e && (e.children.length || e.textContent.trim());
        }, limit);
    }

    function storeReady() {
        if (window.NXSTORE && window.NXSTORE.raw) {
            return Promise.race([window.NXSTORE.raw.get('__nx_ready').catch(function () {}), wait(8000)]);
        }
        return Promise.resolve();
    }

    function fonts() {
        if (document.fonts && document.fonts.ready) return Promise.race([document.fonts.ready, wait(1500)]);
        return Promise.resolve();
    }

    function images(view) {
        var list = Array.prototype.slice.call(view.querySelectorAll('img')).filter(function (i) { return !i.complete; });
        if (!list.length) return Promise.resolve();
        return Promise.race([
            Promise.all(list.map(function (i) {
                return new Promise(function (ok) {
                    i.addEventListener('load', ok, { once: true });
                    i.addEventListener('error', ok, { once: true });
                });
            })),
            wait(3000)
        ]);
    }

    function specific(id) {
        var lazy = window.NXLAZY ? window.NXLAZY.section(id) : Promise.resolve();
        return lazy.then(function () { return specific2(id); });
    }

    function specific2(id) {
        if (id === 'smartboard') {
            return poll(function () {
                var h = document.getElementById('gnBoardHost');
                return h && h.children.length && !h.querySelector('.gn-boot');
            }, MAX);
        }
        if (id === 'calculator') {
            return poll(function () {
                var m = document.getElementById('cxMount');
                return m && m.shadowRoot && m.shadowRoot.querySelector('#kp button');
            }, 8000);
        }
        if (id === 'library' || id === 'home') return storeReady();
        if (id === 'tasks') return filled('#allTasks', 4000);
        if (id === 'timetable') return filled('#ttGrid', 4000);
        if (id === 'notes') {
            return poll(function () {
                var c = document.getElementById('nnCount');
                var g = document.getElementById('nnGrid');
                var p = document.getElementById('nnPin');
                return (c && c.textContent.trim()) || (g && g.children.length) || (p && p.children.length);
            }, 4000);
        }
        return Promise.resolve();
    }

    function overlay(view) {
        var o = null;
        for (var i = 0; i < view.children.length; i++) {
            if (view.children[i].classList.contains('nx-secload')) { o = view.children[i]; break; }
        }
        if (!o) {
            o = document.createElement('div');
            o.className = 'nx-secload';
            o.setAttribute('role', 'status');
            o.setAttribute('aria-live', 'polite');
            o.setAttribute('aria-busy', 'true');
            o.innerHTML = '<b></b><div class="nx-secload-ring"></div><div class="nx-secload-bar"><i></i></div>';
            view.appendChild(o);
        }
        o.querySelector('b').textContent = ar() ? 'جارٍ التحميل' : 'Loading';
        return o;
    }

    function drop(c) {
        document.body.classList.remove('nx-sec-loading');
        if (!c) return;
        c.view.classList.remove('nx-loading');
        c.view.classList.remove('nx-show');
        c.o.classList.remove('out');
    }

    function show(id) {
        var view = document.getElementById('v-' + id);
        if (!view) return;
        if (seen[id]) return;
        seen[id] = true;
        if (current && current.view !== view) drop(current);
        var my = ++token;
        var o = overlay(view);
        o.classList.remove('out');
        view.classList.add('nx-loading');
        view.classList.add('nx-show');
        document.body.classList.add('nx-sec-loading');
        current = { id: id, view: view, o: o };
        var done = false;
        function finish() {
            if (done || my !== token) return;
            done = true;
            view.classList.remove('nx-loading');
            document.body.classList.remove('nx-sec-loading');
            applyCredit();
            o.classList.add('out');
            setTimeout(function () {
                if (my === token) drop(current);
            }, 280);
        }
        Promise.all([wait(MIN), fonts(), frames(), specific(id)]).then(function () {
            return Promise.all([images(view), settle(view, 180, 5000)]);
        }).then(function () {
            return frames();
        }).then(finish, finish);
        setTimeout(finish, MAX);
    }

    var credit = document.querySelector('.cc-frame');
    var aboutView = document.getElementById('v-about');
    var creditRatio = 0;

    function applyCredit() {
        if (!credit) return;
        if (creditRatio === 0) credit.classList.remove('cc-go');
        else if (creditRatio >= 0.6 && !(aboutView && aboutView.classList.contains('nx-loading'))) credit.classList.add('cc-go');
    }

    if (credit && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                creditRatio = en.isIntersecting ? en.intersectionRatio : 0;
            });
            applyCredit();
        }, { threshold: [0, 0.6, 1] }).observe(credit);
    } else if (credit) {
        credit.classList.add('cc-go');
    }

    function currentId() {
        var v = location.hash.replace('#/', '') || 'home';
        return document.getElementById('v-' + v) ? v : 'home';
    }

    window.addEventListener('hashchange', function () {
        var id = currentId();
        if (current && current.id === id && current.view.classList.contains('nx-show')) return;
        show(id);
    });
    show(currentId());
})();
