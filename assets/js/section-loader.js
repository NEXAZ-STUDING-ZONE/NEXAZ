(function () {
    var MIN = 240;
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
        if (id === 'library' && window.NXSTORE && window.NXSTORE.raw) {
            return Promise.race([window.NXSTORE.raw.get('__nx_ready').catch(function () {}), wait(8000)]);
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
            o.innerHTML = '<div class="nx-secload-ring"></div><b></b><small></small><div class="nx-secload-bar"><i></i></div>';
            view.appendChild(o);
        }
        o.querySelector('b').textContent = ar() ? 'جارٍ جلب الملفات…' : 'Loading your files…';
        o.querySelector('small').textContent = ar() ? 'لحظات من فضلك' : 'Just a moment';
        return o;
    }

    function drop(c) {
        if (!c) return;
        c.view.classList.remove('nx-loading');
        c.o.classList.remove('out');
    }

    function show(id) {
        var view = document.getElementById('v-' + id);
        if (!view) return;
        if (current && current.view !== view) drop(current);
        var my = ++token;
        var o = overlay(view);
        o.classList.remove('out');
        view.classList.add('nx-loading');
        current = { id: id, view: view, o: o };
        var done = false;
        function finish() {
            if (done || my !== token) return;
            done = true;
            o.classList.add('out');
            setTimeout(function () {
                if (my === token) drop(current);
            }, 280);
        }
        Promise.all([wait(MIN), fonts(), frames(), images(view), specific(id)]).then(finish, finish);
        setTimeout(finish, MAX);
    }

    function currentId() {
        var v = location.hash.replace('#/', '') || 'home';
        return document.getElementById('v-' + v) ? v : 'home';
    }

    window.addEventListener('hashchange', function () {
        var id = currentId();
        if (current && current.id === id && current.view.classList.contains('nx-loading')) return;
        show(id);
    });
    show(currentId());
})();
