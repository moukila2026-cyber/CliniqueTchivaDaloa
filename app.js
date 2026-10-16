"use strict";
const $ = (s, r = document) => r.querySelector(s),
  $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (x) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const ICONS = {
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  phone:
    '<path d="M5 3h4l2 5-3 2a16 16 0 0 0 6 6l2-3 5 2v4c0 2-2 3-4 2A23 23 0 0 1 3 7c-1-2 0-4 2-4Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-12 5h2m4 0h2"/>',
  heart:
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/><path d="M3 11h5l2-4 3 8 2-4h6"/>',
  shield:
    '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  users:
    '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-16a3 3 0 0 1 0 6m2 10v-3a6 6 0 0 0-3-5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  chat: '<path d="M21 11.5a9 9 0 0 1-9.5 9 10 10 0 0 1-4-.9L2 22l1.7-5.5a9 9 0 1 1 17.3-5Z"/><path d="M7.5 7.5c1.3 4 3 6 7 8l2-2-3-2-1 1c-1.2-.6-2.2-1.6-2.8-2.8l1-1-1.5-2.5Z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  file: '<path d="M14 3H5v18h14V8l-5-5Z"/><path d="M14 3v5h5M8 12h8m-8 4h5"/>',
  wallet:
    '<path d="M20 8V5H6a3 3 0 0 0 0 6h15v10H5a3 3 0 0 1-3-3V8m19 6h-5v4h5"/>',
  box: '<path d="m12 3 9 5v9l-9 5-9-5V8l9-5Zm0 9 9-4M3 8l9 4v10M7 5.5l10 5"/>',
  chart: '<path d="M4 3v18h17M8 16v-5m5 5V6m5 10v-8"/>',
  settings:
    '<path d="m9 3-1 3-3 1v3l-2 2 2 2v3l3 1 1 3h6l1-3 3-1v-3l2-2-2-2V7l-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3h.01"/>',
  external: '<path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7"/>',
  logout: '<path d="M9 3H3v18h6m0-9h12m-5-5 5 5-5 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="m15 4 5 5M3 21l5-1L21 7a3.5 3.5 0 0 0-5-5L3 15v6Z"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-11 12h4"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 4v3"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
  stethoscope:
    '<path d="M5 3v5a5 5 0 0 0 10 0V3M3 3h4m6 0h4m-7 10v3a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="11" r="3"/>',
  siren:
    '<path d="M5 20h14M6.5 20v-3.5h11V20"/><path d="M9 16.5V10a3 3 0 0 1 6 0v6.5"/><path d="M12 4.5V2.5M5.2 6.7 3.8 5.3M18.8 6.7l1.4-1.4"/><path d="M12 9.5v3"/>',
  flask:
    '<path d="M9.5 3h5M10.5 3v5L5.8 17a2 2 0 0 0 1.8 3h8.8a2 2 0 0 0 1.8-3L13.5 8V3"/><path d="M8 15h8"/>',
  eye:
    '<path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.6"/>',
  ear:
    '<path d="M8.5 9a4 4 0 1 1 8 0c0 2.6-2.6 3-3.6 4.6-1 1.6-.9 3-.9 4.4A3.5 3.5 0 0 1 8.5 21"/><path d="M11.2 8.8a1.6 1.6 0 0 1 3 0"/>',
  bandage:
    '<rect x="2.4" y="8.6" width="19.2" height="6.8" rx="3.4" transform="rotate(-22 12 12)"/><path d="M10.2 11.6h.01M13.8 12.4h.01M12 10h.01"/>',
  card:
    '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19"/><path d="M6 15h4"/>',
  whatsapp:
    '<path d="M12 3a9 9 0 0 0-7.7 13.7L3.2 21l4.5-1.2A9 9 0 1 0 12 3Z"/><path d="M9.2 9.4c0 3 2.4 5.4 5.4 5.4.6 0 1.1-.5 1.1-1.1v-.6l-1.6-.8-.8.8c-1-.4-1.9-1.3-2.3-2.3l.8-.8-.8-1.6H10c-.6 0-1.1.5-1.1 1Z"/>',
};
const icon = (n) =>
  `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ICONS.info}</svg>`;
let S = {},
  needsSetup = false,
  me = null,
  route = location.pathname,
  tab = "general",
  calDate = new Date(),
  appointmentCache = [],
  transactionCache = [],
  inventoryCache = [],
  consultationCache = [],
  search = "",
  statusFilter = "all",
  reportStart = "",
  reportEnd = "";
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Abidjan",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const money = (n) => new Intl.NumberFormat("fr-FR").format(n || 0),
  dateFr = (d) =>
    d
      ? new Date(d + "T12:00:00").toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";
const initials = (n) =>
  String(n)
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
const roles = {
  admin: "Administrateur",
  reception: "Accueil",
  medical: "Équipe médicale",
  accounting: "Comptabilité",
};
const statuses = {
  pending: "À confirmer",
  confirmed: "Confirmé",
  completed: "Terminé",
  cancelled: "Annulé",
};
const badge = (s) =>
  `<span class="tag ${esc(s)}">${esc(statuses[s] || s)}</span>`;
const can = (...r) => me && (me.role === "admin" || r.includes(me.role));
function toast(t) {
  $("#toast").textContent = t;
  $("#toast").classList.add("visible");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $("#toast").classList.remove("visible"), 4200);
}
async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (me?.csrf) headers["X-CSRF-Token"] = me.csrf;
  const response = await fetch("/api" + path, {
    credentials: "same-origin",
    ...options,
    headers,
  });
  let data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (
      response.status === 401 &&
      route.startsWith("/gestion") &&
      path != "/login"
    ) {
      me = null;
    }
    let msg =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
          ? "Vérifiez les champs du formulaire."
          : "Une erreur est survenue.";
    throw new Error(msg);
  }
  return data;
}
const post = (p, b) => api(p, { method: "POST", body: JSON.stringify(b) });
function go(path) {
  if (path !== location.pathname) {
    history.pushState({}, "", path);
  }
  route = path;
  search = "";
  statusFilter = "all";
  render();
  window.scrollTo(0, 0);
}
window.addEventListener("popstate", () => {
  route = location.pathname;
  render();
});
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[data-link]");
  if (a && !e.metaKey && !e.ctrlKey) {
    e.preventDefault();
    go(a.getAttribute("href"));
  }
});
function brand() {
  return `<a class="brand" href="/" data-link aria-label="Clinique Tchiva, accueil"><img class="brand-mark" src="/static/logo.png" alt="Logo de la Clinique Tchiva" onerror="this.onerror=null;this.src='/static/favicon.svg'"><div class="brand-name">Clinique Tchiva<small>DALOA · TAZIBOUO</small></div></a>`;
}
function whatsappNumber() {
  let p = (S.whatsapp || "").replace(/[^0-9]/g, "");
  return p.length === 10 ? "225" + p : p;
}
/* --------------------------------------------------------------------------
   Coordonnées de la clinique. Les valeurs de secours reprennent la fiche
   officielle communiquée par la clinique ; les réglages restent modifiables
   depuis l’espace de gestion.
   -------------------------------------------------------------------------- */
const digitsOnly = (x) => String(x ?? "").replace(/[^0-9]/g, ""),
  telHref = (x) => "tel:+" + digitsOnly(x),
  emergencyPhone = () => S.emergency_phone || "+225 07 88 97 55 16",
  landlinePhone = () => S.phone || "+225 27 24 37 50 80",
  receptionPhones = () =>
    S.reception_phones && S.reception_phones.length
      ? S.reception_phones
      : ["+225 07 07 99 54 14", "+225 05 05 81 94 44"],
  plusCode = () => S.plus_code || "WH48+HFJ Daloa",
  gpsLat = () => String(S.latitude || "6.90645"),
  gpsLng = () => String(S.longitude || "-6.43381"),
  mapEmbedUrl = () =>
    S.map_url ||
    `https://www.google.com/maps?q=${gpsLat()},${gpsLng()}&output=embed`,
  mapPointUrl = () => `https://www.google.com/maps?q=${gpsLat()},${gpsLng()}`,
  mapDirectionsUrl = () =>
    `https://www.google.com/maps/dir/?api=1&destination=${gpsLat()},${gpsLng()}`,
  insuranceList = () =>
    S.insurances && S.insurances.length
      ? S.insurances
      : ["CNAM", "ASCOMA", "SANLAM", "AXA", "GMC", "MUGEF-CI"];
function openWhatsApp(message) {
  const p = whatsappNumber();
  if (!p) {
    modal(
      "Renseignements WhatsApp",
      `<div class="notice">${icon("info")}<div>Le numéro WhatsApp de la clinique n’a pas encore été renseigné. Vous pouvez déposer une demande de rendez-vous en ligne ou vous rendre à l’accueil.</div></div><p class="text-small">${esc(S.address)}, ${esc(S.city)}.</p><div class="form-actions"><a class="btn" href="/rendez-vous" data-link onclick="closeModal()">Demander un rendez-vous ${icon("arrow")}</a></div>`,
    );
    return;
  }
  window.open(
    "https://wa.me/" +
      p +
      "?text=" +
      encodeURIComponent(message || "Bonjour, je souhaite un renseignement auprès de la Clinique Tchiva de Daloa."),
    "_blank",
    "noopener,noreferrer",
  );
}
/* Sélecteur de motif WhatsApp : le message est pré-rempli selon le besoin. */
const WHATSAPP_MOTIFS = [
  {
    id: "general",
    icon: "info",
    title: "Renseignement général",
    hint: "Horaires, accès, prise en charge, documents à apporter.",
    message:
      "Bonjour, je souhaite un renseignement général auprès de la Clinique Tchiva de Daloa.",
  },
  {
    id: "laboratoire",
    icon: "flask",
    title: "Tarifs laboratoire",
    hint: "Analyses, bilans à jeun et sérologies : demandez la grille tarifaire.",
    message:
      "Bonjour, je souhaite connaître les tarifs des analyses de laboratoire à la Clinique Tchiva de Daloa.",
  },
  {
    id: "specialiste",
    icon: "calendar",
    title: "Demande de rendez-vous spécialiste",
    hint: "Ophtalmologie, ORL, chirurgie ou suivi médical.",
    message:
      "Bonjour, je souhaite demander un rendez-vous avec un spécialiste (médecine générale, ophtalmologie, ORL, laboratoire ou chirurgie) à la Clinique Tchiva de Daloa.",
  },
];
function whatsapp() {
  const p = whatsappNumber();
  if (!p) {
    openWhatsApp();
    return;
  }
  modal(
    "Écrire à la clinique sur WhatsApp",
    `<div class="wa-menu"><p class="menu-intro">Choisissez votre motif : le message est pré-rempli, vous pouvez le compléter avant l’envoi.</p>${WHATSAPP_MOTIFS.map(
      (m) =>
        `<button class="wa-option" data-wa="${m.id}"><span class="wa-icon">${icon(m.icon)}</span><span class="wa-body"><strong>${esc(m.title)}</strong><small>${esc(m.hint)}</small></span><span class="wa-go">${icon("whatsapp")}</span></button>`,
    ).join("")}<p class="legal-note">${icon("external")} La conversation s’ouvre sur WhatsApp, un service externe soumis à ses propres conditions. N’y communiquez pas d’informations médicales sensibles.</p></div>`,
  );
  $$("[data-wa]").forEach((b) => {
    const m = WHATSAPP_MOTIFS.find((x) => x.id === b.dataset.wa);
    b.onclick = () => {
      closeModal();
      openWhatsApp(m.message);
    };
  });
}
/* Menu d’appel : standard, urgences 24h/24 et accueil. */
function phoneMenu() {
  const reception = receptionPhones();
  const lines = [
    {
      label: "Standard fixe",
      hint: "Appels et suivi administratif, aux heures d’accueil.",
      numbers: [landlinePhone()],
      icon: "phone",
    },
    {
      label: "Urgences & Garde 24h/24",
      hint: "Joignable jour et nuit, week-ends et jours fériés.",
      numbers: [emergencyPhone()],
      icon: "siren",
      urgent: true,
    },
    {
      label: "Accueil & Renseignements",
      hint: "Rendez-vous, horaires, orientation et préparation de votre venue.",
      numbers: reception,
      icon: "users",
    },
  ];
  modal(
    "Appeler la Clinique Tchiva",
    `<div class="call-menu"><p class="menu-intro">Choisissez le poste à joindre. L’appel part directement depuis votre téléphone.</p>${lines
      .map(
        (l) =>
          `<div class="call-group${l.urgent ? " urgent" : ""}"><div class="call-head"><span class="call-icon">${icon(l.icon)}</span><div><strong>${esc(l.label)}</strong><small>${esc(l.hint)}</small></div></div><div class="call-numbers">${l.numbers
            .map(
              (n) =>
                `<a class="call-number" href="${telHref(n)}">${icon("phone")}<span>${esc(n)}</span></a>`,
            )
            .join("")}</div></div>`,
      )
      .join("")}<div class="notice warning">${icon("siren")}<div>En cas d’urgence vitale, appelez directement le <strong>${esc(emergencyPhone())}</strong>. Le formulaire en ligne et WhatsApp ne sont pas surveillés en permanence.</div></div></div>`,
  );
}
function header() {
  const items = [
    ["/", "Accueil"],
    ["/clinique", "La clinique"],
    ["/services", "Nos services"],
    ["/equipe", "Notre équipe"],
    ["/contact", "Contact"],
  ];
  return `<div class="emergency-bar"><div class="container emergency-inner"><span class="emergency-beacon" aria-hidden="true"></span><p class="emergency-text"><strong>Urgences médicales 24h/24</strong><a class="emergency-number" href="${telHref(emergencyPhone())}">${esc(emergencyPhone())}</a></p><a class="emergency-call" href="${telHref(emergencyPhone())}">${icon("siren")}<span>Appeler les urgences</span></a></div></div><div class="topbar"><div class="container"><span>${icon("pin")} Tazibouo, en face du Collège La Paix · Daloa</span><a href="/gestion" data-link>${icon("lock")} Espace personnel</a></div></div><header class="site-header"><div class="container header-inner">${brand()}<nav class="nav" id="public-nav" aria-label="Navigation principale">${items.map(([p, t]) => `<a href="${p}" data-link class="${route === p ? "active" : ""}" ${route === p ? 'aria-current="page"' : ""}>${t}</a>`).join("")}</nav><div class="header-actions"><button class="btn ghost header-call" data-phone>${icon("phone")} Téléphoner</button><a class="btn header-cta" href="/rendez-vous" data-link>${icon("calendar")} Prendre rendez-vous</a></div><button class="menu-toggle" id="menu-toggle" aria-label="Ouvrir le menu" aria-expanded="false">${icon("menu")}</button></div></header>`;
}
function footer() {
  return `<footer class="footer"><div class="container"><div class="footer-grid"><div>${brand()}<p>Une clinique de proximité, au cœur de Daloa.<br>Votre santé, notre priorité.</p></div><div><h4>La clinique</h4><ul><li><a href="/clinique" data-link>Qui sommes-nous ?</a></li><li><a href="/services" data-link>Nos services</a></li><li><a href="/equipe" data-link>Notre équipe médicale</a></li></ul></div><div><h4>Votre visite</h4><ul><li><a href="/rendez-vous" data-link>Prendre rendez-vous</a></li><li><a href="/contact" data-link>Horaires & accès</a></li><li><a href="/contact" data-link>Nous contacter</a></li></ul></div><div><h4>Retrouvez-nous</h4><p>${esc(S.address)}<br>${esc(S.city)}, Côte d’Ivoire<br><small>Plus Code ${esc(plusCode())} · GPS ${esc(gpsLat())}, ${esc(gpsLng())}</small></p><a href="${telHref(landlinePhone())}">${icon("phone")} Standard : ${esc(landlinePhone())}</a><br><a class="footer-urgent" href="${telHref(emergencyPhone())}">${icon("siren")} Urgences 24h/24 : ${esc(emergencyPhone())}</a><br><a class="muted-link" href="${telHref(receptionPhones()[0])}"><small>Accueil : ${esc(receptionPhones().join(" · "))}</small></a></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} Clinique Tchiva. Tous droits réservés.</span><div><a href="/mentions-legales" data-link>Mentions légales</a><a href="/confidentialite" data-link>Confidentialité</a><a href="/gestion" data-link>Espace de gestion ${icon("external")}</a></div></div></div></footer><button class="whatsapp" id="whatsapp-float" title="Contacter la clinique sur WhatsApp" aria-label="Contacter la clinique sur WhatsApp">${icon("whatsapp")}</button><div class="callbar" id="callbar"><a class="callbar-btn urgent" href="${telHref(emergencyPhone())}">${icon("siren")}<span>Urgence 24h/24</span></a><button class="callbar-btn" data-phone>${icon("phone")}<span>Téléphoner</span></button><button class="callbar-btn" data-whatsapp>${icon("whatsapp")}<span>WhatsApp</span></button></div>`;
}
function pageHero(kicker, title, description) {
  return `<section class="page-hero"><div class="container"><div class="breadcrumbs"><a href="/" data-link>Accueil</a>${icon("chevron")}<span>${esc(kicker)}</span></div><div class="eyebrow">CLINIQUE TCHIVA · DALOA</div><h1>${title}</h1><p>${description}</p></div></section>`;
}
function cta() {
  return `<div class="cta"><div><h2>Faisons le premier pas,<br>ensemble.</h2><p>Une question ou besoin d’un rendez-vous ? Nous sommes à votre écoute.</p></div><div class="hero-actions"><a href="/rendez-vous" data-link class="btn light">Demander un rendez-vous ${icon("arrow")}</a><button class="btn ghost" data-whatsapp>${icon("whatsapp")} Écrivez-nous</button></div></div>`;
}
/* --------------------------------------------------------------------------
   Fiches pratiques des cinq services publiés par la clinique.
   Le texte reste celui validé par la clinique dans les réglages ; les
   compléments ci-dessous (repères, consignes) sont des fiches d’information.
   -------------------------------------------------------------------------- */
