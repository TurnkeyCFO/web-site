// EmpowerHer Fitness — minimal vanilla JS
(function () {
  const nav = document.querySelector('.nav');
  const onScroll = () => { if (window.scrollY > 8) nav.classList.add('scrolled'); else nav.classList.remove('scrolled'); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const burger = document.querySelector('.nav-burger');
  const links = document.querySelector('.nav-links');
  if (burger && links) {
    burger.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }

  // Reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '-40px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Message Kendra quick buttons → open the right channel pre-filled
  const KENDRA = {
    email: 'healthcoachingask@gmail.com',
    igHandle: 'empowerher_health_coaching_',
    // phone not public — sms/wa fall back to mailto with same body
    phone: null,
    applyForm: 'https://forms.gle/HTjLUFARbwv1Cbys9'
  };

  function openChannel(channel, body) {
    const subject = 'EmpowerHer Fitness — coaching inquiry';
    const enc = encodeURIComponent(body);
    let url;
    if (channel === 'email') url = `mailto:${KENDRA.email}?subject=${encodeURIComponent(subject)}&body=${enc}`;
    else if (channel === 'instagram') url = `https://ig.me/m/${KENDRA.igHandle}`;
    else if (channel === 'sms' && KENDRA.phone) url = `sms:${KENDRA.phone}?&body=${enc}`;
    else if (channel === 'whatsapp' && KENDRA.phone) url = `https://wa.me/${KENDRA.phone.replace(/\D/g,'')}?text=${enc}`;
    else url = `mailto:${KENDRA.email}?subject=${encodeURIComponent(subject)}&body=${enc}`;
    window.location.href = url;
  }

  document.querySelectorAll('[data-msg]').forEach(card => {
    card.addEventListener('click', (e) => {
      const body = card.getAttribute('data-msg') || '';
      const channel = card.getAttribute('data-channel') || 'email';
      openChannel(channel, body);
    });
  });

  // Channel buttons (use the last-clicked quick-button message if any, else generic)
  let lastMsg = "Hi Kendra! I came across EmpowerHer Fitness and I'd love to learn more about coaching with you.";
  document.querySelectorAll('[data-msg]').forEach(card => {
    card.addEventListener('mouseenter', () => { lastMsg = card.getAttribute('data-msg') || lastMsg; });
    card.addEventListener('focus', () => { lastMsg = card.getAttribute('data-msg') || lastMsg; });
  });
  document.querySelectorAll('[data-channel-only]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openChannel(btn.getAttribute('data-channel-only'), lastMsg);
    });
  });

  // Toast
  window.showToast = function (msg) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2400);
  };
})();
