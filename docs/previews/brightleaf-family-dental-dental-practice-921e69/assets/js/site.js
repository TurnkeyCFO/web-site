/* Brightleaf Family Dental — site.js
   Header scroll state, mobile nav, scroll reveal, FAQ a11y,
   smile-gallery before/after toggle, contact form (functional-looking). */
(function () {
  'use strict';

  /* ---- Sticky header shadow ---- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 12);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Mobile navigation drawer ---- */
  var toggle = document.querySelector('.nav-toggle');
  var drawer = document.querySelector('.mobile-nav');
  var closeBtn = document.querySelector('.mobile-close');
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle('open', open);
    /* Keep the closed drawer out of the tab order and hidden from
       screen readers — its links are off-screen, not gone. */
    drawer.toggleAttribute('inert', !open);
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('no-scroll', open);
    if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (toggle) toggle.addEventListener('click', function () { setDrawer(true); });
  if (closeBtn) closeBtn.addEventListener('click', function () { setDrawer(false); });
  if (drawer) {
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setDrawer(false); });
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setDrawer(false);
  });

  /* ---- Scroll reveal ---- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- FAQ: keep one open per group is optional; just sync aria ---- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var summary = item.querySelector('summary');
    if (!summary) return;
    summary.setAttribute('aria-expanded', item.open ? 'true' : 'false');
    item.addEventListener('toggle', function () {
      summary.setAttribute('aria-expanded', item.open ? 'true' : 'false');
    });
  });

  /* ---- Smile gallery before/after toggle ---- */
  document.querySelectorAll('.ba-card').forEach(function (card) {
    var tabs = card.querySelectorAll('.ba-tab');
    var imgs = card.querySelectorAll('.ba-stage img');
    tabs.forEach(function (tab, idx) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        imgs.forEach(function (img, i) { img.classList.toggle('show', i === idx); });
      });
    });
  });

  /* ---- Emergency triage reveal on appointment forms ---- */
  document.querySelectorAll('form[data-appt]').forEach(function (form) {
    var callout = form.querySelector('.emerg-callout');
    form.querySelectorAll('input[name="emergency"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        if (callout) callout.classList.toggle('show', radio.value === 'yes' && radio.checked);
      });
    });

    /* ---- Functional-looking submit (no backend on preview) ---- */
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;
      var fields = form.querySelector('.form-fields');
      var success = form.querySelector('.form-success');
      var nameInput = form.querySelector('input[name="firstName"]');
      var who = nameInput && nameInput.value ? nameInput.value.trim() : '';
      if (success) {
        var greet = success.querySelector('[data-greet]');
        if (greet) greet.textContent = who ? who + ', your request is in.' : 'Your request is in.';
      }
      if (fields) fields.style.display = 'none';
      if (success) {
        success.classList.add('show');
        success.setAttribute('tabindex', '-1');
        success.focus();
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  /* ---- Footer year ---- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
