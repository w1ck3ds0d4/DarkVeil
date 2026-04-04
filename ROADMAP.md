# DarkVeil - Roadmap

**Type**: Browser extension (Manifest V3)
**Stack**: Plain JavaScript, Chrome APIs
**Compatibility**: Chrome, Edge, Firefox, Brave, Vivaldi, Opera, Arc + bookmarklet/userscript fallbacks

---

## Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete

---

## Phase 1 - Core Extension
> Goal: functional dark mode toggle with per-site settings

- [x] MV3 manifest with content scripts at document_start
- [x] CSS filter inversion engine with media counter-inversion
- [x] Background service worker (commands, messaging, badge)
- [x] Popup UI with global/site toggles and sliders
- [x] Per-site brightness, contrast, sepia controls
- [x] Whitelist and blacklist management
- [x] Settings persistence via chrome.storage.sync
- [x] Keyboard shortcut (Alt+Shift+D)
- [x] Extension icons (16, 48, 128px)

## Phase 2 - Robustness
> Goal: handle edge cases and dynamic content

- [x] MutationObserver for dynamically added media
- [x] Shadow DOM injection via attachShadow monkey-patch
- [x] Already-dark page auto-detection (luminance sampling)
- [x] All-frames support (iframes)
- [x] Print styles (disable filters for @media print)
- [x] Counter-inversion for color inputs, embeds, role="img"

## Phase 3 - Options and Cross-Browser
> Goal: full settings page and alternative delivery methods

- [x] Options page with site list management
- [x] Import/export settings as JSON
- [x] Auto-detection threshold configuration
- [x] Bookmarklet (stateless toggle for any browser)
- [x] Userscript (Tampermonkey/Greasemonkey with persistence)
- [x] Firefox compatibility (gecko ID in manifest)

## Phase 4 - Polish
> Goal: release-ready quality

- [ ] Chrome Web Store listing
- [ ] Firefox Add-ons (AMO) listing
- [ ] Custom site-specific CSS overrides (advanced mode)
- [ ] Scheduled quiet hours (disable dark mode by time)
- [ ] Per-site color temperature adjustment
- [ ] Statistics page (sites darkened, time saved)
- [ ] Onboarding tutorial for first install
