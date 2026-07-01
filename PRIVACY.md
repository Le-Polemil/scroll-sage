# Privacy Policy — Scroll Sage

_Last updated: 2026-06-29_

**Scroll Sage does not collect, transmit, sell, or share any personal data.**

## What data we handle

- **None is sent anywhere.** The extension performs all of its work locally,
  inside your browser. It makes **no network requests of its own**, contacts no
  server, and uses no analytics or tracking.
- **Your settings** (which protections are enabled, the scroll limit, the sound
  option, and the list of sites where you disabled the extension) are stored
  using Chrome's own `chrome.storage.sync`. This data stays within your Google
  account's Chrome sync and is **never transmitted to the developer or any third
  party**.

## Permissions and why they are used

- **storage** — to save your preferences locally (and sync them across your own
  Chrome devices).
- **Host access (`<all_urls>`)** — the extension's single purpose is to curb
  compulsive scrolling, so its content script must run on any site where you
  scroll: freeze auto-advance on short-form video (YouTube Shorts, Instagram
  Reels, TikTok), cap social feeds (X, Facebook, LinkedIn, Instagram), and turn
  generic infinite scroll into a manual "Load more" button. Page content is
  processed **only in your browser** and is never read for collection, stored
  remotely, or transmitted.

## Remote code

The extension executes **no remote code**. All scripts, styles, and assets are
bundled in the published package.

## Changes

Any change to this policy will be published on this page.

## Contact

Questions? Open an issue on the project repository:
https://github.com/Le-Polemil/scroll-sage
