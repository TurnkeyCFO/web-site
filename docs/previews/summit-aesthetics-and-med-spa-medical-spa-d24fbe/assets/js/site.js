/* Summit Aesthetics & Med Spa — interactions */
(function () {
  "use strict";

  /* ---- Sticky header ---- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 24);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Mobile nav ---- */
  var burger = document.querySelector(".burger");
  var drawer = document.querySelector(".mobile-nav");
  if (burger && drawer) {
    burger.addEventListener("click", function () {
      var open = drawer.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("no-scroll", open);
    });
    drawer.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        drawer.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
        document.body.classList.remove("no-scroll");
      }
    });
  }

  /* ---- Accordion (FAQ) ---- */
  document.querySelectorAll(".acc-q").forEach(function (q) {
    q.addEventListener("click", function () {
      var panel = q.nextElementSibling;
      var open = q.getAttribute("aria-expanded") === "true";
      // close siblings within same accordion
      var acc = q.closest(".accordion");
      if (acc && !open) {
        acc.querySelectorAll(".acc-q").forEach(function (other) {
          if (other !== q) {
            other.setAttribute("aria-expanded", "false");
            other.nextElementSibling.style.maxHeight = null;
          }
        });
      }
      q.setAttribute("aria-expanded", open ? "false" : "true");
      panel.style.maxHeight = open ? null : panel.scrollHeight + "px";
    });
  });

  /* ---- Scroll reveal ---- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- Filter bars (shop / services / gallery) ---- */
  document.querySelectorAll("[data-filter-group]").forEach(function (bar) {
    var group = bar.getAttribute("data-filter-group");
    var targets = document.querySelectorAll('[data-filter-target="' + group + '"] > [data-cat]');
    bar.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        bar.querySelectorAll("button").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        var cat = btn.getAttribute("data-cat");
        targets.forEach(function (t) {
          var show = cat === "all" || t.getAttribute("data-cat").split(" ").indexOf(cat) > -1;
          t.classList.toggle("is-hidden", !show);
        });
      });
    });
  });

  /* ---- Forms (functional-looking demo submit) ---- */
  document.querySelectorAll("form[data-demo]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var ok = form.querySelector(".form-ok");
      var btn = form.querySelector("[type=submit]");
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
      setTimeout(function () {
        if (ok) {
          ok.classList.add("show");
          ok.setAttribute("role", "status");
          ok.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        form.reset();
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || "Submit"; }
      }, 850);
    });
  });

  /* ---- Year ---- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---- Booking page: step summary ---- */
  var bookForm = document.getElementById("booking-form");
  if (bookForm) {
    var locSel = bookForm.querySelector("#b-location");
    var svcSel = bookForm.querySelector("#b-service");
    var summary = document.getElementById("booking-summary");
    function refresh() {
      if (!summary) return;
      var loc = locSel && locSel.value ? locSel.value : "—";
      var svc = svcSel && svcSel.value ? svcSel.value : "—";
      summary.querySelector("[data-sum=loc]").textContent = loc;
      summary.querySelector("[data-sum=svc]").textContent = svc;
    }
    [locSel, svcSel].forEach(function (s) { if (s) s.addEventListener("change", refresh); });
    refresh();
  }
})();
