(function () {
  'use strict';
  var EASE_MS = 620;
  function $(s, c) { return (c || document).querySelector(s); }
  function $all(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  function Cine() {
    this.root = $('#cine');
    if (!this.root) return;
    this.slides = $all('.cine__slide', this.root);
    if (!this.slides.length) return;
    this.index = 0;
    this.busy = false;
    this.dotsWrap = $('#cineDots');
    this.buildDots();
    this.bindNav();
    this.bindGestures();
    // autoplay disabled — slides advance only on user swipe / nav
  }

  Cine.prototype.buildDots = function () {
    var self = this;
    if (!this.dotsWrap) return;
    this.dots = [];
    this.slides.forEach(function (s, i) {
      var b = document.createElement('button');
      b.className = 'cine__dot' + (i === 0 ? ' is-active' : '');
      b.setAttribute('aria-label', 'Slide ' + (i + 1));
      b.addEventListener('click', function () { self.go(i); });
      self.dotsWrap.appendChild(b);
      self.dots.push(b);
    });
  };

  Cine.prototype.updateDots = function () {
    if (!this.dots) return;
    for (var i = 0; i < this.dots.length; i++)
      this.dots[i].classList.toggle('is-active', i === this.index);
  };

  Cine.prototype.go = function (next, dir) {
    var n = this.slides.length;
    next = ((next % n) + n) % n;
    if (this.busy || next === this.index) return;
    if (typeof dir !== 'number') dir = next > this.index ? 1 : -1;
    var cur = this.slides[this.index];
    var nx = this.slides[next];
    var self = this;

    nx.style.transition = 'none';
    nx.style.transform = 'scale(1.06) translateX(' + (dir > 0 ? 9 : -9) + '%)';
    nx.style.opacity = '0';
    void nx.offsetWidth;
    nx.style.transition = '';
    nx.classList.add('is-active');
    nx.style.transform = '';
    nx.style.opacity = '';

    cur.classList.remove('is-active');
    cur.style.transform = 'scale(1.03) translateX(' + (dir > 0 ? -9 : 9) + '%)';
    cur.style.opacity = '0';

    this.index = next;
    this.busy = true;
    setTimeout(function () {
      cur.style.transition = 'none';
      cur.style.transform = '';
      cur.style.opacity = '';
      void cur.offsetWidth;
      cur.style.transition = '';
      self.busy = false;
    }, EASE_MS + 60);

    this.updateDots();
    this.restartAuto();
  };

  Cine.prototype.next = function () { this.go(this.index + 1, 1); };
  Cine.prototype.prev = function () { this.go(this.index - 1, -1); };

  Cine.prototype.bindNav = function () {
    var self = this;
    var p = $('#cinePrev'), nb = $('#cineNext');
    if (p) p.addEventListener('click', function () { self.prev(); });
    if (nb) nb.addEventListener('click', function () { self.next(); });
    document.addEventListener('keydown', function (e) {
      if (document.body.classList.contains('ax-menu-open')) return;
      if (e.key === 'ArrowRight') self.next();
      else if (e.key === 'ArrowLeft') self.prev();
    });
  };

  Cine.prototype.bindGestures = function () {
    var self = this;
    var wheelLock = false;
    window.addEventListener('wheel', function (e) {
      var d = e.deltaY || e.deltaX;
      if (Math.abs(d) < 4 || wheelLock) return;
      wheelLock = true;
      setTimeout(function () { wheelLock = false; }, EASE_MS);
      if (d > 0) self.next(); else self.prev();
    }, { passive: true });

    var down = false, sx = 0, sy = 0, moved = 0, href = null;
    function isChrome(t) {
      return t && t.closest && (t.closest('.ax-menu') || t.closest('.ax-menu-btn') ||
        t.closest('.brand') || t.closest('.home-cta') || t.closest('.cine__arrow') ||
        t.closest('.cine__dots'));
    }
    this.root.addEventListener('pointerdown', function (e) {
      if (isChrome(e.target)) return;
      down = true; sx = e.clientX; sy = e.clientY; moved = 0;
      var sl = e.target.closest ? e.target.closest('.cine__slide') : null;
      href = sl ? sl.getAttribute('data-href') : null;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      moved = Math.max(moved, Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy));
    });
    window.addEventListener('pointerup', function (e) {
      if (!down) return;
      down = false;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) self.next(); else self.prev();
      } else if (moved < 8 && href) {
        window.location.href = href;
      }
    });
    window.addEventListener('pointercancel', function () { down = false; });
  };

  Cine.prototype.startAuto = function () {
    var self = this;
    this.autoMs = 6000;
    this.timer = setInterval(function () {
      if (document.hidden) return;
      if (document.body.classList.contains('ax-menu-open')) return;
      self.next();
    }, this.autoMs);
  };
  Cine.prototype.restartAuto = function () {
    if (this.timer) clearInterval(this.timer);
  };

  function boot() {
    if (!window.matchMedia('(max-width: 760px)').matches) return;
    document.body.classList.remove('loading');
    new Cine();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
