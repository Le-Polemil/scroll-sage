# Chrome Web Store — fiche de soumission (Scroll Sage 1.0.0)

Brouillon des textes et infos à coller dans le Developer Dashboard.
**Rappel licence :** la police Bukhari Script est autorisée par l'auteur pour un
usage **non commercial** — l'extension doit rester **gratuite** (pas de version
payante, pub ou monétisation).

---

## Identité

- **Nom** : Scroll Sage
- **Catégorie** : Productivity (Productivité)
- **Langue par défaut** : English (l'UI est localisée via `_locales/`, 12 langues)

## Description courte (≤ 132 caractères)

> Tame infinite scroll: watch Shorts/Reels/TikTok without auto-advance, cap social feeds, turn endless scroll into a button.

## Description détaillée

> Scroll Sage helps you take back control of compulsive scrolling — without
> locking you out of the sites you use.
>
> • Short-form (YouTube Shorts, Instagram Reels, TikTok): keep watching the
>   current video, but auto-advance to the next one is blocked.
> • Social feeds (X, Facebook, LinkedIn, Instagram): a configurable limit pauses
>   the feed after a few screens, with a gentle "continue anyway" option.
> • Everywhere else: when a page would auto-load more on scroll, that pagination
>   is held and replaced by a manual "Load more" button.
>
> Everything runs locally. Scroll Sage does not collect, store remotely, or
> transmit any of your data. Your preferences are saved with Chrome's own sync
> storage. Per-site disable is one click away.
>
> Free and open. Made to help you focus.

## Single purpose (objectif unique)

> Scroll Sage curbs compulsive scrolling by blocking auto-advance on short-form
> video, capping social feeds, and converting infinite scroll into manual,
> on-demand loading.

## Justification des permissions

- **storage** : enregistre tes préférences (fonctionnalités activées, limite de
  défilement, sites désactivés) via `chrome.storage.sync`. Aucune donnée envoyée.
- **Host access (`<all_urls>`)** : le cœur de l'extension (geler le scroll,
  plafonner les fils, différer la pagination) doit pouvoir s'exécuter sur
  n'importe quel site où l'on défile. Tout le traitement est **local**.
- **Script en monde principal (`world: "MAIN"`, `src/inject.js`)** : nécessaire
  pour différer les requêtes de pagination du scroll infini. Purement local,
  aucune exfiltration.

## Confidentialité

- **Données collectées : aucune.** Cocher « Je ne vends ni ne transfère les
  données des utilisateurs à des tiers » et « pas d'usage hors du fonctionnement
  d'un objet unique ».
- Pas de serveur, pas d'analytics, pas de réseau sortant initié par l'extension.

## Assets à fournir

- [x] Icône 128×128 (`icons/icon-128.png`)
- [ ] 1 à 5 captures d'écran **1280×800** (ou 640×400) — popup + démo sur un feed
- [ ] (option) petite/grande vignette promo
- [ ] URL d'une page de confidentialité (un simple paragraphe « aucune donnée
      collectée » suffit ; peut pointer vers le repo GitHub)

## Paquet

- `scroll-sage-1.0.0.zip` (généré à la racine, hors Git) — contient
  `manifest.json`, `src/`, `_locales/`, `icons/`, `assets/`.
