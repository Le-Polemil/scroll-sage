// Popup — lit/écrit les réglages dans chrome.storage.sync
(function () {
  const { withDefaults } = self.SCROLL_SAGE;
  let settings = withDefaults(null);
  let currentHost = null;

  function get(path) {
    return path.split(".").reduce((o, k) => (o == null ? o : o[k]), settings);
  }
  function set(path, value) {
    const keys = path.split(".");
    const last = keys.pop();
    const obj = keys.reduce((o, k) => (o[k] = o[k] || {}), settings);
    obj[last] = value;
  }
  function save() {
    chrome.storage.sync.set(settings);
  }

  function t(key) {
    return chrome.i18n.getMessage(key) || "";
  }

  // Traduit tous les [data-i18n] et fixe langue + sens (RTL pour l'arabe).
  function localize() {
    const lang = chrome.i18n.getUILanguage();
    if (lang) document.documentElement.lang = lang;
    const dir = chrome.i18n.getMessage("@@bidi_dir");
    if (dir) document.documentElement.dir = dir;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const msg = chrome.i18n.getMessage(el.dataset.i18n);
      if (msg) el.textContent = msg;
    });

    // Tagline tirée au hasard à chaque ouverture (les vides sont ignorés).
    const tagEl = document.getElementById("tagline");
    if (tagEl) {
      const pool = [
        "tagline1",
        "tagline2",
        "tagline3",
        "tagline4",
        "tagline5",
        "tagline6",
      ]
        .map((k) => chrome.i18n.getMessage(k))
        .filter(Boolean);
      if (pool.length) {
        tagEl.textContent = pool[Math.floor(Math.random() * pool.length)];
      }
    }
  }

  function hostFromUrl(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch (e) {
      return null;
    }
  }

  function renderSiteButton() {
    const btn = document.getElementById("toggle-site");
    document.getElementById("site").textContent = currentHost || "—";
    if (!currentHost) {
      btn.disabled = true;
      btn.textContent = t("siteUnavailable");
      return;
    }
    btn.disabled = !settings.enabled; // grisé quand l'extension est coupée
    const off = settings.disabledHosts.includes(currentHost);
    btn.textContent = off ? t("enableSite") : t("disableSite");
    btn.classList.toggle("enabled", off);
  }

  // Le master "enabled" pilote l'état actif/désactivé des autres réglages,
  // sans toucher à leurs valeurs (juste l'attribut disabled).
  function applyEnabledState() {
    const on = settings.enabled;
    document.querySelectorAll("input[data-path]").forEach((input) => {
      if (input.dataset.path !== "enabled") input.disabled = !on;
    });
    document.body.classList.toggle("st-off", !on);
    renderSiteButton();
  }

  // Couleur du niveau de limite : 0 bleu → bas vert → haut orange → max rouge.
  function rgb(a) {
    return "rgb(" + a[0] + ", " + a[1] + ", " + a[2] + ")";
  }
  function limitColor(v) {
    const stops = [
      [0, [32, 162, 248]], // bleu
      [3, [174, 204, 138]], // vert
      [7, [255, 220, 124]], // orange
      [10, [250, 102, 69]], // rouge
    ];
    if (v <= stops[0][0]) return rgb(stops[0][1]);
    if (v >= stops[stops.length - 1][0]) return rgb(stops[stops.length - 1][1]);
    for (let i = 1; i < stops.length; i++) {
      if (v <= stops[i][0]) {
        const [v0, c0] = stops[i - 1];
        const [v1, c1] = stops[i];
        const k = (v - v0) / (v1 - v0);
        return rgb(c0.map((c, j) => Math.round(c + (c1[j] - c) * k)));
      }
    }
    return rgb(stops[stops.length - 1][1]);
  }

  function init() {
    document.querySelectorAll("input[data-path]").forEach((input) => {
      if (input.type === "range") {
        const out = input.dataset.output
          ? document.getElementById(input.dataset.output)
          : null;
        const paint = () => {
          if (out) {
            out.textContent = input.value;
            out.style.color = limitColor(Number(input.value));
          }
          input.style.setProperty("--thumb", limitColor(Number(input.value)));
        };
        input.value = get(input.dataset.path);
        paint();
        input.addEventListener("input", paint); // retour visuel immédiat
        input.addEventListener("change", () => {
          set(input.dataset.path, Number(input.value));
          save();
        });
        return;
      }
      input.checked = !!get(input.dataset.path);
      input.addEventListener("change", () => {
        set(input.dataset.path, input.checked);
        save();
        if (input.dataset.path === "enabled") applyEnabledState();
      });
    });

    const btn = document.getElementById("toggle-site");
    btn.addEventListener("click", () => {
      if (!currentHost) return;
      const i = settings.disabledHosts.indexOf(currentHost);
      if (i >= 0) settings.disabledHosts.splice(i, 1);
      else settings.disabledHosts.push(currentHost);
      save();
      renderSiteButton();
    });
    applyEnabledState();
  }

  localize();

  chrome.storage.sync.get(null, (stored) => {
    settings = withDefaults(stored);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      currentHost = tabs && tabs[0] ? hostFromUrl(tabs[0].url) : null;
      init();
    });
  });
})();
