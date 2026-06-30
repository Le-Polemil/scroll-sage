// Scroll Sage — content script
// Trois comportements selon la page détectée :
//   shortform : on laisse regarder, on bloque le passage au suivant
//   feed      : plafond de scroll après N écrans + overlay pause
//   generic   : scroll infini -> bouton « Charger plus »
(function () {
  "use strict";

  const { withDefaults } = window.SCROLL_SAGE;
  let settings = withDefaults(null);
  let teardown = []; // liste de fonctions de nettoyage du mode courant
  let currentSig = null; // signature de l'état appliqué, pour éviter de réappliquer

  /* ------------------------------------------------------------------ */
  /* Détection de la page                                                */
  /* ------------------------------------------------------------------ */

  function host() {
    return location.hostname.replace(/^www\./, "");
  }

  function detect() {
    const h = location.hostname;
    const p = location.pathname;

    if (h.endsWith("youtube.com") && p.startsWith("/shorts/"))
      return { type: "shortform", key: "youtubeShorts" };

    if (h.endsWith("instagram.com") && /^\/reels?\//.test(p))
      return { type: "shortform", key: "instagramReels" };

    if (h.endsWith("tiktok.com")) {
      if (
        p === "/" ||
        p.startsWith("/foryou") ||
        p.startsWith("/following") ||
        p.startsWith("/explore") ||
        /\/video\//.test(p)
      )
        return { type: "shortform", key: "tiktok" };
    }

    if (h.endsWith("x.com") || h.endsWith("twitter.com")) {
      if (p === "/" || p === "/home") return { type: "feed", key: "x" };
    }
    if (h.endsWith("facebook.com") && (p === "/" || p.startsWith("/?")))
      return { type: "feed", key: "facebook" };
    if (h.endsWith("linkedin.com") && p.startsWith("/feed"))
      return { type: "feed", key: "linkedin" };
    if (h.endsWith("instagram.com") && p === "/")
      return { type: "feed", key: "instagramHome" };

    return { type: "generic" };
  }

  /* ------------------------------------------------------------------ */
  /* Petits utilitaires UI                                               */
  /* ------------------------------------------------------------------ */

  // Raccourci i18n (chrome.i18n est disponible dans les content scripts).
  const t = (key, subs) => chrome.i18n.getMessage(key, subs);

  let lastToast = 0;
  function toast(msg) {
    const now = Date.now();
    if (now - lastToast < 1500) return;
    lastToast = now;
    const el = document.createElement("div");
    el.className = "st-toast";
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("st-show"));
    setTimeout(() => {
      el.classList.remove("st-show");
      setTimeout(() => el.remove(), 300);
    }, 1600);
    if (settings.sound) chime();
  }

  // Son de synthèse, doux : deux notes sinus descendantes avec enveloppe +
  // passe-bas (pas de fichier audio à embarquer). Déclenché depuis un geste
  // utilisateur (molette / clavier), donc autorisé par le navigateur.
  let audioCtx = null;
  function chime() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioCtx = audioCtx || new Ctx();
      if (audioCtx.state === "suspended") audioCtx.resume();

      const filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1800; // arrondit les aigus
      filter.connect(audioCtx.destination);

      const t0 = audioCtx.currentTime;
      const notes = [
        { f: 587.33, at: 0.0 }, // Ré5
        { f: 440.0, at: 0.08 }, // La4
      ];
      for (const { f, at } of notes) {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = "sine";
        o.frequency.value = f;
        const s = t0 + at;
        g.gain.setValueAtTime(0.0001, s);
        g.gain.linearRampToValueAtTime(0.11, s + 0.012); // attaque douce
        g.gain.exponentialRampToValueAtTime(0.0001, s + 0.26); // déclin
        o.connect(g).connect(filter);
        o.start(s);
        o.stop(s + 0.3);
      }
    } catch (e) {
      /* audio indisponible : on ignore */
    }
  }

  function on(target, evt, fn, opts) {
    target.addEventListener(evt, fn, opts);
    teardown.push(() => target.removeEventListener(evt, fn, opts));
  }

  function addClass(cls) {
    document.documentElement.classList.add(cls);
    teardown.push(() => document.documentElement.classList.remove(cls));
  }

  function makeNode(html) {
    const wrap = document.createElement("div");
    wrap.innerHTML = html.trim();
    const node = wrap.firstElementChild;
    teardown.push(() => node.remove());
    return node;
  }

  /* ------------------------------------------------------------------ */
  /* Mode short-form : regarder oui, défiler non                         */
  /* ------------------------------------------------------------------ */

  const ADVANCE_KEYS = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp"]);

  function applyShortform() {
    addClass("st-shortform"); // masque les boutons next/prev natifs via le CSS

    const block = (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      toast(t("toastBlocked"));
    };

    on(window, "wheel", (e) => block(e), { capture: true, passive: false });
    on(window, "touchmove", (e) => block(e), { capture: true, passive: false });
    on(
      window,
      "keydown",
      (e) => {
        if (ADVANCE_KEYS.has(e.key)) block(e);
      },
      { capture: true }
    );
  }

  /* ------------------------------------------------------------------ */
  /* Mode feed : plafond de scroll après N écrans                        */
  /* ------------------------------------------------------------------ */

  function applyFeed() {
    let unlocked = false;
    const limit = () => window.innerHeight * settings.feedScreenLimit;

    const overlay = makeNode(`
      <div class="st-overlay" hidden>
        <div class="st-card">
          <div class="st-card-title">${t("pauseTitle")}</div>
          <p>${t("pauseBody")}</p>
          <button class="st-btn" type="button">${t("pauseContinue")}</button>
        </div>
      </div>`);
    document.documentElement.appendChild(overlay);
    overlay.querySelector("button").addEventListener("click", () => {
      unlocked = true;
      overlay.hidden = true;
    });

    const clamp = () => {
      if (unlocked) return;
      if (window.scrollY > limit()) {
        window.scrollTo(0, limit());
        overlay.hidden = false;
      }
    };

    on(
      window,
      "wheel",
      (e) => {
        if (unlocked) return;
        if (e.deltaY > 0 && window.scrollY >= limit() - 2) {
          e.preventDefault();
          overlay.hidden = false;
        }
      },
      { capture: true, passive: false }
    );
    on(window, "scroll", clamp, { passive: true });
  }

  /* ------------------------------------------------------------------ */
  /* Mode générique : on laisse scroller, on diffère les requêtes de       */
  /* pagination (via src/inject.js, monde principal) et on les rejoue au   */
  /* clic « Charger plus ». Le scroll n'est jamais bloqué.                 */
  /* ------------------------------------------------------------------ */

  function applyGeneric() {
    let page = 1;
    const root = document.documentElement;

    // Active l'interception réseau côté monde principal.
    root.dataset.ssHold = "1";
    teardown.push(() => {
      root.dataset.ssHold = "0";
      // Libère les requêtes en attente pour ne pas laisser la page bloquée.
      document.dispatchEvent(new Event("ss-release"));
      delete root.dataset.ssHeld;
    });

    const btn = makeNode(
      `<button class="st-loadmore" type="button" hidden>Charger plus ↓</button>`
    );
    document.documentElement.appendChild(btn);
    const relabel = () => {
      btn.textContent = t("loadMorePage", [String(page)]);
    };
    relabel();

    // Le bouton n'apparaît que si des requêtes de pagination sont en attente.
    const sync = () => {
      btn.hidden = Number(root.dataset.ssHeld || "0") === 0;
    };
    sync();
    on(document, "ss-held", sync);

    btn.addEventListener("click", () => {
      page += 1;
      relabel();
      btn.hidden = true;
      document.dispatchEvent(new Event("ss-release")); // rejoue les requêtes
    });
  }

  /* ------------------------------------------------------------------ */
  /* Application / réévaluation                                          */
  /* ------------------------------------------------------------------ */

  function clearMode() {
    teardown.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        /* ignore */
      }
    });
    teardown = [];
  }

  function desiredState() {
    if (!settings.enabled) return null;
    if (settings.disabledHosts.includes(host())) return null;
    const page = detect();
    if (page.type === "shortform" && settings.shortform[page.key]) return page;
    if (page.type === "feed" && settings.feeds[page.key]) return page;
    if (page.type === "generic" && settings.generic.enabled) return page;
    return null;
  }

  function apply() {
    const state = desiredState();
    const sig = JSON.stringify({ state, v: settings }) + location.pathname;
    if (sig === currentSig) return;
    currentSig = sig;

    clearMode();
    if (!state) return;
    if (!document.body) {
      // body pas encore prêt (document_start) : on réessaie vite
      requestAnimationFrame(apply);
      currentSig = null;
      return;
    }

    if (state.type === "shortform") applyShortform();
    else if (state.type === "feed") applyFeed();
    else if (state.type === "generic") applyGeneric();
  }

  /* ------------------------------------------------------------------ */
  /* Suivi des changements (SPA) + réglages                              */
  /* ------------------------------------------------------------------ */

  function watchUrlChanges() {
    let last = location.href;
    const fire = () => {
      if (location.href !== last) {
        last = location.href;
        apply();
      }
    };
    ["pushState", "replaceState"].forEach((m) => {
      const orig = history[m];
      history[m] = function () {
        const r = orig.apply(this, arguments);
        fire();
        return r;
      };
    });
    window.addEventListener("popstate", fire);
    setInterval(fire, 1000); // filet de sécurité pour les SPA récalcitrantes
  }

  chrome.storage.sync.get(null, (stored) => {
    settings = withDefaults(stored);
    apply();
    watchUrlChanges();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    chrome.storage.sync.get(null, (stored) => {
      settings = withDefaults(stored);
      currentSig = null; // force la réévaluation
      apply();
    });
  });
})();
