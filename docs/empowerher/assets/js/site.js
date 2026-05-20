// EmpowerHer v2 — mobile menu, carousel, exit-intent, lead-magnet, video modal
(function () {
  // ---------- Mobile menu ----------
  const ham = document.querySelector('.hamburger');
  const menu = document.querySelector('.mobile-menu');
  const closeBtn = document.querySelector('.mobile-menu .close');
  if (ham && menu) {
    ham.addEventListener('click', () => { menu.classList.add('open'); document.body.style.overflow = 'hidden'; });
    if (closeBtn) closeBtn.addEventListener('click', () => { menu.classList.remove('open'); document.body.style.overflow = ''; });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { menu.classList.remove('open'); document.body.style.overflow = ''; }));
  }

  // ---------- Testimonial carousel ----------
  const slides = document.querySelectorAll('.testimonial');
  const dots = document.querySelectorAll('.carousel-dots button');
  if (slides.length > 1) {
    let i = 0;
    const show = (n) => {
      slides.forEach((s, idx) => s.classList.toggle('active', idx === n));
      dots.forEach((d, idx) => d.classList.toggle('active', idx === n));
      i = n;
    };
    dots.forEach((d, idx) => d.addEventListener('click', () => show(idx)));
    setInterval(() => show((i + 1) % slides.length), 6000);
  }

  // ---------- Exit-intent (desktop only) ----------
  const exit = document.querySelector('.exit-modal');
  if (exit && window.matchMedia('(min-width: 860px)').matches) {
    let shown = false;
    const trigger = (e) => {
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
    const closeExit = exit.querySelector('.close');
    if (closeExit) closeExit.addEventListener('click', () => exit.classList.remove('show'));
    exit.addEventListener('click', (e) => { if (e.target === exit) exit.classList.remove('show'); });
  }

  // ---------- Lead-magnet forms (capture and confirm) ----------
  document.querySelectorAll('form[data-lead]').forEach(f => {
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = f.querySelector('input[type=email]').value.trim();
      if (!email || !email.includes('@')) return;
      // Open mailto to kendra with prefilled subject
      const subject = encodeURIComponent('Send me the 7-day kickstart guide');
      const body = encodeURIComponent('Email: ' + email + '\n\nHi Kendra — please send me the free 7-day kickstart guide. Thanks!');
      window.location.href = 'mailto:kendra@empowerher-healthcoaching.com?subject=' + subject + '&body=' + body;
      f.innerHTML = '<p class="ok" style="color:white;font-weight:600;">Thanks! Your email app just opened — hit send to get the guide.</p>';
    });
  });

  // ---------- Video modal ----------
  document.querySelectorAll('[data-video]').forEach(el => {
    el.addEventListener('click', () => {
      alert("Kendra's intro video is coming soon! In the meantime, message her on Instagram @empowerher.healthcoaching to chat.");
    });
  });

  // ---------- Animate stat counters on view ----------
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        let cur = 0;
        const step = target / 30;
        const t = setInterval(() => {
          cur += step;
          if (cur >= target) { cur = target; clearInterval(t); }
          el.textContent = (target % 1 === 0 ? Math.round(cur) : cur.toFixed(1)) + suffix;
        }, 40);
        obs.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach(c => obs.observe(c));
  }
})();
