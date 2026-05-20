// EmpowerHer v5 — iMessage-style chat module + Tawk.to embed + formsubmit.co fallback
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

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  function wireChat() {
    var phone = document.querySelector('.im-phone');
    if (!phone) return;
    var form = phone.querySelector('form[data-chat]');
    var stage = phone.querySelector('[data-im-stage]');
    var preview = phone.querySelector('[data-im-preview]');
    var typing = phone.querySelector('[data-im-typing]');
    var okEl = phone.querySelector('[data-im-ok]');
    var msgInput = phone.querySelector('#chat-msg');
    var chips = phone.querySelectorAll('[data-im-chip]');

    // Quick-chip click prefills message and focuses
    chips.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var txt = btn.getAttribute('data-im-chip') || btn.textContent;
        // decode HTML entities
        var d = document.createElement('div'); d.innerHTML = txt;
        msgInput.value = d.textContent;
        msgInput.focus();
        msgInput.dispatchEvent(new Event('input'));
      });
    });

    // Live preview bubble as user types
    var previewBubble = null;
    function syncPreview() {
      var t = msgInput.value.trim();
      if (!t) {
        if (previewBubble) { previewBubble.remove(); previewBubble = null; }
        return;
      }
      if (!previewBubble) {
        previewBubble = document.createElement('div');
        previewBubble.className = 'im-row im-row-out';
        previewBubble.innerHTML = '<div class="im-bubble im-bubble-out"></div>';
        preview.appendChild(previewBubble);
      }
      previewBubble.querySelector('.im-bubble').textContent = t;
      stage.scrollTop = stage.scrollHeight;
    }
    msgInput.addEventListener('input', syncPreview);

    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (form.querySelector('[name=name]') || {}).value || '';
      var email = (form.querySelector('[name=email]') || {}).value || '';
      var message = (msgInput.value || '').trim();
      if (!name.trim() || !email || !email.includes('@') || !message) {
        msgInput.focus();
        msgInput.placeholder = name.trim() && email ? 'Type your message…' : 'Add your name + email above, then send';
        return;
      }
      var btn = form.querySelector('button[type=submit]');
      if (btn) btn.disabled = true;

      // Lock the sent bubble (was previewBubble) and clear input
      if (previewBubble) {
        previewBubble.classList.remove('im-preview-pending');
        previewBubble = null;
      }
      msgInput.value = '';

      // Show typing indicator
      if (typing) typing.hidden = false;
      stage.scrollTop = stage.scrollHeight;

      var endpoint = 'https://formsubmit.co/ajax/' + KENDRA_EMAIL;
      var finish = function () {
        setTimeout(function () {
          if (typing) typing.hidden = true;
          showOk();
        }, 1400);
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
      .then(finish)
      .catch(function () {
        var subject = encodeURIComponent('New message from EmpowerHer website');
        var body = encodeURIComponent('From: ' + name + ' <' + email + '>\n\n' + message);
        try { window.location.href = 'mailto:' + KENDRA_EMAIL + '?subject=' + subject + '&body=' + body; } catch (_) {}
        finish();
      });
    });

    function showOk() {
      form.hidden = true;
      var chipsEl = phone.querySelector('.im-chips');
      if (chipsEl) chipsEl.hidden = true;
      if (okEl) okEl.hidden = false;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { loadTawk(); wireChat(); });
  } else {
    loadTawk(); wireChat();
  }
})();
