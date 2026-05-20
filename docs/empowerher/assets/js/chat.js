// EmpowerHer v4 — Tawk.to embed + formsubmit.co fallback + slick chat module UX
(function () {
  var TAWK_PROPERTY_ID = window.EH_TAWK_PROPERTY_ID || 'PLACEHOLDER_FOR_KENDRAS_ID';
  var TAWK_WIDGET_ID = window.EH_TAWK_WIDGET_ID || 'default';
  var KENDRA_EMAIL = window.EH_KENDRA_EMAIL || 'healthcoachingask@gmail.com';

  function loadTawk() {
    if (TAWK_PROPERTY_ID === 'PLACEHOLDER_FOR_KENDRAS_ID') return;
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
    var block = form.closest('.chat-block');
    var typingEl = block ? block.querySelector('.chat-typing') : null;
    var okEl = block ? block.querySelector('.chat-ok') : null;
    var statusInline = form.querySelector('.chat-status');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (form.querySelector('[name=name]') || {}).value || '';
      var email = (form.querySelector('[name=email]') || {}).value || '';
      var message = (form.querySelector('[name=message]') || {}).value || '';
      if (!email || !email.includes('@') || !message.trim()) {
        if (statusInline) {
          statusInline.textContent = 'Add your email and a quick message so Kendra can reply.';
          statusInline.style.display = 'block';
        } else {
          alert('Please add your email and a quick message so Kendra can reply.');
        }
        return;
      }
      var btn = form.querySelector('button[type=submit]');
      if (btn) { btn.disabled = true; }
      if (typingEl) { typingEl.classList.add('show'); }

      var endpoint = 'https://formsubmit.co/ajax/' + KENDRA_EMAIL;
      var doneFn = function () {
        setTimeout(function () {
          if (typingEl) typingEl.classList.remove('show');
          showOk();
        }, 1300);
      };
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
      .then(doneFn)
      .catch(function () {
        // Fallback: mailto so the message still reaches Kendra
        var subject = encodeURIComponent('New message from EmpowerHer website');
        var body = encodeURIComponent('From: ' + name + ' <' + email + '>\n\n' + message);
        try { window.location.href = 'mailto:' + KENDRA_EMAIL + '?subject=' + subject + '&body=' + body; } catch (_) {}
        doneFn();
      });
    });

    function showOk() {
      form.style.display = 'none';
      if (okEl) {
        okEl.classList.add('show');
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { loadTawk(); wireChatForm(); });
  } else {
    loadTawk(); wireChatForm();
  }
})();
