/* Red Oak Mobile Detailing — site interactions */
(function () {
  "use strict";

  /* ---- mark the document as JS-enabled ----
     The reveal animations hide content with `.js [data-reveal]{opacity:0}`.
     Adding this class here (rather than in the HTML) means that if JS is
     disabled OR this file fails to load, the class is never added and every
     section stays fully visible — no blank page below the hero. */
  document.documentElement.className += " js";

  /* ---- sticky header shadow ---- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- mobile menu ---- */
  var burger = document.querySelector(".hamburger");
  var menu = document.getElementById("mobile-menu");
  if (burger && menu) {
    burger.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        menu.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---- reveal on scroll ---- */
  var reveals = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var d = e.target.getAttribute("data-reveal-delay");
          if (d) e.target.style.transitionDelay = d + "ms";
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- current year ---- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---- booking date: never allow a date in the past ---- */
  var dateInput = document.getElementById("date");
  if (dateInput && dateInput.type === "date") {
    dateInput.min = new Date().toISOString().split("T")[0];
  }

  /* ---- booking / contact form submission ----
     Forms POST to a real handler (Formspree) via fetch so the success UI is
     kept. If no live endpoint is configured yet, or the request fails, the
     submission falls back to the customer's mail client addressed to Marcus
     — so a booking request always reaches a real channel. */
  document.querySelectorAll("form[data-form]").forEach(function (form) {
    var success = form.parentNode.querySelector(".form-success");
    var submitBtn = form.querySelector('button[type="submit"]');

    form.querySelectorAll("input,select,textarea").forEach(function (input) {
      function clear() {
        var field = input.closest(".field");
        if (field) field.classList.remove("field-error");
      }
      input.addEventListener("input", clear);
      input.addEventListener("change", clear);
    });

    function showSuccess() {
      form.style.display = "none";
      if (success) {
        success.classList.add("show");
        success.setAttribute("tabindex", "-1");
        success.focus();
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    function mailtoFallback() {
      var to = form.getAttribute("data-mailto") || "marcus@redoakdetailing.com";
      var subject = form.getAttribute("data-subject") ||
        "Website enquiry — Red Oak Mobile Detailing";
      var lines = [];
      form.querySelectorAll("input,select,textarea").forEach(function (input) {
        if (!input.name || input.name.charAt(0) === "_") return;
        if (input.type === "radio" && !input.checked) return;
        var label = "";
        var lab = input.id && form.querySelector('label[for="' + input.id + '"]');
        if (lab) label = lab.textContent.replace(/\*/g, "").trim();
        var val = input.value;
        if (input.tagName === "SELECT" && input.selectedIndex >= 0) {
          val = input.options[input.selectedIndex].text;
        }
        if (val && val.trim() !== "") {
          lines.push((label || input.name) + ": " + val.trim());
        }
      });
      window.location.href = "mailto:" + to +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(lines.join("\n"));
    }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var ok = true;
      var firstBad = null;

      form.querySelectorAll("[required]").forEach(function (input) {
        var field = input.closest(".field");
        var valid = true;
        if (input.type === "radio") {
          valid = !!form.querySelector('input[name="' + input.name + '"]:checked');
        } else if (input.type === "email") {
          valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
        } else {
          valid = input.value.trim() !== "";
        }
        if (!valid) {
          ok = false;
          if (field) field.classList.add("field-error");
          if (!firstBad) firstBad = input;
        }
      });

      if (!ok) {
        if (firstBad) firstBad.focus();
        return;
      }

      if (submitBtn) submitBtn.disabled = true;

      var endpoint = form.getAttribute("action") || "";
      var configured = /^https?:\/\/.+/.test(endpoint) &&
        endpoint.indexOf("REPLACE_WITH") === -1;

      if (configured && window.fetch) {
        fetch(endpoint, {
          method: "POST",
          body: new FormData(form),
          headers: { "Accept": "application/json" }
        }).then(function (res) {
          if (res.ok) {
            showSuccess();
          } else {
            throw new Error("submit failed");
          }
        }).catch(function () {
          mailtoFallback();
          showSuccess();
        });
      } else {
        mailtoFallback();
        showSuccess();
      }
    });
  });

  /* ---- prefill package on booking page from ?pkg= ---- */
  try {
    var params = new URLSearchParams(window.location.search);
    var pkg = params.get("pkg");
    if (pkg) {
      var radio = document.querySelector('.pick input[value="' + pkg + '"]');
      if (radio) radio.checked = true;
    }
  } catch (e) { /* no-op */ }
})();
