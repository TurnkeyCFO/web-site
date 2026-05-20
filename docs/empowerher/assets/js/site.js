// EmpowerHer v4 — visual polish layer
// - Mobile menu (slide-in + stagger)
// - Carousel with cross-fade
// - Exit-intent
// - Animated stat counters (with gold-SVG suffix when data-suffix="star")
// - Nav scroll background
// - Reveal-on-scroll
(function () {
  // ---------- Star SVG (inline gold) ----------
  var STAR_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:.85em;height:.85em;display:inline-block;vertical-align:-.12em;fill:#F5B400;stroke:#C48E0E;stroke-width:1.5;stroke-linejoin:round;filter:drop-shadow(0 1px 1px rgba(196,142,14,.35));margin-left:.12em"><path d="M12 2.5l2.95 6.36 6.97.93-5.12 4.78 1.31 6.93L12 17.95l-6.11 3.55 1.31-6.93L2.08 9.79l6.97-.93z"/></svg>';

  // ---------- Mobile menu ----------
  var ham = document.querySelector('.hamburger');
  var menu = document.querySelector('.mobile-menu');
  var closeBtn = document.querySelector('.mobile-menu .close');
  if (ham && menu) {
    ham.addEventListener('click', function () { menu.classList.add('open'); document.body.style.overflow = 'hidden'; });
    if (closeBtn) closeBtn.addEventListener('click', function () { menu.classList.remove('open'); document.body.style.overflow = ''; });
    Array.prototype.forEach.call(menu.querySelectorAll('a'), function (a) {
      a.addEventListener('click', function () { menu.classList.remove('open'); document.body.style.overflow = ''; });
    });
  }

  // ---------- Nav scroll background ----------
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () {
      if (window.scrollY > 12) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---------- Testimonial carousel (cross-fade) ----------
  var slides = document.querySelectorAll('.testimonial');
  var dots = document.querySelectorAll('.carousel-dots button');
  if (slides.length > 1) {
    var i = 0;
    var carousel = document.querySelector('.testimonial-carousel');
    var paused = false;
    var show = function (n) {
      Array.prototype.forEach.call(slides, function (s, idx) { s.classList.toggle('active', idx === n); });
      Array.prototype.forEach.call(dots, function (d, idx) { d.classList.toggle('active', idx === n); });
      i = n;
    };
    Array.prototype.forEach.call(dots, function (d, idx) {
      d.addEventListener('click', function () { show(idx); });
    });
    if (carousel) {
      carousel.addEventListener('mouseenter', function () { paused = true; });
      carousel.addEventListener('mouseleave', function () { paused = false; });
    }
    setInterval(function () { if (!paused) show((i + 1) % slides.length); }, 6000);

    // Keyboard
    document.addEventListener('keydown', function (e) {
      if (!document.activeElement || document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') show((i + 1) % slides.length);
      if (e.key === 'ArrowLeft') show((i - 1 + slides.length) % slides.length);
    });
  }

  // ---------- Exit-intent ----------
  var exit = document.querySelector('.exit-modal');
  if (exit && window.matchMedia('(min-width: 860px)').matches) {
    var shown = false;
    var trigger = function (e) {
      if (shown) return;
      if (e.clientY < 8 && e.relatedTarget === null) {
        shown = true;
        exit.classList.add('show');
        try { localStorage.setItem('eh_exit_shown', '1'); } catch (_) {}
      }
    };
    if (!localStorage.getItem('eh_exit_shown')) {
      document.addEventListener('mouseout', trigger);
    }
    var closeExit = exit.querySelector('.close');
    if (closeExit) closeExit.addEventListener('click', function () { exit.classList.remove('show'); });
    exit.addEventListener('click', function (e) { if (e.target === exit) exit.classList.remove('show'); });
  }

  // ---------- Lead-magnet (legacy mailto fallback) ----------
  Array.prototype.forEach.call(document.querySelectorAll('form[data-lead]'), function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var emailEl = f.querySelector('input[type=email]');
      if (!emailEl) return;
      var email = emailEl.value.trim();
      if (!email || !email.includes('@')) return;
      var subject = encodeURIComponent('Send me the 7-day kickstart guide');
      var body = encodeURIComponent('Email: ' + email + '\n\nHi Kendra — please send me the free 7-day kickstart guide. Thanks!');
      window.location.href = 'mailto:healthcoachingask@gmail.com?subject=' + subject + '&body=' + body;
      f.innerHTML = '<p class="ok" style="color:white;font-weight:600;">Thanks! Your email app just opened — hit send to get the guide.</p>';
    });
  });

  // ---------- Video modal ----------
  Array.prototype.forEach.call(document.querySelectorAll('[data-video]'), function (el) {
    el.addEventListener('click', function () {
      alert("Kendra's intro video is coming soon! In the meantime, message her on Instagram @empowerher.healthcoaching to chat.");
    });
  });

  // ---------- Animate stat counters on view (with fallback final value) ----------
  function renderCounter(el, value) {
    var target = parseFloat(el.dataset.count);
    var rawSuffix = el.dataset.suffix || '';
    var isStar = rawSuffix === 'star' || rawSuffix === '&star;' || rawSuffix === '★';
    var suffixHTML = isStar ? STAR_SVG : rawSuffix;
    var disp = (target % 1 === 0 ? Math.round(value) : value.toFixed(1));
    el.innerHTML = disp + suffixHTML;
  }
  function animateCounter(el) {
    var target = parseFloat(el.dataset.count);
    var start = performance.now();
    var dur = 700;
    function tick(now) {
      var p = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      renderCounter(el, target * eased);
      if (p < 1) requestAnimationFrame(tick);
      else renderCounter(el, target);
    }
    requestAnimationFrame(tick);
  }
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    // Always set final value first as fallback (non-JS / fast capture render correctly)
    Array.prototype.forEach.call(counters, function (c) { renderCounter(c, parseFloat(c.dataset.count)); });
    // Expose finalizer for headless QA
    window.__finalizeCounters = function () {
      Array.prototype.forEach.call(counters, function (c) { renderCounter(c, parseFloat(c.dataset.count)); });
    };
    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced && 'IntersectionObserver' in window) {
      // Reset to 0 then animate in on first intersection
      Array.prototype.forEach.call(counters, function (c) { renderCounter(c, 0); });
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        });
      }, { threshold: 0.3 });
      Array.prototype.forEach.call(counters, function (c) { obs.observe(c); });
    }
  }

  // ---------- Reveal-on-scroll ----------
  if ('IntersectionObserver' in window) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    Array.prototype.forEach.call(document.querySelectorAll('.reveal'), function (el) { revealObs.observe(el); });
  } else {
    Array.prototype.forEach.call(document.querySelectorAll('.reveal'), function (el) { el.classList.add('in'); });
  }
})();
