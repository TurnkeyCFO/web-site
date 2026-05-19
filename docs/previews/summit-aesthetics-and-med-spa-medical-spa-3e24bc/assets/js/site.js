/* Summit Aesthetics & Med Spa — interactions. Vanilla JS, no deps. */
(function () {
  "use strict";
  var doc = document;

  /* ---- Sticky header shadow ---- */
  var header = doc.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Year stamp ---- */
  doc.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---- Desktop dropdowns ---- */
  doc.querySelectorAll(".has-drop").forEach(function (drop) {
    var btn = drop.querySelector("button");
    if (!btn) return;
    var close = function () {
      drop.dataset.open = "false";
      btn.setAttribute("aria-expanded", "false");
    };
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = drop.dataset.open === "true";
      doc.querySelectorAll(".has-drop").forEach(function (d) {
        d.dataset.open = "false";
        var b = d.querySelector("button");
        if (b) b.setAttribute("aria-expanded", "false");
      });
      drop.dataset.open = open ? "false" : "true";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
    });
    drop.addEventListener("mouseenter", function () {
      drop.dataset.open = "true";
      btn.setAttribute("aria-expanded", "true");
    });
    drop.addEventListener("mouseleave", close);
  });
  doc.addEventListener("click", function () {
    doc.querySelectorAll(".has-drop").forEach(function (d) {
      d.dataset.open = "false";
      var b = d.querySelector("button");
      if (b) b.setAttribute("aria-expanded", "false");
    });
  });
  doc.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      doc.querySelectorAll('.has-drop[data-open="true"]').forEach(function (d) {
        d.dataset.open = "false";
      });
      closeMobile();
      closeBag();
    }
  });

  /* ---- Mobile nav ---- */
  var burger = doc.querySelector(".burger");
  var mobileNav = doc.querySelector(".mobile-nav");
  var scrim = doc.querySelector(".scrim");
  function closeMobile() {
    if (!mobileNav) return;
    mobileNav.classList.remove("open");
    if (burger) burger.setAttribute("aria-expanded", "false");
    syncScrim();
  }
  function openMobile() {
    if (!mobileNav) return;
    mobileNav.classList.add("open");
    if (burger) burger.setAttribute("aria-expanded", "true");
    if (scrim) scrim.classList.add("show");
  }
  if (burger) {
    burger.addEventListener("click", function () {
      mobileNav.classList.contains("open") ? closeMobile() : openMobile();
    });
  }
  doc.querySelectorAll(".mobile-close").forEach(function (b) {
    b.addEventListener("click", closeMobile);
  });
  doc.querySelectorAll(".mobile-nav nav a").forEach(function (a) {
    a.addEventListener("click", closeMobile);
  });

  /* ---- Bag drawer ---- */
  var bagDrawer = doc.querySelector(".bag-drawer");
  function closeBag() {
    if (!bagDrawer) return;
    bagDrawer.classList.remove("open");
    syncScrim();
  }
  function openBag() {
    if (!bagDrawer) return;
    bagDrawer.classList.add("open");
    if (scrim) scrim.classList.add("show");
  }
  function syncScrim() {
    if (!scrim) return;
    var anyOpen =
      (mobileNav && mobileNav.classList.contains("open")) ||
      (bagDrawer && bagDrawer.classList.contains("open"));
    scrim.classList.toggle("show", !!anyOpen);
  }
  if (scrim) {
    scrim.addEventListener("click", function () {
      closeMobile();
      closeBag();
    });
  }
  doc.querySelectorAll("[data-open-bag]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault();
      openBag();
    });
  });
  doc.querySelectorAll(".bag-close").forEach(function (b) {
    b.addEventListener("click", closeBag);
  });

  /* ---- Mini-cart state ---- */
  var BAG = [];
  try {
    BAG = JSON.parse(localStorage.getItem("summit_bag") || "[]");
  } catch (e) {
    BAG = [];
  }
  function saveBag() {
    try {
      localStorage.setItem("summit_bag", JSON.stringify(BAG));
    } catch (e) {}
  }
  function money(n) {
    return "$" + n.toFixed(2);
  }
  function renderBag() {
    var count = BAG.reduce(function (s, i) {
      return s + i.qty;
    }, 0);
    doc.querySelectorAll(".bag-count").forEach(function (el) {
      el.textContent = count;
      el.hidden = count === 0;
    });
    var list = doc.querySelector(".bag-items");
    var totalEl = doc.querySelector(".bag-total-val");
    if (!list) return;
    if (BAG.length === 0) {
      list.innerHTML =
        '<div class="bag-empty">Your bag is empty.<br>Explore our medical-grade skincare collection.</div>';
      if (totalEl) totalEl.textContent = money(0);
      return;
    }
    list.innerHTML = BAG.map(function (i, idx) {
      return (
        '<div class="bag-line">' +
        '<div class="bl-thumb media ' + (i.skin || "m-blush") + '"></div>' +
        '<div class="bl-info"><b>' + i.name + "</b>" +
        "<small>Qty " + i.qty + " &middot; " + money(i.price) + "</small></div>" +
        '<button class="bl-rm" data-rm="' + idx + '">Remove</button>' +
        "</div>"
      );
    }).join("");
    var total = BAG.reduce(function (s, i) {
      return s + i.price * i.qty;
    }, 0);
    if (totalEl) totalEl.textContent = money(total);
    list.querySelectorAll("[data-rm]").forEach(function (b) {
      b.addEventListener("click", function () {
        BAG.splice(+b.dataset.rm, 1);
        saveBag();
        renderBag();
      });
    });
  }
  doc.querySelectorAll("[data-add]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var name = btn.dataset.add;
      var price = parseFloat(btn.dataset.price || "0");
      var skin = btn.dataset.skin || "m-blush";
      var found = BAG.find(function (i) {
        return i.name === name;
      });
      if (found) found.qty += 1;
      else BAG.push({ name: name, price: price, qty: 1, skin: skin });
      saveBag();
      renderBag();
      var label = btn.textContent;
      btn.textContent = "Added";
      btn.classList.add("added");
      setTimeout(function () {
        btn.textContent = label;
        btn.classList.remove("added");
      }, 1100);
    });
  });
  renderBag();

  /* ---- Shop filter ---- */
  var filterBtns = doc.querySelectorAll(".filter-btn");
  if (filterBtns.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) {
          b.classList.remove("active");
        });
        btn.classList.add("active");
        var cat = btn.dataset.filter;
        doc.querySelectorAll("[data-cat]").forEach(function (card) {
          var show = cat === "all" || card.dataset.cat === cat;
          card.style.display = show ? "" : "none";
        });
      });
    });
  }

  /* ---- Accordion ---- */
  doc.querySelectorAll(".acc-item").forEach(function (item) {
    var trigger = item.querySelector(".acc-trigger");
    var panel = item.querySelector(".acc-panel");
    if (!trigger || !panel) return;
    trigger.addEventListener("click", function () {
      var open = item.dataset.open === "true";
      var siblings = item.closest(".accordion");
      if (siblings) {
        siblings.querySelectorAll(".acc-item").forEach(function (s) {
          if (s !== item) {
            s.dataset.open = "false";
            var p = s.querySelector(".acc-panel");
            var t = s.querySelector(".acc-trigger");
            if (p) p.style.height = "0px";
            if (t) t.setAttribute("aria-expanded", "false");
          }
        });
      }
      item.dataset.open = open ? "false" : "true";
      trigger.setAttribute("aria-expanded", open ? "false" : "true");
      panel.style.height = open ? "0px" : panel.scrollHeight + "px";
    });
  });
  window.addEventListener("resize", function () {
    doc.querySelectorAll('.acc-item[data-open="true"] .acc-panel').forEach(function (p) {
      p.style.height = p.scrollHeight + "px";
    });
  });

  /* ---- Booking widget choices ---- */
  doc.querySelectorAll(".choice-grid").forEach(function (grid) {
    grid.querySelectorAll(".choice").forEach(function (c) {
      c.addEventListener("click", function () {
        grid.querySelectorAll(".choice").forEach(function (x) {
          x.classList.remove("sel");
        });
        c.classList.add("sel");
        var target = grid.dataset.target;
        if (target) {
          var input = doc.getElementById(target);
          if (input) input.value = c.dataset.value || c.querySelector("b").textContent;
        }
      });
    });
  });

  /* ---- Forms ---- */
  doc.querySelectorAll("form[data-mock]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var card = form.closest(".form-card") || form.parentElement;
      var success = card ? card.querySelector(".form-success") : null;
      if (success) {
        form.style.display = "none";
        success.classList.add("show");
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        form.reset();
      }
    });
  });

  /* ---- Newsletter inline ---- */
  doc.querySelectorAll("form[data-news]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      form.innerHTML =
        '<p style="color:inherit;margin:0;font-weight:500;">Thank you — you are on the list. Watch your inbox for member offers and seasonal treatment guides.</p>';
    });
  });

  /* ---- Reveal on scroll ---- */
  var reveals = doc.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach(function (r) {
      io.observe(r);
    });
  } else {
    reveals.forEach(function (r) {
      r.classList.add("in");
    });
  }

  /* ---- Smooth-scroll for in-page anchors ---- */
  doc.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var target = doc.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
})();
