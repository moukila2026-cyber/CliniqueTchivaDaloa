/* Clinique Tchiva — interactions légères (aucune donnée, aucun appel réseau).
   Rôle : barre de progression, en-tête compact, révélation au défilement,
   reflet des cartes et effet magnétique sur les boutons principaux.
   Désactivé pour prefers-reduced-motion et pour l'espace de gestion (/gestion). */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  var isAdmin = function () { return location.pathname.indexOf("/gestion") === 0; };

  /* 1. Barre de progression de lecture */
  var bar = document.createElement("div");
  bar.className = "v-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);

  /* 2. En-tête compact au défilement + progression (passif, léger) */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      var max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
      bar.style.transform = "scaleX(" + Math.min(1, y / max).toFixed(4) + ")";
      var header = document.querySelector(".site-header");
      if (header) header.classList.toggle("v-scrolled", y > 12);
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* 3. Révélation au défilement (site public uniquement) */
  var SELECTOR = [
    ".info-item",
    ".section-head",
    ".card",
    ".about-art",
    ".about-grid > div",
    ".step",
    ".contact-line",
    ".cta",
    ".faq details",
    ".map",
    ".booking-aside",
    ".footer-grid > div",
    ".prose > *",
    ".service-detail",
    ".service-tile",
    ".insurance-copy",
    ".insurance-panel",
    ".emergency-grid",
    ".clinic-photo",
    ".chip"
  ].join(",");

  var canReveal = !reduce && "IntersectionObserver" in window;
  var pending = new Set();

  function finish(el) {
    el.classList.remove("v-reveal", "v-in");
    el.style.removeProperty("--v-delay");
  }

  var io = canReveal ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      io.unobserve(el);
      pending.delete(el);
      el.classList.add("v-in");
      var done = false;
      var end = function () { if (!done) { done = true; finish(el); } };
      el.addEventListener("transitionend", end, { once: true });
      window.setTimeout(end, 1400); // filet de sécurité si aucune transition
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }) : null;

  function prepare(scope) {
    if (!canReveal || isAdmin()) return;
    scope.querySelectorAll(SELECTOR).forEach(function (el) {
      if (el.dataset.vr === "1" || el.closest(".v-reveal")) return;
      el.dataset.vr = "1";
      var siblings = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.classList.add("v-reveal");
      el.style.setProperty("--v-delay", ((siblings % 3) * 0.1).toFixed(2) + "s");
      pending.add(el);
      io.observe(el);
    });
    // Nettoie les éléments retirés par un changement de page
    pending.forEach(function (el) {
      if (!el.isConnected) { io.unobserve(el); pending.delete(el); }
    });
  }

  /* 4. Reflet qui suit le pointeur sur les cartes */
  if (fine && !reduce) {
    document.addEventListener("pointermove", function (e) {
      var card = e.target && e.target.closest ? e.target.closest(".card, .service-tile, .insurance-panel, .call-group") : null;
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });
  }

  /* 5. Effet magnétique léger sur les boutons principaux (souris uniquement) */
  if (fine && !reduce) {
    var MAGNET = ".hero-actions .btn, .cta .btn, .map-actions .btn, .service-actions .btn";
    document.addEventListener("pointermove", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest(MAGNET) : null;
      if (!btn) return;
      var r = btn.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) * 0.12;
      var dy = (e.clientY - (r.top + r.height / 2)) * 0.18;
      btn.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
    }, { passive: true });
    document.addEventListener("pointerout", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest(MAGNET) : null;
      if (btn && !btn.contains(e.relatedTarget)) btn.style.transform = "";
    }, { passive: true });
  }

  /* 6. Observer le rendu de l'application (pages changées par app.js) */
  var app = document.getElementById("app");
  if (app) {
    prepare(app);
    var mo = new MutationObserver(function () { prepare(app); });
    mo.observe(app, { childList: true, subtree: true });
  }

  root.classList.add("v-ready");
})();
