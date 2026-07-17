/* HOME — Horizontal Parallax Gallery (2D/DOM version).
 * Faithful port of the Codrops demo by David Faure (src/main.ts + src/gallery/index.ts):
 *   wheel scroll -> smoothed translateX of the strip, plus per-image counter-parallax
 *   (image is 125% wide, shifted translate3d(shift%,0,0), shift = -t * 10).
 * lerp/clamp match GSAP.utils.interpolate/clamp exactly.
 * Site chrome kept from the previous build (unchanged): bottom dial, left contacts
 * panel fade, and clickable cards (data-href). No WebGL. */
(function () {
  function lerp(p1, p2, t) { return p1 + (p2 - p1) * t; }            // = GSAP.utils.interpolate
  function clamp(min, max, v) { return Math.max(min, Math.min(max, v)); } // = GSAP.utils.clamp

  /* ---------- Gallery (src/gallery/index.ts, 1:1) ---------- */
  function Gallery() {
    this.container = document.querySelector('.gallery__image__container');
    this.wrapper = document.querySelector('.gallery__wrapper');
    this.images = document.querySelectorAll('.gallery__media__image');
  }
  Gallery.prototype._clamp = function (v, min, max) { return Math.max(min, Math.min(max, v)); };
  Gallery.prototype.applyParallaxEffect = function () {
    var vw = window.innerWidth;
    var viewportCenter = vw * 0.5;
    var self = this;
    this.images.forEach(function (image) {
      var parent = image.parentElement;
      if (!parent) return;
      var rect = parent.getBoundingClientRect();
      var elementCenter = rect.left + rect.width * 0.5;
      // -1 (left) .. 0 (center) .. 1 (right)
      var t = self._clamp((elementCenter - viewportCenter) / viewportCenter, -1, 1);
      // images now shown at original 100% (no overscale) -> no counter-parallax
      // No per-image transform: keeping the image on the card's own layer lets
      // the card's rounded overflow clip apply correctly (avoids square corners
      // on hover zoom). Hover zoom/lift is handled purely in CSS now.
      void t;
    });
  };
  Gallery.prototype.render = function (container, scroll) {
    container.style.transform = 'translateX(' + (scroll < 0.01 ? 0 : -scroll) + 'px)';
    this.applyParallaxEffect();
  };

  /* ---------- App (src/main.ts, 1:1 core + site chrome) ---------- */
  function App() {
    this.container = document.querySelector('.gallery__image__container');
    this.wrapper = document.querySelector('.gallery__wrapper');
    this.scroll = { current: 0, target: 0, ease: 0.07, limit: 0 };
    var self = this;
    this.preloadImages().then(function () {
      document.body.classList.remove('loading');
      self.gallery = new Gallery();
      self.setLimit();
      self.onResize();
      self.addEventListeners();
      self.buildDial();
      self.render();
    });
  }

  App.prototype.preloadImages = function () {
    var images = Array.prototype.slice.call(document.querySelectorAll('img'));
    return Promise.all(images.map(function (img) {
      return new Promise(function (resolve) {
        var image = new Image();
        image.onload = function () { resolve(); };
        image.onerror = function () { resolve(); };
        image.src = img.src;
      });
    }));
  };

  App.prototype.setLimit = function () {
    if (!this.container || !this.wrapper) return;
    // Center the first & last card at the two scroll extremes (keeps the current
    // look: first card centered at rest, contacts panel sitting in the left gap).
    var medias = document.querySelectorAll('.gallery__media');
    var vw = window.innerWidth;
    if (medias.length) {
      var cardW = medias[0].getBoundingClientRect().width;
      var pad = Math.max(0, vw / 2 - cardW / 2);
      this.container.style.paddingLeft = pad + 'px';
      this.container.style.paddingRight = pad + 'px';
    }
    // dial spacing = distance between two adjacent card centers
    var m2 = document.querySelectorAll('.gallery__media');
    if (m2.length > 1) {
      var a = m2[0].getBoundingClientRect();
      var b = m2[1].getBoundingClientRect();
      this.dialSpacing = (b.left + b.width / 2) - (a.left + a.width / 2);
    } else {
      this.dialSpacing = 1;
    }

    // Scroll limit = the distance needed for the LAST card to reach the same
    // center as the first, which is exactly (n-1) * card-center-spacing.
    // NOTE: don't derive this from container.scrollWidth - a flex container
    // omits the trailing padding-right, which left the last card ~1 pad short
    // of center (it stopped near the right edge).
    this.scroll.limit = m2.length > 1 ? (m2.length - 1) * this.dialSpacing : 0;

    // contacts panel sizing (from previous build)
    var panel = this.introEl || (this.introEl = document.querySelector('.home-contacts'));
    if (panel && medias.length) {
      var cw = medias[0].getBoundingClientRect().width;
      var gapLeft = vw / 2 - cw / 2;
      var avail = gapLeft - 40 - 40;
      if (avail < 240) { panel.style.display = 'none'; }
      else { panel.style.display = ''; panel.style.left = '40px'; panel.style.width = Math.min(avail, 360) + 'px'; }
    }
  };

  App.prototype.onWheel = function (e) {
    var d = e.deltaY;
    if (e.deltaMode === 1) d *= 16; else if (e.deltaMode === 2) d *= window.innerHeight;
    this.scroll.target += d;
  };

  App.prototype.onResize = function () {
    this.setLimit();
  };

  App.prototype.addEventListeners = function () {
    var self = this;
    window.addEventListener('resize', function () { self.onResize(); });
    window.addEventListener('wheel', function (e) { self.onWheel(e); }, { passive: true });

    // pointer drag + touch swipe (mobile); a short press = tap that opens the card
    var dragging = false, startX = 0, startTarget = 0, moved = 0, downHref = null;
    function isChrome(t) {
      return t && t.closest && (t.closest('.ax-menu') || t.closest('.ax-menu-btn') ||
        t.closest('.brand') || t.closest('.home-cta') || t.closest('.home-contacts'));
    }
    window.addEventListener('pointerdown', function (e) {
      if (isChrome(e.target)) return;
      dragging = true; startX = e.clientX; startTarget = self.scroll.target; moved = 0;
      var card = e.target.closest ? e.target.closest('.gallery__media') : null;
      var img = card ? card.querySelector('.gallery__media__image') : null;
      downHref = img ? img.getAttribute('data-href') : null;
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      moved += Math.abs(e.clientX - startX);
      self.scroll.target = startTarget - (e.clientX - startX) * 1.6;
    });
    window.addEventListener('pointerup', function () {
      if (dragging && moved < 6 && downHref) { window.location.href = downHref; }
      dragging = false;
    });
    window.addEventListener('pointercancel', function () { dragging = false; });
  };

  /* ---------- bottom dial (unchanged from previous build) ---------- */
  App.prototype.buildDial = function () {
    this.dialRing = document.querySelector('.dial__ring');
    if (!this.dialRing) return;
    this.dialSections = ['\u0410\u0420\u0415\u041d\u0414\u0410', '\u0420\u0415\u041c\u041e\u041d\u0422', '\u0413\u0410\u041b\u0415\u0420\u0415\u042f', '\u0421\u0415\u0420\u0422\u0418\u0424\u0418\u041a\u0410\u0422', '\u041e \u041d\u0410\u0421'];
    this.dialStep = 11;
    this.dialSpan = (this.dialSections.length - 1) * this.dialStep;
    this.dialActive = -1;
    var ring = this.dialRing;
    var self = this;
    this.dialItems = this.dialSections.map(function (name, i) {
      var it = document.createElement('div');
      it.className = 'dial__item';
      it.style.transform = 'rotate(' + (i * self.dialStep) + 'deg) translateY(calc(-1 * var(--dialR)))';
      var sp = document.createElement('span');
      sp.className = 'dial__lbl';
      sp.textContent = name;
      it.appendChild(sp);
      ring.appendChild(it);
      return sp;
    });
    for (var a = -self.dialStep; a <= self.dialSpan + self.dialStep + 0.01; a += self.dialStep / 5) {
      var tk = document.createElement('div');
      tk.className = 'dial__tick';
      tk.style.transform = 'rotate(' + a + 'deg) translateY(calc(-1 * var(--dialR)))';
      ring.appendChild(tk);
    }
  };

  App.prototype.updateDial = function (scroll) {
    if (!this.dialRing) return;
    var n = this.dialSections.length;
    var p;
    if (this.dialSpacing && isFinite(this.dialSpacing) && this.dialSpacing !== 0) {
      p = scroll / this.dialSpacing;
    } else {
      p = this.scroll.limit > 0 ? (scroll / this.scroll.limit) * (n - 1) : 0;
    }
    p = clamp(0, n - 1, p);
    this.dialRing.style.transform = 'rotate(' + (-p * this.dialStep) + 'deg)';
    var idx = Math.round(p);
    if (idx !== this.dialActive) {
      for (var i = 0; i < this.dialItems.length; i++) {
        this.dialItems[i].classList.toggle('is-active', i === idx);
      }
      this.dialActive = idx;
    }
  };

  /* ---------- render loop (src/main.ts render + dial/contacts) ---------- */
  App.prototype.render = function () {
    this.scroll.target = clamp(0, this.scroll.limit, this.scroll.target);
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);

    this.gallery.render(this.container, this.scroll.current);
    this.updateDial(this.scroll.current);

    var intro = this.introEl || (this.introEl = document.querySelector('.home-contacts'));
    if (intro) {
      var io = clamp(0, 1, 1 - this.scroll.current / 110);
      intro.style.opacity = io;
      intro.style.pointerEvents = io < 0.05 ? 'none' : '';
    }

    var self = this;
    requestAnimationFrame(function () { self.render(); });
  };

  if (!window.matchMedia('(max-width: 760px)').matches) { new App(); }
})();
