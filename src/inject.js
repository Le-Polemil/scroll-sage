// Scroll Sage — intercepteur réseau (monde PRINCIPAL)
// Diffère UNIQUEMENT les requêtes de pagination DÉCLENCHÉES PAR UN SCROLL, et les
// rejoue au clic « Charger plus ». Une requête n'est retenue que si :
//   1. l'isolé a activé la protection sur la page (html[data-ss-hold="1"])
//   2. elle survient juste après un défilement vers le BAS près du bas de page
//      (fenêtre courte) — c'est la signature d'un scroll infini
//   3. aucun geste utilisateur récent (clic/touche : requête « voulue », on laisse)
// Ainsi les fetchs spontanés (chatbots, polling, sync) ne sont PAS interceptés.
// Communication avec le content script isolé via dataset + events sur document.
(function () {
  "use strict";

  const ZONE = 1200; // px avant le bas : zone de déclenchement de la pagination
  const GESTURE_MS = 1200; // requête < 1,2 s après un geste = voulue, on laisse
  const SCROLL_WINDOW = 700; // ms : délai max entre un scroll-bas et le fetch lié
  const root = document.documentElement;
  let lastGesture = 0;
  let lastScrollTrigger = 0; // dernier défilement vers le bas près du bas
  let lastY = window.scrollY || 0;
  const queue = [];

  ["pointerdown", "click", "keydown", "submit", "touchstart"].forEach((ev) =>
    addEventListener(ev, () => (lastGesture = Date.now()), true)
  );

  // Un scroll vers le bas qui amène près du bas = déclencheur potentiel de pagination.
  addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      const goingDown = y > lastY;
      lastY = y;
      if (!goingDown) return;
      const gap = root.scrollHeight - (y + window.innerHeight);
      if (gap <= ZONE) lastScrollTrigger = Date.now();
    },
    { capture: true, passive: true }
  );

  function shouldHold() {
    if (root.dataset.ssHold !== "1") return false;
    if (Date.now() - lastGesture < GESTURE_MS) return false;
    // Le fetch doit suivre de près un vrai défilement vers le bas.
    return Date.now() - lastScrollTrigger < SCROLL_WINDOW;
  }

  function notify() {
    root.dataset.ssHeld = String(queue.length);
    document.dispatchEvent(new Event("ss-held"));
  }

  function flush() {
    const pending = queue.splice(0);
    notify();
    pending.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        /* ignore */
      }
    });
  }
  document.addEventListener("ss-release", flush);

  // Méthode HTTP d'un appel fetch (string URL, Request, ou init.method). Défaut GET.
  function fetchMethod(args) {
    try {
      if (args[1] && args[1].method) return String(args[1].method).toUpperCase();
      if (typeof Request !== "undefined" && args[0] instanceof Request)
        return String(args[0].method || "GET").toUpperCase();
    } catch (e) {
      /* ignore */
    }
    return "GET";
  }

  // On ne retient QUE les GET (la pagination en est quasi toujours), et la
  // décision ne doit jamais pouvoir casser fetch -> try/catch + passage transparent.
  function wantHold(isGet) {
    try {
      return isGet && shouldHold();
    } catch (e) {
      return false;
    }
  }

  // --- fetch ---
  const origFetch = window.fetch;
  if (typeof origFetch === "function") {
    window.fetch = function (...args) {
      if (!wantHold(fetchMethod(args) === "GET")) {
        return origFetch.apply(this, args);
      }
      return new Promise((resolve, reject) => {
        queue.push(() => origFetch.apply(window, args).then(resolve, reject));
        notify();
      });
    };
  }

  // --- XMLHttpRequest (GET asynchrone uniquement) ---
  const XHR = window.XMLHttpRequest;
  if (XHR && XHR.prototype) {
    const origOpen = XHR.prototype.open;
    const origSend = XHR.prototype.send;
    XHR.prototype.open = function (method, url, async) {
      this.__ssAsync = async !== false; // async par défaut
      this.__ssGet = String(method || "GET").toUpperCase() === "GET";
      return origOpen.apply(this, arguments);
    };
    XHR.prototype.send = function () {
      if (!this.__ssAsync || !wantHold(this.__ssGet)) {
        return origSend.apply(this, arguments);
      }
      const self = this;
      const args = arguments;
      queue.push(() => origSend.apply(self, args));
      notify();
    };
  }
})();
