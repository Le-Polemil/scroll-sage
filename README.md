# Scroll Sage

Extension Chrome (Manifest V3) qui reprend le contrôle du défilement, en une
seule extension :

- **Short-form** (YouTube Shorts, Instagram Reels, TikTok) → tu peux **regarder**
  la vidéo courante, mais le passage au suivant est bloqué (molette, flèches,
  swipe).
- **Fils sociaux** (X, Facebook, LinkedIn, fil Instagram) → plafond après N
  écrans, avec un overlay « pause » et un bouton _Continuer quand même_.
- **Partout ailleurs** → quand une page à scroll infini approche du bas, le
  défilement est bloqué et un bouton **« Charger plus ↓ »** apparaît.

Tout est local, aucune donnée n'est envoyée nulle part.

## Installation (mode développeur)

1. `chrome://extensions`
2. Active **Mode développeur** (en haut à droite)
3. **Charger l'extension non empaquetée** → sélectionne le dossier `scroll-sage/`
4. Épingle l'icône : le popup permet d'activer/désactiver chaque fonctionnalité
   et de désactiver l'extension site par site.

## Réglages

Via le popup (stockés dans `chrome.storage.sync`, synchronisés entre tes
appareils Chrome connectés). Le nombre d'écrans autorisés sur les fils et la
zone de déclenchement du bouton « Charger plus » sont configurables dans
`src/defaults.js`.

## Langues (i18n)

L'interface est traduite via `_locales/` et **Chrome choisit automatiquement la
langue selon celle du navigateur** (repli sur l'anglais si non couverte).
Langues fournies : anglais (défaut), français, espagnol, portugais (BR),
allemand, italien, russe, chinois simplifié, japonais, arabe (RTL géré), hindi,
indonésien. Pour ajouter une langue : copier `_locales/en/messages.json` dans
`_locales/<code>/` et traduire les valeurs (les clés de marque héritent de
l'anglais).

> Les traductions hors FR/EN sont au mieux automatiques — une relecture native
> est bienvenue.

## Limites connues

- Le mode **générique** repose sur une heuristique (page « haute » + proximité du
  bas). Sur un site mal détecté, désactive-le pour cet hôte via le popup.
- Les sélecteurs qui masquent les boutons natifs des Shorts YouTube
  (`src/content.css`) peuvent casser si YouTube change son markup.
- Pas d'icônes fournies (clé `icons` omise du manifest, facultative) — ajoute-en
  si tu veux la publier.