const SERVICE_DETAILS = [
  {
    keys: ["medecine", "general"],
    icon: "stethoscope",
    image: "/static/img/service-medecine-generale.jpg",
    alt: "Consultation de médecine générale entre un médecin, un patient adulte et son enfant",
    tag: "Médecine générale",
    short: "Consultations adultes et enfants, bilans de santé, suivi des maladies chroniques.",
    highlights: [
      "Consultations adultes et pédiatriques",
      "Bilans de santé et conseils de prévention",
      "Suivi des pathologies chroniques : hypertension, diabète, paludisme",
      "Orientation vers les spécialités de la clinique",
    ],
    practical:
      "Apportez vos ordonnances, vos résultats d’analyses et vos traitements en cours.",
  },
  {
    keys: ["ophtalmo", "oeil", "yeux", "vision"],
    icon: "eye",
    image: "/static/img/service-ophtalmologie.jpg",
    alt: "Examen de la vue avec un appareil de réfraction chez un ophtalmologue",
    tag: "Ophtalmologie",
    short: "Réfraction, acuité visuelle, dépistage de la cataracte et du glaucome.",
    highlights: [
      "Examens de réfraction et mesure de l’acuité visuelle",
      "Dépistage de la cataracte et du glaucome",
      "Bilans ophtalmologiques complets",
      "Suivi des affections de la vision et conseils de correction",
    ],
    practical:
      "Venez avec vos lunettes ou lentilles actuelles. En cas d’examen avec dilatation de la pupille, prévoyez un accompagnant.",
  },
  {
    keys: ["orl", "oto", "oreille", "rhino"],
    icon: "ear",
    image: "/static/img/service-orl.jpg",
    alt: "Consultation ORL avec examen de l’oreille à l’otoscope",
    tag: "ORL",
    short: "Oreilles, nez, gorge : diagnostic, audiométrie et soins spécialisés.",
    highlights: [
      "Consultations et diagnostics des affections des oreilles, du nez et de la gorge",
      "Audiométrie et évaluation de l’audition",
      "Soins spécialisés et suivi des troubles ORL",
      "Conseils de prévention audition et voix",
    ],
    practical:
      "Signalez à l’accueil vos traitements en cours et apportez vos anciens comptes rendus.",
  },
  {
    keys: ["laboratoire", "analyse", "biologie", "labo"],
    icon: "flask",
    image: "/static/img/service-laboratoire.jpg",
    alt: "Technicien de laboratoire manipulant des tubes de prélèvements sanguins",
    tag: "Laboratoire d’analyses médicales",
    short: "Prélèvements sur place, biochimie, NFS, bilans à jeun et sérologies.",
    highlights: [
      "Prélèvements réalisés sur place",
      "Analyses biochimiques et hématologie (NFS)",
      "Bilans à jeun et sérologies",
      "Consignes de prélèvement précisées avant votre venue",
    ],
    practical:
      "Pour un bilan à jeun (glycémie, bilan lipidique), ne mangez pas pendant 12 heures ; l’eau reste autorisée. Apportez votre ordonnance et signalez vos traitements.",
  },
  {
    keys: ["chirurgie", "chirurgical", "operation"],
    icon: "bandage",
    image: "/static/img/service-chirurgie.jpg",
    alt: "Salle de petite chirurgie avec une équipe soignante et du matériel stérile",
    tag: "Chirurgie",
    short: "Consultations chirurgicales, petites chirurgies, pansements et suivi.",
    highlights: [
      "Consultations chirurgicales spécialisées",
      "Petites chirurgies et actes réalisés sur place",
      "Pansements et soins post-opératoires",
      "Suivi jusqu’à cicatrisation complète",
    ],
    practical:
      "Apportez vos examens d’imagerie, comptes rendus et la liste de vos traitements, y compris les anticoagulants.",
  },
];
const norm = (x) =>
  String(x || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
const detailFor = (name) => {
  const n = norm(name);
  return SERVICE_DETAILS.find((d) => d.keys.some((k) => n.includes(norm(k))));
};
function serviceCards() {
  const list = S.specialties || [];
  if (!list.length)
    return `<div class="empty-state">${icon("stethoscope")}<h3>Notre offre de soins se précise.</h3><p>La liste des services et spécialités est en cours de renseignement par la clinique. Pour connaître les consultations disponibles, rapprochez-vous de l’accueil.</p><a class="btn" href="/contact" data-link>Nous contacter ${icon("arrow")}</a></div>`;
  return `<div class="service-list">${list
    .map((s, i) => {
      const d = detailFor(s.name);
      return `<article class="service-detail" id="service-${i + 1}"><div class="service-media"><img src="${d ? d.image : "/static/hero-clinic.jpg"}" alt="${esc(d ? d.alt : "")}" loading="lazy" decoding="async"><span class="service-tag">${icon(d ? d.icon : "stethoscope")}<span>${esc(d ? d.tag : s.name)}</span></span></div><div class="service-body"><div class="icon-box">${icon(d ? d.icon : "stethoscope")}</div><h3>${esc(s.name)}</h3><p>${esc(s.description || "Renseignez-vous auprès de l’accueil pour connaître les modalités de consultation.")}</p>${
        d
          ? `<ul class="checks">${d.highlights.map((h) => `<li>${icon("check")} ${esc(h)}</li>`).join("")}</ul><div class="service-practical">${icon("info")}<div><strong>Pour préparer votre venue</strong><span>${esc(d.practical)}</span></div></div>`
          : ""
      }<div class="service-actions"><a class="btn small" href="/rendez-vous" data-link>${icon("calendar")} Rendez-vous</a><button class="btn small secondary" data-phone>${icon("phone")} Téléphoner</button><button class="btn small ghost" data-whatsapp>${icon("whatsapp")} WhatsApp</button></div></div></article>`;
    })
    .join("")}</div>`;
}
function servicesPreview() {
  const list = (S.specialties || []).map((s) => ({ ...s, ...detailFor(s.name) }));
  if (!list.length) return "";
  return `<section class="section sage"><div class="container"><div class="section-head"><div><div class="eyebrow">CINQ SPÉCIALITÉS, UN SEUL LIEU</div><h2>Nos services,<br>en un coup d’œil.</h2></div><a class="text-link" href="/services" data-link>Voir les fiches détaillées ${icon("arrow")}</a></div><div class="service-tiles">${list
    .map(
      (s) =>
        `<a class="service-tile" href="/services" data-link><span class="service-tile-img"><img src="${s.image || "/static/hero-clinic.jpg"}" alt="${esc(s.alt || "")}" loading="lazy" decoding="async"></span><span class="service-tile-body"><span class="service-tile-icon">${icon(s.icon || "stethoscope")}</span><strong>${esc(s.name)}</strong><small>${esc(s.short || s.description || "")}</small></span>`,
    )
    .join("")}</div></div></section>`;
}
function insurancesSection(compact = false) {
  const list = insuranceList();
  return `<section class="section insurance-section${compact ? " compact" : ""}"><div class="container insurance-grid"><div class="insurance-copy"><div class="eyebrow">ASSURANCES & MUTUELLES</div><h2>Votre prise en charge,<br>simplifiée.</h2><p>La Clinique Tchiva accueille les patients assurés auprès des organismes conventionnés. Présentez vos documents à l’accueil : vos droits sont vérifiés avec votre organisme avant la consultation.</p><ul class="checks"><li>${icon("check")} Tiers-payant selon les conditions de votre organisme</li><li>${icon("check")} Vérification de vos droits à l’accueil, avant les soins</li><li>${icon("check")} Un éventuel reste à charge vous est annoncé clairement</li></ul><div class="insurance-chips">${list.map((x) => `<span class="chip">${icon("card")}${esc(x)}</span>`).join("")}</div></div><div class="insurance-panel"><img class="insurance-photo" src="/static/img/accueil-assurances.jpg" alt="Accueil de la clinique accompagnant un patient avec ses documents d’assurance" loading="lazy" decoding="async"><h3>Documents à fournir</h3><ol class="insurance-docs"><li>Le bon de consultation ou la prise en charge délivré par votre organisme</li><li>Votre carte d’assuré ou de mutuelle en cours de validité</li><li>Une pièce d’identité</li></ol><p class="legal-note">Sans ces documents, la consultation est réglée sur place puis remboursée selon les règles de votre organisme. La liste des organismes conventionnés est tenue à jour par la clinique.</p></div></div></section>`;
}
function home() {
  return `<section class="hero"><div class="container hero-grid"><div class="hero-copy"><div class="location-pill"><span class="dot"></span> À VOS CÔTÉS, À DALOA</div><h1>Votre santé,<br><em>notre priorité.</em></h1><p>À chaque étape, une attention qui fait la différence. La Clinique Tchiva vous accueille à Tazibouo, au plus près de vous et de votre famille.</p><div class="hero-actions"><a class="btn" href="/rendez-vous" data-link>Prendre rendez-vous ${icon("arrow")}</a><a class="btn secondary" href="/clinique" data-link>Découvrir la clinique</a></div><div class="hero-note">${icon("shield")} Une demande simple. Vos informations restent confidentielles.</div></div><div class="hero-visual"><img class="hero-photo" src="/static/hero-clinic.jpg" alt="Illustration d’une professionnelle de santé dans un cadre accueillant" fetchpriority="high"><span class="photo-tag">${icon("heart")} L’humain au cœur du soin</span><div class="care-float"><div class="symbol">${icon("stethoscope")}</div><div><strong>Proches de vous.</strong><span>À Tazibouo, au cœur de Daloa.</span></div></div><small class="photo-caption">Visuel d’illustration généré par IA · ne représente pas l’équipe</small></div></div></section><section class="info-strip" aria-label="Informations pratiques"><div class="container info-four"><a class="info-item" href="/contact" data-link>${icon("pin")}<div><strong>Facile à trouver</strong><span>Tazibouo, en face du Collège La Paix</span></div></a><a class="info-item urgent" href="${telHref(emergencyPhone())}">${icon("siren")}<div><strong>Urgences 24h/24</strong><span>${esc(emergencyPhone())}</span></div></a><a class="info-item" href="/contact" data-link>${icon("clock")}<div><strong>Préparez votre visite</strong><span>${S.hours ? "Consulter nos horaires d’accueil" : "Horaires à confirmer auprès de l’accueil"}</span></div></a><a class="info-item" href="/rendez-vous" data-link>${icon("calendar")}<div><strong>Un rendez-vous, simplement</strong><span>Faites votre demande en ligne</span></div></a></div></section><section class="section"><div class="container"><div class="section-head"><div><div class="eyebrow">À CHAQUE BESOIN, UNE ÉCOUTE</div><h2>Comment pouvons-nous<br>vous accompagner ?</h2></div><a class="text-link" href="/services" data-link>Découvrir nos services ${icon("arrow")}</a></div><div class="cards">${[
    [
      "01",
      "stethoscope",
      "Un premier rendez-vous",
      "Vous souhaitez consulter ? Faites une demande : l’accueil vous orientera selon votre besoin.",
      "Demander un rendez-vous",
      "/rendez-vous",
    ],
    [
      "02",
      "heart",
      "Un suivi à organiser",
      "Préparez votre prochaine visite et renseignez-vous sur les consultations proposées par la clinique.",
      "Préparer ma visite",
      "/contact",
    ],
    [
      "03",
      "chat",
      "Une question, tout simplement",
      "Horaires, accès ou renseignements pratiques : échangez avec l’accueil avant de vous déplacer.",
      "Contacter la clinique",
      "/contact",
    ],
  ]
    .map(
      ([n, i, t, d, l, p]) =>
        `<article class="card"><span class="card-num">${n}</span><div class="icon-box">${icon(i)}</div><h3>${t}</h3><p>${d}</p><a class="text-link" href="${p}" data-link>${l} ${icon("arrow")}</a></article>`,
    )
    .join(
      "",
    )}</div></div></section>${servicesPreview()}<section class="section sage"><div class="container about-grid"><div class="about-art" aria-hidden="true"><img class="about-logo" src="/static/logo.png" alt="" onerror="this.onerror=null;this.src='/static/favicon.svg'"><div class="about-badge"><div><strong>Votre clinique de proximité</strong><span>Daloa · Tazibouo</span></div>${icon("pin")}</div></div><div><div class="eyebrow">BIENVENUE À LA CLINIQUE TCHIVA</div><h2>Une attention sincère.<br>Une relation de confiance.</h2><p>${esc(S.about)}</p><ul class="checks"><li>${icon("check")} Une localisation accessible à Tazibouo</li><li>${icon("check")} Des demandes de rendez-vous simplifiées</li><li>${icon("check")} Le respect de vos informations personnelles</li></ul><a href="/clinique" data-link class="text-link">Mieux nous connaître ${icon("arrow")}</a></div></div></section><section class="section"><div class="container"><div class="eyebrow">VOTRE PARCOURS, EN TOUTE SIMPLICITÉ</div><h2>Votre prochaine visite,<br>en trois étapes.</h2><div class="steps">${[
    [
      "01",
      "Faites votre demande",
      "Choisissez une date souhaitée et laissez vos coordonnées via le formulaire sécurisé.",
    ],
    [
      "02",
      "Recevez une confirmation",
      "L’accueil vérifie les disponibilités et vous contacte pour confirmer le rendez-vous.",
    ],
    [
      "03",
      "Venez à la clinique",
      "Retrouvez-nous à Tazibouo, en face du Collège La Paix, avec vos documents utiles.",
    ],
  ]
    .map(
      ([n, t, d]) =>
        `<div class="step"><div class="step-number">${n}.</div><h3>${t}</h3><p>${d}</p></div>`,
    )
    .join(
      "",
    )}</div></div></section>${insurancesSection()}<section class="section" style="padding-top:0"><div class="container">${cta()}</div></section>`;
}
function clinic() {
  return `${pageHero("La clinique", "Proches de vous.<br><em>À l’écoute de votre santé.</em>", "Découvrez la Clinique Tchiva, votre point de rencontre santé à Tazibouo, dans la ville de Daloa.")}<section class="section"><div class="container about-grid"><div><div class="eyebrow">NOTRE CLINIQUE</div><h2>Au cœur de Daloa,<br>au plus près de vous.</h2><p style="white-space:pre-line">${esc(S.about)}</p><p class="text-small">Les informations sur les spécialités et les praticiens sont publiées après validation par la direction de la clinique.</p><a class="btn" href="/contact" data-link>Nous rendre visite ${icon("arrow")}</a></div><div class="clinic-photo"><img class="clinic-shot" src="/static/img/clinique-facade.jpg" alt="Façade de la clinique, quartier Tazibouo à Daloa" loading="lazy" decoding="async"><div class="about-badge"><div><strong>${esc(S.address)}</strong><span>${esc(S.city)}, Côte d’Ivoire · Plus Code ${esc(plusCode())}</span></div>${icon("pin")}</div></div></div></section><section class="section"><div class="container emergency-grid"><div class="emergency-photo"><img src="/static/img/urgence-soins.jpg" alt="Couloir de la clinique en soirée, équipe soignante joignable pour les urgences" loading="lazy" decoding="async"></div><div><div class="eyebrow">URGENCES & GARDE</div><h2>Une équipe joignable,<br>jour et nuit.</h2><p>Les urgences médicales sont prises en charge 24h/24, week-ends et jours fériés. Un seul numéro à retenir, celui de la garde.</p><div class="hero-actions"><a class="btn" href="${telHref(emergencyPhone())}">${icon("siren")} Appeler le ${esc(emergencyPhone())}</a><button class="btn secondary" data-phone>${icon("phone")} Voir tous les numéros</button></div><p class="legal-note">En cas d’urgence vitale, appelez sans attendre. Les demandes envoyées par le formulaire ou WhatsApp ne sont pas surveillées en permanence.</p></div></div></section><section class="section sage"><div class="container"><div class="eyebrow">BIEN PRÉPARER VOTRE VISITE</div><h2>Quelques repères utiles.</h2><div class="faq"><details><summary>Comment prendre rendez-vous ?</summary><p>Remplissez le formulaire en ligne. Il s’agit d’une demande : votre rendez-vous est confirmé uniquement après validation par la clinique.</p></details><details><summary>Où se trouve la clinique ?</summary><p>${esc(S.address)}, ${esc(S.city)}. La carte interactive de la page Contact est centrée sur le point GPS exact ${esc(gpsLat())}, ${esc(gpsLng())} (Plus Code ${esc(plusCode())}). Le bouton « Itinéraire » ouvre directement la navigation Google Maps.</p></details><details><summary>Quels documents apporter ?</summary><p>Préparez vos documents d’identité, votre carte d’assuré ou de mutuelle avec le bon de prise en charge, ainsi que vos précédentes ordonnances et résultats d’examens. Les consignes détaillées figurent sur la page Services.</p></details><details><summary>Puis-je utiliser ce formulaire pour une urgence ?</summary><p>Non. Les demandes en ligne ne sont pas surveillées en permanence. En cas d’urgence, appelez le ${esc(emergencyPhone())} ou rendez-vous immédiatement au service d’urgence le plus proche.</p></details></div></div></section><section class="section"><div class="container">${cta()}</div></section>`;
}
function services() {
  return `${pageHero("Nos services", "Des soins qui commencent<br>par une écoute.", "Cinq spécialités publiées par la clinique, avec pour chacune les actes réalisés et les consignes pour préparer votre venue.")}<section class="section"><div class="container">${serviceCards()}<div class="notice mt20">${icon("info")}Les demandes en ligne ne remplacent ni une consultation ni un service d’urgence. Aucun diagnostic ne peut être établi via ce site. Pour une urgence, appelez le ${esc(emergencyPhone())}.</div><div class="service-shortcuts"><div><strong>Un doute sur le service à contacter ?</strong><span>L’accueil vous oriente vers la spécialité adaptée.</span></div><div class="hero-actions"><button class="btn small secondary" data-phone>${icon("phone")} Téléphoner</button><button class="btn small ghost" data-whatsapp>${icon("whatsapp")} Écrire sur WhatsApp</button><a class="btn small" href="/rendez-vous" data-link>${icon("calendar")} Rendez-vous</a></div></div></div></section>${insurancesSection(true)}<section class="section sage"><div class="container">${cta()}</div></section>`;
}
function team() {
  return `${pageHero("Notre équipe", "Des visages.<br>Une même attention.", "Découvrez les praticiens et leurs spécialités, après validation et publication de leurs profils par la clinique.")}<section class="section"><div class="container">${S.team.length ? `<div class="cards">${S.team.map((p) => `<article class="card"><div class="person-avatar">${esc(initials(p.name))}</div><span class="tag mb20">${esc(p.specialty)}</span><h3>${esc(p.name)}</h3><p>${esc(p.bio || "Contactez l’accueil pour connaître les disponibilités de consultation.")}</p><a class="text-link" href="/rendez-vous" data-link>Demander une consultation ${icon("arrow")}</a></article>`).join("")}</div>` : `<div class="empty-state">${icon("users")}<h3>Faisons bientôt connaissance.</h3><p>Les noms, qualifications et disponibilités de l’équipe médicale seront affichés après validation par la direction. Aucun profil non vérifié n’est présenté.</p><a href="/contact" data-link class="btn secondary">Renseignements auprès de l’accueil ${icon("arrow")}</a></div>`}</div></section><section class="section sage"><div class="container">${cta()}</div></section>`;
}
function mapView() {
  return `<div class="map"><iframe src="${esc(mapEmbedUrl())}" title="Carte interactive Google Maps de la Clinique Tchiva, Tazibouo, Daloa" loading="lazy" referrerpolicy="no-referrer" allowfullscreen></iframe><div class="map-card"><div class="map-card-icon">${icon("pin")}</div><div class="map-card-text"><strong>${esc(S.address)}</strong><small>${esc(S.city)}, Côte d’Ivoire · Plus Code ${esc(plusCode())}</small><small class="map-gps">GPS ${esc(gpsLat())}, ${esc(gpsLng())}</small></div></div></div><div class="map-actions"><a class="btn" href="${mapDirectionsUrl()}" target="_blank" rel="noopener noreferrer">${icon("external")} Itinéraire vers la clinique</a><a class="btn secondary" href="${mapPointUrl()}" target="_blank" rel="noopener noreferrer">${icon("grid")} Ouvrir dans Google Maps</a></div>`;
}
function contact() {
  const reception = receptionPhones();
  return `${pageHero("Contact & accès", "Une question ?<br>Parlons-en.", "Adresse exacte, numéros utiles, horaires et prise en charge assurance : tout pour préparer votre visite à la Clinique Tchiva.")}<section class="section"><div class="container contact-grid"><div><div class="contact-line">${icon("pin")}<div><h3>Notre adresse</h3><p>${esc(S.address)}<br>${esc(S.city)}, Côte d’Ivoire<br><small class="contact-sub">Plus Code ${esc(plusCode())} · GPS ${esc(gpsLat())}, ${esc(gpsLng())}</small></p></div></div><div class="contact-line">${icon("clock")}<div><h3>Horaires d’accueil</h3><p>${esc(S.hours || "Horaires à compléter par la clinique. Merci de vérifier les disponibilités avant de vous déplacer.")}</p><small class="contact-sub">Urgences et garde assurées 24h/24, week-ends et jours fériés.</small></div></div><div class="contact-line">${icon("phone")}<div><h3>Téléphone & contacts</h3><div class="contact-numbers"><p><strong>Standard fixe :</strong> <a href="${telHref(landlinePhone())}">${esc(landlinePhone())}</a></p><p class="urgent-line">${icon("siren")}<strong>Urgences & garde 24h/24 :</strong> <a href="${telHref(emergencyPhone())}">${esc(emergencyPhone())}</a></p><p><strong>Accueil & renseignements :</strong> ${reception.map((n) => `<a href="${telHref(n)}">${esc(n)}</a>`).join(" · ")}</p></div><button class="btn small secondary mt20" data-phone>${icon("phone")} Téléphoner — choisir le poste</button></div></div>${S.email ? `<div class="contact-line">${icon("mail")}<div><h3>E-mail</h3><p><a href="mailto:${esc(S.email)}">${esc(S.email)}</a></p></div></div>` : ""}<div class="hero-actions mt20"><button class="btn" data-whatsapp>${icon("whatsapp")} Écrire sur WhatsApp</button><a class="btn secondary" href="/rendez-vous" data-link>Un rendez-vous ${icon("arrow")}</a></div></div><div>${mapView()}<p class="legal-note">La carte interactive et l’itinéraire sont fournis par Google Maps, un service externe. Vérifiez le point d’arrivée avant de partir.</p><div class="notice warning">${icon("siren")}<div>En cas d’urgence, appelez directement le <strong>${esc(emergencyPhone())}</strong>. Le formulaire en ligne et WhatsApp ne sont pas surveillés en permanence.</div></div></div></div></section>${insurancesSection(true)}<section class="section sage"><div class="container">${cta()}</div></section>`;
}
const field = (
  label,
  name,
  type = "text",
  value = "",
  extra = "",
  full = false,
) =>
  `<div class="field ${full ? "full" : ""}"><label for="f-${name}">${label}</label><input id="f-${name}" name="${name}" type="${type}" value="${esc(value)}" ${extra}></div>`;
const selectField = (label, name, options, value = "", full = false) =>
  `<div class="field ${full ? "full" : ""}"><label for="f-${name}">${label}</label><select id="f-${name}" name="${name}">${options
    .map((o) => {
      const [v, l] = Array.isArray(o) ? o : [o, o];
      return `<option value="${esc(v)}" ${v === value ? "selected" : ""}>${esc(l)}</option>`;
    })
    .join("")}</select></div>`;
const textarea = (label, name, value = "", extra = "") =>
  `<div class="field full"><label for="f-${name}">${label}</label><textarea name="${name}" id="f-${name}" ${extra}>${esc(value)}</textarea></div>`;
const errorBox = '<div class="form-error" role="alert"></div>';
function booking() {
  return `${pageHero("Rendez-vous", "Votre prochaine visite<br>commence ici.", "Transmettez votre demande en quelques instants. L’accueil vous contactera pour confirmer le rendez-vous selon les disponibilités.")}<section class="section"><div class="container booking-grid"><div class="panel" id="booking-panel"><h3>Demande de rendez-vous</h3><p class="text-small">Les champs marqués d’un * sont obligatoires.</p><form id="booking-form">${errorBox}<div class="form-grid">${field("Nom et prénom *", "patient", "text", "", 'required minlength="2" maxlength="120" autocomplete="name" placeholder="Votre nom complet"')}${field("Téléphone *", "phone", "tel", "", 'required maxlength="30" autocomplete="tel" placeholder="+225 00 00 00 00 00"')}${selectField("Service souhaité", "service", [["Demande de consultation", "Être orienté par l’accueil"], ...S.specialties.map((s) => s.name)])}${selectField("Praticien souhaité", "practitioner", [["", "Sans préférence"], ...S.team.map((t) => t.name)])}${field("Date souhaitée *", "day", "date", "", 'required min="' + today() + '" max="' + new Date(Date.now() + 180 * 864e5).toISOString().slice(0, 10) + '"')}${field("Heure souhaitée (facultatif)", "slot", "time", "", 'step="900"')}<div class="field full"><small id="slot-hint">La date et l’heure restent à confirmer par l’accueil.</small><div id="slot-suggestions" class="inline-actions"></div></div><div class="honeypot" aria-hidden="true"><label>Site web<input name="website" autocomplete="off" tabindex="-1"></label></div><div class="form-sep"><label class="check-label"><input name="privacy" type="checkbox" required><span>J’accepte que mes coordonnées soient utilisées pour traiter ma demande de rendez-vous. J’ai lu la <a href="/confidentialite" data-link>politique de confidentialité</a>. *</span></label></div><label class="check-label field full"><input name="consent" type="checkbox"><span>J’accepte de recevoir des rappels de rendez-vous par téléphone ou WhatsApp. Ce consentement est facultatif et peut être retiré auprès de l’accueil.</span></label><div class="notice field full">${icon("shield")}N’indiquez aucune information médicale sensible. Ce formulaire n’est pas un dossier médical et ne convient pas aux urgences.</div></div><div class="form-actions"><button class="btn" type="submit">Envoyer ma demande ${icon("arrow")}</button></div></form></div><aside class="booking-aside"><h3>On s’occupe de la suite.</h3><p>Un premier contact simple, pour une visite mieux préparée.</p><div class="steps">${[
    [
      "1",
      "Votre demande est enregistrée",
      "Conservez la référence affichée après l’envoi.",
    ],
    [
      "2",
      "L’accueil vous recontacte",
      "Le rendez-vous est confirmé après vérification des disponibilités.",
    ],
    ["3", "Retrouvez-nous à Tazibouo", "En face du Collège La Paix, à Daloa."],
  ]
    .map(
      ([n, t, d]) =>
        `<div class="step"><div class="step-number">${n}</div><div><h4>${t}</h4><p>${d}</p></div></div>`,
    )
    .join(
      "",
    )}</div><div class="notice warning">${icon("info")}La demande ne vaut pas confirmation de rendez-vous.</div><div class="aside-details"><hr style="border:0;border-top:1px solid var(--line);margin:25px 0"><div class="text-small">${icon("pin")} ${esc(S.address)}<br>${esc(S.city)}, Côte d’Ivoire</div></div></aside></div></section>`;
}
function legal(privacy) {
  return `${pageHero(privacy ? "Confidentialité" : "Mentions légales", privacy ? "Vos données,<br>avec attention." : "Informations légales.", privacy ? "Comprendre l’utilisation de vos coordonnées et exercer vos droits." : "Informations sur l’éditeur du site et ses conditions d’utilisation.")}<section class="section"><div class="container prose">${privacy ? `<div class="notice warning">${icon("info")}Cette politique doit être validée et complétée par la direction avant l’ouverture du site à de vrais patients.</div><h2>1. Responsable du traitement</h2><p>${esc(S.name)}, ${esc(S.address)}, ${esc(S.city)}, Côte d’Ivoire. Contact pour les données personnelles : ${esc(S.privacy_contact || S.email || "à compléter par la clinique ; vous pouvez vous présenter à l’accueil")}.</p><h2>2. Informations collectées</h2><p>Le formulaire recueille votre nom, téléphone, service ou praticien souhaité, date et heure préférées, ainsi que votre choix concernant les rappels. Ne communiquez pas de symptômes, résultats d’examens ou autres informations médicales via ce formulaire.</p><h2>3. Utilisation et accès</h2><p>Ces informations permettent à l’accueil et au personnel habilité d’organiser les rendez-vous. Les consultations et encaissements sont réservés aux rôles autorisés. Aucune publicité ciblée et aucun outil d’analyse publicitaire ne sont installés.</p><h2>4. Consentement aux rappels</h2><p>Les rappels sont facultatifs. Votre refus n’empêche pas une demande. L’envoi automatique n’est pas activé : un membre habilité peut préparer un rappel, puis l’envoyer manuellement après vérification du consentement. Vous pouvez retirer ce consentement à l’accueil.</p><h2>5. Durée de conservation</h2><p>Durée cible proposée pour les demandes sans suivi : ${esc(S.retention_days || 180)} jours après la dernière interaction. La clinique doit valider sa politique de conservation et réaliser les suppressions ; aucun effacement automatique n’est actuellement activé. Les données comptables et les dossiers de soins suivent des obligations spécifiques à faire valider avant exploitation.</p><h2>6. Sécurité et prestataires</h2><p>L’espace de gestion utilise des comptes individuels, des droits d’accès et une journalisation. Les noms et téléphones des patients sont chiffrés dans la base. Le chiffrement HTTPS, les sauvegardes, l’hébergeur et les formalités réglementaires doivent être vérifiés avant la mise en production.</p><p>La carte Google Maps de la page Contact est intégrée au site et chargée par Google. Les liens WhatsApp et d’itinéraire ne s’ouvrent que sur votre action et vous font quitter le site : vous êtes alors soumis aux politiques de confidentialité de ces services.</p><h2>7. Vos droits</h2><p>Pour demander l’accès, la rectification, la suppression de vos données ou retirer votre consentement, contactez l’accueil. La clinique vérifie votre identité et les obligations de conservation avant de traiter la demande. Le cadre applicable en Côte d’Ivoire et les formalités auprès de l’autorité compétente doivent être validés par la direction.</p><h2>8. Cookies</h2><p>Seul un cookie de session technique est utilisé lors de la connexion à l’espace de gestion. Il expire après 8 heures. Aucun cookie publicitaire n’est installé.</p>` : `<h2>Éditeur</h2><p>${esc(S.name)}<br>${esc(S.address)}<br>${esc(S.city)}, Côte d’Ivoire<br>${S.phone ? esc(S.phone) : "Téléphone : à compléter"}<br>${S.email ? esc(S.email) : "Adresse e-mail : à compléter"}</p><h2>Informations à finaliser avant publication</h2><ul><li>Raison sociale et forme juridique, numéro d’immatriculation et autorisations applicables.</li><li>Identité du responsable de publication.</li><li>Hébergeur : nom, adresse et coordonnées.</li><li>Contact pour la protection des données et modalités d’exercice des droits.</li></ul><h2>Informations de santé</h2><p>Les contenus du site sont informatifs. Ils ne remplacent pas une consultation médicale. Aucun rendez-vous n’est confirmé par le seul envoi d’une demande. En cas d’urgence, adressez-vous au service d’urgence le plus proche.</p><h2>Visuels et contenus</h2><p>Les visuels des pages d’accueil, clinique, services et assurances sont des illustrations générées par intelligence artificielle. Ils ne représentent ni un membre de l’équipe ni les locaux réels de la clinique. Les noms et qualifications des praticiens seront publiés uniquement après validation par la clinique.</p><h2>Carte et services externes</h2><p>La carte interactive et le bouton d’itinéraire sont fournis par Google Maps ; WhatsApp est un service externe. Ces services se chargent uniquement après votre action et sont soumis à leurs propres conditions de confidentialité.</p><h2>Disponibilité du site</h2><p>La clinique ne peut pas garantir la surveillance permanente des demandes en ligne. Vérifiez les coordonnées et horaires avant votre déplacement.</p>`}</div></section>`;
}
async function render() {
  const isAdmin = route.startsWith("/gestion");
  if (isAdmin) {
    await renderAdmin();
    return;
  }
  const pages = {
    "/": home,
    "/clinique": clinic,
    "/services": services,
    "/equipe": team,
    "/contact": contact,
    "/rendez-vous": booking,
    "/confidentialite": () => legal(true),
    "/mentions-legales": () => legal(false),
  };
  const fn = pages[route];
  document.title =
    {
      "/": "Clinique Tchiva à Daloa · Votre santé, notre priorité",
      "/services": "Nos services · Clinique Tchiva",
      "/equipe": "Notre équipe · Clinique Tchiva",
      "/contact": "Contact & accès · Clinique Tchiva",
      "/rendez-vous": "Rendez-vous · Clinique Tchiva",
      "/clinique": "La clinique · Clinique Tchiva",
    }[route] || "Clinique Tchiva · Daloa";
  $("#app").innerHTML =
    header() +
    `<main id="main">${fn ? fn() : pageHero("Page introuvable", "Cette page n’existe pas.", "Revenez à l’accueil pour poursuivre votre visite.")}</main>` +
    footer();
  $("#menu-toggle")?.addEventListener("click", () => {
    const n = $("#public-nav");
    n.classList.toggle("open");
    $("#menu-toggle").setAttribute(
      "aria-expanded",
      n.classList.contains("open"),
    );
  });
  $$("[data-whatsapp],#whatsapp-float").forEach((b) => (b.onclick = whatsapp));
  $$("[data-phone]").forEach((b) => (b.onclick = phoneMenu));
  if (route === "/rendez-vous") bindBooking();
}
function bindBooking() {
  const form = $("#booking-form");
  form.onsubmit = async (e) => {
    e.preventDefault();
    await submit(form, async () => {
      const d = Object.fromEntries(new FormData(form));
      d.privacy = form.privacy.checked;
      d.consent = form.consent.checked;
      const r = await post("/appointments", d);
      $("#booking-panel").innerHTML =
        `<div class="success-box"><div class="success-icon">${icon("check")}</div><h2>Votre demande est enregistrée.</h2><p class="text-small">Conservez cette référence pour vos échanges avec l’accueil.</p><div class="reference">${esc(r.reference)}</div><div class="notice">${icon("info")}${esc(r.message)}</div><p class="legal-note">Vous avez demandé le ${dateFr(d.day)}${d.slot ? " à " + esc(d.slot) : ""}. La clinique doit encore confirmer la date et l’heure.</p><a class="btn secondary mt20" href="/" data-link>Retour à l’accueil</a></div>`;
      $("#booking-panel").scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };
  const load = async () => {
    if (!form.day.value) return;
    try {
      const r = await api(
        "/availability?day=" +
          form.day.value +
          "&practitioner=" +
          encodeURIComponent(form.practitioner.value),
      );
      $("#slot-hint").textContent = r.configured
        ? r.slots.length
          ? "Créneaux indicatifs : cliquez pour choisir. Validation nécessaire par l’accueil."
          : "Aucun créneau proposé à cette date. Une demande reste possible, sans garantie de disponibilité."
        : "Les disponibilités sont à confirmer. Vous pouvez indiquer une heure souhaitée.";
      $("#slot-suggestions").innerHTML = r.slots
        .map(
          (s) =>
            `<button type="button" class="btn small secondary" data-slot="${s}">${s}</button>`,
        )
        .join("");
      $$("[data-slot]").forEach(
        (b) =>
          (b.onclick = () => {
            form.slot.value = b.dataset.slot;
          }),
      );
    } catch (e) {
      $("#slot-hint").textContent = e.message;
    }
  };
  form.day.onchange = load;
  form.practitioner.onchange = load;
}
async function submit(form, fn) {
  const b = $("button[type=submit]", form);
  const error = $(".form-error", form);
  if (error) error.textContent = "";
  if (b) b.disabled = true;
  try {
    await fn();
  } catch (e) {
    if (error) error.textContent = e.message;
    else toast(e.message);
  } finally {
    if (b) b.disabled = false;
  }
}
let modalPreviousFocus = null;
function modal(title, body) {
  modalPreviousFocus = document.activeElement;
  $("#modal-root").innerHTML =
    `<div class="modal-overlay"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><h2 id="modal-title">${esc(title)}</h2><button class="modal-close" aria-label="Fermer">${icon("close")}</button></div>${body}</section></div>`;
  document.body.style.overflow = "hidden";
  $(".modal-close").onclick = closeModal;
  $(".modal-overlay").onclick = (e) => {
    if (e.target.classList.contains("modal-overlay")) closeModal();
  };
  setTimeout(
    () =>
      (
        $(".modal input:not([type=checkbox]),.modal select") ||
        $(".modal .modal-close") ||
        $(".modal button:not([disabled]),.modal a[href]") ||
        $(".modal")
      )?.focus?.(),
    20,
  );
}
function closeModal() {
  $("#modal-root").innerHTML = "";
  document.body.style.overflow = "";
  modalPreviousFocus?.focus?.();
}
document.addEventListener("keydown", (e) => {
  if (!$(".modal")) return;
  if (e.key === "Escape") closeModal();
  if (e.key === "Tab") {
    const f = $$(
      "a[href],button:not(:disabled),input,select,textarea",
      [...$$(".modal")][0],
    ).filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const a = f[0],
      b = f.at(-1);
    if (e.shiftKey && document.activeElement === a) {
      e.preventDefault();
      b.focus();
    } else if (!e.shiftKey && document.activeElement === b) {
      e.preventDefault();
      a.focus();
    }
  }
});
function loginPage() {
  return `<div class="login-page"><aside class="login-brand">${brand()}<div><div class="eyebrow" style="color:#cedecb">ESPACE RÉSERVÉ AU PERSONNEL</div><h1>Le soin commence<br>par une bonne<br>organisation.</h1><p>Rendez-vous, consultations et gestion de la clinique. Un espace unique pour votre équipe.</p></div><small>${icon("shield")} Accès protégé · Comptes individuels · Traçabilité</small></aside><main class="login-content" id="main"><div class="login-form"><a class="login-return" href="/" data-link>← Retour au site de la clinique</a><h2>Heureux de vous retrouver.</h2><p>Connectez-vous avec votre e-mail et votre mot de passe.</p><form id="login-form">${errorBox}${field("Adresse e-mail", "email", "email", "", 'required autocomplete="username"')}${field("Mot de passe", "password", "password", "", 'required autocomplete="current-password"')}<button class="btn" type="submit">Se connecter ${icon("arrow")}</button></form>${needsSetup ? `<div class="notice">${icon("lock")}<div>Aucun compte n’est encore activé. Le propriétaire du projet doit configurer <code>ADMIN_NOM</code>, <code>ADMIN_PRENOM</code>, <code>ADMIN_EMAIL</code> et <code>ADMIN_PASSWORD</code> dans les paramètres privés Vercel, puis redéployer. Aucun code supplémentaire n’est demandé ici et aucune inscription administrateur n’est ouverte au public.</div></div>` : `<p class="legal-note">Accès réservé au personnel autorisé. Pour obtenir un compte ou réinitialiser un accès, contactez l’administrateur de la clinique.</p>`}<p class="legal-note">Ne saisissez des données réelles de patients qu’après validation de l’hébergement et de la protection des données.</p></div></main></div>`;
}
const adminItems = () => [
  ["/gestion", "grid", "Vue d’ensemble", true],
  [
    "/gestion/rendez-vous",
    "calendar",
    "Rendez-vous",
    can("reception", "medical"),
  ],
  ["/gestion/calendrier", "clock", "Calendrier", can("reception", "medical")],
  ["/gestion/consultations", "stethoscope", "Consultations", can("medical")],
  ["/gestion/finances", "wallet", "Finances", can("accounting")],
  ["/gestion/stocks", "box", "Stocks & consommables", true],
  ["/gestion/rapports", "chart", "Rapports", can("accounting")],
  ["/gestion/parametres", "settings", "Paramètres", can()],
  ["/gestion/formation", "help", "Guide de prise en main", true],
];
function adminShell() {
  return `<div class="admin"><aside class="sidebar" id="sidebar">${brand()}<div class="sidebar-label">Gestion de la clinique</div><nav class="admin-nav" aria-label="Gestion">${adminItems()
    .filter((x) => x[3])
    .map(
      ([p, i, t]) =>
        `<a href="${p}" data-link class="${route === p ? "active" : ""}">${icon(i)}${t}</a>`,
    )
    .join(
      "",
    )}</nav><div class="sidebar-bottom"><a href="/" data-link>${icon("external")} Voir le site public</a><div class="user-mini"><div class="avatar">${esc(initials(me.name))}</div><div><strong>${esc(me.name)}</strong><span>${esc(roles[me.role])}</span></div></div></div></aside><div class="admin-main"><header class="admin-top"><button class="icon-btn mobile-admin-toggle" id="admin-menu" aria-label="Ouvrir le menu">${icon("menu")}</button><span>Clinique Tchiva <span class="muted">/ Espace de gestion</span></span><div class="admin-top-actions"><span class="tag">${icon("shield")} Espace protégé</span><button class="icon-btn" id="password-button" title="Changer mon mot de passe" aria-label="Changer mon mot de passe">${icon("lock")}</button><button class="icon-btn" id="logout" title="Se déconnecter">${icon("logout")} <span class="wide-only">Déconnexion</span></button></div></header><main class="admin-content" id="main"><div class="loading">Chargement de votre espace…</div></main></div></div>`;
}
const title = (name, description, button = "") =>
  `<div class="admin-title"><div><h1>${name}</h1><p>${description}</p></div>${button}</div>`;
const addButton = (id, label) =>
  `<button class="btn" id="${id}">${icon("plus")} ${label}</button>`;
function emptyTable(col, title, desc, i = "file") {
  return `<tr class="table-empty"><td colspan="${col}"><div class="mini-empty">${icon(i)}<strong>${title}</strong>${desc}</div></td></tr>`;
}
function stat(label, value, note, i = "chart") {
  return `<div class="stat-card"><div class="stat-label">${label}${icon(i)}</div><div class="stat-value">${value}</div><small>${note}</small></div>`;
}
async function renderAdmin() {
  document.title = "Espace de gestion · Clinique Tchiva";
  if (!me) {
    try {
      me = await api("/me");
    } catch {}
  }
  if (!me) {
    $("#app").innerHTML = loginPage();
    $("#login-form").onsubmit = (e) => {
      e.preventDefault();
      const f = e.currentTarget;
      submit(f, async () => {
        const p = Object.fromEntries(new FormData(f));
        me = await post("/login", { email: p.email, password: p.password });
        renderAdmin();
      });
    };
    return;
  }
  $("#app").innerHTML = adminShell();
  $("#admin-menu").onclick = () => $("#sidebar").classList.toggle("open");
  $("#logout").onclick = async () => {
    try {
      await post("/logout", {});
      me = null;
      renderAdmin();
    } catch (e) {
      toast(e.message);
    }
  };
  $("#password-button").onclick = passwordModal;
  const pages = {
    "/gestion": dashboard,
    "/gestion/rendez-vous": appointmentsPage,
    "/gestion/calendrier": calendarPage,
    "/gestion/consultations": consultationsPage,
    "/gestion/finances": financesPage,
    "/gestion/stocks": inventoryPage,
    "/gestion/rapports": reportsPage,
    "/gestion/parametres": settingsPage,
    "/gestion/formation": trainingPage,
  };
  try {
    await (pages[route] || dashboard)();
  } catch (e) {
    $("#main").innerHTML =
      title("Accès indisponible", esc(e.message)) +
      `<a href="/gestion" data-link class="btn secondary">Retour au tableau de bord</a>`;
  }
}
function chart(rows, start, end) {
  const buckets = [];
  for (let i = 5; i >= 0; i--) {
    let d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    buckets.push({
      key: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString("fr-FR", { month: "short" }),
      income: 0,
      expense: 0,
    });
  }
  for (const t of rows) {
    let b = buckets.find((b) => t.day.slice(0, 7) === b.key);
    if (b) b[t.kind] += t.amount;
  }
  const max = Math.max(1, ...buckets.flatMap((b) => [b.income, b.expense]));
  return `<div class="chart">${buckets.map((b) => `<div class="chart-col"><div class="chart-bar" style="height:${(b.income / max) * 100}%" title="${esc(b.label)} : recettes ${money(b.income)} FCFA"></div><div class="chart-bar expense" style="height:${(b.expense / max) * 100}%" title="Dépenses ${money(b.expense)} FCFA"></div><span>${esc(b.label)}</span></div>`).join("")}</div><div class="chart-legend"><span><i></i> Recettes</span><span><i class="light"></i> Dépenses</span></div>${rows.length ? "" : '<p class="legal-note">Aucune écriture enregistrée. Le graphique se remplira avec vos données.</p>'}`;
}
async function dashboard() {
  const summary = await api("/admin/summary");
  let ap = [],
    tx = [];
  if (can("reception", "medical")) ap = await api("/admin/appointments");
  if (can("accounting")) tx = await api("/admin/transactions");
  $("#main").innerHTML =
    title(
      "Bonjour, " + esc(me.name.split(" ")[0]) + ".",
      "Voici l’activité de votre clinique, en un coup d’œil.",
      can("reception", "medical")
        ? `<a class="btn" href="/gestion/rendez-vous" data-link>${icon("calendar")} Gérer les rendez-vous</a>`
        : "",
    ) +
    `<div class="notice warning">${icon("info")}Configuration initiale : coordonnées et offre médicale à compléter. N’utilisez pas de données réelles avant la validation de l’hébergement et de la protection des données.</div><div class="stat-grid">${can("reception", "medical") ? stat("Rendez-vous du jour", summary.today, "Aujourd’hui · " + dateFr(today()), "calendar") + stat("Demandes à confirmer", summary.pending, "À traiter par l’accueil", "clock") : stat("Stocks en alerte", summary.low_stock, "Quantité au seuil ou inférieure", "box")}${can("accounting") ? stat("Recettes du mois", money(summary.income) + " <small>FCFA</small>", "Encaissements enregistrés", "wallet") + stat("Solde du mois", money(summary.income - summary.expense) + " <small>FCFA</small>", "Recettes moins dépenses", "chart") : stat("Stocks en alerte", summary.low_stock, "À vérifier avant réapprovisionnement", "box")}</div><div class="dashboard-grid"><section class="panel"><div class="panel-head"><h3>${can("accounting") ? "Évolution des finances" : "Les prochains rendez-vous"}</h3><a class="text-link" href="${can("accounting") ? "/gestion/finances" : "/gestion/calendrier"}" data-link>Voir tout ${icon("arrow")}</a></div>${can("accounting") ? chart(tx) : upcoming(ap)}</section><section class="panel"><div class="panel-head"><h3>${can("reception", "medical") ? "Prochains rendez-vous" : "Vos repères"}</h3>${can("reception", "medical") ? '<a class="text-link" href="/gestion/calendrier" data-link>Calendrier</a>' : ""}</div>${can("reception", "medical") ? upcoming(ap) : '<div class="mini-empty">' + icon("shield") + "<strong>Un espace dédié à votre rôle</strong>Consultez les finances, les rapports et les stocks depuis le menu.</div>"}</section></div><div class="quick-links">${can("medical") ? '<a class="quick-link" href="/gestion/consultations" data-link>' + icon("plus") + " Enregistrer une consultation</a>" : ""}${can("accounting") ? '<a class="quick-link" href="/gestion/finances" data-link>' + icon("wallet") + " Ajouter une dépense</a>" : ""}<a class="quick-link" href="/gestion/stocks" data-link>${icon("box")} Contrôler les stocks <span class="tag ${summary.low_stock ? "alert" : ""}">${summary.low_stock} alerte(s)</span></a><a class="quick-link" href="/gestion/formation" data-link>${icon("help")} Guide de prise en main</a></div>${summary.audit?.length ? `<section class="panel mt20"><div class="panel-head"><h3>Journal d’activité récent</h3><span class="tag">Traçabilité</span></div>${summary.audit.map((a) => `<div class="audit-row"><div>${esc(a.action)} <span>· ${esc(a.name || "Système")}</span></div><span>${new Date(a.created_at).toLocaleString("fr-FR")}</span></div>`).join("")}</section>` : ""}`;
}
function upcoming(ap) {
  const rows = ap
    .filter((a) => a.day >= today() && a.status === "confirmed")
    .sort((a, b) => (a.day + a.slot).localeCompare(b.day + b.slot))
    .slice(0, 4);
  return rows.length
    ? rows
        .map(
          (a) =>
            `<div class="audit-row"><div><strong>${esc(a.patient)}</strong><br><span>${esc(a.service)}</span></div><div>${dateFr(a.day)}<br><span>${esc(a.slot)}</span></div></div>`,
        )
        .join("")
    : `<div class="mini-empty">${icon("calendar")}<strong>Aucun rendez-vous confirmé à venir</strong>Les rendez-vous apparaîtront ici après leur confirmation.</div>`;
}
async function appointmentsPage() {
  appointmentCache = await api("/admin/appointments");
  $("#main").innerHTML =
    title(
      "Rendez-vous",
      "Traitez les demandes et organisez les consultations.",
      `<a href="/rendez-vous" class="btn" data-link>${icon("plus")} Nouvelle demande</a>`,
    ) +
    `<div class="tabs"><a class="active" href="/gestion/rendez-vous" data-link>Liste des demandes</a><a href="/gestion/calendrier" data-link>Calendrier</a>${can() ? '<a href="/gestion/parametres" data-link>Disponibilités</a>' : ""}</div><div class="table-panel"><div class="table-tools"><input type="search" id="appointment-search" placeholder="Rechercher un nom, téléphone, référence…" aria-label="Rechercher un rendez-vous"><div class="filters"><select id="appointment-filter" aria-label="Filtrer par statut"><option value="all">Tous les statuts</option>${Object.entries(
      statuses,
    )
      .map(([k, v]) => `<option value="${k}">${v}</option>`)
      .join(
        "",
      )}</select><span class="tag">${appointmentCache.filter((a) => a.status === "pending").length} à confirmer</span></div></div><div class="table-scroll"><table><thead><tr><th>Patient</th><th>Date souhaitée</th><th>Service / Praticien</th><th>Statut</th><th>Rappels</th><th>Actions</th></tr></thead><tbody id="appointment-rows"></tbody></table></div><div class="table-count" id="appointment-count"></div></div><div class="notice mt20">${icon("bell")}Les rappels sont préparés manuellement, uniquement pour les patients consentants avec un rendez-vous confirmé. Aucun envoi automatique n’est configuré.</div>`;
  $("#appointment-search").oninput = (e) => {
    search = e.target.value;
    appointmentRows();
  };
  $("#appointment-filter").onchange = (e) => {
    statusFilter = e.target.value;
    appointmentRows();
  };
  appointmentRows();
}
function appointmentRows() {
  const rows = appointmentCache.filter(
    (a) =>
      (statusFilter === "all" || a.status === statusFilter) &&
      [a.patient, a.phone, a.reference]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  $("#appointment-rows").innerHTML =
    rows
      .map(
        (a) =>
          `<tr><td><strong>${esc(a.patient)}</strong><small>${esc(a.phone)} · ${esc(a.reference)}</small></td><td><strong>${dateFr(a.day)}</strong><small>${esc(a.slot || "Heure à définir")}</small></td><td>${esc(a.service)}<small>${esc(a.practitioner || "À attribuer")}</small></td><td>${badge(a.status)}</td><td><span class="tag">${a.consent ? "Consentement reçu" : "Non autorisés"}</span></td><td><div class="td-actions"><button class="icon-btn" data-appointment="${a.id}" title="Modifier le rendez-vous">${icon("edit")}</button>${a.consent && a.status === "confirmed" ? `<button class="icon-btn" data-reminder="${a.id}" title="Préparer un rappel">${icon("bell")}</button>` : ""}</div></td></tr>`,
      )
      .join("") ||
    emptyTable(
      6,
      "Aucune demande à afficher",
      "Les demandes envoyées depuis le site seront affichées ici.",
      "calendar",
    );
  $("#appointment-count").textContent =
    rows.length + " demande(s) affichée(s) · 2 000 demandes récentes maximum";
  $$("[data-appointment]").forEach(
    (b) => (b.onclick = () => appointmentModal(Number(b.dataset.appointment))),
  );
  $$("[data-reminder]").forEach(
    (b) => (b.onclick = () => reminderModal(Number(b.dataset.reminder))),
  );
}
function appointmentModal(id) {
  const a = appointmentCache.find((a) => a.id === id);
  modal(
    "Organiser le rendez-vous",
    `<p class="text-small"><strong>${esc(a.patient)}</strong> · ${esc(a.phone)}<br>${esc(a.reference)} · ${esc(a.service)}</p><form id="appointment-form">${errorBox}<div class="form-grid">${field("Date", "day", "date", a.day, "required")}${field("Heure", "slot", "time", a.slot)}${selectField("Statut", "status", Object.entries(statuses), a.status)}${selectField("Praticien", "practitioner", [["", "Accueil / non attribué"], ...S.team.map((t) => t.name)], a.practitioner)}<div class="field full"><label>Rappels au patient</label><div class="inline-actions"><span class="tag">${a.consent ? "Consentement reçu" : "Non autorisés"}</span><button type="button" class="icon-btn" id="consent-action">${a.consent ? "Enregistrer le retrait du consentement" : "Enregistrer un consentement recueilli"}</button></div></div><div class="notice field full">${icon("info")}La confirmation nécessite une heure. Pour une même date, un même praticien ne peut pas avoir deux rendez-vous confirmés à la même heure. L’accueil doit prévenir le patient.</div></div><div class="form-actions">${can() ? `<button type="button" class="icon-btn" id="delete-appointment" title="Supprimer définitivement">${icon("trash")}</button>` : ""}<button type="button" class="btn secondary" onclick="closeModal()">Annuler</button><button class="btn" type="submit">Enregistrer</button></div></form>`,
  );
  $("#appointment-form").onsubmit = (e) => {
    e.preventDefault();
    submit(e.currentTarget, async () => {
      await api("/admin/appointments/" + id, {
        method: "PATCH",
        body: JSON.stringify(Object.fromEntries(new FormData(e.target))),
      });
      closeModal();
      toast("Rendez-vous mis à jour.");
      await renderAdmin();
    });
  };
  $("#consent-action").onclick = async () => {
    if (
      !confirm(
        a.consent
          ? "Confirmez-vous que le patient a demandé le retrait de son consentement aux rappels ?"
          : "Confirmez-vous avoir recueilli et vérifié l’accord explicite du patient aux rappels ?",
      )
    )
      return;
    try {
      await api("/admin/appointments/" + id + "/consent", {
        method: "PATCH",
        body: JSON.stringify({ consent: !a.consent, confirmation: true }),
      });
      closeModal();
      toast("Consentement mis à jour et tracé.");
      renderAdmin();
    } catch (e) {
      toast(e.message);
    }
  };
  $("#delete-appointment")?.addEventListener("click", async () => {
    if (!confirm("Supprimer définitivement cette demande et ses coordonnées ?"))
      return;
    try {
      await api("/admin/appointments/" + id, { method: "DELETE" });
      closeModal();
      renderAdmin();
      toast("Demande supprimée.");
    } catch (e) {
      toast(e.message);
    }
  });
}
async function reminderModal(id) {
  try {
    const r = await post("/admin/appointments/" + id + "/reminder", {});
    modal(
      "Préparer un rappel WhatsApp",
      `<div class="notice">${icon("shield")}Le consentement a été vérifié. Relisez le message et le numéro avant l’envoi. Ouvrir WhatsApp n’envoie pas le message automatiquement.</div><p class="text-small">Destinataire : <strong>+${esc(r.phone)}</strong></p><div class="panel text-small">${esc(r.message)}</div><div class="form-actions"><button class="btn secondary" onclick="closeModal()">Fermer</button><a class="btn" href="https://wa.me/${esc(r.phone)}?text=${encodeURIComponent(r.message)}" target="_blank" rel="noopener noreferrer">${icon("chat")} Ouvrir WhatsApp</a></div>`,
    );
  } catch (e) {
    toast(e.message);
  }
}
async function calendarPage() {
  appointmentCache = await api("/admin/appointments");
  $("#main").innerHTML =
    title(
      "Calendrier des consultations",
      "Les demandes ne deviennent des rendez-vous qu’après confirmation.",
      can()
        ? '<button class="btn" id="manage-schedules">' +
            icon("settings") +
            " Disponibilités</button>"
        : "",
    ) +
    `<div class="tabs"><a href="/gestion/rendez-vous" data-link>Liste des demandes</a><a class="active" href="/gestion/calendrier" data-link>Calendrier</a></div><div class="panel"><div class="calendar-header"><button class="icon-btn" id="previous-month" aria-label="Mois précédent">←</button><h3 id="calendar-month"></h3><div class="inline-actions"><button class="icon-btn" id="calendar-today">Aujourd’hui</button><button class="icon-btn" id="next-month" aria-label="Mois suivant">→</button></div></div><div class="calendar-wrap"><div id="calendar-grid" class="calendar-grid"></div></div><div class="chart-legend"><span><i></i> Confirmé</span><span><i style="background:#f2cf85"></i> À confirmer</span></div></div><div class="notice mt20">${icon("clock")}Les plages récurrentes sont configurables dans Paramètres → Disponibilités. Les créneaux restent indicatifs ; le personnel valide chaque demande.</div>`;
  $("#previous-month").onclick = () => {
    calDate = new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1);
    drawCalendar();
  };
  $("#next-month").onclick = () => {
    calDate = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1);
    drawCalendar();
  };
  $("#calendar-today").onclick = () => {
    calDate = new Date();
    drawCalendar();
  };
  $("#manage-schedules")?.addEventListener("click", () => {
    tab = "schedules";
    go("/gestion/parametres");
  });
  drawCalendar();
}
function drawCalendar() {
  const year = calDate.getFullYear(),
    month = calDate.getMonth(),
    first = new Date(year, month, 1);
  $("#calendar-month").textContent = first.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  let start = new Date(year, month, 1 - ((first.getDay() + 6) % 7)),
    html = ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam.", "Dim."]
      .map((d) => `<div class="calendar-label">${d}</div>`)
      .join("");
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key =
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0");
    const events = appointmentCache.filter(
      (a) => a.day === key && ["confirmed", "pending"].includes(a.status),
    );
    html += `<div class="calendar-day ${d.getMonth() !== month ? "other" : ""} ${key === today() ? "today" : ""}"><span class="day-number">${d.getDate()}</span>${events
      .sort((a, b) => a.slot.localeCompare(b.slot))
      .map(
        (a) =>
          `<button class="calendar-event ${a.status}" data-event="${a.id}" title="${esc(a.patient)} · ${esc(a.service)}">${esc(a.slot || "À définir")} ${esc(a.patient)}</button>`,
      )
      .join("")}</div>`;
  }
  $("#calendar-grid").innerHTML = html;
  $$("[data-event]").forEach(
    (b) => (b.onclick = () => appointmentModal(Number(b.dataset.event))),
  );
}
async function consultationsPage() {
  consultationCache = await api("/admin/consultations");
  const total = consultationCache.reduce((s, c) => s + c.amount - c.paid, 0);
  $("#main").innerHTML =
    title(
      "Consultations",
      "Enregistrez les consultations et leurs encaissements.",
      addButton("add-consultation", "Nouvelle consultation"),
    ) +
    `<div class="notice mb20">${icon("shield")}Ce registre est administratif, sans notes cliniques ni diagnostics. Les paiements sont automatiquement inscrits dans les recettes.</div><div class="stat-grid">${stat("Consultations enregistrées", consultationCache.length, "2 000 entrées récentes maximum", "stethoscope")}${stat("Restant à encaisser", money(total) + " <small>FCFA</small>", "Sur les consultations affichées", "wallet")}</div><div class="table-panel"><div class="table-tools"><input id="consultation-search" type="search" placeholder="Rechercher un patient ou un service…" aria-label="Rechercher une consultation"><span class="tag">Registre des consultations</span></div><div class="table-scroll"><table><thead><tr><th>Patient</th><th>Date / Praticien</th><th>Service</th><th>Montant</th><th>Encaissé</th><th>Solde / Action</th></tr></thead><tbody id="consultation-rows"></tbody></table></div></div>`;
  $("#add-consultation").onclick = consultationModal;
  $("#consultation-search").oninput = (e) => {
    search = e.target.value;
    consultationRows();
  };
  consultationRows();
}
function consultationRows() {
  const rows = consultationCache.filter((c) =>
    (c.patient + " " + c.service).toLowerCase().includes(search.toLowerCase()),
  );
  $("#consultation-rows").innerHTML =
    rows
      .map(
        (c) =>
          `<tr><td><strong>${esc(c.patient)}</strong><small>Consultation #${c.id}</small></td><td>${dateFr(c.day)}<small>${esc(c.practitioner || "Non renseigné")}</small></td><td>${esc(c.service)}</td><td>${money(c.amount)} F</td><td>${money(c.paid)} F</td><td>${c.amount === c.paid ? '<span class="tag completed">Soldé</span>' : `<div class="td-actions"><span class="tag pending">${money(c.amount - c.paid)} F</span><button class="icon-btn" data-payment="${c.id}" title="Encaisser un complément">${icon("plus")}</button></div>`}</td></tr>`,
      )
      .join("") ||
    emptyTable(
      6,
      "Aucune consultation enregistrée",
      "Ajoutez une consultation pour commencer votre registre.",
      "stethoscope",
    );
  $$("[data-payment]").forEach(
    (b) => (b.onclick = () => paymentModal(Number(b.dataset.payment))),
  );
}
async function consultationModal() {
  let ap = [];
  try {
    ap = await api("/admin/appointments");
  } catch (e) {
    toast(e.message);
    return;
  }
  const available = ap.filter(
    (a) =>
      !consultationCache.some((c) => c.appointment_id === a.id) &&
      a.status !== "cancelled" &&
      a.status !== "completed",
  );
  modal(
    "Enregistrer une consultation",
    `<form id="consultation-form">${errorBox}<div class="form-grid">${selectField("Lier à un rendez-vous (facultatif)", "appointment_id", [["", "Sans rendez-vous lié"], ...available.map((a) => [String(a.id), a.patient + " · " + dateFr(a.day)])], "", true)}${field("Nom du patient *", "patient", "text", "", 'required minlength="2" maxlength="120"')}${field("Date de consultation *", "day", "date", today(), 'required max="' + today() + '"')}${field("Service / prestation *", "service", "text", "", 'required minlength="2" maxlength="120"')}${selectField("Praticien", "practitioner", [["", "À renseigner"], ...S.team.map((p) => p.name)])}${field("Montant dû (FCFA) *", "amount", "number", "0", 'required min="0" max="100000000" step="1"')}${field("Montant encaissé (FCFA) *", "paid", "number", "0", 'required min="0" max="100000000" step="1"')}<div class="notice field full">${icon("wallet")}L’encaissement sera ajouté aux recettes, sans double saisie. Le rendez-vous lié passera au statut « Terminé ».</div></div><div class="form-actions"><button type="button" class="btn secondary" onclick="closeModal()">Annuler</button><button class="btn" type="submit">Enregistrer</button></div></form>`,
  );
  const f = $("#consultation-form");
  f.appointment_id.onchange = () => {
    const a = ap.find((a) => String(a.id) === f.appointment_id.value);
    if (a) {
      f.patient.value = a.patient;
      f.service.value = a.service;
      f.practitioner.value = a.practitioner;
    }
  };
  f.onsubmit = (e) => {
    e.preventDefault();
    submit(f, async () => {
      const d = Object.fromEntries(new FormData(f));
      d.amount = Number(d.amount);
      d.paid = Number(d.paid);
      d.appointment_id = d.appointment_id ? Number(d.appointment_id) : null;
      await post("/admin/consultations", d);
      closeModal();
      toast("Consultation et encaissement enregistrés.");
      consultationsPage();
    });
  };
}
function paymentModal(id) {
  const c = consultationCache.find((c) => c.id === id);
  modal(
    "Encaisser un complément",
    `<p class="text-small">Consultation #${id} · ${esc(c.patient)}<br>Solde restant : <strong>${money(c.amount - c.paid)} FCFA</strong></p><form id="payment-form">${errorBox}${field("Montant encaissé (FCFA)", "amount", "number", "", 'required min="1" max="' + (c.amount - c.paid) + '" step="1"')}<div class="form-actions"><button class="btn" type="submit">Enregistrer le paiement</button></div></form>`,
  );
  $("#payment-form").onsubmit = (e) => {
    e.preventDefault();
    submit(e.target, async () => {
      await post("/admin/consultations/" + id + "/payment", {
        amount: Number(e.target.amount.value),
      });
      closeModal();
      toast("Paiement ajouté aux recettes.");
      consultationsPage();
    });
  };
}
async function financesPage() {
  transactionCache = await api("/admin/transactions");
  $("#main").innerHTML =
    title(
      "Finances",
      "Suivez vos encaissements et vos dépenses en francs CFA.",
      addButton("add-transaction", "Nouvelle opération"),
    ) +
    `<div class="report-period"><div class="field"><label for="finance-month">Période</label><input type="month" id="finance-month" value="${today().slice(0, 7)}"></div></div><div id="finance-stats" class="stat-grid"></div><div class="table-panel"><div class="table-tools"><input id="finance-search" type="search" placeholder="Rechercher un libellé ou une catégorie…" aria-label="Rechercher une opération"><div class="filters"><select id="finance-kind" aria-label="Type d’opération"><option value="all">Toutes les opérations</option><option value="income">Recettes</option><option value="expense">Dépenses</option></select><a class="text-link" href="/gestion/rapports" data-link>Exporter un rapport ${icon("arrow")}</a></div></div><div class="table-scroll"><table><thead><tr><th>Date</th><th>Libellé</th><th>Catégorie</th><th>Type</th><th>Montant</th></tr></thead><tbody id="finance-rows"></tbody></table></div><div class="table-count">Les encaissements des consultations sont ajoutés automatiquement. Les écritures ne sont pas supprimables ; corrigez par une écriture compensatrice documentée.</div></div>`;
  $("#add-transaction").onclick = transactionModal;
  ["finance-search", "finance-kind", "finance-month"].forEach((id) =>
    $("#" + id).addEventListener(
      id === "finance-search" ? "input" : "change",
      financeRows,
    ),
  );
  financeRows();
}
function financeRows() {
  const month = $("#finance-month").value,
    q = $("#finance-search").value.toLowerCase(),
    kind = $("#finance-kind").value;
  const period = transactionCache.filter(
      (t) => !month || t.day.startsWith(month),
    ),
    rows = period.filter(
      (t) =>
        (kind === "all" || t.kind === kind) &&
        (t.label + " " + t.category).toLowerCase().includes(q),
    );
  const income = period
      .filter((t) => t.kind === "income")
      .reduce((s, t) => s + t.amount, 0),
    expense = period
      .filter((t) => t.kind === "expense")
      .reduce((s, t) => s + t.amount, 0);
  $("#finance-stats").innerHTML =
    stat(
      "Recettes",
      money(income) + " <small>FCFA</small>",
      "Encaissements sur la période",
      "wallet",
    ) +
    stat(
      "Dépenses",
      money(expense) + " <small>FCFA</small>",
      "Décaissements sur la période",
      "chart",
    ) +
    stat(
      "Solde de trésorerie",
      money(income - expense) + " <small>FCFA</small>",
      "Ne constitue pas un bénéfice comptable",
      "wallet",
    ) +
    stat(
      "Opérations",
      period.length,
      "5 000 dernières écritures maximum",
      "file",
    );
  $("#finance-rows").innerHTML =
    rows
      .map(
        (t) =>
          `<tr><td>${dateFr(t.day)}</td><td><strong>${esc(t.label)}</strong>${t.consultation_id ? "<small>Lié à la consultation #" + t.consultation_id + "</small>" : ""}</td><td>${esc(t.category)}</td><td><span class="tag ${t.kind}">${t.kind === "income" ? "Recette" : "Dépense"}</span></td><td class="${t.kind === "income" ? "amount-positive" : "amount-negative"}"><strong>${t.kind === "income" ? "+" : "−"} ${money(t.amount)} F</strong></td></tr>`,
      )
      .join("") ||
    emptyTable(
      5,
      "Aucune opération sur cette période",
      "Les encaissements et dépenses s’afficheront ici.",
      "wallet",
    );
}
function transactionModal() {
  modal(
    "Ajouter une opération",
    `<form id="transaction-form">${errorBox}<div class="form-grid">${selectField(
      "Type",
      "kind",
      [
        ["expense", "Dépense"],
        ["income", "Recette hors consultation"],
      ],
      "expense",
    )}${field("Date", "day", "date", today(), 'required max="' + today() + '"')}${field("Catégorie *", "category", "text", "", 'required minlength="2" maxlength="80" placeholder="Ex. Consommables, charges…"')}${field("Montant (FCFA) *", "amount", "number", "", 'required min="1" max="100000000" step="1"')}${field("Libellé *", "label", "text", "", 'required minlength="2" maxlength="200" placeholder="Description sans données patient"', true)}<div class="notice field full">${icon("info")}Pour une consultation, utilisez le registre des consultations afin d’éviter un double encaissement. N’inscrivez pas de nom de patient dans le libellé.</div></div><div class="form-actions"><button type="button" class="btn secondary" onclick="closeModal()">Annuler</button><button class="btn" type="submit">Enregistrer l’opération</button></div></form>`,
  );
  $("#transaction-form").onsubmit = (e) => {
    e.preventDefault();
    submit(e.target, async () => {
      const d = Object.fromEntries(new FormData(e.target));
      d.amount = Number(d.amount);
      await post("/admin/transactions", d);
      closeModal();
      toast("Opération enregistrée.");
      financesPage();
    });
  };
}
async function inventoryPage() {
  inventoryCache = await api("/admin/inventory");
  const moves = await api("/admin/movements");
  $("#main").innerHTML =
    title(
      "Stocks & consommables",
      "Contrôlez les quantités et anticipez vos réapprovisionnements.",
      addButton("add-item", "Nouveau consommable"),
    ) +
    `<div class="stat-grid">${stat("Références", inventoryCache.length, "Articles suivis dans le stock", "box")}${stat("Articles au seuil d’alerte", inventoryCache.filter((i) => i.quantity <= i.threshold).length, "Stock inférieur ou égal au seuil", "bell")}</div><div class="table-panel"><div class="table-tools"><input id="inventory-search" type="search" placeholder="Rechercher un consommable…" aria-label="Rechercher un consommable"><select id="inventory-alert" aria-label="Filtrer les stocks"><option value="all">Tous les consommables</option><option value="low">Stock en alerte</option></select></div><div class="table-scroll"><table><thead><tr><th>Consommable</th><th>Quantité</th><th>Seuil d’alerte</th><th>État</th><th>Mouvement</th></tr></thead><tbody id="inventory-rows"></tbody></table></div></div><section class="panel mt20"><div class="panel-head"><h3>Derniers mouvements</h3><span class="tag">Traçabilité du stock</span></div>${moves.length ? `<div class="table-scroll"><table><thead><tr><th>Date</th><th>Article</th><th>Variation</th><th>Motif</th></tr></thead><tbody>${moves.map((m) => `<tr><td>${new Date(m.created_at).toLocaleDateString("fr-FR")}</td><td>${esc(m.name)}</td><td class="${m.delta >= 0 ? "amount-positive" : "amount-negative"}">${m.delta > 0 ? "+" : ""}${m.delta}</td><td>${esc(m.reason)}</td></tr>`).join("")}</tbody></table></div>` : '<div class="mini-empty">Aucun mouvement enregistré.</div>'}</section><p class="legal-note">Ce module suit les quantités de consommables ; il ne gère pas la pharmacie, les lots, les péremptions ou les prescriptions.</p>`;
  $("#add-item").onclick = itemModal;
  $("#inventory-search").oninput = inventoryRows;
  $("#inventory-alert").onchange = inventoryRows;
  inventoryRows();
}
function inventoryRows() {
  const q = $("#inventory-search").value.toLowerCase(),
    low = $("#inventory-alert").value === "low";
  const rows = inventoryCache.filter(
    (i) =>
      i.name.toLowerCase().includes(q) && (!low || i.quantity <= i.threshold),
  );
  $("#inventory-rows").innerHTML =
    rows
      .map(
        (i) =>
          `<tr><td><strong>${esc(i.name)}</strong></td><td><strong>${money(i.quantity)}</strong> ${esc(i.unit)}</td><td>${i.threshold} ${esc(i.unit)}</td><td><span class="tag ${i.quantity <= i.threshold ? "alert" : "completed"}">${i.quantity === 0 ? "Rupture" : i.quantity <= i.threshold ? "À réapprovisionner" : "Disponible"}</span></td><td><button class="icon-btn" data-movement="${i.id}">${icon("plus")} Entrée / sortie</button></td></tr>`,
      )
      .join("") ||
    emptyTable(
      5,
      "Aucun consommable à afficher",
      "Ajoutez vos premiers articles et définissez leurs seuils d’alerte.",
      "box",
    );
  $$("[data-movement]").forEach(
    (b) => (b.onclick = () => movementModal(Number(b.dataset.movement))),
  );
}
function itemModal() {
  modal(
    "Ajouter un consommable",
    `<form id="item-form">${errorBox}<div class="form-grid">${field("Nom du consommable *", "name", "text", "", 'required minlength="2" maxlength="100"', true)}${field("Unité *", "unit", "text", "", 'required maxlength="30" placeholder="Ex. boîtes, unités"')}${field("Quantité initiale *", "quantity", "number", "0", 'required min="0" step="1"')}${field("Seuil d’alerte *", "threshold", "number", "5", 'required min="0" step="1"')}</div><div class="form-actions"><button class="btn" type="submit">Ajouter au stock</button></div></form>`,
  );
  $("#item-form").onsubmit = (e) => {
    e.preventDefault();
    submit(e.target, async () => {
      const d = Object.fromEntries(new FormData(e.target));
      d.quantity = Number(d.quantity);
      d.threshold = Number(d.threshold);
      await post("/admin/inventory", d);
      closeModal();
      toast("Consommable ajouté.");
      inventoryPage();
    });
  };
}
function movementModal(id) {
  const i = inventoryCache.find((i) => i.id === id);
  modal(
    "Entrée ou sortie de stock",
    `<p class="text-small"><strong>${esc(i.name)}</strong> · Stock actuel : ${i.quantity} ${esc(i.unit)}</p><form id="movement-form">${errorBox}<div class="form-grid">${selectField(
      "Mouvement",
      "kind",
      [
        ["out", "Sortie / consommation"],
        ["in", "Entrée / réapprovisionnement"],
      ],
      "out",
    )}${field("Quantité *", "quantity", "number", "", 'required min="1" step="1"')}${field("Motif *", "reason", "text", "", 'required minlength="2" maxlength="180" placeholder="Ex. Utilisation en consultation"', true)}</div><div class="form-actions"><button class="btn" type="submit">Valider le mouvement</button></div></form>`,
  );
  $("#movement-form").onsubmit = (e) => {
    e.preventDefault();
    submit(e.target, async () => {
      const f = e.target;
      await post("/admin/inventory/" + id + "/movement", {
        delta: Number(f.quantity.value) * (f.kind.value === "out" ? -1 : 1),
        reason: f.reason.value,
      });
      closeModal();
      toast("Mouvement enregistré.");
      inventoryPage();
    });
  };
}
async function reportsPage() {
  transactionCache = await api("/admin/transactions");
  if (!reportStart) reportStart = today().slice(0, 7) + "-01";
  if (!reportEnd) reportEnd = today();
  $("#main").innerHTML =
    title(
      "Rapports & statistiques",
      "Analysez les flux de trésorerie et exportez vos opérations.",
    ) +
    `<div class="report-period">${field("Du", "report-start", "date", reportStart)}${field("Au", "report-end", "date", reportEnd)}<button class="btn" id="report-export">${icon("download")} Exporter en CSV</button></div><div id="report-stats" class="stat-grid"></div><div class="dashboard-grid"><div class="panel"><div class="panel-head"><h3>Évolution sur les six derniers mois</h3></div>${chart(transactionCache)}</div><div class="panel"><div class="panel-head"><h3>Répartition des dépenses</h3><span class="tag">Période sélectionnée</span></div><div id="category-report"></div></div></div><div class="notice mt20">${icon("info")}Les rapports affichent les 5 000 dernières écritures et ne remplacent pas les états comptables réglementaires. Le CSV exporte toutes les écritures de la période sélectionnée, sans données patient.</div>`;
  ["report-start", "report-end"].forEach(
    (id) => ($("#f-" + id).onchange = reportRows),
  );
  $("#report-export").onclick = () => {
    if (!reportValid()) return;
    const a = document.createElement("a");
    a.href = "/api/admin/report.csv?start=" + reportStart + "&end=" + reportEnd;
    a.download = "tchiva-finances.csv";
    document.body.append(a);
    a.click();
    a.remove();
  };
  reportRows();
}
function reportValid() {
  reportStart = $("#f-report-start").value;
  reportEnd = $("#f-report-end").value;
  if (!reportStart || !reportEnd || reportStart > reportEnd) {
    toast("Choisissez une période valide.");
    return false;
  }
  return true;
}
function reportRows() {
  if (!reportValid()) return;
  const rows = transactionCache.filter(
      (t) => t.day >= reportStart && t.day <= reportEnd,
    ),
    income = rows
      .filter((t) => t.kind === "income")
      .reduce((s, t) => s + t.amount, 0),
    expense = rows
      .filter((t) => t.kind === "expense")
      .reduce((s, t) => s + t.amount, 0);
  $("#report-stats").innerHTML =
    stat(
      "Recettes",
      money(income) + " <small>FCFA</small>",
      "Encaissements sur la période",
      "wallet",
    ) +
    stat(
      "Dépenses",
      money(expense) + " <small>FCFA</small>",
      "Décaissements sur la période",
      "chart",
    ) +
    stat(
      "Solde de trésorerie",
      money(income - expense) + " <small>FCFA</small>",
      "Recettes moins dépenses",
      "wallet",
    ) +
    stat(
      "Nombre d’opérations",
      rows.length,
      "Sur la période sélectionnée",
      "file",
    );
  const cat = Object.create(null);
  rows
    .filter((t) => t.kind === "expense")
    .forEach((t) => (cat[t.category] = (cat[t.category] || 0) + t.amount));
  $("#category-report").innerHTML = Object.keys(cat).length
    ? Object.entries(cat)
        .sort((a, b) => b[1] - a[1])
        .map(
          ([k, v]) =>
            `<div class="audit-row"><span>${esc(k)}</span><strong>${money(v)} F</strong></div>`,
        )
        .join("")
    : '<div class="mini-empty">' +
      icon("chart") +
      "<strong>Aucune dépense à analyser</strong>Vos catégories s’afficheront au fil des opérations.</div>";
}
let adminSettings = {};
async function settingsPage() {
  adminSettings = await api("/admin/settings");
  $("#main").innerHTML =
    title(
      "Paramètres de la clinique",
      "Modifiez les informations du site et les accès du personnel.",
    ) +
    `<div class="tabs" id="settings-tabs">${[
      ["general", "Informations"],
      ["services", "Services & équipe"],
      ["schedules", "Disponibilités"],
      ["users", "Comptes"],
      ["launch", "Mise en ligne"],
    ]
      .map(
        ([k, l]) =>
          `<button data-tab="${k}" class="${tab === k ? "active" : ""}">${l}</button>`,
      )
      .join("")}</div><div id="settings-content"></div>`;
  $$("[data-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        tab = b.dataset.tab;
        $$("[data-tab]").forEach((x) => x.classList.toggle("active", x === b));
        settingsTab();
      }),
  );
  await settingsTab();
}
async function persistSettings() {
  await api("/admin/settings", {
    method: "PUT",
    body: JSON.stringify(adminSettings),
  });
  const r = await api("/public");
  S = r.settings;
  toast("Informations enregistrées et site actualisé.");
}
async function settingsTab() {
  const s = adminSettings,
    el = $("#settings-content");
  if (tab === "general") {
    el.innerHTML = `<div class="settings-layout"><section class="panel"><h3>Informations essentielles</h3><p class="text-small">Les champs vides restent signalés comme « à compléter » sur le site.</p><form id="settings-form">${errorBox}<div class="form-grid">${field("Nom de la clinique", "name", "text", s.name, 'required minlength="2" maxlength="100"')}${field("Ville", "city", "text", s.city, "required")}${field("Adresse / repère", "address", "text", s.address, "required", true)}${field("Téléphone", "phone", "tel", s.phone, 'placeholder="+225…"')}${field("Numéro WhatsApp", "whatsapp", "tel", s.whatsapp, 'placeholder="+225…"')}${field("Numéro des urgences 24h/24", "emergency_phone", "tel", s.emergency_phone, 'placeholder="+225…"')}${field("Accueil & renseignements (plusieurs numéros séparés par une virgule)", "reception_phones", "text", (s.reception_phones || []).join(", "), 'placeholder="+225 07 07 99 54 14, +225 05 05 81 94 44"', true)}${field("Adresse e-mail", "email", "email", s.email)}${field("Contact protection des données", "privacy_contact", "text", s.privacy_contact)}${textarea("Horaires d’accueil", "hours", s.hours, 'maxlength="1000" placeholder="Indiquez les jours et horaires validés"')}${textarea("Présentation de la clinique", "about", s.about, 'maxlength="2500"')}${field("URL d’intégration Google Maps (facultatif)", "map_url", "url", s.map_url, 'placeholder="https://www.google.com/maps?q=6.90645,-6.43381&output=embed"', true)}<div class="field full"><small>URL chargée dans la carte de la page Contact. Par défaut : <code>https://www.google.com/maps?q=6.90645,-6.43381&amp;output=embed</code>. Le bouton d’itinéraire utilise les coordonnées ci-dessous.</small></div>${field("Plus Code", "plus_code", "text", s.plus_code, 'placeholder="WH48+HFJ Daloa"')}${field("Latitude GPS", "latitude", "text", s.latitude, 'placeholder="6.90645"')}${field("Longitude GPS", "longitude", "text", s.longitude, 'placeholder="-6.43381"')}<div class="field full"><small>Coordonnées exactes de la clinique, utilisées pour la carte et le bouton « Itinéraire ». Aucun schéma de remplacement n’est affiché : la carte réelle reste toujours prioritaire.</small></div>${field("Assurances & mutuelles conventionnées (séparées par une virgule)", "insurances", "text", (s.insurances || []).join(", "), 'placeholder="CNAM, ASCOMA, SANLAM, AXA, GMC, MUGEF-CI"', true)}${field("Durée cible des demandes sans suivi (jours)", "retention_days", "number", s.retention_days, 'required min="30" max="3650"')}<div class="field full"><small>Cette durée est informative ; aucune suppression automatique. Validez les obligations applicables avant de supprimer des données.</small></div></div><div class="form-actions"><button class="btn" type="submit">Enregistrer les modifications ${icon("check")}</button></div></form></section><aside class="help-card"><h3>${icon("help")} À votre rythme.</h3><p>Pas besoin de modifier le code du site.</p><ol><li>Renseignez vos coordonnées officielles.</li><li>Indiquez les horaires vérifiés.</li><li>Enregistrez pour mettre à jour le site.</li><li>Contrôlez l’affichage sur la page Contact.</li></ol><a href="/gestion/formation" data-link class="text-link">Ouvrir le guide ${icon("arrow")}</a></aside></div>`;
    $("#settings-form").onsubmit = (e) => {
      e.preventDefault();
      submit(e.target, async () => {
        const d = Object.fromEntries(new FormData(e.target));
        d.retention_days = Number(d.retention_days);
        d.reception_phones = String(d.reception_phones || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
        d.insurances = String(d.insurances || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
        adminSettings = { ...s, ...d };
        await persistSettings();
      });
    };
  } else if (tab === "services") {
    el.innerHTML = `<div class="notice mb20">${icon("shield")}Ne publiez que des spécialités réellement proposées et des profils dont les qualifications ont été vérifiées. Un brouillon n’apparaît pas sur le site public.</div><section class="panel"><div class="panel-head"><h3>Services & spécialités</h3><button class="btn small" id="add-specialty">${icon("plus")} Ajouter un service</button></div>${s.specialties.length ? s.specialties.map((x, i) => `<div class="settings-row"><div class="grow"><strong>${esc(x.name)}</strong><p>${esc(x.description)}</p></div><span class="tag ${x.published ? "completed" : "pending"}">${x.published ? "Publié" : "Brouillon"}</span><button class="icon-btn" data-specialty="${i}" aria-label="Modifier ${esc(x.name)}">${icon("edit")}</button><button class="icon-btn" data-delete-specialty="${i}" aria-label="Supprimer ${esc(x.name)}">${icon("trash")}</button></div>`).join("") : '<div class="mini-empty">Aucun service renseigné. Ajoutez votre offre de soins vérifiée.</div>'}</section><section class="panel mt20"><div class="panel-head"><h3>Équipe médicale</h3><button class="btn small" id="add-practitioner">${icon("plus")} Ajouter un praticien</button></div>${s.team.length ? s.team.map((x, i) => `<div class="settings-row"><div class="person-avatar no-margin" style="width:40px;height:40px;font-size:16px">${esc(initials(x.name))}</div><div class="grow"><strong>${esc(x.name)}</strong><p>${esc(x.specialty)}</p></div><span class="tag ${x.published ? "completed" : "pending"}">${x.published ? "Publié" : "Brouillon"}</span><button class="icon-btn" data-practitioner="${i}" aria-label="Modifier ${esc(x.name)}">${icon("edit")}</button><button class="icon-btn" data-delete-practitioner="${i}" aria-label="Supprimer ${esc(x.name)}">${icon("trash")}</button></div>`).join("") : '<div class="mini-empty">Aucun profil renseigné. Aucun nom de médecin n’est inventé.</div>'}</section>`;
    $("#add-specialty").onclick = () => contentModal("specialty");
    $("#add-practitioner").onclick = () => contentModal("practitioner");
    $$("[data-specialty]").forEach(
      (b) =>
        (b.onclick = () =>
          contentModal("specialty", Number(b.dataset.specialty))),
    );
    $$("[data-practitioner]").forEach(
      (b) =>
        (b.onclick = () =>
          contentModal("practitioner", Number(b.dataset.practitioner))),
    );
    for (const [attr, key] of [
      ["specialty", "specialties"],
      ["practitioner", "team"],
    ]) {
      $$("[data-delete-" + attr + "]").forEach(
        (b) =>
          (b.onclick = async () => {
            if (
              !confirm(
                "Supprimer cet élément du site ? Les anciennes demandes ne seront pas effacées.",
              )
            )
              return;
            const i = Number(b.getAttribute("data-delete-" + attr));
            const old = structuredClone(adminSettings);
            adminSettings[key].splice(i, 1);
            try {
              await persistSettings();
              settingsTab();
            } catch (e) {
              adminSettings = old;
              toast(e.message);
            }
          }),
      );
    }
  } else if (tab === "schedules") {
    el.innerHTML = `<div class="notice mb20">${icon("clock")}Les plages hebdomadaires proposent des heures indicatives dans le formulaire. Les demandes doivent toujours être validées. Les jours sont interprétés dans le fuseau Africa/Abidjan.</div><section class="panel"><div class="panel-head"><h3>Disponibilités récurrentes</h3><button class="btn small" id="add-schedule">${icon("plus")} Ajouter une plage</button></div>${s.schedules.length ? `<div class="table-scroll"><table><thead><tr><th>Jour</th><th>Plage</th><th>Durée</th><th>Praticien</th><th>Actions</th></tr></thead><tbody>${s.schedules.map((x, i) => `<tr><td>${["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"][x.weekday]}</td><td>${x.start} – ${x.end}</td><td>${x.minutes} min</td><td>${esc(x.practitioner || "Accueil / général")}</td><td><div class="td-actions"><button class="icon-btn" data-schedule="${i}" aria-label="Modifier la plage">${icon("edit")}</button><button class="icon-btn" data-delete-schedule="${i}" aria-label="Supprimer la plage">${icon("trash")}</button></div></td></tr>`).join("")}</tbody></table></div>` : '<div class="mini-empty">' + icon("calendar") + "<strong>Aucune plage publiée</strong>Les visiteurs peuvent transmettre une date et une heure souhaitées.</div>"}</section>`;
    $("#add-schedule").onclick = () => scheduleModal();
    $$("[data-schedule]").forEach(
      (b) => (b.onclick = () => scheduleModal(Number(b.dataset.schedule))),
    );
    $$("[data-delete-schedule]").forEach(
      (b) =>
        (b.onclick = async () => {
          if (!confirm("Supprimer cette plage récurrente ?")) return;
          const old = structuredClone(adminSettings);
          adminSettings.schedules.splice(Number(b.dataset.deleteSchedule), 1);
          try {
            await persistSettings();
            settingsTab();
          } catch (e) {
            adminSettings = old;
            toast(e.message);
          }
        }),
    );
  } else if (tab === "users") {
    const users = await api("/admin/users");
    el.innerHTML = `<section class="panel"><div class="panel-head"><h3>Comptes du personnel</h3><button class="btn small" id="add-user">${icon("plus")} Créer un compte</button></div><div class="table-scroll"><table><thead><tr><th>Personnel</th><th>Rôle</th><th>État</th><th>Action</th></tr></thead><tbody>${users.map((u) => `<tr><td><strong>${esc(u.name)}</strong><small>${esc(u.email)}</small></td><td>${esc(roles[u.role])}</td><td><span class="tag ${u.active ? "completed" : "cancelled"}">${u.active ? "Actif" : "Désactivé"}</span></td><td>${u.id !== me.id ? `<button class="icon-btn" data-toggle-user="${u.id}">${u.active ? "Désactiver" : "Réactiver"}</button>` : "Votre compte"}</td></tr>`).join("")}</tbody></table></div></section><section class="panel mt20"><h3>Des accès selon les responsabilités</h3><ul class="text-small muted"><li><strong>Administrateur :</strong> tous les modules, paramètres et comptes.</li><li><strong>Accueil :</strong> rendez-vous, calendrier et consommables, sans accès aux finances ni aux consultations.</li><li><strong>Équipe médicale :</strong> rendez-vous, consultations, encaissements liés et stocks.</li><li><strong>Comptabilité :</strong> finances, rapports et stocks, sans noms ni téléphones de patients.</li></ul></section>`;
    $("#add-user").onclick = userModal;
    $$("[data-toggle-user]").forEach(
      (b) =>
        (b.onclick = async () => {
          try {
            await api("/admin/users/" + b.dataset.toggleUser, {
              method: "PATCH",
              body: "{}",
            });
            settingsTab();
            toast("Accès mis à jour.");
          } catch (e) {
            toast(e.message);
          }
        }),
    );
  } else {
    el.innerHTML = `<section class="panel"><h3>Avant d’accueillir vos premiers patients en ligne</h3><p class="text-small">Le site est préparé techniquement, mais sa mise en production n’est pas automatique.</p>${[
      [!!s.phone, "Téléphone officiel renseigné"],
      [!!s.whatsapp, "Numéro WhatsApp renseigné"],
      [!!s.hours, "Horaires d’accueil validés"],
      [s.specialties.some((x) => x.published), "Services réels publiés"],
      [
        s.team.some((x) => x.published),
        "Profils et qualifications médicales validés",
      ],
      [!!s.emergency_phone, "Numéro des urgences 24h/24 renseigné"],
      [!!s.map_url && !!s.latitude && !!s.longitude, "Carte Google Maps et coordonnées GPS exactes validées"],
      [!!(s.insurances && s.insurances.length), "Assurances et mutuelles conventionnées listées"],
      [!!s.privacy_contact, "Contact pour la protection des données renseigné"],
    ]
      .map(
        ([ok, l]) =>
          `<div class="health-check ${ok ? "" : "warn"}">${icon(ok ? "check" : "clock")}${l}<span class="tag ${ok ? "completed" : "pending"}" style="margin-left:auto">${ok ? "Renseigné" : "À compléter"}</span></div>`,
      )
      .join(
        "",
      )}<h4 class="mt20">À configurer avec votre hébergeur</h4><ul class="text-small muted"><li>Nom de domaine, HTTPS et cookie sécurisé ; définir PUBLIC_URL et COOKIE_SECURE=1.</li><li>Vercel avec PostgreSQL/Neon : DATABASE_URL et ENCRYPTION_KEY en variables privées ; premier administrateur via ADMIN_NOM, ADMIN_PRENOM, ADMIN_EMAIL et ADMIN_PASSWORD, accès restreint, sauvegardes et tests de restauration. Aucun disque persistant local n’est requis dans ce mode.</li><li>Vérifier les formalités ivoiriennes relatives aux données de santé et à leur hébergement.</li><li>Compléter les mentions légales et valider la politique de conservation.</li><li>Créer ou revendiquer la fiche Google Business Profile, vérifier l’adresse et soumettre le sitemap dans Search Console. Aucun classement Google n’est garanti.</li><li>Pour des rappels automatiques : choisir un prestataire SMS ou WhatsApp Business API, documenter le consentement et configurer un ordonnanceur. Non intégré à cette version.</li></ul><div class="notice">${icon("info")}Le balisage local MedicalClinic, les métadonnées, robots.txt et le sitemap sont prévus. Le sitemap et les URL canoniques utilisent le domaine défini dans PUBLIC_URL.</div></section>`;
  }
}
function contentModal(kind, index = null) {
  const practitioner = kind === "practitioner",
    key = practitioner ? "team" : "specialties",
    x = index === null ? {} : adminSettings[key][index];
  modal(
    practitioner ? "Profil du praticien" : "Service & spécialité",
    `<form id="content-form">${errorBox}<div class="form-grid">${field(practitioner ? "Nom du praticien *" : "Nom du service *", "name", "text", x.name || "", 'required minlength="2" maxlength="100"', true)}${practitioner ? field("Spécialité / qualification vérifiée *", "specialty", "text", x.specialty || "", 'required maxlength="100"', true) : ""}${textarea(practitioner ? "Présentation courte" : "Description", practitioner ? "bio" : "description", x[practitioner ? "bio" : "description"] || "", 'maxlength="500"')}<label class="check-label field full"><input type="checkbox" name="published" ${x.published ? "checked" : ""}><span>Publier sur le site. Je confirme avoir vérifié les informations et disposer de l’autorisation de publication.</span></label></div><div class="form-actions"><button type="button" class="btn secondary" onclick="closeModal()">Annuler</button><button class="btn" type="submit">Enregistrer</button></div></form>`,
  );
  $("#content-form").onsubmit = (e) => {
    e.preventDefault();
    submit(e.target, async () => {
      const old = structuredClone(adminSettings),
        d = Object.fromEntries(new FormData(e.target));
      d.published = e.target.published.checked;
      if (index === null) adminSettings[key].push(d);
      else adminSettings[key][index] = d;
      try {
        await persistSettings();
        closeModal();
        settingsTab();
      } catch (err) {
        adminSettings = old;
        throw err;
      }
    });
  };
}
function scheduleModal(index = null) {
  const x =
    index === null
      ? {
          weekday: 0,
          start: "08:00",
          end: "12:00",
          minutes: 30,
          practitioner: "",
        }
      : adminSettings.schedules[index];
  modal(
    "Plage de disponibilité",
    `<form id="schedule-form">${errorBox}<div class="form-grid">${selectField(
      "Jour",
      "weekday",
      [
        "Lundi",
        "Mardi",
        "Mercredi",
        "Jeudi",
        "Vendredi",
        "Samedi",
        "Dimanche",
      ].map((x, i) => [String(i), x]),
      String(x.weekday),
    )}${selectField("Praticien", "practitioner", [["", "Accueil / général"], ...adminSettings.team.filter((p) => p.published).map((p) => p.name)], x.practitioner)}${field("Début", "start", "time", x.start, "required")}${field("Fin", "end", "time", x.end, "required")}${field("Durée d’un créneau (minutes)", "minutes", "number", x.minutes, 'required min="10" max="120"')}</div><div class="form-actions"><button class="btn" type="submit">Enregistrer la plage</button></div></form>`,
  );
  $("#schedule-form").onsubmit = (e) => {
    e.preventDefault();
    submit(e.target, async () => {
      const old = structuredClone(adminSettings),
        d = Object.fromEntries(new FormData(e.target));
      d.weekday = Number(d.weekday);
      d.minutes = Number(d.minutes);
      if (index === null) adminSettings.schedules.push(d);
      else adminSettings.schedules[index] = d;
      try {
        await persistSettings();
        closeModal();
        settingsTab();
      } catch (err) {
        adminSettings = old;
        throw err;
      }
    });
  };
}
function userModal() {
  modal(
    "Créer un compte personnel",
    `<form id="user-form">${errorBox}<div class="form-grid">${field("Nom et prénom *", "name", "text", "", 'required minlength="2" maxlength="100"', true)}${field("E-mail *", "email", "email", "", 'required autocomplete="off"')}${selectField("Rôle", "role", Object.entries(roles), "reception")}${field("Mot de passe initial *", "password", "password", "", 'required minlength="12" maxlength="72" autocomplete="new-password"', true)}<div class="notice field full">${icon("lock")}Utilisez au moins 12 caractères et transmettez le mot de passe par un canal distinct. Chaque membre peut ensuite changer son mot de passe.</div></div><div class="form-actions"><button class="btn" type="submit">Créer le compte</button></div></form>`,
  );
  $("#user-form").onsubmit = (e) => {
    e.preventDefault();
    submit(e.target, async () => {
      await post("/admin/users", Object.fromEntries(new FormData(e.target)));
      closeModal();
      toast("Compte créé.");
      settingsTab();
    });
  };
}
function passwordModal() {
  modal(
    "Changer mon mot de passe",
    `<form id="password-form">${errorBox}${field("Mot de passe actuel", "current", "password", "", 'required autocomplete="current-password"')}<div class="spacer"></div>${field("Nouveau mot de passe (12 caractères minimum)", "password", "password", "", 'required minlength="12" maxlength="72" autocomplete="new-password"')}<div class="form-actions"><button class="btn" type="submit">Mettre à jour</button></div><p class="legal-note">Toutes vos sessions seront fermées. Reconnectez-vous avec le nouveau mot de passe.</p></form>`,
  );
  $("#password-form").onsubmit = (e) => {
    e.preventDefault();
    submit(e.target, async () => {
      await post("/admin/password", Object.fromEntries(new FormData(e.target)));
      closeModal();
      me = null;
      renderAdmin();
      toast("Mot de passe changé. Veuillez vous reconnecter.");
    });
  };
}
async function trainingPage() {
  $("#main").innerHTML =
    title(
      "Bienvenue dans votre nouvel outil.",
      "Une prise en main en 15 minutes, pour aller à l’essentiel.",
    ) +
    `<div class="notice mb20">${icon("help")}Ce guide constitue le support de formation courte. Un administrateur doit accompagner le personnel lors de la première utilisation.</div><div class="panel prose" style="max-width:none"><div class="eyebrow">01 · METTRE LE SITE À JOUR · 3 MIN</div><h3>Vos informations, sans toucher au code.</h3><ol class="text-small muted"><li>Ouvrez <strong>Paramètres → Informations</strong> avec un compte administrateur.</li><li>Modifiez le téléphone, le numéro WhatsApp et d’urgence avec l’indicatif +225, l’adresse, les coordonnées GPS, les horaires et les assurances conventionnées.</li><li>Cliquez sur <strong>Enregistrer les modifications</strong>. Vérifiez la page Contact du site public.</li><li>Dans <strong>Services & équipe</strong>, ajoutez un service ou un praticien vérifié. Sans « Publier », l’élément reste en brouillon.</li></ol><hr style="border:0;border-top:1px solid var(--line);margin:30px 0"><div class="eyebrow">02 · GÉRER UN RENDEZ-VOUS · 4 MIN</div><h3>Du premier contact à la consultation.</h3><ol class="text-small muted"><li>Dans <strong>Rendez-vous</strong>, filtrez « À confirmer » et ouvrez une demande avec le crayon.</li><li>Vérifiez la date, l’heure et le praticien. Choisissez « Confirmé » et prévenez le patient.</li><li>Consultez la vue <strong>Calendrier</strong>. Un créneau confirmé ne peut pas être attribué deux fois au même praticien.</li><li>Si le patient a consenti aux rappels, cliquez sur la cloche. Vérifiez le numéro et le texte puis ouvrez WhatsApp. <strong>L’envoi est manuel, pas automatique.</strong></li><li>Pour annuler, modifiez le statut en « Annulé ». En cas de retrait du consentement, ouvrez la demande et utilisez « Enregistrer le retrait du consentement » avant tout nouvel envoi.</li></ol><hr style="border:0;border-top:1px solid var(--line);margin:30px 0"><div class="eyebrow">03 · CONSULTATIONS & ENCAISSEMENTS · 3 MIN</div><h3>Une saisie, sans double encaissement.</h3><ol class="text-small muted"><li>Avec le rôle médical ou administrateur, ouvrez <strong>Consultations → Nouvelle consultation</strong>.</li><li>Liez éventuellement un rendez-vous, renseignez la prestation et les montants.</li><li>Le montant encaissé est ajouté automatiquement aux recettes. Ne le ressaisissez pas dans Finances.</li><li>Pour un paiement ultérieur, utilisez le bouton « + » à côté du solde restant.</li><li>Ce registre ne contient pas de dossier clinique. Ne saisissez pas de diagnostics dans les libellés.</li></ol><hr style="border:0;border-top:1px solid var(--line);margin:30px 0"><div class="eyebrow">04 · FINANCES & STOCKS · 3 MIN</div><h3>Garder une vision claire au quotidien.</h3><ol class="text-small muted"><li>Dans <strong>Finances</strong>, ajoutez une dépense avec sa date, son montant et sa catégorie.</li><li>Dans <strong>Stocks & consommables</strong>, créez les articles et leur seuil d’alerte. Utilisez « Entrée / sortie » pour chaque mouvement.</li><li>Une sortie supérieure au stock disponible est refusée.</li><li>Dans <strong>Rapports</strong>, choisissez la période et exportez le CSV. Il s’ouvre dans Excel.</li></ol><hr style="border:0;border-top:1px solid var(--line);margin:30px 0"><div class="eyebrow">05 · LES BONS RÉFLEXES · 2 MIN</div><h3>Protéger les accès et les patients.</h3><ul class="text-small muted"><li>Un compte par personne. N’utilisez jamais un mot de passe partagé.</li><li>Déconnectez-vous en fin de poste. L’administrateur doit désactiver les comptes des personnes qui quittent la clinique.</li><li>Ne saisissez aucune donnée réelle avant la validation de l’hébergement, du HTTPS, des sauvegardes et des formalités de protection des données.</li><li>La direction doit vérifier les données publiées et traiter les demandes de retrait de consentement et de suppression.</li><li>Les liens Google Maps et WhatsApp ouvrent des services externes. N’envoyez pas de données médicales sensibles.</li></ul><div class="notice mt20">${icon("check")}Exercice de validation : modifiez un horaire, créez une demande fictive, confirmez-la, enregistrez une consultation, vérifiez la recette et réalisez un mouvement de stock. Utilisez un environnement de test séparé.</div></div>`;
}
// Le même fichier PNG sert partout. Un logo horizontal masque le nom adjacent
// pour éviter de le répéter si le nom est déjà présent dans le visuel.
function loadLogo() {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      document.body.classList.toggle(
        "logo-wide",
        image.naturalWidth / image.naturalHeight > 1.8,
      );
      resolve();
    };
    image.onerror = () => resolve();
    image.src = "/static/logo.png";
  });
}
async function init() {
  try {
    const [r] = await Promise.all([api("/public"), loadLogo()]);
    S = r.settings;
    needsSetup = r.needs_setup;
    await render();
  } catch (e) {
    $("#app").innerHTML =
      `<div class="loading"><h2>Connexion temporairement indisponible.</h2><p>${esc(e.message)}</p><button class="btn" onclick="location.reload()">Réessayer</button></div>`;
  }
}
init();
