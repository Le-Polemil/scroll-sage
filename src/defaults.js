// Réglages par défaut, partagés entre le content script et le popup.
(function () {
  const DEFAULTS = {
    enabled: true,
    shortform: {
      youtubeShorts: true,
      instagramReels: true,
      tiktok: true,
    },
    feeds: {
      x: true,
      facebook: true,
      linkedin: true,
      instagramHome: true,
    },
    feedScreenLimit: 3, // nombre d'écrans autorisés avant le blocage d'un fil
    generic: {
      enabled: true,
      triggerZone: 800, // px avant le bas où l'on bloque le scroll infini
      minPageScreens: 4, // n'agit que sur les pages « hautes » (anti faux positifs)
    },
    sound: false, // petit son de synthèse (Web Audio) au moment du blocage
    disabledHosts: [], // hôtes où l'extension est totalement désactivée
  };

  // Fusion profonde simple settings stockés -> défauts (2 niveaux suffisent ici).
  function withDefaults(stored) {
    const out = JSON.parse(JSON.stringify(DEFAULTS));
    if (!stored) return out;
    for (const key of Object.keys(out)) {
      if (stored[key] === undefined) continue;
      if (out[key] && typeof out[key] === "object" && !Array.isArray(out[key])) {
        Object.assign(out[key], stored[key]);
      } else {
        out[key] = stored[key];
      }
    }
    return out;
  }

  const api = { DEFAULTS, withDefaults };
  if (typeof window !== "undefined") window.SCROLL_SAGE = api;
  if (typeof self !== "undefined") self.SCROLL_SAGE = api;
})();
