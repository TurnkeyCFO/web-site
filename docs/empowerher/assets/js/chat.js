// EmpowerHer v3 — Tawk.to embed + formsubmit.co fallback chat
(function () {
  // Property ID swap-in by Ricky once Kendra creates her free Tawk.to account.
  // Window override hook for per-environment swap (e.g. staging).
  var TAWK_PROPERTY_ID = window.EH_TAWK_PROPERTY_ID || 'PLACEHOLDER_FOR_KENDRAS_ID';
  var TAWK_WIDGET_ID = window.EH_TAWK_WIDGET_ID || 'default';
  var KENDRA_EMAIL = window.EH_KENDRA_EMAIL || 'healthcoachingask@gmail.com';

  function loadTawk() {
    if (TAWK_PROPERTY_ID === 'PLACEHOLDER_FOR_KENDRAS_ID') return;
    // Standard Tawk.to embed
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://embed.tawk.to/' + TAWK_PROPERTY_ID + '/' + TAWK_WIDGET_ID;
    s.charset = 'UTF-8';
    s.setAttribute('crossorigin', '*');
    document.body.appendChild(s);
  }

  function wireChatForm() {
    var form = document.querySelector('form[data-chat]');
    if (!form) return;
    var statusEl = form.querySelector('.chat-ok');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (form.querySelector('[name=name]') || {}).value || '';
      var email = (form.querySelector('[name=email]') || {}).value || '';
      var message = (form.querySelector('[name=message]') || {}).value || '';
      if (!email || !email.includes('@') || !message.trim()) {
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.style.background = '#FBE5E0';
          statusEl.style.color = '#A63D1F';
          statusEl.textContent = 'Please add your email and a quick message so Kendra can reply.';
        }
        return;
      }
      var btn = form.querySelector('button[type=submit]');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
      // formsubmit.co AJAX endpoint — free, no signup. First-time only requires
      // recipient to confirm via an email Kendra clicks; after that it just works.
      var endpoint = 'https://formsubmit.co/ajax/' + KENDRA_EMAIL;
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: name,
          email: email,
          message: message,
          _subject: 'New message from EmpowerHer website',
          _template: 'box',
          _captcha: 'false'
        })
      })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function () {
        showOk();
      })
      .catch(function () {
        // Fallback: mailto so the message still reaches Kendra
        var subject = encodeURIComponent('New message from EmpowerHer website');
        var body = encodeURIComponent('From: ' + name + ' <' + email + '>\n\n' + message);
        window.location.href = 'mailto:' + KENDRA_EMAIL + '?subject=' + subject + '&body=' + body;
        showOk();
      });
    });

    function showOk() {
      form.reset();
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.style.background = '';
        statusEl.style.color = '';
        statusEl.innerHTML = "Got it! Kendra usually replies within a few hours. While you wait, follow her on <a href=\"https://www.instagram.com/empowerher.healthcoaching\" rel=\"noopener\" style=\"color:#577D7D;font-weight:700;\">Instagram</a> for daily inspiration.";
      }
      var btn = form.querySelector('button[type=submit]');
      if (btn) { btn.disabled = false; btn.textContent = 'Send'; }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { loadTawk(); wireChatForm(); });
  } else {
    loadTawk(); wireChatForm();
  }
})();
